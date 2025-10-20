import { writable } from 'svelte/store';

const storedTheme = localStorage.getItem('theme') || 'dark';
export const theme = writable(storedTheme);

theme.subscribe(value => {
    localStorage.setItem('theme', value);
    document.body.classList.toggle('dark', value === 'dark');
});