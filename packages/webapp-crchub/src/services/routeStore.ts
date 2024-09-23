import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface RouteData {
  name: string;
  params: Record<string, any>;
}

export const currentRoute: Writable<RouteData> = writable({ name: 'Home', params: {} });