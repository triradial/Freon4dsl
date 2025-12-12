import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface User {
    oid: string;     // Azure Entra Object ID
    email: string;   // Provided during login
    name: string;    // From Azure Entra
    facility: string;
    role: string;
    isGlobalAdmin: boolean;
}

function createUserStore() {
    const { subscribe, set, update }: Writable<User | null> = writable(null);

    return {
        subscribe,
        setUser: (user: User) => {
            set(user);
            // Store in session storage
            sessionStorage.setItem('user', JSON.stringify(user));
        },
        clearUser: () => {
            set(null);
            sessionStorage.removeItem('user');
        },
        updateUser: (data: Partial<User>) => {
            update(user => {
                const updatedUser = user ? { ...user, ...data } : null;
                if (updatedUser) {
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                }
                return updatedUser;
            });
        },
        initializeFromStorage: () => {
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    set(parsedUser);
                } catch (error) {
                    console.error('Failed to parse stored user:', error);
                    sessionStorage.removeItem('user');
                }
            }
        }
    };
}

export const userStore = createUserStore();