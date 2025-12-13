import { writable } from 'svelte/store';

function createStaffAvailabilityStore() {
    const { subscribe, set, update } = writable(true); // Default to true (show by default)

    return {
        subscribe,
        enable: () => {
            set(true);
            sessionStorage.setItem('showStaffAvailability', 'true');
        },
        disable: () => {
            set(false);
            sessionStorage.setItem('showStaffAvailability', 'false');
        },
        toggle: () => {
            update(value => {
                const newValue = !value;
                sessionStorage.setItem('showStaffAvailability', newValue ? 'true' : 'false');
                return newValue;
            });
        },
        initializeFromStorage: () => {
            const stored = sessionStorage.getItem('showStaffAvailability');
            if (stored === 'false') {
                set(false);
            } else {
                set(true); // Default to true if not set
            }
        }
    };
}

export const staffAvailabilityStore = createStaffAvailabilityStore();

