import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types.js';

export const ssr = false;

// Admin-only routes that require isGlobalAdmin permission
const ADMIN_ONLY_ROUTES = ['/organizations', '/people'];

export const load: LayoutLoad = async ({ url }) => {
    // Only run on the client
    if (typeof window !== 'undefined') {
        const auth = sessionStorage.getItem('auth') === 'true';
        if (!auth && url.pathname !== '/login') {
            // Store intended route for after login
            sessionStorage.setItem('intendedRoute', url.pathname + url.search);
            throw redirect(307, '/login');
        }
        
        // Check if route requires admin access
        if (auth && ADMIN_ONLY_ROUTES.includes(url.pathname)) {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (!user.isGlobalAdmin) {
                        // User is not an admin, redirect to home
                        throw redirect(307, '/home');
                    }
                } catch (error) {
                    // If user data is invalid, redirect to home
                    throw redirect(307, '/home');
                }
            } else {
                // No user data, redirect to home
                throw redirect(307, '/home');
            }
        }
    }
    return {};
}; 