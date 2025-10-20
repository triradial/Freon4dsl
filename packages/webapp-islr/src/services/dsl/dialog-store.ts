// info about dialogs: whether they are open or closed

// indicates whether the application is initializing
import { writable } from 'svelte/store';

export const initializing = writable(true);

// variables for the FileMenu
export const openModelDialogVisible = writable(false);
export const deleteModelDialogVisible = writable(false);
export const deleteUnitDialogVisible = writable(false);
export const newUnitDialogVisible = writable(false);
export const renameUnitDialogVisible = writable(false);

// variables for the EditMenu
export const findTextDialogVisible = writable(false);
export const findStructureDialogVisible = writable(false);
export const findNamedDialogVisible = writable(false);

// variables for the HelpButton
export const helpDialogVisible = writable(false);
