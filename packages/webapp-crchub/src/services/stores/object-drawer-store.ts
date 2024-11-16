import { get, writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/data-store.js';
import type { Study } from '../data/data-store.js';

export const drawerStore = writable({
    instanceId: uuidv4(),
    open: false,
    objectType: null as 'study' | 'patient' | null,
    action: null as 'add' | 'edit' | null,
    id: null as string | null,
    object: null as any
});

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
        : { id: uuidv4(), patientNumber: '', displayName: '', name: '', dob: '', gender: '', studyId: parentId, study: parentName };
    drawerStore.set({ instanceId: uuidv4(), open: true, objectType: type, action: 'add', id: null, object });
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
        drawerStore.set({ instanceId: uuidv4(), open: true, objectType: type, action: 'edit', id, object });
    }
}

export async function saveObject(updatedObject: any) {
    drawerStore.update(store => {
        if (store.objectType === 'study') {
            if (store.action === 'add') {
                dataStore.addStudy(updatedObject);
            } else {
                dataStore.updateStudy(updatedObject);
            }
        } else {
            if (store.action === 'add') {
                dataStore.addPatient(updatedObject);
            } else {
                dataStore.updatePatient(updatedObject);
            }
        }
        return { ...store, open: false };
    });
}

export function closeDrawer() {
    drawerStore.update(store => ({ ...store, open: false }));
}