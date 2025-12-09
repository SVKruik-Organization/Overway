import { z } from "zod";
import { formatApiError, formatAppName } from "~/utils/format";
import { Pool, database } from "@svkruik/sk-platform-db-conn";
import { sendMail } from "@svkruik/sk-dispatch-connector";

// Validation schema for the request body
const bodySchema = z.object({
    email: z.email(),
    password: z.string(),
});

/**
 * Login using email and password
 * @returns The full name of the user, used for the UI.
 */
export default defineEventHandler(async (event): Promise<string> => {
    try {
        const parseResult = bodySchema.safeParse(await readBody(event));
        if (!parseResult.success) throw new Error("The form is not completed correctly. Please try again.", { cause: { statusCode: 1400 } });
        const { email, password } = parseResult.data;
        const appName = formatAppName(getRouterParam(event, "app"));

        // Retrieve the user from the database
        const connection: Pool = await database("central");
        const response: Array<{
            "first_name": string,
            "last_name": string,
            "password": string,
        }> = await connection.query("SELECT first_name, last_name, password FROM user WHERE email = ?;", [email]);

        // Validate the response
        const user = response[0];
        if (!user) throw new Error("Email or password is incorrect. Please check your credentials and try again.", { cause: { statusCode: 1401 } });
        if (!(await verifyPassword(user.password, password))) throw new Error("Email or password is incorrect. Please check your credentials and try again.", { cause: { statusCode: 1401 } });

        // Send the email with a 6-digit code
        const verificationPin: number = Math.floor(100000 + Math.random() * 900000);
        await sendMail({
            "to": email,
            "fileName": "2fa-code",
            "replacements": [
                { "key": "firstName", "value": user.first_name || "user" },
                { "key": "platformName", "value": appName },
                { "key": "verificationPin", "value": verificationPin.toString() }]
        }, "amqp");

        // Delete any existing verification codes for the same email and reason
        // Insert the verification code into the database
        await connection.query(
            "DELETE FROM user_verification WHERE user_email = ? AND reason = '2fa'; INSERT INTO user_verification (user_email, pin, reason) VALUES (?, ?, ?);",
            [email, email, verificationPin, "2fa"]);

        return `${user.first_name} ${user.last_name}`;
    } catch (error: any) {
        throw formatApiError(error);
    }
});