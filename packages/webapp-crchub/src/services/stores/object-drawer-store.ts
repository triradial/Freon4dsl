import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/data-store.js';
import type { Study } from '../data/data-store.js';

export const objectDrawerStore = writable({
    open: false,
    type: null, // 'study' | 'patient'
    action: null, // 'add' | 'edit'
    data: null
});

export function openObjectDrawer(type: 'study' | 'patient', action: 'add' | 'edit', data: any) {
    objectDrawerStore.set({ open: true, type, action, data });
}

export function closeObjectDrawer() {
    objectDrawerStore.set({ open: false, type: null, action: null, data: null });
}

export async function addObject(type: 'study' | 'patient', parentId?: string) {
    let parentName = '';
    if (parentId && type === 'patient') {
        const parentObject: Study | undefined = await dataStore.getStudy(parentId);
        if (parentObject) {
            parentName = parentObject.name;
        }
    }
    const object = type === 'study'
        ? { id: uuidv4(), name: '', title: '', status: '', phase: '', therapeuticArea: '', currentProtocol: '' }
        : { id: uuidv4(), patientNumber: '', displayName: '', name: '', initials: '', dob: '', gender: '', studyId: parentId, study: parentName };
    objectDrawerStore.set({ open: true, type, action: 'add', data: object });
}

export async function editObject(type: 'study' | 'patient', id: string) {
    console.log('editObject called:', type, id);

    let object;
    if (type === 'study') {
        object = await dataStore.getStudy(id);
    } else {
        object = await dataStore.getPatient(id);
    }
    console.log('Object retrieved:', object);

    if (!object) {
        console.error(`${type} with id ${id} not found`);
    } else {
        console.error(`${type} with id ${id} found`);
        objectDrawerStore.set({ open: true, type, action: 'edit', data: object });
    }
}

export async function saveObject(updatedObject: any) {
    objectDrawerStore.update(store => {
        if (store.type === 'study') {
            if (store.data.action === 'add') {
                dataStore.addStudy(updatedObject);
            } else {
                dataStore.updateStudy(updatedObject);
            }
        } else {
            if (store.data.action === 'add') {
                dataStore.addPatient(updatedObject);
            } else {
                dataStore.updatePatient(updatedObject);
            }
        }
        return { ...store, open: false };
    });
}