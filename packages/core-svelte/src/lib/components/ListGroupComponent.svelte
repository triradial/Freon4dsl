<script lang="ts">
    /**
     * This component expands/collapses the child of its (Expandable)Box.
     * with non-editable text
     */
    import { onMount, createEventDispatcher } from "svelte";
    import { Box, FreLogger, ListGroupBox, FreEditor } from "@freon4dsl/core";
    import { componentId } from "./svelte-utils/index.js";
    import RenderComponent from "./RenderComponent.svelte";
    import type { ListGroupProps } from './svelte-utils/FreComponentProps.js';
    import { contextMenu } from './stores/AllStores.svelte.js';
    /* ts-ignore */
    import {  ChevronDown as IconChevronDown,  ChevronRight as IconChevronRight,  Plus as IconPlus,  EllipsisVertical as IconEllipsisVertical  } from '@lucide/svelte';

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

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();
    let style: string = $state('');
    const label = $derived(() => box.getLabel());
    let isExpanded = $state(initialIsExpanded);
    let contentStyle = $derived(isExpanded ? 'display:block;' : 'display:none;');

    const dispatcher = createEventDispatcher();

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

    function onContextMenu(event: MouseEvent) {
        event.preventDefault();
        dispatcher("contextmenu", { event, box, editor });
    }

</script>

<div id="{id}" class="list-group {cssClass}" style="{style}" oncontextmenu={onContextMenu}>
    {#if canExpand}
        <button class="btn-icon p-0 ml-1 mr-1 toggle-button" onclick={toggleExpanded} title={isExpanded ? "Collapse" : "Expand"} tabindex="0">
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
        <button class="circle-button action-button" onclick={addItem} title="Add" tabindex="0">
            <IconPlus size={14} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="circle-button action-button" title="More..." tabindex="0">
            <IconEllipsisVertical size={14} />
        </button> 
    {/if}
</div>
{#key contentStyle}
    <div class="list-group-content {cssClass}" bind:this={contentElement} style={contentStyle}>
        <RenderComponent box={box.child} {editor} {cssClass} />
    </div>
{/key}
