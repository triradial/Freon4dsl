import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types.js';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
    // Only run on the client
    if (typeof window !== 'undefined') {
        const auth = sessionStorage.getItem('auth') === 'true';
        if (!auth && url.pathname !== '/login') {
            // Store intended route for after login
            sessionStorage.setItem('intendedRoute', url.pathname + url.search);
            throw redirect(307, '/login');
        }
    }
    return {};
}; 