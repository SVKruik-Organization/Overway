<script lang="ts" setup>
import { createTicket } from "@svkruik/sk-platform-formatters";
import { AppTypes, PromptTypes, type PopupItem } from "~/assets/customTypes";
import { useFetchLoginEmail } from "~/utils/fetch/auth/useFetchLoginEmail";
import { useFetchLoginGuest } from "~/utils/fetch/auth/useFetchLoginGuest";
import { useFetchRefreshSession } from "~/utils/fetch/auth/useFetchRefresh";
import { useFetchSubmit2FA } from "~/utils/fetch/auth/useFetchSubmit2FA";
import { getAppPreset } from "~/utils/settings";
const { $event } = useNuxtApp();
const userSession = useUserSession();
const route = useRoute();
const appName = route.params.app as AppTypes | undefined;
if (!appName || !(appName satisfies AppTypes)) navigateTo("/login/overway");
document.documentElement.className = appName || "overway";

// Reactive Data
const emailInput: Ref<string> = ref("");
const passwordInput: Ref<string> = ref("");
const verificationInput: Ref<string> = ref("");
const guestInput: Ref<string> = ref("");
const step: Ref<1 | 2 | 3 | 4> = ref(1);
const loginButton = useTemplateRef<HTMLButtonElement>("loginButton");
const verificationButton = useTemplateRef<HTMLButtonElement>("verificationButton");
const guestButton = useTemplateRef<HTMLButtonElement>("guestButton");
const isSubmissionInProgress: Ref<boolean> = ref(false);
const previousInputValues: Ref<{
    email: string;
    password: string;
    verification: string;
    guest: string;
}> = ref({
    email: "",
    password: "",
    verification: "",
    guest: "",
});
const username: Ref<string | null> = ref(null);

// Methods

/**
 * Try a user login with email and password.
 * If successful, move to MFA (step 2).
 * @returns Status of the operation.
 */
async function submitLogin(): Promise<boolean> {
    try {
        if (isSubmissionInProgress.value) return false;
        if (previousInputValues.value.email === emailInput.value && previousInputValues.value.password === passwordInput.value) return false;
        toggleButtonState(loginButton.value, true);

        if (!emailInput.value.length || !passwordInput.value.length) throw new Error("The form is not completed correctly. Please try again.");
        previousInputValues.value.email = emailInput.value;
        previousInputValues.value.password = passwordInput.value;

        await signOut(); // Clear any existing session
        username.value = await useFetchLoginEmail(emailInput.value, passwordInput.value);

        step.value = 2;
        return true;
    } catch (error: any) {
        $event("popup", {
            id: createTicket(4),
            type: PromptTypes.danger,
            message: error.message || "Something went wrong on our end. Please try again later.",
            duration: 3,
        } as PopupItem);
        return false;
    } finally {
        toggleButtonState(loginButton.value, false);
    }
}

/**
 * Continue login for an already logged-in user.
 * If successful, log the user in and redirect to the app.
 * @returns Status of the operation.
 */
async function continueLogin(): Promise<boolean> {
    try {
        if (isSubmissionInProgress.value) return false;
        toggleButtonState(loginButton.value, true);
        if (!userSession.loggedIn || !userSession.user.value) {
            step.value = 1;
            throw new Error("No active session found. Please log in again.");

            // Guest users can be characterized by the absence of an email.
            // For safety always force them to log in again.
        } else if (!userSession.user.value.email) {
            step.value = 1;
            throw new Error("Guest users cannot continue their session. Please log in again.");
        }

        const token: string = await useFetchRefreshSession();
        username.value = userSession.user.value.fullName;
        return handleSuccess(token);
    } catch (error: any) {
        $event("popup", {
            id: createTicket(4),
            type: PromptTypes.danger,
            message: error.message || "Something went wrong on our end. Please try again later.",
            duration: 3,
        } as PopupItem);
        return false;
    } finally {
        toggleButtonState(loginButton.value, false);
    }
}

/**
 * Try to submit the 2FA code for verification.
 * If successful, log the user in and redirect to the dashboard.
 * @returns Status of the operation.
 */
async function submit2fa(): Promise<boolean> {
    try {
        if (isSubmissionInProgress.value) return false;
        if (previousInputValues.value.verification === verificationInput.value) return false;
        toggleButtonState(verificationButton.value, true);

        if (!emailInput.value.length || !verificationInput.value.length) throw new Error("The form is not completed correctly. Please try again.");
        previousInputValues.value.verification = verificationInput.value;

        const token: string = await useFetchSubmit2FA(emailInput.value, verificationInput.value);
        return handleSuccess(token);
    } catch (error: any) {
        $event("popup", {
            id: createTicket(4),
            type: PromptTypes.danger,
            message: error.message || "Something went wrong on our end. Please try again later.",
            duration: 3,
        } as PopupItem);
        return false;
    } finally {
        toggleButtonState(verificationButton.value, false);
    }
}

