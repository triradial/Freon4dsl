import { goto } from '$app/navigation';

export function navigateTo(routeName: string, id?: string) {
    let url = '/' + routeName.toLowerCase();
    if (id) {
        url += `?id=${id}`;
    }
    console.log("Navigating to:", url);
    goto(url);
}