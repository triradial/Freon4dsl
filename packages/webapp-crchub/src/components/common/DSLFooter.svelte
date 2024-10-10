<script lang="ts">
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faGlasses, faTimes } from "@fortawesome/free-solid-svg-icons";
    import { Popover, Button, Tooltip, Checkbox } from "flowbite-svelte";
    import { slide } from "svelte/transition";

    export let onCheckboxChange: (key: string, value: boolean) => void;
    export let items: Array<{ id: string; label: string; visible: boolean }>;

    $: visibleItems = items.filter((item) => item.visible);
    $: hiddenItems = items.filter((item) => !item.visible);

    function handleItemToggle(id: string) {
        const index = items.findIndex((item) => item.id === id);
        if (index !== -1) {
            items[index].visible = !items[index].visible;
            items = [...items]; // Trigger reactivity
            onCheckboxChange(id, items[index].visible);
        }
    }
</script>

<div class="footer-container">
    <Button id="editoritems" class="editor-footer-button" outlined={true} rounded={true}>
        <FontAwesomeIcon icon={faGlasses} />
    </Button>
    <!-- <Tooltip type='dark' triggeredBy="#editoritems" placement="left">Display options</Tooltip> -->
    <span class="editor-footer-text flex-grow">
        {hiddenItems.length > 0 ? `Hidden: ${hiddenItems.map((item) => item.label).join(", ")}` : ""}
    </span>
    <Popover title="Display Options" transition={slide} placement="top" class="editor-display-options-popover w-40" triggeredBy="#editoritems" trigger="click">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="p-2" on:click|stopPropagation>
            {#each items as item}
                <div class="flex items-center mb-2 editor-display-options">
                    <Checkbox id={item.id} checked={item.visible} on:change={() => handleItemToggle(item.id)} class="mr-2">
                        {item.label}
                    </Checkbox>
                </div>
            {/each}
        </div>
    </Popover>
</div>