/**
 * Try a guest user login using a code.
 * @returns Status of the operation.
 */
async function submitGuest(): Promise<boolean> {
    try {
        if (isSubmissionInProgress.value || !getAppPreset()?.guestLoginEnabled) return false;
        if (previousInputValues.value.guest === guestInput.value) return false;
        toggleButtonState(guestButton.value, true);

        if (!guestInput.value.length) throw new Error("The form is not completed correctly. Please try again.");
        previousInputValues.value.guest = guestInput.value;

        const token: string = await useFetchLoginGuest(guestInput.value);
        return handleSuccess(token);
    } catch (error: any) {
        $event("popup", {
            id: createTicket(4),
            type: PromptTypes.danger,
            message: error.message || "Something went wrong on our end. Please try again later.",
            duration: 3,
        } as PopupItem);
        return false;
    } finally {
        toggleButtonState(guestButton.value, false);
    }
}

/**
 * Toggle the state of a button (disabled/enabled) and update its appearance.
 * @param button The button element to toggle.
 * @param disabled Whether to disable (true) or enable (false) the button.
 */
function toggleButtonState(button: HTMLButtonElement | null, disabled: boolean): void {
    isSubmissionInProgress.value = disabled;
    if (!button) return;
    button.disabled = disabled;
    button.style.pointerEvents = disabled ? "none" : "auto";
    button.style.opacity = disabled ? "0.6" : "1";

    const iconElement = button.querySelector("i");
    if (iconElement) {
        if (disabled) {
            iconElement.classList.replace("fa-arrow-right-to-bracket", "fa-circle-notch");
            iconElement.classList.add("fa-spin");
        } else {
            iconElement.classList.replace("fa-circle-notch", "fa-arrow-right-to-bracket");
            iconElement.classList.remove("fa-spin");
        }
    }
}

/**
 * Show a popup on successful login and redirect if necessary.
 * @param token The token of the created session.
 * @returns Status of the operation.
 */
function handleSuccess(token: string): boolean {
    const fullName: string = userSession.user.value?.fullName || "User";
    const redirectUrl: string | null = getAppPreset()?.redirectUrl || null;

    if (appName !== "overway" && redirectUrl) {
        $event("popup", {
            id: createTicket(4),
            type: PromptTypes.success,
            message: `Login successful! Welcome back ${fullName}. Redirecting you now!`,
            duration: 3,
        } as PopupItem);
        setTimeout(() => {
            navigateTo({
                path: redirectUrl,
                query: {
                    token
                }
            }, {
                external: true,
                replace: true,
            });
        }, 1500);
    } else step.value = 4;
    return true;
}

/**
 * Get the username to display.
 * @param backup Optional backup string if no user is logged in.
 * @returns The username string.
 */
function getUsername(backup?: string): string {
    if (username.value) return username.value;
    if (userSession.user.value) {
        return userSession.user.value.fullName;
    }
    return backup || getAppPreset()?.userTitle || "User";
}

/**
 * Format the application name for display.
 * @param app The application type.
 * @returns The formatted application name.
 */
function changeApp(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedApp = selectElement.value as AppTypes;
    navigateTo(`/login/${selectedApp}`);
}

/**
 * Signs the user out by clearing the session.
 */
async function signOut(): Promise<void> {
    await (useUserSession()).clear();
}
</script>

