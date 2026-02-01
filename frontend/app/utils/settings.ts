// Website settings and configuration

import { AppTypes, UserTypes } from "~/assets/customTypes";

const config = useRuntimeConfig();

// Preset configurations for different applications
const appPresets: Record<AppTypes, {
    name: string;
    userTitle: string;
    redirectUrl: string | null;
    guestLoginEnabled: boolean;
}> = {
    overway: {
        name: "SK Overway",
        userTitle: "User",
        redirectUrl: config.public.appRedirectOverway,
        guestLoginEnabled: false,
    },
    administrator: {
        name: "SK Administrator",
        userTitle: "Administrator",
        redirectUrl: config.public.appRedirectAdministrator,
        guestLoginEnabled: true,
    },
    platform: {
        name: "SK Platform",
        userTitle: "User",
        redirectUrl: config.public.appRedirectPlatform,
        guestLoginEnabled: false,
    },
    commander: {
        name: "SK Commander",
        userTitle: "Operator",
        redirectUrl: config.public.appRedirectCommander,
        guestLoginEnabled: false,
    },
    docs: {
        name: "SK Docs",
        userTitle: "Reader",
        redirectUrl: config.public.appRedirectDocs,
        guestLoginEnabled: false,
    },
}

/**
 * Get the preset configuration for the current app.
 * @returns The preset configuration object.
 */
export function getAppPreset(overwrite: AppTypes | undefined = undefined): {
    name: string;
    userTitle: string;
    redirectUrl: string | null;
    guestLoginEnabled: boolean;
} | undefined {
    if (overwrite) return appPresets[overwrite];
    const route = useRoute();
    const appName = route.params.app as string | undefined;
    if (!appName) return appPresets.overway;
    return appPresets[appName as keyof typeof appPresets] || appPresets.overway;
}

/**
 * Find the app name by the raw name.
 * @param rawName The raw name of the app.
 * @returns The app name.
 */
export function findAppNameByRawName(rawName: string): AppTypes | undefined {
    const appName = Object.keys(appPresets).find(app => app.toLowerCase() === rawName.toLowerCase().replace("sk ", ""));
    if (!appName) return undefined;
    return appName as AppTypes;
}

/** Get the session TTL (time to live) in seconds based on user type.
 * @param userType The type of user (USER or GUEST).
 * @returns The session TTL in seconds.
 */
export function getSessionTTL(userType: UserTypes): {
    maxAge: number;
} {
    const base = 60 * 60;
    return {
        maxAge: userType === UserTypes.GUEST ? base * 4 : base * 24 * 30, // 4 hours for guests, 30 days for users
    };
}