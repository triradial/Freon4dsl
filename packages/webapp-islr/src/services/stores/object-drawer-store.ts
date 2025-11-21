import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/data-store.js';
import type { Study } from '../data/data-store.js';

export const objectDrawerStore = writable({
    open: false,
    type: null, // 'project'
    action: null, // 'add' | 'edit'
    data: null
});

export function openObjectDrawer(type: 'project', action: 'add' | 'edit', data: any) {
    objectDrawerStore.set({ open: true, type, action, data });
}

export function closeObjectDrawer() {
    objectDrawerStore.set({ open: false, type: null, action: null, data: null });
}

export async function addObject(type: 'project', parentId?: string) {
    const object = { id: uuidv4(), name: 'StudyExtract', title: '', status: '' };
    objectDrawerStore.set({ open: true, type, action: 'add', data: object });
}

export async function editObject(type: 'project', id: string) {
    console.log('editObject called:', type, id);

    let object;
    object = await dataStore.getStudy(id);
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
        if (store.type === 'project') {
            if (store.data.action === 'add') {
                dataStore.addStudy(updatedObject);
            } else {
                dataStore.updateStudy(updatedObject);
            }
        }
        return { ...store, open: false };
    });
}