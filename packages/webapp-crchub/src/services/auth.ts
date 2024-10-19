import { writable } from 'svelte/store';
import { signIn, getCurrentUser, confirmSignIn, type SignInInput, type SignInOutput, type ConfirmSignInInput, signOut } from 'aws-amplify/auth';
import { userStore, type User } from '../services/userStore';
import { initializeDatastore, getUserByEmail } from "../services/dataStore";

const initialAuth = sessionStorage.getItem('auth') === 'true';

export const isAuthenticated = writable<boolean>(initialAuth);
export const redirectUrl = writable<string>('/');

export async function authenticate(signInInput: SignInInput): Promise<boolean> {
    try {
        const signInOutput = await signIn(signInInput);
        const user = await getUserByEmail(signInInput.username);
        if (user) {
            userStore.setUser(user);
            await initializeDatastore();
            return true;
        } else {
            console.error('User not found');
            return false;
        }

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'UserAlreadyAuthenticatedException') {
            console.log('User already authenticated, signing out and retrying');
            try {
                await signOut();
                // Retry authentication after sign out
                return authenticate(signInInput);
            } catch (signOutError) {
                console.error('Error during sign out:', signOutError);
                return false;
            }
        }
        console.error('authenticate: error signing in', error);
        return false;
    }
}