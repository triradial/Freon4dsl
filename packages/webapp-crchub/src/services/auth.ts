import { writable } from 'svelte/store';
import { signIn, getCurrentUser, confirmSignIn, type SignInInput, type SignInOutput, type ConfirmSignInInput, signOut } from 'aws-amplify/auth';
import { userStore, type User } from '../services/userStore.js';
import { initializeDatastore, getUserByEmail } from "../services/dataStore.js";

const initialAuth = sessionStorage.getItem('auth') === 'true';

export const isAuthenticated = writable<boolean>(initialAuth);
export const redirectUrl = writable<string>('/');

export async function authenticate(username: string, password: string): Promise<boolean> {
    try {
        console.log('Authenticating user:', username); // Debug log
        const fakeauth = true;

        if (fakeauth) {
            if (!(username === 'graham.mcgibbon@triradial.com') &&
                !(username === 'mike.vogel@triradial.com') &&
                !(username === 'hkneiss@gmail.com'))
                {
                console.log('User not in allowed list'); // Debug log
                return false;
            }   
        } else {
            const signInInput: SignInInput = {
                username: username,
                password: password,
            };
            const signInOutput = await signIn(signInInput);
        }
        
        console.log('Calling getUserByEmail with:', username); // Debug log
        const user = await getUserByEmail(username);
        console.log('getUserByEmail returned:', user); // Debug log

        if (user) {
            userStore.setUser(user);
            await initializeDatastore();
            return true;
        } else {
            console.error('User not found for email:', username);
            return false;
        }

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'UserAlreadyAuthenticatedException') {
            console.log('User already authenticated, signing out and retrying');
            try {
                await signOut();
                // Retry authentication after sign out
                return authenticate(username, password);
            } catch (signOutError) {
                console.error('Error during sign out:', signOutError);
                return false;
            }
        }
        console.error('authenticate: error signing in', error);
        return false;
    }
}