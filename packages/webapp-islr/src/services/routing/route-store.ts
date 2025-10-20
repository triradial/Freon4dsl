import { derived } from 'svelte/store';
import { page } from '$app/stores';

export interface RouteData {
  name: string;
  params: Record<string, any>;
}

export const currentRoute = derived(page, ($page): RouteData => {
  const url = $page.url;
  // Get the route name from the path (first segment, uppercased)
  const pathname = url.pathname.replace(/^\//, '').split('/')[0] || 'home';
  const name = pathname.toUpperCase();
  // Get params from search params
  const params = Object.fromEntries(url.searchParams.entries());
  return { name, params };
});