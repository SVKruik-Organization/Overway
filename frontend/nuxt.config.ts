// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: false },
    ssr: false,
    css: ["./app/assets/main.css"],
    modules: [
        "nuxt-auth-utils",
        "nuxt-cron",
    ],
    cron: {
        runOnInit: true,
        timeZone: "Europe/Amsterdam",
        jobsDir: "core/tss/jobs",
    },
    runtimeConfig: {
        session: {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            name: "overway_session",
            password: process.env.NUXT_SESSION_PASSWORD || "",
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            }
        },
        databaseHost: "",
        databasePort: "",
        databaseUsername: "",
        databasePassword: "",
        meilisearchHost: "",
        meilisearchApiKey: "",
        meilisearchMasterKey: "",
        uplinkHost: "",
        uplinkPort: "",
        uplinkUsername: "",
        uplinkPassword: "",
        uplinkExchange: "",
        uplinkRouter: "",
        public: {
            wsUrl: "",
            appRedirectAdministrator: "",
            appRedirectPlatform: "",
            appRedirectCommander: "",
            appRedirectDocs: "",
        }
    },
    app: {
        head: {
            title: "SK Overway",
            meta: [
                { charset: "utf-8" },
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                { name: "theme-color", content: "#000000" },
                { name: "canonical", content: "https://auth.stefankruik.com/" },
                {
                    name: "keywords",
                    content:
                        "SK Overway",
                },
                { name: "owner", content: "Stefan Kruik" },
                { name: "description", content: "Robust SSO for everything SK Platform." },
                { property: "og:type", content: "website" },
                { property: "og:site_name", content: "SK Overway" },
                { property: "og:locale", content: "en_US" },
                { property: "og:locale:alternate", content: "nl_NL" },
                {
                    property: "og:image",
                    content:
                        "https://files.stefankruik.com/Products/1280/Overway.png",
                },
                { property: "og:image:alt", content: "The SK Overway logo." },
                { property: "og:image:type", content: "image/png" },
                { property: "og:image:width", content: "1280" },
                { property: "og:image:height", content: "640" },
                { property: "og:title", content: "SK Overway" },
                { property: "og:description", content: "Robust SSO for everything SK Platform." },
                {
                    property: "twitter:image",
                    content:
                        "https://files.stefankruik.com/Products/1280/Overway.png",
                },
                { property: "twitter:title", content: "Robust SSO for everything SK Platform." },
                {
                    property: "twitter:description",
                    content: "Robust SSO for everything SK Platform.",
                },
                { property: "twitter:card", content: "summary_large_image" },
            ],
            script: [
                { src: "https://kit.fontawesome.com/ffc90f94bc.js", crossorigin: "anonymous" }
            ],
            link: [
                { rel: "preconnect", href: "https://fonts.googleapis.com" },
                { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
                {
                    rel: "stylesheet",
                    href: "https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap"
                }
            ]
        },
    },
    router: {
        options: {
            scrollBehaviorType: 'smooth'
        }
    }
});
