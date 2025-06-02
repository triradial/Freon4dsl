// info about the model and model unit shown
import type {UnitInfo, UnitList} from "./store-interfaces.js";

// Core model state
export let currentModelName = $state('');
export let currentUnitName = $state('');

// UI state
export let noUnitAvailable = $state(true);
export let editorProgressShown = $state(true);
export let unsavedChanges = $state(true);

// Unit state
export let currentUnit = $state<UnitInfo>({id: undefined, ref: undefined});
export let toBeDeleted = $state<UnitInfo>({id: undefined, ref: undefined});
export let toBeRenamed = $state<UnitInfo>({id: undefined, ref: undefined});

// Unit lists
export let unitNames = $state<UnitList>({ids: [], refs: []});
export let units = $state<UnitList>({ids: [], refs: []});

// Update functions - keeping these for backward compatibility
export function setCurrentModelName(name: string) {
    currentModelName = name;
}

export function setCurrentUnitName(name: string) {
    currentUnitName = name;
}

export function setNoUnitAvailable(value: boolean) {
    noUnitAvailable = value;
}

export function setEditorProgressShown(value: boolean) {
    editorProgressShown = value;
}

export function setUnsavedChanges(value: boolean) {
    unsavedChanges = value;
}

export function setToBeDeleted(value: UnitInfo) {
    toBeDeleted = value;
}

export function setToBeRenamed(value: UnitInfo) {
    toBeRenamed = value;
}

export function setUnitNames(value: UnitList) {
    unitNames = value;
}

export function updateUnits(value: UnitList) {
    units = value;
}

// New functions for better type safety and state management
export function updateModelState(modelName: string, unitName: string) {
    currentModelName = modelName;
    currentUnitName = unitName;
}

export function updateEditorState(progressShown: boolean, unitAvailable: boolean, hasUnsavedChanges: boolean) {
    editorProgressShown = progressShown;
    noUnitAvailable = unitAvailable;
    unsavedChanges = hasUnsavedChanges;
}

export function updateUnitState(unit: UnitInfo) {
    currentUnit = unit;
}

export function updateUnitLists(names: UnitList, unitList: UnitList) {
    unitNames = names;
    units = unitList;
}
