import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/data-store.js';
import type { Study } from '../data/data-store.js';

export const objectDrawerStore = writable({
    open: false,
    type: null, // 'study' | 'patient' | 'organization' | 'person'
    action: null, // 'add' | 'edit'
    data: null
});

export function openObjectDrawer(type: 'study' | 'patient' | 'organization' | 'person', action: 'add' | 'edit', data: any) {
    objectDrawerStore.set({ open: true, type, action, data });
}

export function closeObjectDrawer() {
    objectDrawerStore.set({ open: false, type: null, action: null, data: null });
}

export async function addObject(type: 'study' | 'patient' | 'organization' | 'person', parentId?: string) {
    let parentName = '';
    if (parentId && type === 'patient') {
        const parentObject: Study | undefined = await dataStore.getStudy(parentId);
        if (parentObject) {
            parentName = parentObject.name;
        }
    }
    let object;
    if (type === 'study') {
        object = { id: uuidv4(), name: '', title: '', status: '', phase: '', therapeuticArea: '', currentProtocol: '' };
    } else if (type === 'patient') {
        object = { id: uuidv4(), patientNumber: '', initials: '', dob: '', gender: '', studyId: parentId, study: parentName };
    } else if (type === 'organization') {
        object = { id: uuidv4(), name: '', isDomain: false, orgTypeId: '', orgSubtypeId: '' };
    } else if (type === 'person') {
        object = { id: uuidv4(), name: '', email: '', username: '', oid: '' };
    }
    objectDrawerStore.set({ open: true, type, action: 'add', data: object });
}

export async function editObject(type: 'study' | 'patient' | 'organization' | 'person', idOrData: string | any) {
    console.log('editObject called:', type, idOrData);

    let object;
    
    // If idOrData is an object (has the data), use it directly
    if (typeof idOrData === 'object' && idOrData !== null) {
        object = idOrData;
    } else {
        // Otherwise, treat it as an ID and fetch from API
        const id = idOrData as string;
        if (type === 'study') {
            object = await dataStore.getStudy(id);
        } else if (type === 'patient') {
            object = await dataStore.getPatient(id);
        } else if (type === 'organization') {
            object = await dataStore.getOrganization(id);
        } else if (type === 'person') {
            object = await dataStore.getPerson(id);
        }
    }
    
    console.log('Object retrieved:', object);

    if (!object) {
        const id = typeof idOrData === 'string' ? idOrData : idOrData?.id;
        console.error(`${type} with id ${id} not found`);
    } else {
        const id = typeof idOrData === 'string' ? idOrData : idOrData?.id;
        console.log(`${type} with id ${id} found`);
        objectDrawerStore.set({ open: true, type, action: 'edit', data: object });
    }
}

export async function saveObject(updatedObject: any) {
    // Get current store state to determine type and action
    let storeState: { type: string | null; action: string | null } = { type: null, action: null };
    objectDrawerStore.subscribe(s => { storeState = s; })();
    
    // Await the async dataStore operation before closing the drawer
    // This ensures the data is saved and state is updated before the drawer closes
    if (storeState.type === 'study') {
        if (storeState.action === 'add') {
            await dataStore.addStudy(updatedObject);
        } else {
            await dataStore.updateStudy(updatedObject);
        }
    } else if (storeState.type === 'patient') {
        if (storeState.action === 'add') {
            await dataStore.addPatient(updatedObject);
        } else {
            await dataStore.updatePatient(updatedObject);
        }
    } else if (storeState.type === 'organization') {
        if (storeState.action === 'add') {
            await dataStore.addOrganization(updatedObject);
        } else {
            await dataStore.updateOrganization(updatedObject.id, updatedObject);
        }
    } else if (storeState.type === 'person') {
        if (storeState.action === 'add') {
            await dataStore.addPerson(updatedObject);
        } else {
            await dataStore.updatePerson(updatedObject.id, updatedObject);
        }
    }
    
    // Now close the drawer after the save has completed
    objectDrawerStore.set({ open: false, type: null, action: null, data: null });
}
