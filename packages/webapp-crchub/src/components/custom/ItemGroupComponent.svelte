<script lang="ts">
    import { onMount } from "svelte";
    import { FreEditor, FreLogger, PartWrapperBox } from "@freon4dsl/core";
    import { RenderComponent } from "@freon4dsl/core-svelte";
    import { componentId } from "@freon4dsl/core-svelte";
    // ts-ignore
    import {  ChevronDown as IconChevronDown,  ChevronRight as IconChevronRight,  Plus as IconPlus,  EllipsisVertical as IconEllipsisVertical  } from '@lucide/svelte';
    
    const LOGGER = new FreLogger("ListGroupComponent");
    
    const { box, editor } = $props<{ box: PartWrapperBox, editor: FreEditor }>();

    // Props
    let cssClass = box && box.findParam("cssClass") || "";
    let canAdd = box && box.findParam("canAdd") === "true";
    let canCRUD = box && box.findParam("canCRUD") === "true";
    let canExpand = box && box.findParam("canExpand") === "true";
    let isExpanded = $state(box && box.findParam("isExpanded") === "true");
    let label = $derived(() => box ? box.findParam("label") || "" : "");

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();
    let contentStyle = $derived(() => isExpanded ? 'display:block;' : 'display:none;');

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    // async function setFocus(): Promise<void> {
    // }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH ItemGroupComponent (" + why + ")");
    };

    onMount(() => {
        box.refreshComponent = refresh;   
    });

    // Replaces afterUpdate()
    $effect(() => {
        box.refreshComponent = refresh;
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

    // function onContextMenu(event: MouseEvent) {
    //     event.preventDefault();
    //     dispatcher("contextmenu", { event, box, editor });
    // }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="list-group {cssClass}">
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
    <div class="list-group-content {cssClass}" bind:this={contentElement} style={contentStyle()}>
        <RenderComponent box={box.childBox} {editor} {cssClass} />
    </div>
{/key}
