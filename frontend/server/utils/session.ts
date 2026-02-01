import { User, UserSession } from "#auth-utils";
import { randomUUID } from "crypto";
import type { H3Event } from "h3";
import { UserTypes } from "~/assets/customTypes";
import { UserEntity } from "../core/ges/user";
import { GuestEntity } from "../core/ges/guest";
import { getSessionTTL } from "~/utils/settings";
import { Pool } from "@svkruik/sk-platform-db-conn";

/**
 * Creates and returns a user session.
 * Also updates the last login date in the database.
 * 
 * @param event The request event
 * @param user The user data to store in the session 
 * @param connection The database connection to use
 * @returns The user data stored in the session
 */
export async function createUserSession(event: H3Event, user: User, connection: Pool): Promise<User> {
    const userSession: UserSession = await replaceUserSession(event, {
        "user": user,
        "loggedInAt": new Date(),
    }, getSessionTTL(user.type));

    // Update the last login date in the database
    const tableName: string = user.type === UserTypes.USER ? "users" : "guest_users";
    await connection.query(`UPDATE ${tableName} SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?;`, [user.id]);

    // Return the user data
    return userSession.user as User;
}

/**
 * Creates a persistent token for the user.
 * 
 * @param user The user data
 * @param connection The database connection to use
 * @returns The created token
 */
export async function createUserToken(user: UserEntity | GuestEntity): Promise<string> {
    const token = randomUUID();
    const userType = user instanceof UserEntity ? UserTypes.USER : UserTypes.GUEST;
    await user.database.query(`
        DELETE FROM sessions WHERE user_id = ? AND user_type = ?;
        INSERT INTO sessions (id, user_id, user_type, payload, last_activity, app_name) VALUES (?, ?, ?, ?, ?, 'SK Overway');`,
        [user.id, userType,
        randomUUID(), user.id, userType, token, Math.floor(Date.now() / 1000)]);
    return token;
}

export async function getUserFromToken(token: string): Promise<UserEntity | GuestEntity | null> {

}