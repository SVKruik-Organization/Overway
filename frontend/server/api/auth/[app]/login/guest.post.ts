import { z } from "zod";
import { formatApiError, formatAppName } from "~/utils/format";
import { GuestEntity } from "~~/server/core/ges/guest";
import { Pool, database } from "@svkruik/sk-platform-db-conn";

// Validation schema for the request body
const bodySchema = z.object({
    email: z.email(),
});

/**
 * Request a login for a guest user using an email.
 * @returns The full name of the user, used for the UI.
 */
export default defineEventHandler(async (event): Promise<string> => {
    try {
        const parseResult = bodySchema.safeParse(await readBody(event));
        if (!parseResult.success) throw new Error("The form is not completed correctly. Please try again.", { cause: { statusCode: 1400 } });
        const { email } = parseResult.data;
        const appName = formatAppName(getRouterParam(event, "app"));

        // Create the guest and request login
        const connection: Pool = await database("central");
        const guest: GuestEntity = new GuestEntity(null, email, appName, connection);
        return await guest.requestLogin();
    } catch (error: any) {
        throw formatApiError(error);
    }
});