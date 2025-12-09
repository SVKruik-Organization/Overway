import { Languages, UserTypes } from "~/assets/customTypes";
import { H3Event } from "h3";
import { createUserToken } from "~~/server/utils/session";
import { Pool } from "@svkruik/sk-platform-db-conn";
import { sendMail } from "@svkruik/sk-dispatch-connector";

type LoginConfig = {
    disableSendMail?: boolean; // true to disable sending login notification email
}

export class UserEntity {
    id: number | null = null;
    email: string | null = null;
    appName: string;
    database: Pool;

    constructor(id: number | null, email: string | null, appName: string, database: Pool) {
        this.id = id;
        this.email = email;
        this.appName = appName;
        this.database = database;
    }

    async login(event: H3Event, config?: LoginConfig): Promise<string> {
        if (this.id === null && this.email === null) throw new Error("Either ID or email must be provided to fetch user.", { cause: { statusCode: 1400 } });

        // Fetch additional PII
        const additionalData: Array<{
            "id": number,
            "first_name": string,
            "last_name": string,
            "email": string,
            "image_name": string,
        }> = await this.database.query("SELECT id, first_name, last_name, email, image_name FROM user WHERE id = ? OR email = ?;", [this.id, this.email]);
        if (!additionalData.length) throw new Error("Email or password is incorrect. Please check your credentials and try again.", { cause: { statusCode: 1401 } });
        this.id = additionalData[0].id;
        this.email = additionalData[0].email;

        // Send new login email

        if (!config?.disableSendMail) await sendMail({
            "to": this.email,
            "fileName": "new-login",
            "replacements": [
                { "key": "firstName", "value": additionalData[0].first_name || "user" },
                { "key": "platformName", "value": this.appName }],
        }, "amqp");

        // Create the session
        await createUserSession(event, {
            "id": this.id,
            "firstName": additionalData[0].first_name,
            "lastName": additionalData[0].last_name,
            "email": this.email,
            "type": UserTypes.USER,
            "imageName": additionalData[0].image_name,
            "language": Languages.EN
        }, this.database);

        // Create session token
        const sessionToken: string = await createUserToken(this);
        return sessionToken;
    }
}