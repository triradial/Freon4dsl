import { writable } from 'svelte/store';

function createAdminModeStore() {
    const { subscribe, set, update } = writable(false);

    return {
        subscribe,
        enable: () => {
            set(true);
            sessionStorage.setItem('adminMode', 'true');
        },
        disable: () => {
            set(false);
            sessionStorage.setItem('adminMode', 'false');
        },
        toggle: () => {
            update(value => {
                const newValue = !value;
                sessionStorage.setItem('adminMode', newValue ? 'true' : 'false');
                return newValue;
            });
        },
        initializeFromStorage: () => {
            const stored = sessionStorage.getItem('adminMode');
            if (stored === 'true') {
                set(true);
            } else {
                set(false);
            }
        }
    };
}

export const adminModeStore = createAdminModeStore();

