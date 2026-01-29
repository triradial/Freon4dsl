import { writable, derived } from 'svelte/store';

export function themeForBundle(v: string | null | undefined): 'dark' | 'light' {
    return v === 'light' || v === 'dark' ? v : 'dark';
}

const stored = themeForBundle(typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null);
export const theme = writable<string>(stored);

theme.subscribe((value) => {
    const t = themeForBundle(value);
    localStorage.setItem('theme', t);
    if (typeof document !== 'undefined') document.body.classList.toggle('dark', t === 'dark');
});

/** Use this for CSS href to avoid requesting bundle-undefined.css etc. */
export const themeBundle = derived(theme, (v) => themeForBundle(v));