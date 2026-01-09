import { writable } from 'svelte/store';

export const breadcrumbStore = writable<{ label: string; href?: string }[]>([]);

export function setBreadcrumb(breadcrumbs: { label: string; href?: string }[]) {
  breadcrumbStore.set(breadcrumbs);
} 