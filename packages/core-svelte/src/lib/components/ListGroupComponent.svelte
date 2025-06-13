<svelte:options immutable={true}/>
<script lang="ts">
    /**
     * This component expands/collapses the child of its (Expandable)Box.
     * with non-editable text
     */
    import { onMount } from "svelte";
    import { Box, FreLogger, ListGroupBox, FreEditor } from "@freon4dsl/core";
    import { componentId } from "./svelte-utils/index.js";
    import RenderComponent from "./RenderComponent.svelte";
    import { CaretDown as IconCaretDown, CaretRight as IconCaretRight, Plus as IconPlus, EllipsisVertical as IconEllipsisVertical } from '@lucide/svelte';

    export let box: ListGroupBox;
    export let editor: FreEditor;

    const LOGGER = new FreLogger("ListGroupComponent");

    let id: string = !!box ? componentId(box) : 'group-for-unknown-box';
    // let element: HTMLDivElement = null;
    let contentElement: HTMLDivElement | null = null;
    let style: string;
    let cssClass: string = '';
    let label: string;
    let level: number;
    let child: Box;
    let isExpanded: boolean = false; 

    let canAdd: boolean = false;
    let canCRUD: boolean = false;
    
    let contentStyle: string = 'display: none';

    onMount( () => {
        if (!!box) {
            isExpanded = box.isExpanded;
            canAdd = box.canAdd;
            canCRUD = box.canCRUD;
            contentStyle = isExpanded ? 'display:block;' : 'display:none;';
            box.refreshComponent = refresh;   
        }
    });

    $effect(() => {
        if (!!box) {
            box.refreshComponent = refresh;
        }
    });

    const refresh = (why?: string) => {
        LOGGER.log("REFRESH ListGroupBoxComponent (" + why + ")");
        if (!!box) {
            label = box.getLabel();
            style = box.cssStyle;
            cssClass = box.cssClass;
            child = box?.child;
        }
    };

    $: { // Evaluated and re-evaluated when the box changes.
        refresh("FROM component " + box?.id);
    }

    function toggleExpanded() {
        if (contentElement) {
            contentElement.style.display = contentElement.style.display === "block" ? "none" : "block";
            isExpanded = !isExpanded;
            contentStyle = isExpanded ? 'display:block;' : 'display:none;';
        }
    }

    function addItem() {
        box.executeAction(editor, "add");
    }

</script>

<div id="{id}" class="list-group {cssClass}" style="{style}">
    {#key isExpanded}
        <button class="btn btn-sm preset-filled w-4 h-4 p-0 ml-1 mr-1 toggle-button" onclick={toggleExpanded}>
            {#if isExpanded}
                <IconCaretDown />
            {:else}
                <IconCaretRight />
            {/if}
        </button>
    {/key}
    <span class="list-group-label">{label}</span>
    {#if canAdd}
    <button class="btn btn-sm preset-filled w-7 h-7 p-0 action-button" onclick={addItem}>
        <IconPlus />
    </button>
    {/if}
    {#if canCRUD}
    <button class="btn btn-sm preset-filled w-7 h-7 p-0 action-button">
        <IconEllipsisVertical />
    </button> 
    {/if}
</div>
{#key contentStyle}
    <div bind:this={contentElement} style="{contentStyle}">
        <RenderComponent box={child} editor={editor}/>
    </div>
{/key}
