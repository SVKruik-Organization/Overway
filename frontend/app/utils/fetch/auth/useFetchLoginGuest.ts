/**
 * Create a new session for a guest user with an email.
 * Magic link will be sent to the email for login.
 * @param email The guest email.
 * @returns The token of the created session.
 * @throws An error if the request fails.
 */
export const useFetchLoginGuest = async (email: string): Promise<string> => {
    try {
        const token: string = await $fetch(`/api/auth/${useRoute().params.app}/login/guest`, {
            method: "POST",
            body: { email },
            headers: { "Content-Type": "application/json" },
        });
        await useUserSession().fetch();
        return token;
    } catch (error: any) {
        throw formatError(error);
    }
}