/// <reference types="svelte" />

declare global {
    interface WindowEventMap {
        navigateTo: CustomEvent<{ name: string; params: any }>;
    }

    interface HTMLAttributes<T> {
        'on:study-click'?: (event: StudyClickEvent) => void;
    }
}

export {};