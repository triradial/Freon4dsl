<script lang="ts">
    import { onMount } from "svelte";
    import { AST, FreEditor, FreChangeManager, FreLanguage, FreLogger, ownerOfType, PartListWrapperBox } from "@freon4dsl/core";
    import { RenderComponent } from "@freon4dsl/core-svelte";
    import { componentId } from "@freon4dsl/core-svelte";
    // ts-ignore
    import {  ChevronDown as IconChevronDown,  ChevronRight as IconChevronRight,  Trash2 as IconDelete, Copy as IconDuplicate,Share2 as IconShare2,  EllipsisVertical as IconEllipsisVertical  } from '@lucide/svelte';
    import CustomTextbox from "./helper/CustomTextbox.svelte";
    
    const LOGGER = new FreLogger("ItemGroupComponent");
    
    const { box, editor } = $props<{ box: PartListWrapperBox, editor: FreEditor }>();

    // Props
    let cssClass = box && box.findParam("cssClass") || "";
    let canDelete = box && box.findParam("canDelete") === "true";
    let canCRUD = box && box.findParam("canCRUD") === "true";
    let canDuplicate = box && box.findParam("canDuplicate") === "true";
    let canShare = box && box.findParam("canShare") === "true";
    let canExpand = box && box.findParam("canExpand") === "true";
    let isExpanded = $state(box && box.findParam("isExpanded") === "true");
    let label = $derived(() => box ? box.findParam("label") || "" : "");
    let placeholderText = "<enter>";

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();
    let contentStyle = $derived(() => isExpanded ? 'display:block;' : 'display:none;');

    let isEditing = $state(false);

    const getText = () => {
        const propertyName = "name";
        const node = box.node;
        return node[propertyName];
    }

    const setText = (value: string) => {
        const propertyName = "name";
        const node = box.node;
        const oldValue = node[propertyName];
        console.debug(`[ItemGroupComponent] Changing property '${propertyName}' of node`, node, 'from', oldValue, 'to', value);
        node[propertyName] = value;
        // FreChangeManager.getInstance().setPrimitive(node, propertyName, value);
        // console.debug(`[ItemGroupComponent] Change registered with FreChangeManager for property '${propertyName}' of node`, node);
    };

    let text = $state(getText());

    $effect(() => {
        text = getText();
    });

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    // async function setFocus(): Promise<void> {
    // }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
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

    const deleteItem = () => {
        AST.change(() => {
            const ownerDescriptor = box.node.freOwnerDescriptor();
            const parent = ownerDescriptor.owner;
            const propertyName = ownerDescriptor.propertyName;
            const index = ownerDescriptor.propertyIndex;

            if (parent && propertyName && typeof index === "number" && index >= 0) {
                parent[propertyName].splice(index, 1);
                LOGGER.log(`Removed item at index ${index} from ${propertyName}`);
            } else {
                LOGGER.log("Could not determine parent, property name, or index for deletion");
            }
        });
    }

    const duplicateItem = () => {
        AST.change(() => {
            const language = FreLanguage.getInstance();
            const propertyName = box.propertyName;
            const node = box.node;
            const parentConceptName = node.freLanguageConcept();
            const owner = ownerOfType(node, parentConceptName);
            const index = owner.freOwnerDescriptor().propertyIndex //period.events.indexOf(event);
        });
    }

    const shareItem = () => {
        LOGGER.log("Sharing item");
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="item-group {cssClass}">
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
    <span class="item-group-label" tabindex="-1">{label()}:</span>
    <CustomTextbox
        id={id}
        value={text}
        setValue={setText}
        getValue={getText}
        placeholder={placeholderText}
    />
    {#if canDuplicate}
        <button class="circle-button action-button" onclick={duplicateItem} title="Duplicate" tabindex="0">
            <IconDuplicate size={14} />
        </button>
    {/if}
    {#if canDelete}
        <button class="circle-button action-button" onclick={deleteItem} title="Delete" tabindex="0">
            <IconDelete size={14} />
        </button>
    {/if}
    {#if canShare}
        <button class="circle-button action-button" onclick={shareItem} title="Share" tabindex="0">
            <IconShare2 size={14} />
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
