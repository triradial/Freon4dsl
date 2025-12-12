import { writable } from 'svelte/store';
import { userStore } from '../stores/users-store.js';
import { dataStore } from "../data/data-store.js";
import { env } from '../../config/env.js';
import { adminModeStore } from '../stores/admin-mode-store.js';

const initialAuth = sessionStorage.getItem('auth') === 'true';

export const isAuthenticated = writable<boolean>(initialAuth);
export const redirectUrl = writable<string>('/');
export const authToken = writable<string | null>(sessionStorage.getItem('authToken'));

/**
 * Authenticate user with username and password
 * This uses the new authentication flow:
 * 1. Server validates username in Azure AD
 * 2. Server gets OID from Azure AD
 * 3. Server checks database with OID and password
 * 4. Server checks active flag
 * 5. Server returns fake JWT token
 */
export async function authenticate(username: string, password: string): Promise<{ success: boolean; errorMessage?: string }> {
    try {
        console.log('[auth.ts] Starting authentication for:', username);
        const resp = await fetch(`${env.serverUrl}/signIn`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                cache: 'no-store'
            }
        );

        console.log('[auth.ts] Response status:', resp.status, 'ok:', resp.ok);

        if (!resp.ok) {
            const errorData = await resp.json();
            console.error('[auth.ts] Authentication failed:', errorData);
            
            // Map HTTP status codes to user-friendly messages
            let errorMessage: string;
            if (resp.status === 429) {
                // Rate limit error
                errorMessage = 'Too many login attempts. Please try again later.';
            } else if (resp.status >= 500) {
                // Server errors (500, 502, 503, etc.)
                errorMessage = 'Server issue. Please try again later.';
            } else {
                // All other authentication errors (404, 401, 403, etc.)
                errorMessage = 'Incorrect username or password. Please try again.';
            }
            
            return { success: false, errorMessage };
        }

        const data = await resp.json();
        console.log('[auth.ts] Response data:', data);
        
        // Store the authentication token
        if (data.token) {
            sessionStorage.setItem('authToken', data.token);
            authToken.set(data.token);
        }

        // Store the OID for use in subsequent requests
        if (data.oid) {
            sessionStorage.setItem('oid', data.oid);
        }

        console.log('[auth.ts] Calling getUserByEmail with:', username);
        try {
            const user = await dataStore.getUserByEmail(username);
            console.log('[auth.ts] getUserByEmail returned:', user);

            if (user) {
                userStore.setUser(user);
                await dataStore.initializeDatastore();
                sessionStorage.setItem('auth', 'true');
                isAuthenticated.set(true);
                console.log('[auth.ts] Authentication successful, returning true');
                return { success: true };
            } else {
                console.error('[auth.ts] User not found for email:', username);
                // Clear stored auth data if user retrieval fails
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('oid');
                authToken.set(null);
                return { success: false, errorMessage: 'Application issue, user not found. Please contact support.' };
            }
        } catch (userError: any) {
            console.error('[auth.ts] Error fetching user:', userError);
            // Clear stored auth data
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('oid');
            authToken.set(null);
            
            // Check if it's a server error (500+)
            if (userError.status && userError.status >= 500) {
                return { success: false, errorMessage: 'Server issue. Please contact support.' };
            } else if (userError.status === 404) {
                return { success: false, errorMessage: 'Application issue, user not found. Please contact support.' };
            } else {
                return { success: false, errorMessage: 'Server issue. Please contact support.' };
            }
        }

    } catch (error) {
        console.error('[auth.ts] Authentication error:', error);
        // Clear stored auth data on error
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('oid');
        authToken.set(null);
        
        // Network errors (server not responding)
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return { success: false, errorMessage: 'Server not responding. Please try again later.' };
        }
        
        return { success: false, errorMessage: 'Server not responding. Please try again later.' };
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
    try {
        // Call server signOut endpoint
        await fetch(`${env.serverUrl}/signOut`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`
            }
        });
    } catch (error) {
        console.error('Sign out error:', error);
    } finally {
        // Clear local storage and stores
        sessionStorage.removeItem('auth');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('oid');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('adminMode');
        
        authToken.set(null);
        isAuthenticated.set(false);
        userStore.clearUser();
        adminModeStore.disable();
    }
}

/**
 * Get the current auth token for making authenticated requests
 */
export function getAuthToken(): string | null {
    return sessionStorage.getItem('authToken');
}

/**
 * Check if the user is currently authenticated
 */
export function checkAuth(): boolean {
    const hasAuth = sessionStorage.getItem('auth') === 'true';
    const hasToken = !!sessionStorage.getItem('authToken');
    return hasAuth && hasToken;
}

/**
 * Initialize auth state from session storage
 * Call this on app startup
 */
export function initializeAuth(): void {
    const hasAuth = checkAuth();
    isAuthenticated.set(hasAuth);
    
    const token = sessionStorage.getItem('authToken');
    if (token) {
        authToken.set(token);
    }
    
    // Initialize user from storage if auth is valid
    if (hasAuth) {
        userStore.initializeFromStorage();
    }
}
