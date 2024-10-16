<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Button, Tooltip } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faTimes, faGripLinesVertical, faRotateRight } from "@fortawesome/free-solid-svg-icons";
    import { getDrawer, drawerStore, setDrawerWidth, setActiveDrawer, getDrawerWidth, type Drawer } from "../../services/sideDrawerStore";

    export let isOpen = false;

    $: activeDrawer = $drawerStore.activeDrawer;
    $: drawerWidth = activeDrawer ? getDrawerWidth(activeDrawer) : 400;
    $: drawers = Object.values($drawerStore.drawers) as Drawer[];
    $: if (activeDrawer !== activeDrawerKey) {
        activeDrawerKey = activeDrawer;
        activeDrawerInstance = null;  
    }

    let activeDrawerInstance: any;
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
        if (activeDrawerInstance && typeof activeDrawerInstance.refresh === 'function') {
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
</script>

<div class="drawer-system" class:open={isOpen}>
    <div class="drawer-buttons">
        {#each drawers as drawer}
            {#if drawer.isVisible}
                <Button id={drawer.key} class="drawer-button" on:click={() => toggleDrawer(drawer.key)}>
                    <FontAwesomeIcon icon={drawer.icon} />
                </Button>
                <!-- <Tooltip class="tooltip-popover" triggeredBy="#{drawer.key}" placement="left">{drawer.description}</Tooltip> -->
            {/if}
        {/each}
    </div>
    {#if isOpen && activeDrawer}
        <div class="drawer-content-wrapper" style="width: {drawerWidth}px">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="resize-handle" on:mousedown={startResize}>
                <FontAwesomeIcon icon={faGripLinesVertical} class="grip-icon" />
            </div>
            <div class="drawer-content">
                <div class="drawer-header">
                    <div class="drawer-title-container">
                        <h2>{getDrawer(activeDrawer)?.title ?? ""}</h2>
                        {#if getDrawer(activeDrawer)?.supportsRefresh}
                            <Button class="drawer-header-button" on:click={refreshDrawer}>
                                <FontAwesomeIcon icon={faRotateRight} />
                            </Button>
                        {/if}
                    </div>
                    <Button class="drawer-header-button" on:click={closeDrawer}>
                        <FontAwesomeIcon icon={faTimes} />
                    </Button>
                </div>
                {#key activeDrawer}
                    <svelte:component 
                        this={getDrawer(activeDrawer)?.component}
                        {...getDrawer(activeDrawer)?.props}
                        bind:this={activeDrawerInstance}
                    />
                {/key}
            </div>
        </div>
    {/if}
</div>
