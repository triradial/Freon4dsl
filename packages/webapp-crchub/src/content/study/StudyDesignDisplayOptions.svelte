<script lang="ts">
    import { Popover } from '@skeletonlabs/skeleton-svelte';
    import { onMount } from "svelte";
    // @ts-ignore
    import { Eye as IconEye, EyeClosed as IconEyeClosed, X as IconX } from '@lucide/svelte';

    const { onCheckboxChange, items } = $props<{
        onCheckboxChange: (key: string, value: boolean) => void;
        items: Array<{ id: string; label: string; visible: boolean; parent?: string; count?: number }>;
    }>();

    // Local state for items that can be mutated
    let localItems = $state<Array<{ id: string; label: string; visible: boolean; parent?: string; count?: number }>>([]);
    let hiddenItems = $state<Array<{ id: string; label: string; visible: boolean; parent?: string; count?: number }>>([]);  
    
    // Update local items when props change
    $effect(() => {
        localItems = [...items];
    });
    
    // Update hidden items when local items change
    $effect(() => {
        hiddenItems = localItems.filter((item) => !item.visible);
    });

    // Recursively uncheck all descendants of a given item
    function uncheckDescendants(parentId: string) {
        const children = localItems.filter(i => i.parent === parentId);
        children.forEach(child => {
            if (child.visible) {
                child.visible = false;
                onCheckboxChange(child.id, false);
            }
            // Recursively uncheck grandchildren
            uncheckDescendants(child.id);
        });
    }

    function handleItemToggle(id: string) {
        const item = localItems.find(i => i.id === id);
        if (item) {
            // Toggle the item's visible property
            item.visible = !item.visible;
            onCheckboxChange(id, item.visible);
            
            // Handle parent-child relationships
            if (!item.visible) {
                // Item unchecked - uncheck all descendants recursively
                uncheckDescendants(id);
            }
            // If item is checked, don't automatically check children (user must do this manually)
        }
    }

    function isParentVisible(id: string): boolean {
        const item = localItems.find((item) => item.id === id);
        if (!item || !item.parent) {
            return true;
        }
        const parent = localItems.find(i => i.id === item.parent);
        if (!parent) {
            return true;
        }
        // Recursively check if parent and all ancestors are visible
        return parent.visible && isParentVisible(parent.id);
    }

    // Calculate indentation level based on parent hierarchy depth
    function getIndentLevel(id: string): number {
        const item = localItems.find((item) => item.id === id);
        if (!item || !item.parent) {
            return 0;
        }
        return 1 + getIndentLevel(item.parent);
    }

    let openState = $state(false);
    function popoverClose() {
        openState = false;
    }
</script>

<div class="footer-container">
    <Popover
        open={openState}
        onOpenChange={(e) => (openState = e.open)}
        positioning={{ placement: 'bottom-start', offset: 4 }}
        contentBase="card p-4 space-y-2 max-w-[320px] editor-display-options-popover w-44"
        arrow
        arrowBackground="editor-display-options-popover"
    >
        {#snippet trigger()}
            <button id="editoritems" type="button" class="standard-button primary inverted"><IconEye size="16" /> Display Options</button>
        {/snippet}
        {#snippet content()}
            <header class="flex justify-between align-center">
                <span class="footer-header-text">Display Options</span>
                <button class="icon-button drawer-header-button" type="button" onclick={popoverClose}><IconX size="16" /></button>
            </header>
            <div class="editor-display-options">
                {#each localItems as item}
                    <div class="flex items-center item" style="margin-left: {getIndentLevel(item.id) * 1.5}rem;">
                        <button type="button" onclick={() => handleItemToggle(item.id)} class="btn {item.visible ? '' : 'hidden-item'}"
                            disabled={!isParentVisible(item.id)}
                            title={item.visible ? 'Hide' : 'Show'}
                        >
                            {#if item.visible}
                                <IconEye size={16} />
                            {:else}
                                <IconEyeClosed size={16} />
                            {/if}
                            {item.label}
                        </button>
                    </div>
                {/each}
            </div>
        {/snippet}
    </Popover>
    {#if hiddenItems.length > 0}
        <span class="editor-footer-label">Hidden Items: </span>
        <span class="editor-footer-text flex-grow">{hiddenItems.map((item) => item.count !== undefined ? `${item.label} (${item.count})` : item.label).join(", ")}</span>
    {/if}
</div>
