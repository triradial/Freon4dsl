<script lang="ts">
    import FontAwesomeIcon from "./FontAwesomeIcon.svelte";
    import { faGlasses, faTimes } from "@fortawesome/free-solid-svg-icons";
    import { Popover, Button, Tooltip, Checkbox } from "flowbite-svelte";
    import { slide } from "svelte/transition";
    import { onMount } from "svelte";

    const { onCheckboxChange, items: initialItems } = $props<{
        onCheckboxChange: (key: string, value: boolean) => void;
        items: Array<{ id: string; label: string; visible: boolean; parent?: string }>;
    }>();
    let items = $state<Array<{ id: string; label: string; visible: boolean; parent?: string }>>([...initialItems]);

    onMount(() => {
        items = [...initialItems];
    });

    let hiddenItems = $derived(items.filter((item) => !item.visible));

    // function handleItemToggle(id: string) {
    //     const index = items.findIndex((item) => item.id === id);
    //     if (index !== -1) {
    //         items[index].visible = !items[index].visible;
    //         items = [...items]; // Trigger reactivity
    //         onCheckboxChange(id, items[index].visible);
    //     }
    // }

    function handleItemToggle(id: string) {
        const index = items.findIndex((item) => item.id === id);
        if (index !== -1) {
            const item = items[index];
            item.visible = !item.visible;      
            if (!item.visible) {
                items.forEach((child, i) => {
                    if (child.parent === id) {
                        child.visible = false;
                    }
                });
            }
            items = [...items]; // Trigger reactivity
            onCheckboxChange(id, item.visible);
            if (!item.visible) {
                items.forEach((child, i) => {
                    if (child.parent === id) {
                        onCheckboxChange(child.id, child.visible);
                    }
                });
            }
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
</script>

<div class="footer-container">
    <Button id="editoritems" class="editor-footer-button" outlined={true} rounded={true}>
        <FontAwesomeIcon icon={faGlasses} />
    </Button>
    <span class="editor-footer-text flex-grow">
        {hiddenItems.length > 0 ? `Hidden: ${hiddenItems.map((item) => item.label).join(", ")}` : ""}
    </span>
    <Popover title="Display Options" transition={slide} placement="right" class="editor-display-options-popover w-40" triggeredBy="#editoritems" trigger="click">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div on:click|stopPropagation>
            {#each items as item}
                <div class="flex items-center editor-display-options {item.parent ? 'ml-6' : ''}">
                    <Checkbox id={item.id} checked={item.visible} on:change={() => handleItemToggle(item.id)} 
                        class="crc-checkbox "
                        disabled={!isParentVisible(item.id)}>
                        {item.label}
                    </Checkbox>
                </div>
            {/each}
        </div>
    </Popover>
</div>
