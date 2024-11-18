import { writable, get } from 'svelte/store';

export type Drawer = {
    key: string;
    icon: any;
    component: any;
    title: string;
    description: string;
    defaultWidth: number;
    width: number;
    isVisible: boolean;
    supportsRefresh: boolean;
    props?: Record<string, any>;
};

type DrawerStore = {
    drawers: Record<string, Drawer>;
    activeDrawer: string | null;
};

export const drawerStore = writable<DrawerStore>({
    drawers: {},
    activeDrawer: null
});

export function setDrawerProps(drawerKey: string, props: Record<string, any>) {
    drawerStore.update(store => ({
        ...store,
        drawers: {
            ...store.drawers,
            [drawerKey]: { 
                ...store.drawers[drawerKey], 
                props: { ...store.drawers[drawerKey].props, ...props }
            }
        }
    }));
}

export function addDrawer(drawer: Omit<Drawer, 'width' | 'isVisible'>) {
    drawerStore.update(store => ({
        ...store,
        drawers: {
            ...store.drawers,
            [drawer.key]: {
                ...drawer,
                width: drawer.defaultWidth,
                isVisible: false
            }
        }
    }));
}

export function setDrawerWidth(drawerKey: string, width: number) {
    drawerStore.update(store => ({
        ...store,
        drawers: {
            ...store.drawers,
            [drawerKey]: { ...store.drawers[drawerKey], width }
        }
    }));
}

export function getDrawerWidth(drawerKey: string): number {
    const store = get(drawerStore);
    return store.drawers[drawerKey]?.width ?? store.drawers[drawerKey]?.defaultWidth ?? 400;
}

export function setDrawerVisibility(drawerKey: string, isVisible: boolean) {
    drawerStore.update(store => ({
        ...store,
        drawers: {
            ...store.drawers,
            [drawerKey]: { ...store.drawers[drawerKey], isVisible }
        }
    }));
}

export function getDrawerVisibility(drawerKey: string): boolean {
    return get(drawerStore).drawers[drawerKey]?.isVisible ?? false;
}

export function setActiveDrawer(drawerKey: string | null) {
    drawerStore.update(store => ({
        ...store,
        activeDrawer: drawerKey
    }));
}

export function getActiveDrawer(): string | null {
    return get(drawerStore).activeDrawer;
}

export function getDrawer(drawerKey: string): Drawer | undefined {
    return get(drawerStore).drawers[drawerKey];
}

export function getDrawerComponent(drawerKey: string): any | undefined {
    const store = get(drawerStore);
    return store.drawers[drawerKey]?.component;
}