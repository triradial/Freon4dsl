// info about dialogs: whether they are open or closed

// indicates whether the application is initializing
export let initializing = $state(true);

// variables for the FileMenu
export let openModelDialogVisible = $state(false);
export let deleteModelDialogVisible = $state(false);
export let deleteUnitDialogVisible = $state(false);
export let newUnitDialogVisible = $state(false);
export let renameUnitDialogVisible = $state(false);

// variables for the EditMenu
export let findTextDialogVisible = $state(false);
export let findStructureDialogVisible = $state(false);
export let findNamedDialogVisible = $state(false);

// variables for the HelpButton
export let helpDialogVisible = $state(false);
