import { writable } from 'svelte/store';
import type {UnitInfo, UnitList} from "./store-interfaces.js";

// Core model state
export const currentModelName = writable('');
export const currentUnitName = writable('');

// UI state
export const noUnitAvailable = writable(true);
export const editorProgressShown = writable(true);
export const unsavedChanges = writable(true);

// Unit state
export const currentUnit = writable<UnitInfo>({id: undefined, ref: undefined});
export const toBeDeleted = writable<UnitInfo>({id: undefined, ref: undefined});
export const toBeRenamed = writable<UnitInfo>({id: undefined, ref: undefined});

// Unit lists
export const unitNames = writable<UnitList>({ids: [], refs: []});
export const units = writable<UnitList>({ids: [], refs: []});

// Update functions - keeping these for backward compatibility
export function setCurrentModelName(name: string) {
    currentModelName.set(name);
}

export function setCurrentUnitName(name: string) {
    currentUnitName.set(name);
}

export function setNoUnitAvailable(value: boolean) {
    noUnitAvailable.set(value);
}

export function setEditorProgressShown(value: boolean) {
    editorProgressShown.set(value);
}

export function setUnsavedChanges(value: boolean) {
    unsavedChanges.set(value);
}

export function setToBeDeleted(value: UnitInfo) {
    toBeDeleted.set(value);
}

export function setToBeRenamed(value: UnitInfo) {
    toBeRenamed.set(value);
}

export function setUnitNames(value: UnitList) {
    unitNames.set(value);
}

export function updateUnits(value: UnitList) {
    units.set(value);
}

// New functions for better type safety and state management
export function updateModelState(modelName: string, unitName: string) {
    currentModelName.set(modelName);
    currentUnitName.set(unitName);
}

export function updateEditorState(progressShown: boolean, unitAvailable: boolean, hasUnsavedChanges: boolean) {
    editorProgressShown.set(progressShown);
    noUnitAvailable.set(unitAvailable);
    unsavedChanges.set(hasUnsavedChanges);
}

export function updateUnitState(unit: UnitInfo) {
    currentUnit.set(unit);
}

export function updateUnitLists(names: UnitList, unitList: UnitList) {
    unitNames.set(names);
    units.set(unitList);
}
