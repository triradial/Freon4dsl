import { writable } from 'svelte/store';
import type { FreError } from "@freon4dsl/core";

export const errorsLoaded = writable(true);
export const searchResultLoaded = writable(true);
export const modelErrors = writable({list: []});
export const activeTab = writable('errorTab');
export const searchResults = writable({list: []});
export const interpreterTrace = writable({value: "no trace"});

export interface ErrorInfoInterface {
    list: FreError[];
}

// the currently active tab and constants to indicate the tabs
export const errorTab = "Errors";
export const searchTab = "Search";
export const interpreterTab = "Interpreter";
