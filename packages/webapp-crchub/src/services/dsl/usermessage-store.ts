import { FreErrorSeverity } from "@freon4dsl/core";
import { writable } from 'svelte/store';

// info about Freon
export const versionNumber: string = "1.1.0-beta.3";

export const severity = writable({ value: FreErrorSeverity.Error });
export const userMessage = writable({ value: "This is an important message. Once you've read it, you can dismiss it." });
export const userMessageOpen = writable(false);

export function setUserMessage(message: string, sever?: FreErrorSeverity) {
    userMessage.set({ value: message });
    if (sever !== null && sever !== undefined) {
        severity.set({ value: sever });
    } else {
        severity.set({ value: FreErrorSeverity.Error });
    }
    console.log("Freon User Message: " + message + ", " + (sever ?? FreErrorSeverity.Error));
    userMessageOpen.set(true);
}
