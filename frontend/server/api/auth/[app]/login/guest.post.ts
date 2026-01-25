import { z } from "zod";
import { formatApiError, formatAppName } from "~/utils/format";
import { GuestEntity } from "~~/server/core/ges/guest";
import { Pool, database } from "@svkruik/sk-platform-db-conn";

// Validation schema for the request body
const bodySchema = z.object({
    email: z.email(),
});

/**
 * Login a guest user using a code.
 * @returns The user info and session information.
 */
export default defineEventHandler(async (event): Promise<string> => {
    try {
        const parseResult = bodySchema.safeParse(await readBody(event));
        if (!parseResult.success) throw new Error("The form is not completed correctly. Please try again.", { cause: { statusCode: 1400 } });
        const { email } = parseResult.data;
        const appName = formatAppName(getRouterParam(event, "app"));

        // Create the guest and login
        const connection: Pool = await database("central");
        const guest: GuestEntity = new GuestEntity(null, email, appName, connection);
        return await guest.login(event);
    } catch (error: any) {
        throw formatApiError(error);
    }
});