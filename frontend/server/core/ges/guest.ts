import { Languages, UserTypes } from "~/assets/customTypes";
import { H3Event } from "h3";
import { createUserToken } from "~~/server/utils/session";
import { Pool } from "@svkruik/sk-platform-db-conn";
import { sendMail } from "@svkruik/sk-dispatch-connector";

type LoginConfig = {
    disableSendMail?: boolean; // true to disable sending login notification email
}

export class GuestEntity {
    id: number | null = null;
    code: string | null = null;
    appName: string;
    database: Pool;

    constructor(id: number | null, code: string | null, appName: string, database: Pool) {
        this.id = id;
        this.code = code;
        this.appName = appName;
        this.database = database;
    }

    async login(event: H3Event, config?: LoginConfig): Promise<string> {
        if (this.id === null && this.code === null) throw new Error("ID or code must be provided to fetch Guest.", { cause: { statusCode: 1400 } });

        // Fetch additional PII
        const additionalData: Array<{
            "id": number,
            "first_name": string,
            "last_name": string,
            "password": string,
            "image_name": string,
            "admin_email": string,
            "admin_name": string,
        }> = await this.database.query("SELECT guest.id, guest.first_name, guest.last_name, guest.password, guest.image_name, email as admin_email, CONCAT(user.first_name, ' ', user.last_name) as admin_name FROM guest LEFT JOIN user ON user.id = guest.created_by_id WHERE guest.id = ? OR guest.password = ?;", [this.id, this.code]);
        if (!additionalData.length) throw new Error("This guest account does not exist. Please check your credentials and try again.", { cause: { statusCode: 1401 } });
        this.id = additionalData[0].id;
        this.code = additionalData[0].password;

        // Send new login email to the Administrator who created the guest
        if (!config?.disableSendMail) await sendMail({
            "to": additionalData[0].admin_email,
            "fileName": "new-guest-login",
            "replacements": [
                { "key": "adminName", "value": additionalData[0].admin_name },
                { "key": "guestName", "value": `${additionalData[0].first_name} ${additionalData[0].last_name}` },
                { "key": "platformName", "value": this.appName }]
        }, "amqp");

        // Create the session
        await createUserSession(event, {
            "id": this.id,
            "firstName": additionalData[0].first_name,
            "lastName": additionalData[0].last_name,
            "email": null,
            "type": UserTypes.GUEST,
            "imageName": additionalData[0].image_name,
            "language": Languages.EN
        }, this.database);

        // Create session token
        const sessionToken: string = await createUserToken(this);
        return sessionToken;
    }
}