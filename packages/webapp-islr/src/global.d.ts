declare global {
    interface WindowEventMap {
        navigateTo: CustomEvent<{ name: string; params: any }>;
    }

    interface HTMLAttributes<T> {
        'on:study-click'?: (event: StudyClickEvent) => void;
    }
}

// Add Svelte module declaration
declare module "*.svelte" {
    import type { ComponentType } from "svelte";
    const component: ComponentType;
    export default component;
}

export { };