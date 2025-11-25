import { get, writable } from 'svelte/store';

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
    supportsPrint: boolean;
    props?: Record<string, any>;
};

type DrawerStore = {
    drawers: Record<string, Drawer>;
    activeDrawer: string | null;
};

export const drawerStore = writable<DrawerStore & { drawerOrder: string[] }>({
    drawers: {},
    activeDrawer: null,
    drawerOrder: []
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

export function setDrawerTitle(drawerKey: string, title: string) {
    drawerStore.update(store => ({
        ...store,
        drawers: {
            ...store.drawers,
            [drawerKey]: { ...store.drawers[drawerKey], title }
        }
    }));
}

export function addDrawer(drawer: Omit<Drawer, 'width' | 'isVisible'>) {
    drawerStore.update(store => {
        // Only add to order if not present
        const newOrder = store.drawerOrder.includes(drawer.key)
            ? store.drawerOrder
            : [...store.drawerOrder, drawer.key];
        return {
            ...store,
            drawers: {
                ...store.drawers,
                [drawer.key]: {
                    ...drawer,
                    width: drawer.defaultWidth,
                    isVisible: false
                }
            },
            drawerOrder: newOrder
        };
    });
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

export function setAllDrawersVisibility(isVisible: boolean) {
    drawerStore.update(store => ({
        ...store,
        drawers: Object.fromEntries(Object.entries(store.drawers).map(([key, drawer]) => [key, { ...drawer, isVisible }]))
    }));
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

export function getDrawerOrder(): string[] {
    return get(drawerStore).drawerOrder;
}