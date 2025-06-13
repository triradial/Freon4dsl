<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getDrawer, drawerStore, setDrawerWidth, setActiveDrawer, getDrawerWidth, type Drawer, getDrawerOrder } from "../../services/stores/side-drawer-store.js";
    // @ts-ignore
    import { GripVertical as IconGripVertical, RefreshCw as IconRefreshCw, X as IconX } from '@lucide/svelte';

    let { isOpen = false } = $props<{ isOpen?: boolean }>();

    let activeDrawer = $derived($drawerStore.activeDrawer);
    let drawerWidth = $derived(activeDrawer ? getDrawerWidth(activeDrawer) : 400);
    let drawerOrder = $derived(getDrawerOrder());
    let drawers = $derived(
        $drawerStore.drawerOrder.map(key => $drawerStore.drawers[key]).filter(Boolean)
    );
    $effect(() => {
        console.log("[SideDrawerSystem] $effect activeDrawer:", activeDrawer, "activeDrawerKey:", activeDrawerKey);
        if (activeDrawer !== activeDrawerKey) {
            activeDrawerKey = activeDrawer;
            activeDrawerInstance = null;
        }
    });

    let activeDrawerInstance = $state<any>(null);
    let activeDrawerKey: string | null = null;

    const dispatch = createEventDispatcher();

    function toggleDrawer(drawerKey: string) {
        if (isOpen && activeDrawer === drawerKey) {
            isOpen = false;
        } else {
            isOpen = true;
            setActiveDrawer(drawerKey);
            drawerWidth = getDrawerWidth(drawerKey);
        }
        dispatch("drawerToggle", { isOpen, activeDrawer });
    }

    function closeDrawer() {
        isOpen = false;
        dispatch("drawerToggle", { isOpen, activeDrawer: "" });
    }

    function refreshDrawer() {
        if (activeDrawerInstance && typeof activeDrawerInstance.refresh === "function") {
            activeDrawerInstance.refresh();
        }
    }

    let resizing = false;
    let startX: number;
    let startWidth: number;

    function handleResize(event: MouseEvent) {
        if (!resizing) return;

        const dx = startX - event.clientX;
        const newWidth = Math.max(400, Math.min(1400, startWidth + dx));
        drawerWidth = newWidth;
        if (activeDrawer) {
            setDrawerWidth(activeDrawer, drawerWidth);
            dispatch("resize", { width: drawerWidth });
        }
    }

    function startResize(event: MouseEvent) {
        resizing = true;
        startX = event.clientX;
        startWidth = drawerWidth;

        window.addEventListener("mousemove", handleResize);
        window.addEventListener("mouseup", stopResize);
        event.preventDefault();
    }

    function stopResize() {
        resizing = false;
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", stopResize);
    }

    let DrawerComponent = $state(null);
    $effect(() => {
        console.log("[SideDrawerSystem] $effect DrawerComponent:", DrawerComponent);
        DrawerComponent = getDrawer(activeDrawer)?.component ?? null;
    });

    $effect(() => {
        console.log("Rendering drawers:", drawers);
    });
</script>

<div class="drawer-system" class:open={isOpen}>
    <div class="drawer-buttons">
        {#each drawers as drawer}
            {#if drawer.isVisible}
                {@const Icon = drawer.icon}
                <button id={drawer.key} class="icon-button toolbar-button" onclick={() => toggleDrawer(drawer.key)}><Icon size={20} /></button>
                <!-- <Tooltip class="tooltip-popover" triggeredBy="#{drawer.key}" placement="left">{drawer.description}</Tooltip> -->
            {/if}
        {/each}
    </div>
    {#if isOpen && activeDrawer}
        <div class="drawer-content-wrapper" style="width: {drawerWidth}px">
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="resize-handle" role="button" tabindex="0" onmousedown={startResize}><IconGripVertical /></div>
            <div class="drawer-content">
                <div class="drawer-header">
                    <div class="drawer-title-container">
                        <h2>{getDrawer(activeDrawer)?.title ?? ""}</h2>
                        {#if getDrawer(activeDrawer)?.supportsRefresh}
                            <button class="icon-button drawer-header-button" onclick={refreshDrawer}><IconRefreshCw size={16} /></button>
                        {/if}
                    </div>
                    <button class="icon-button drawer-header-button" onclick={closeDrawer}><IconX size={16} /></button>
                </div>
                {#if DrawerComponent}
                    <DrawerComponent {...getDrawer(activeDrawer)?.props} bind:this={activeDrawerInstance} />
                {/if}
            </div>
        </div>
    {/if}
</div>
