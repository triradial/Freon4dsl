<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { drawerStore, getDrawer, getDrawerWidth, setActiveDrawer, setDrawerWidth } from "../../services/stores/side-drawer-store.js";
// @ts-ignore
    import { Printer as IconPrinter, RefreshCw as IconRefreshCw, X as IconX } from '@lucide/svelte';

    let { isOpen = false } = $props<{ isOpen?: boolean }>();

    let activeDrawer = $derived($drawerStore.activeDrawer);
    let drawerWidth = $derived(activeDrawer ? getDrawerWidth(activeDrawer) : 400);
    let drawers = $derived($drawerStore.drawerOrder.map(key => $drawerStore.drawers[key]).filter(Boolean));
    let activeDrawerTitle = $derived(activeDrawer ? ($drawerStore.drawers[activeDrawer]?.title ?? "") : "");
    let drawerContentEl = $state<HTMLElement | null>(null);
    let activeDrawerInstance = $state<any>(null);
    let activeDrawerKey: string | null = null;
    let resizing = false;
    let startX: number;
    let startWidth: number;

    let DrawerComponent = $state(null);
    $effect(() => {
        DrawerComponent = getDrawer(activeDrawer)?.component ?? null;
    });

    let isHandleBright = $state(false);
    let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
    let dragging = false;

    $effect(() => {
        if (activeDrawer !== activeDrawerKey) {
            activeDrawerKey = activeDrawer;
            activeDrawerInstance = null;
        }
    });

    const dispatch = createEventDispatcher();

    function toggleDrawer(drawerKey: string) {
        if (isOpen && activeDrawer === drawerKey) {
            isOpen = false;
            setActiveDrawer(null);
        } else {
            isOpen = true;
            setActiveDrawer(drawerKey);
            drawerWidth = getDrawerWidth(drawerKey);
        }
        dispatch("drawerToggle", { isOpen, activeDrawer });
    }

    function closeDrawer() {
        isOpen = false;
        setActiveDrawer(null);
        dispatch("drawerToggle", { isOpen, activeDrawer: "" });
    }
    
    function printContent() {
        if (activeDrawerInstance && typeof activeDrawerInstance.print === "function") {
            activeDrawerInstance.print();
        }
    }

    function refreshDrawer() {
        if (activeDrawerInstance && typeof activeDrawerInstance.refresh === "function") {
            activeDrawerInstance.refresh();
        }
    }

    function getDynamicMinWidth() {
        const HARDCODED_MIN = 400;
        if (drawerContentEl) {
            const contentMin = drawerContentEl.scrollWidth;
            return Math.max(HARDCODED_MIN, contentMin);
        }
        return HARDCODED_MIN;
    }

    function handleResize(event: MouseEvent) {
        if (!resizing) return;

        const dx = startX - event.clientX;
        const dynamicMinWidth = getDynamicMinWidth();
        const newWidth = Math.max(dynamicMinWidth, Math.min(1400, startWidth + dx));
        drawerWidth = newWidth;
        if (activeDrawer) {
            setDrawerWidth(activeDrawer, drawerWidth);
            dispatch("resize", { width: drawerWidth });
        }
    }

    function startResize(event: MouseEvent) {
        resizing = true;
        dragging = true;
        startX = event.clientX;
        startWidth = drawerWidth;
        if (hoverTimeout) clearTimeout(hoverTimeout);
        isHandleBright = true;

        window.addEventListener("mousemove", handleResize);
        window.addEventListener("mouseup", stopResize);
        event.preventDefault();
    }

    function stopResize() {
        resizing = false;
        dragging = false;
        if (hoverTimeout) clearTimeout(hoverTimeout);
        isHandleBright = false;
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", stopResize);
    }

    function handleResizeHandleMouseEnter() {
        hoverTimeout = setTimeout(() => {
            isHandleBright = true;
        }, 300);
    }

    function handleResizeHandleMouseLeave() {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (!dragging) {
            isHandleBright = false;
        }
    }
</script>

<div class="drawer-system" class:open={isOpen}>
    <div class="drawer-buttons">
        {#each drawers as drawer}
            {#if drawer.isVisible}
                {@const Icon = drawer.icon}
                <button id={drawer.key} class="icon-button toolbar-button" onclick={() => toggleDrawer(drawer.key)} title={drawer.description}><Icon size={24} /></button>
            {/if}
        {/each}
    </div>
    {#if isOpen && activeDrawer}
        <div class="drawer-content-wrapper" style="width: {drawerWidth}px">
            <div class="drawer-content">
                <div class="drawer-header">
                    <div class="drawer-title-container">
                        <h2>{activeDrawerTitle}</h2>
                        {#if getDrawer(activeDrawer)?.supportsRefresh}
                            <button class="image-button drawer-header-button" onclick={refreshDrawer}><IconRefreshCw size={20} /></button>
                        {/if}
                        {#if getDrawer(activeDrawer)?.supportsPrint}
                            <button class="image-button drawer-header-button" onclick={printContent}><IconPrinter size={20} /></button>
                        {/if}
                    </div>
                    <button class="image-button drawer-header-button" onclick={closeDrawer}><IconX size={16} /></button>
                </div>
                {#if DrawerComponent}
                    <div bind:this={drawerContentEl} style="height: 100%">
                        <DrawerComponent {...getDrawer(activeDrawer)?.props} bind:this={activeDrawerInstance} />
                    </div>
                {/if}
            </div>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="resize-handle"
                class:bright={isHandleBright}
                aria-hidden="true"
                tabindex="-1"
                onmousedown={startResize}
                onmouseenter={handleResizeHandleMouseEnter}
                onmouseleave={handleResizeHandleMouseLeave}>
            </div>
        </div>
    {/if}
</div>
