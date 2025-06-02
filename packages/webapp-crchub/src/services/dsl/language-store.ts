// info about the language

// name of the language
export let languageName = $state("FreLanguage ...");
// all possible unit types
export let unitTypes: stringList = $state({ list: []});
// all file extensions associated with the model units
export let fileExtensions: stringList = $state({ list: []});
// all possible projections
export let projectionNames = $state({ list: ["default"] });
// the projections that are currently chosen to be shown
export let projectionsShown = $state({ list: ["default"] });
