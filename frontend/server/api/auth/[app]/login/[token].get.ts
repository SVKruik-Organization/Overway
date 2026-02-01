import { formatApiError, formatAppName } from "~/utils/format";
import { Pool, database } from "@svkruik/sk-platform-db-conn";
import { GuestEntity } from "~~/server/core/ges/guest";

/**
 * Login a user using a token.
 * If successful, creates a session for the user.
 * @returns
 */
export default defineEventHandler(async (event): Promise<void> => {
    try {
        const appName = formatAppName(getRouterParam(event, "app"));
        const token = getRouterParam(event, "token");
        if (!token) throw new Error("The provided token is invalid or has expired. Please check your credentials and try again.", { cause: { statusCode: 1401 } });

        // Fetch the user by token and login
        const connection: Pool = await database("central");
        const guest: GuestEntity = new GuestEntity(null, null, appName, connection);
        return await guest.login(event, token);
    } catch (error: any) {
        throw formatApiError(error);
    }
});