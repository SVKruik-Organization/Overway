import { z } from "zod";
import { formatApiError } from "~/utils/format";
import { Pool, database } from "@svkruik/sk-platform-db-conn";
import { UserTypes } from "~/assets/customTypes";

// Validation schema for the request body
const bodySchema = z.object({
    token: z.string(),
});

/**
 * Submit the 2FA code for verification
 * If successful, creates a session for the user
 * @returns The user info and session information.
 */
export default defineEventHandler(async (event): Promise<{
    "user_id": number;
    "user_type": UserTypes;
}> => {
    try {
        const parseResult = bodySchema.safeParse(await readBody(event));
        if (!parseResult.success) throw new Error("The form is not completed correctly. Please try again.", { cause: { statusCode: 1400 } });
        const { token } = parseResult.data;

        // Retrieve the user ID from the database
        const connection: Pool = await database("central");
        const response: Array<Array<{
            "user_id": any; // BigInt
            "user_type": UserTypes;
        }>> = await connection.query(`
            SELECT user_id, user_type FROM sessions WHERE payload = ?;
            UPDATE sessions SET last_activity = ? WHERE payload = ?;`,
            [token, Math.floor(Date.now() / 1000), token]);
        // response[1] is the result of the UPDATE query.

        if (!response.length || !response[0].length) throw new Error("The provided token is invalid or has expired. Please check your credentials and try again.", { cause: { statusCode: 1401 } });
        return {
            "user_id": Number(response[0][0].user_id),
            "user_type": response[0][0].user_type,
        };
    } catch (error: any) {
        throw formatApiError(error);
    }
});