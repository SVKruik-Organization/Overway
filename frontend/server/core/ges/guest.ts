import { AppTypes, Languages, UserTypes } from "~/assets/customTypes";
import { H3Event } from "h3";
import { createUserToken } from "~~/server/utils/session";
import { Pool } from "@svkruik/sk-platform-db-conn";
import { sendMail } from "@svkruik/sk-dispatch-connector";
import { findAppNameByRawName, getAppPreset } from "~/utils/settings";

type LoginConfig = {
    disableSendMail?: boolean; // true to disable sending login notification email to the administrator
}

export class GuestEntity {
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

    /**
     * Request a login for a guest user using an email.
     * @returns The full name of the user, used for the UI.
     */
    async requestLogin(): Promise<string> {
        if (this.id === null && this.email === null) throw new Error("ID or email must be provided to fetch Guest.", { cause: { statusCode: 1400 } });

        // Fetch additional PII
        const additionalData: Array<{
            "id": any, // BigInt
            "first_name": string,
            "full_name": string,
            "guest_email": string,
        }> = await this.database.query("SELECT guest_users.id, guest_users.first_name, guest_users.full_name, guest_users.email AS guest_email FROM guest_users WHERE guest_users.id = ? OR guest_users.email = ?;", [this.id, this.email]);
        if (!additionalData.length) throw new Error("This guest account does not exist. Please check your credentials and try again.", { cause: { statusCode: 1401 } });
        this.id = Number(additionalData[0].id);
        this.email = additionalData[0].guest_email;

        // Create session token
        const sessionToken: string = await createUserToken(this);

        // Send magic link to the guest
        const redirectUrl = getAppPreset(AppTypes.OVERWAY)?.redirectUrl;
        const loginLink = `${redirectUrl}/api/auth/${this.appName.replace("SK ", "")}/login/${sessionToken}`.toLowerCase();
        await sendMail({
            "to": this.email,
            "fileName": "magic-link-login",
            "replacements": [
                { "key": "firstName", "value": additionalData[0].first_name || "user" },
                { "key": "platformName", "value": this.appName },
                { "key": "loginLink", "value": loginLink },
                { "key": "loginLink", "value": loginLink }]
        }, "amqp", "SK Overway");

        return additionalData[0].full_name;
    }

    /**
     * Login a guest user using a token.
     * @param event The event object.
     * @param token The token to login with.
     * @param config Optional configuration for the login.
     */
    async login(event: H3Event, token: string, config?: LoginConfig): Promise<void> {
        if (!token) throw new Error("The provided token is invalid or has expired. Please check your credentials and try again.", { cause: { statusCode: 1401 } });

        // Fetch additional PII
        const additionalData: Array<{
            "id": any, // BigInt
            "first_name": string,
            "full_name": string,
            "email": string,
            "admin_email": string,
            "admin_name": string,
        }> = await this.database.query(`
            SELECT
                guest_users.id,
                guest_users.first_name,
                guest_users.full_name,
                guest_users.email AS guest_email,
                users.email AS admin_email,
                users.full_name AS admin_name
            FROM
                guest_users
                LEFT JOIN sessions ON object_id = guest_users.id
                LEFT JOIN users ON users.id = guest_users.owner_id
            WHERE payload = ? AND object_type = ?`, [token, UserTypes.GUEST]);
        if (!additionalData.length) throw new Error("This guest account does not exist. Please check your credentials and try again.", { cause: { statusCode: 1401 } });
        this.id = Number(additionalData[0].id);
        this.email = additionalData[0].email;

        // Send new login email to the Administrator who created the guest
        if (!config?.disableSendMail) await sendMail({
            "to": additionalData[0].admin_email,
            "fileName": "new-guest-login",
            "replacements": [
                { "key": "adminName", "value": additionalData[0].admin_name },
                { "key": "guestName", "value": `${additionalData[0].full_name}` },
                { "key": "platformName", "value": this.appName }]
        }, "amqp", this.appName);

        // Create the session
        await createUserSession(event, {
            "id": this.id,
            "fullName": additionalData[0].full_name,
            "email": this.email,
            "type": UserTypes.GUEST,
            "language": Languages.EN
        }, this.database);

        const appName = findAppNameByRawName(this.appName);
        if (!appName) throw new Error("The specified application does not exist.", { cause: { statusCode: 1404 } });
        const redirectUrl = getAppPreset(appName)?.redirectUrl + `?token=${token}`;
        sendRedirect(event, redirectUrl);
    }
}