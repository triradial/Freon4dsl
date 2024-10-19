import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface User {
    userid: string;  // From AWS Cognito
    email: string;   // Provided during login
    name: string;    // From AWS Cognito
    facility: string;
}

function createUserStore() {
    const { subscribe, set, update }: Writable<User | null> = writable(null);

    return {
        subscribe,
        setUser: (user: User) => set(user),
        clearUser: () => set(null),
        updateUser: (data: Partial<User>) => update(user => user ? { ...user, ...data } : null),
    };
}

export const userStore = createUserStore();