<script lang="ts">
    import { Popover } from '@skeletonlabs/skeleton-svelte';
    import { onMount } from "svelte";
    // @ts-ignore
    import { Eye as IconEye, X as IconX } from '@lucide/svelte';

    const { onCheckboxChange, items } = $props<{
        onCheckboxChange: (key: string, value: boolean) => void;
        items: Array<{ id: string; label: string; visible: boolean; parent?: string }>;
    }>();

    // Local state for items that can be mutated
    let localItems = $state<Array<{ id: string; label: string; visible: boolean; parent?: string }>>([]);
    let hiddenItems = $state<Array<{ id: string; label: string; visible: boolean; parent?: string }>>([]);  
    
    // Update local items when props change
    $effect(() => {
        localItems = [...items];
    });
    
    // Update hidden items when local items change
    $effect(() => {
        hiddenItems = localItems.filter((item) => !item.visible);
    });

    function handleItemToggle(id: string) {
        const item = localItems.find(i => i.id === id);
        if (item) {
            // Toggle the item's visible property
            item.visible = !item.visible;
            onCheckboxChange(id, item.visible);
            
            // Handle parent-child relationships
            if (!item.parent) {
                // This is a parent item
                if (!item.visible) {
                    // Parent unchecked - uncheck all children
                    const children = localItems.filter(i => i.parent === id);
                    children.forEach(child => {
                        if (child.visible) {
                            child.visible = false;
                            onCheckboxChange(child.id, false);
                        }
                    });
                }
                // If parent is checked, don't automatically check children (user must do this manually)
            }
        }
    }

    function isParentVisible(id: string): boolean {
        const item = localItems.find((item) => item.id === id);
        if (!item || !item.parent) {
            return true;
        }
        const parent = localItems.find(i => i.id === item.parent);
        return parent ? parent.visible : true;
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
        positioning={{ placement: 'top' }}
        contentBase="card p-4 space-y-2 max-w-[320px] editor-display-options-popover w-40"
        arrow
        arrowBackground="editor-display-options-popover"
    >
        {#snippet trigger()}
            <button id="editoritems" type="button" class="icon-button editor-footer-button"><IconEye size={16}/></button>
        {/snippet}
        {#snippet content()}
            <header class="flex justify-between align-center">
                <span class="footer-header-text">Display Options</span>
                <button class="icon-button drawer-header-button" type="button" onclick={popoverClose}><IconX size="16" /></button>
            </header>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div onclick={() => {}}>
                {#each localItems as item}
                    <div class="flex items-center editor-display-options {item.parent ? 'ml-6' : ''}">
                        <input
                            id={item.id}
                            type="checkbox"
                            checked={item.visible}
                            onchange={() => handleItemToggle(item.id)}
                            class="crc-checkbox form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out mr-2"
                            disabled={!isParentVisible(item.id)}
                        />
                        <label for={item.id} class="mt-1">{item.label}</label>
                    </div>
                {/each}
            </div>
        {/snippet}
    </Popover>
    <span class="editor-footer-label">Hidden Items: </span>
    <span class="editor-footer-text flex-grow">{hiddenItems.length > 0 ? `${hiddenItems.map((item) => item.label).join(", ")}` : "None"}</span>
</div>
