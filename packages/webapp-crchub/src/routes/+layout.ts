import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
    const auth = sessionStorage.getItem("auth") === "true";
    
    // Allow access to login page
    if (url.pathname === '/login') {
        return {};
    }

    // Protect all other routes
    if (!auth) {
        throw redirect(307, '/login');
    }

    return {};
}; 