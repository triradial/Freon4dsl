import { writable } from 'svelte/store';
import { signIn, type SignInInput } from 'aws-amplify/auth';
// import awsconfig from '../amplifyconfiguration.json';

const initialAuth = sessionStorage.getItem('auth') === 'true';

export const isAuthenticated = writable<boolean>(initialAuth);
export const redirectUrl = writable<string>('/');

export async function authenticate(signInInput: SignInInput): Promise<boolean> {
    try {
        const signInOutput = await signIn(signInInput);
        // isAuthenticated.set(true);
        // sessionStorage.setItem('auth', 'true');
        console.log('authenticate: logged in:', signInOutput);
        return true;
    } catch (error) {
        console.log('authenticate: error signing in');
        return false;
    }
}