<template>
    <main class="flex" :class="`main-background-image-${appName || 'overway'}`">
        <div class="flex content-container">
            <div class="flex-col background-image-container">
                <div class="background-image" :class="`background-image-${appName || 'overway'}`"></div>
                <div class="flex-col title-container">
                    <h2>SK Overway SSO</h2>
                    <div class="flex" v-if="appName !== 'overway'">
                        <h4>Working for</h4>
                        <select id="app-selector" @change="changeApp($event)"
                            title="Select the application you want to log in to.">
                            <option v-for="app in Object.values(AppTypes).filter(a => a !== 'overway')" :key="app"
                                :value="app" :selected="app === appName">
                                {{ formatAppName(app) }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
            <form class="flex-col" @submit.prevent="continueLogin"
                v-if="step === 1 && userSession.loggedIn && userSession.user.value && userSession.user.value.email">
                <div class="flex-col title">
                    <h2>Welcome back,</h2>
                    <strong>{{ getUsername() }}</strong>
                </div>
                <p>Seems like you are logged in already. Would you like to continue with this account?</p>
                <p>{{ userSession.user.value.email }}</p>
                <button type="submit" class="flex button-login" ref="verificationButton"
                    title="Continue with this account.">
                    <span>Continue</span>
                    <i class="fa-regular fa-arrow-right-to-bracket"></i>
                </button>
                <button type="button" class="flex" @click="signOut(); step = 1"
                    title="Log in with a different account.">
                    <span>Not you?</span>
                    <i class="fa-regular fa-arrow-left"></i>
                </button>
                <small>Trouble signing in? If you are supposed to be here, you know who to contact.</small>
            </form>
            <form class="flex-col" @submit.prevent="submitLogin" v-else-if="step === 1">
                <div class="flex-col title">
                    <h2>Welcome back,</h2>
                    <strong>{{ getAppPreset()?.userTitle }}</strong>
                </div>
                <div class="flex input-container">
                    <label for="email" v-if="!emailInput.length" class="flex">
                        Email<span>*</span>
                    </label>
                    <input type="email" v-model="emailInput" required id="email" name="email" autocomplete="email" />
                </div>
                <div class="flex input-container">
                    <label for="password" v-if="!passwordInput.length" class="flex">
                        Password<span>*</span>
                    </label>
                    <input type="password" v-model="passwordInput" required id="password" name="password"
                        autocomplete="current-password" />
                </div>
                <button type="submit" class="flex button-login" ref="loginButton"
                    title="Submit your credentials to login.">
                    <span>Login</span>
                    <i class="fa-regular fa-arrow-right-to-bracket"></i>
                </button>
                <template v-if="getAppPreset()?.guestLoginEnabled">
                    <div class="splitter-container flex">
                        <hr>
                        </hr>
                        or
                        <hr>
                        </hr>
                    </div>
                    <button type="button" class="flex" @click="signOut(); step = 3"
                        title="Login as a Guest with an Administrator provided account.">
                        <span>Guest</span>
                        <i class="fa-regular fa-id-badge"></i>
                    </button>
                </template>
                <small>Trouble signing in? If you are supposed to be here, you know who to contact.</small>
            </form>
            <form class="flex-col" @submit.prevent="submit2fa" v-else-if="step === 2">
                <div class="flex-col title">
                    <h2>Almost there,</h2>
                    <strong>{{ getUsername() }}</strong>
                </div>
                <p>Please enter the 6-digit code sent to your email. It is valid for 10 minutes.</p>
                <div class="flex input-container">
                    <label for="verification" v-if="!verificationInput.length" class="flex">
                        2FA PIN<span>*</span>
                    </label>
                    <input type="text" v-model="verificationInput" required id="verification" name="verification"
                        minlength="6" maxlength="6" autocomplete="off" />
                </div>
                <button type="submit" class="flex button-login" ref="verificationButton"
                    title="Submit your 2FA code to complete login.">
                    <span>Submit</span>
                    <i class="fa-regular fa-arrow-right-to-bracket"></i>
                </button>
                <button type="button" class="flex" @click="step = 1; previousInputValues.password = ''"
                    title="Go back to the previous step.">
                    <span>Cancel</span>
                    <i class="fa-regular fa-arrow-left"></i>
                </button>
                <small>Trouble signing in? If you are supposed to be here, you know who to contact.</small>
            </form>
            <form class="flex-col" @submit.prevent="submitGuest"
                v-else-if="step === 3 && getAppPreset()?.guestLoginEnabled">
                <div class="flex-col title">
                    <h2>Welcome,</h2>
                    <strong>Guest</strong>
                </div>
                <div class="flex input-container">
                    <label for="guest" v-if="!guestInput.length" class="flex">
                        Guest E-mail<span>*</span>
                    </label>
                    <input type="email" v-model="guestInput" required id="guest" name="guest" />
                </div>
                <div style="height: 41px;"></div>
                <button type="submit" class="flex button-login" ref="guestButton"
                    title="Submit your Guest E-mail to login.">
                    <span>Login</span>
                    <i class="fa-regular fa-arrow-right-to-bracket"></i>
                </button>
                <button type="button" class="flex" @click="step = 1" title="Go back to the previous step.">
                    <span>Go back</span>
                    <i class="fa-regular fa-arrow-left"></i>
                </button>
                <small>Trouble signing in? If you are supposed to be here, you know who to contact.</small>
            </form>
            <form class="flex-col" @submit.prevent v-else-if="step === 4">
                <div class="flex-col title">
                    <h2>Good to have you{{ userSession.user.value?.email ? ' back' : '' }},</h2>
                    <strong>{{ getUsername() }}</strong>
                </div>
                <p>You are now logged in to and able to use SK Platform.</p>
                <p>Normally you would be redirected, but you do not have an app source.</p>
                <p>You can close this tab safely and start using everything SK Platform.</p>
            </form>
            <form class="flex-col" v-else>
                <div class="flex-col title">
                    <h2>Something went wrong,</h2>
                    <strong>Please try again later.</strong>
                </div>
                <p>If the problem persists, please contact an Administrator.</p>
                <small>Trouble signing in? If you are supposed to be here, you know who to contact.</small>
            </form>
        </div>
    </main>
</template>

<style scoped>
main {
    box-sizing: border-box;
    padding: 50px;
    height: 100vh;
}

.content-container {
    gap: 50px;
    width: 100%;
    height: 100%;
    max-height: 800px;
}

.background-image,
form {
    border-radius: 25px;
    height: 100%;
}

.background-image-container {
    position: relative;
    height: 100%;
    flex-grow: 1;
}

.title-container {
    position: absolute;
    bottom: 25px;
    left: 25px;
}

.title-container h2 {
    color: var(--color-background);
    font-weight: bold;
}

.title-container h4,
.title-container select {
    color: var(--color-background);
    opacity: 0.6;
}

.title-container select {
    appearance: none;
    font-weight: 600;
    font-size: medium;
}

.background-image {
    width: 100%;
    background: no-repeat center;
}

.background-image-overway {
    background-image: url(/apps/overway.png);
    background-size: 370%;
    background-position-x: -2200px;
    background-position-y: -1250px;
    max-width: 1400px;
}

.background-image-administrator {
    background-image: url(/apps/administrator.png);
    background-size: 130%;
}

.background-image-platform {
    background-image: url(/apps/platform.png);
    background-size: 140%;
}

.background-image-commander {
    background-image: url(/apps/commander.png);
    background-size: 140%;
}

.background-image-docs {
    background-image: url(/apps/docs.png);
    background-size: 250%;
}

form {
    box-sizing: border-box;
    padding: 50px;
    width: 400px;
    background-color: var(--color-fill);
    gap: 25px;
}

.title {
    margin-bottom: 75px;
}

.title strong {
    color: var(--color-accent);
    font-size: large;
}

.input-container {
    position: relative;
    width: 100%;
}

.input-container label {
    position: absolute;
    left: 15px;
    pointer-events: none;
    align-items: center;
    gap: 5px;
    color: var(--color-text-light);
}

.input-container label span {
    color: var(--color-accent);
}

.input-container input {
    border: 1px solid var(--color-border-dark);
}

.input-container input,
button {
    width: 100%;
    border-radius: var(--border-radius-mid);
    padding: 10px 15px;
}

button {
    background-color: var(--color-border-dark);
}

button i {
    margin-left: auto;
}

button:hover i {
    margin-right: 5px;
}

.button-login {
    background-color: var(--color-accent);
}

.button-login i,
.button-login span {
    color: var(--color-background);
}

.splitter-container {
    width: 100%;
    justify-content: center;
}

.splitter-container hr {
    width: 20%;
    border: 0;
    border-top: 1px solid var(--color-border-dark);
    margin: 0 30px;
    background-color: transparent;
}

form > small {
    margin-top: auto;
    color: var(--color-text-light);
    opacity: 0.4;
}

@media (width <=1545px) {
    .background-image-overway {
        background-size: 3000px;
        background-position-x: -1400px;
        background-position-y: -900px;
    }

    .background-image-administrator {
        background-size: 1300px;
    }

    .background-image-platform {
        background-size: 1400px;
    }

    .background-image-commander {
        background-size: 1300px;
    }

    .background-image-docs {
        background-size: 2200px;
        background-position-y: -400px;
    }
}

@media (width <=800px) {
    main {
        padding: 25px;
        background: no-repeat center;
    }

    .main-background-image-overway {
        background-image: url(/apps/overway.png);
        background-size: 3000px;
        background-position-x: -1400px;
    }

    .main-background-image-administrator {
        background-image: url(/apps/administrator.png);
    }

    .main-background-image-platform {
        background-image: url(/apps/platform.png);
    }

    .main-background-image-commander {
        background-image: url(/apps/commander.png);
    }

    .main-background-image-docs {
        background-image: url(/apps/docs.png);
    }

    .content-container {
        justify-content: center;
    }

    .title {
        margin-bottom: 15px;
    }

    .background-image-container {
        display: none;
    }
}
</style>