<script lang="ts">
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faGlasses, faTimes } from "@fortawesome/free-solid-svg-icons";
    import { Popover, Button, Tooltip, Checkbox } from "flowbite-svelte";
    import { slide } from "svelte/transition";

    export let onCheckboxChange: (key: string, value: boolean) => void;
    export let items: Array<{ id: string; label: string; visible: boolean; parent?: string }>;

    $: hiddenItems = items.filter((item) => !item.visible);

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
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
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
