import { writable } from 'svelte/store';
import { userStore } from '../stores/users-store.js';
import { dataStore } from "../data/data-store.js";
import { env } from '../../config/env.js';

const initialAuth = sessionStorage.getItem('auth') === 'true';

export const isAuthenticated = writable<boolean>(initialAuth);
export const redirectUrl = writable<string>('/');

export async function authenticate(username: string, password: string): Promise<boolean> {
    try {
        const resp = await fetch(`${env.serverUrl}/signIn`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                cache: 'no-store'
            }
        );
        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }
    } catch (error) {
        console.error('Error loading studies:', error);
        return false;
    }
    try {
        console.log('Calling getUserByEmail with:', username);
        const user = await dataStore.getUserByEmail(username);
        console.log('getUserByEmail returned:', user);

        if (user) {
            userStore.setUser(user);
            await dataStore.initializeDatastore();
            sessionStorage.setItem('auth', 'true');
            isAuthenticated.set(true);
            return true;
        } else {
            console.error('User not found for email:', username);
            return false;
        }

    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

export async function signOut(): Promise<void> {
    // try {
    //     const fakeauth = true; // Should match the flag in authenticate

    //     if (!fakeauth) {
    //         await msalInstance.logoutPopup();
    //     }

    //     sessionStorage.removeItem('auth');
    //     isAuthenticated.set(false);
    // } catch (error) {
    //     console.error('Logout error:', error);
    // }
}