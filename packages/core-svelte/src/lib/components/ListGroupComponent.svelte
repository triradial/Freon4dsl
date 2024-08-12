<svelte:options immutable={true}/>
<script lang="ts">
    /**
     * This component expands/collapses the child of its (Expandable)Box.
     * with non-editable text
     */
    import { onMount, afterUpdate } from "svelte";
    import { Box, FreLogger, ListGroupBox, FreEditor } from "@freon4dsl/core";
    import { componentId } from "./svelte-utils/index.js";
    import RenderComponent from "./RenderComponent.svelte";

    import { Button } from 'flowbite-svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faChevronDown, faChevronUp, faPlus, faEllipsis, faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';

    export let box: ListGroupBox;
    export let editor: FreEditor;

    const LOGGER = new FreLogger("ListGroupBoxComponent");

    let id: string = !!box ? componentId(box) : 'group-for-unknown-box';
    // let element: HTMLDivElement = null;
    let contentElement: HTMLDivElement = null;
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

    afterUpdate( () => {
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
        contentElement.style.display = contentElement.style.display === "block" ? "none" : "block";
        isExpanded = !isExpanded;
        contentStyle = isExpanded ? 'display:block;' : 'display:none;';
    }

    function addItem() {
        box.executeAction(editor, "add");
    }

</script>

<div id="{id}" class="list-group {cssClass}" style="{style}">
    {#key isExpanded}
        <Button pill={true} class="w-4 h-7 p-0 ml-1 mr-1" color="none" size="xs" on:click={toggleExpanded}>
            <FontAwesomeIcon class="w-3 h-3 toggle-button {cssClass}" icon={isExpanded ? faCaretDown : faCaretRight} />
        </Button>
    {/key}
    <span class="list-group-label {cssClass}">{label}</span>
    {#if canAdd}
    <Button pill={true} size="xs" class="w-7 h-7 p-0 action-button" outline on:click={addItem}>
        <FontAwesomeIcon class="w-3 h-3" icon={faPlus} />
    </Button>
    {/if}
    {#if canCRUD}
    <Button pill={true} size="xs" class="w-7 h-7 p-0 action-button" outline>
        <FontAwesomeIcon class="w-3 h-3" icon={faEllipsis} />
    </Button> 
    {/if}
</div>
{#key contentStyle}
    <div bind:this={contentElement} style="{contentStyle}">
        <RenderComponent box={child} editor={editor}/>
    </div>
{/key}
