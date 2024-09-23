import { navigate } from 'svelte-routing';
import { currentRoute } from './routeStore';

export function updateCurrentRoute(routeName: string, id?: string) {
    currentRoute.set({ name: routeName, params: id ? { id } : {} });
}

export function navigateTo(routeName: string, id?: string) {
    updateCurrentRoute(routeName, id);
    let url = '/' + routeName.toLowerCase();
    if (id) {
        url += `?id=${id}`;
    }
    console.log("Navigating to:", url);
    navigate(url);
}