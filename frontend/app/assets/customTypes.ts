export enum AppTypes {
    OVERWAY = "overway",
    ADMINISTRATOR = "administrator",
    PLATFORM = "platform",
    COMMANDER = "commander",
    DOCS = "docs",
}

export enum UserTypes {
    USER = "App\\Models\\User",
    GUEST = "App\\Models\\GuestUser",
}

export enum Languages {
    EN = "en",
    NL = "nl",
    // KR = "kr",
}

// Pop-up Item
export type PopupItem = {
    "id": string,
    "type": PromptTypes,
    "message": string,
    "duration": number
}

// Prompt/Informational Message Types
export enum PromptTypes {
    info = "info",
    success = "success",
    warning = "warning",
    danger = "danger"
}

export type DateFormat = {
    "date": string,
    "time": string,
    "today": Date
}
