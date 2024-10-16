import { get, writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { studies, patients, getStudy, getPatient, addStudy, editStudy, addPatient, editPatient } from '../services/dataStore';

export const drawerStore = writable({
    instanceId: uuidv4(),
    open: false,
    objectType: null as 'study' | 'patient' | null,
    action: null as 'add' | 'edit' | null,
    id: null as string | null,
    object: null as any
});

export function addObject(type: 'study' | 'patient') {
    const object = type === 'study'
        ? { id: uuidv4(), name: '', title: '', status: '', phase: '', therapeuticArea: '', currentProtocol: '' }
        : { id: uuidv4(), patientNumber: '', displayName: '', name: '', dob: '', gender: '', studyId: '', study: '' };
    drawerStore.set({ instanceId: uuidv4(), open: true, objectType: type, action: 'add', id: null, object });
}

export function editObject(type: 'study' | 'patient', id: string) {
    console.log('editObject called:', type, id);
    
    // Log the current state of the studies store
    console.log('Current studies:', get(studies));
    
    let object;
    if (type === 'study') {
        object = getStudy(id);
        if (!object) {
            console.log('Study not found in getStudy, trying direct access');
            object = get(studies).find(study => study.id === id);
        }
    } else {
        object = getPatient(id);
        if (!object) {
            console.log('Patient not found in getPatient, trying direct access');
            object = get(patients).find(patient => patient.id === id);
        }
    }
    
    console.log('Object retrieved:', object);
    
    if (!object) {
        console.error(`${type} with id ${id} not found`);
        // Set an error state in the store
        drawerStore.set({ instanceId: uuidv4(), open: false, objectType: null, action: null, id: null, object: null });
        return;
    }
    
    drawerStore.set({ instanceId: uuidv4(), open: true, objectType: type, action: 'edit', id, object });
    console.log('drawerStore updated:', get(drawerStore));
}

export async function saveObject(updatedObject: any) {
    drawerStore.update(store => {
        if (store.objectType === 'study') {
            if (store.action === 'add') {
                addStudy(updatedObject);
            } else {
                editStudy(updatedObject);
            }
        } else {
            if (store.action === 'add') {
                addPatient(updatedObject);
            } else {
                editPatient(updatedObject);
            }
        }
        return { ...store, open: false };
    });
}

export function closeDrawer() {
    drawerStore.update(store => ({ ...store, open: false }));
}