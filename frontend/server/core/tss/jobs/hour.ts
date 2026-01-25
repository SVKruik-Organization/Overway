import { defineCronHandler } from "#nuxt/cron"
import { logData, logError } from "@svkruik/sk-platform-formatters";
import { Pool, database } from "@svkruik/sk-platform-db-conn";

export default defineCronHandler("hourly", async () => {
    try {
        const connection: Pool = await database("central");
        await connection.query("DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;");

        logData(`[CRON / Hour] Completed data cleaning process.`, "info");
    } catch (error: any) {
        logError(error);
    }
});