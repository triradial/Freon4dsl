import { navigate } from 'svelte-routing';
import { currentRoute } from './routeStore';

export function updateCurrentRoute(routeName: string, id?: string) {
    // if routeName contains ?id= then split it into routeName and id
    if (routeName.includes('?id=')) {
        const [route, params] = routeName.split('?');
        routeName = route;
        id = params.split('=')[1];
    }
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