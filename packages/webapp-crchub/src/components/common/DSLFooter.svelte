<script lang="ts">
    import { Popover } from '@skeletonlabs/skeleton-svelte';
    import { onMount } from "svelte";
    // @ts-ignore
    import { Eye as IconEye, X as IconX } from '@lucide/svelte';

    const { onCheckboxChange, items } = $props<{
        onCheckboxChange: (key: string, value: boolean) => void;
        items: Array<{ id: string; label: string; visible: boolean; parent?: string }>;
    }>();

    onMount(() => {
    });

    let hiddenItems = $derived(items.filter((item) => !item.visible));

    function handleItemToggle(id: string) {
        const item = items.find(i => i.id === id);
        if (item) {
            onCheckboxChange(id, !item.visible);
        }
    }

    function isParentVisible(id: string): boolean {
        const index = items.findIndex((item) => item.id === id);
        let result = true;
        if (index !== -1) {
            const item = items[index];           
            if (!item.parent) {
                result = true;
            } else {
                const parent = items.find(i => i.id === item.parent);
                result = parent ? parent.visible : true;
            }
        }
        return result;
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
                {#each items as item}
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
    <span class="editor-footer-text flex-grow">
        {hiddenItems.length > 0 ? `Hidden: ${hiddenItems.map((item) => item.label).join(", ")}` : ""}
    </span>
</div>
