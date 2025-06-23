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
    import { 
        ChevronDown as IconChevronDown, 
        ChevronRight as IconChevronRight, 
        Plus as IconPlus, 
        EllipsisVertical as IconEllipsisVertical 
    } from '@lucide/svelte';
    import type { ListGroupProps } from './svelte-utils/FreComponentProps.js';

    const LOGGER = new FreLogger("ListGroupComponent");

    // Props
    let { 
        box,
        editor,
        cssClass,
        canAdd = false,
        canCRUD = false,
        canExpand = true,
        isExpanded: initialIsExpanded = false
     }: ListGroupProps<ListGroupBox> = $props();

    let id: string = !!box ? componentId(box) : 'group-for-unknown-box';
    let contentElement: HTMLDivElement | null = null;
    let style: string;
    const label = $derived(() => box.getLabel());
    let isExpanded = $state(initialIsExpanded);
    let contentStyle = $derived(isExpanded ? 'display:block;' : 'display:none;');

    onMount(() => {
        if (!!box) {
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
        }
    };

    $effect(() => {
        refresh("FROM component " + box?.id);
    });

    const toggleExpanded = (event: MouseEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        event.stopPropagation();
    };

    const addItem = (event: MouseEvent) => {
        box.executeAction(editor, "add");
        event.stopPropagation();
    };

</script>

<div id="{id}" class="list-group {cssClass}" style="{style}">
    {#if canExpand}
        <button class="p-0 ml-1 mr-1 toggle-button" onclick={toggleExpanded}>
            {#if isExpanded}
                <IconChevronDown size={16} />
            {:else}
                <IconChevronRight size={16} />
            {/if}
        </button>
    {:else}
        <span class="w-5"></span>   
    {/if}
    <span class="list-group-label">{label()}</span>
    {#if canAdd}
        <button class="circle-button action-button" onclick={addItem} title="Add">
            <IconPlus size={14} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="circle-button action-button" title="More...">
            <IconEllipsisVertical size={14} />
        </button> 
    {/if}
</div>
{#key contentStyle}
    <div class="list-group-content {cssClass}" bind:this={contentElement} style={contentStyle}>
        <RenderComponent box={box.child} {editor} {cssClass} />
    </div>
{/key}
