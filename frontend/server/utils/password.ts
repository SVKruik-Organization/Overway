import bcrypt from "bcryptjs";

/**
 * Normalizes Laravel's bcrypt hash format ($2y$) to be compatible with Node.js bcrypt libraries.
 * 
 * @param hash The bcrypt hash (potentially with $2y$ prefix from Laravel)
 * @returns The normalized hash with $2b$ prefix
 */
function normalizeBcryptHash(hash: string): string {
    if (hash.startsWith("$2y$")) {
        return hash.replace(/^\$2y\$/, "$2b$");
    }
    return hash;
}

/**
 * Verifies a plain text password against a Laravel-compatible bcrypt hash.
 * This function handles Laravel's $2y$ prefix by converting it to $2b$ before verification.
 * 
 * @param plainPassword The plain text password to verify
 * @param storedHash The bcrypt hash stored in the database (from Laravel)
 * @returns Promise<boolean> True if the password matches, false otherwise
 */
export async function validatePassword(plainPassword: string, storedHash: string): Promise<boolean> {
    try {
        if (!storedHash || typeof storedHash !== "string") {
            return false;
        }

        // Check if it's a valid bcrypt hash format
        if (!/^\$2[ayb]\$/.test(storedHash)) {
            return false;
        }

        const compatibleHash = normalizeBcryptHash(storedHash);
        return await bcrypt.compare(plainPassword, compatibleHash);
    } catch (error) {
        return false;
    }
}
