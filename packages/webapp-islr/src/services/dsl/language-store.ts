import { writable } from 'svelte/store';

// info about the language

// name of the language
export const languageName = writable("FreLanguage ...");
// all possible unit types
export const unitTypes = writable({ list: [] });
// all file extensions associated with the model units
export const fileExtensions = writable({ list: [] });
// all possible projections
export const projectionNames = writable({ list: ["default"] });
// the projections that are currently chosen to be shown
export const projectionsShown = writable({ list: ["default"] });
