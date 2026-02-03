import { writable } from 'svelte/store';

export type ExpandCollapseCommand = {
    command: 'expand' | 'collapse' | 'default';
    timestamp: number;
};

function createExpandCollapseStore() {
    const { subscribe, set } = writable<ExpandCollapseCommand | null>(null);

    return {
        subscribe,
        expandAll: () => {
            set({ command: 'expand', timestamp: Date.now() });
        },
        collapseAll: () => {
            set({ command: 'collapse', timestamp: Date.now() });
        },
        resetToDefaults: () => {
            set({ command: 'default', timestamp: Date.now() });
        },
        reset: () => {
            set(null);
        }
    };
}

export const expandCollapseStore = createExpandCollapseStore();
