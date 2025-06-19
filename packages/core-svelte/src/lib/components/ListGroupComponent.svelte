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
    import { CircleChevronDown as IconChevronDown, CircleChevronRight as IconChevronRight, Plus as IconPlus, EllipsisVertical as IconEllipsisVertical } from '@lucide/svelte';
    import type { FreComponentProps } from './svelte-utils/FreComponentProps.js';

    const LOGGER = new FreLogger("ListGroupComponent");

    // Props
    let { 
        box,
        editor
     }: FreComponentProps<ListGroupBox> = $props();

    let id: string = !!box ? componentId(box) : 'group-for-unknown-box';
    // let element: HTMLDivElement = null;
    let contentElement: HTMLDivElement | null = null;
    let style: string;
    let cssClass: string = '';
    const label = $derived(() => box.getLabel());
    let level: number;
    let child: Box;
    let isExpanded = $state(true);
    let contentStyle: string = 'display: none';

    let canAdd: boolean = true;
    let canCRUD: boolean = false;


    onMount(() => {
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
            style = box.cssStyle;
            cssClass = box.cssClass;
            child = box?.child;
        }
    };

    $effect(() => {
        refresh("FROM component " + box?.id);
    });

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    function addItem() {
        box.executeAction(editor, "add");
    }

</script>

<div id="{id}" class="list-group {cssClass}" style="{style}">
    <button class="btn-icon p-0 ml-1 mr-1 toggle-button" onclick={toggleExpanded}>
        {#if isExpanded}
            <IconChevronDown size={24} />
        {:else}
            <IconChevronRight size={24} />
        {/if}
    </button>
    <span class="list-group-label">{label()}</span>
    {#if canAdd}
        <button class="btn-icon p-0 action-button" onclick={addItem}>
            <IconPlus size={16} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="btn-icon p-0 action-button">
            <IconEllipsisVertical size={16} />
        </button> 
    {/if}
</div>
{#if isExpanded}
    <div bind:this={contentElement}>
        <RenderComponent box={child} editor={editor}/>
    </div>
{/if}
