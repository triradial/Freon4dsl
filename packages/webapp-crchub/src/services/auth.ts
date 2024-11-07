import { writable } from 'svelte/store';
import { PublicClientApplication } from '@azure/msal-browser';
import { userStore } from '../services/userStore.js';
import { initializeDatastore, getUserByEmail } from "../services/dataStore.js";

const initialAuth = sessionStorage.getItem('auth') === 'true';

export const isAuthenticated = writable<boolean>(initialAuth);
export const redirectUrl = writable<string>('/');

// Configure MSAL
const msalConfig = {
    auth: {
        clientId: 'd3936fc5-e732-4ffa-b9b4-963b9efb080c',
        authority: 'https://login.microsoftonline.com/76fac783-2772-4068-9735-d086f7a56bda',
        redirectUri: window.location.origin,
    }
};

const msalInstance = new PublicClientApplication(msalConfig);

export async function authenticate(username: string, password: string): Promise<boolean> {
    try {
        console.log('Authenticating user:', username);
        const fakeauth = false; // Toggle this for testing

        if (fakeauth) {
            if (!(username === 'graham.mcgibbon@triradial.com') &&
                !(username === 'mike.vogel@triradial.com') &&
                !(username === 'geoff.garabedian@triradial.com') &&
                !(username === 'hkneiss@gmail.com')) {
                console.log('User not in allowed list');
                return false;
            }
        } else {
            // Microsoft Entra ID authentication
            try {
                const loginResponse = await msalInstance.loginPopup({
                    scopes: ['User.Read']
                });

                if (!loginResponse.account) {
                    console.error('No account returned from Microsoft login');
                    return false;
                }

                username = loginResponse.account.username; // Use the email from Microsoft
            } catch (msalError) {
                console.error('Microsoft authentication error:', msalError);
                return false;
            }
        }

        console.log('Calling getUserByEmail with:', username);
        const user = await getUserByEmail(username);
        console.log('getUserByEmail returned:', user);

        if (user) {
            userStore.setUser(user);
            await initializeDatastore();
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
    try {
        const fakeauth = true; // Should match the flag in authenticate

        if (!fakeauth) {
            await msalInstance.logoutPopup();
        }

        sessionStorage.removeItem('auth');
        isAuthenticated.set(false);
    } catch (error) {
        console.error('Logout error:', error);
    }
}