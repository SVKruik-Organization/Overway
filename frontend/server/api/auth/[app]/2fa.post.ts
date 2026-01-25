import { z } from "zod";
import { formatApiError, formatAppName } from "~/utils/format";
import { UserEntity } from "~~/server/core/ges/user";
import { Pool, database } from "@svkruik/sk-platform-db-conn";

// Validation schema for the request body
const bodySchema = z.object({
    email: z.email(),
    pin: z.string().length(6),
});

/**
 * Submit the 2FA code for verification
 * If successful, creates a session for the user
 * @returns The user info and session information.
 */
export default defineEventHandler(async (event): Promise<string> => {
    try {
        const parseResult = bodySchema.safeParse(await readBody(event));
        if (!parseResult.success) throw new Error("The form is not completed correctly. Please try again.", { cause: { statusCode: 1400 } });
        const { email, pin } = parseResult.data;
        const appName = formatAppName(getRouterParam(event, "app"));

        // Retrieve the verification code from the database
        const connection: Pool = await database("central");
        const codeResponse: Array<200> = await connection.query("SELECT 200 FROM user_verifications WHERE user_email = ? AND pin = ? AND reason = 'MFA' AND expires_at > CURRENT_TIMESTAMP;", [email, pin]);
        if (!codeResponse.length) throw new Error("The provided code is incorrect or has expired. Please check your credentials and try again.", { cause: { statusCode: 1401 } });

        // Create the user and login
        const user: UserEntity = new UserEntity(null, email, appName, connection);
        return await user.login(event);
    } catch (error: any) {
        throw formatApiError(error);
    }
});