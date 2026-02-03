<script lang="ts">
    import { AST, FreLanguage, FreLogger, PartWrapperBox, type FreNode } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
// ts-ignore
    import { ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, EllipsisVertical as IconEllipsisVertical, Plus as IconPlus } from '@lucide/svelte';

    const LOGGER = new FreLogger("ListGroupComponent");
    FreLogger.unmute("ListGroupComponent");
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // Props
    let cssClass = box && box.findParam("cssClass") || "";
    let canAdd = box && box.findParam("canAdd") === "true";
    let canCRUD = box && box.findParam("canCRUD") === "true";
    let canExpand = box && box.findParam("canExpand") === "true";
    let isExpanded = $state(box && box.findParam("isExpanded") === "true");
    let label = $derived(() => box ? box.findParam("label") || "" : "");

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();
    let toggleButton: HTMLButtonElement | undefined = $state();
    let contentStyle = $derived(() => isExpanded ? 'display:block;' : 'display:none;');

    // Get the count of items in the list
    let itemCount = $derived(() => {
        try {
            const items = box?.getPropertyValue();
            if (Array.isArray(items)) {
                return items.length;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    });

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.

    async function setFocus(): Promise<void> {
        // list group has no editable element, but does have a selectable child
        // set to none if there is no expandable child
        if (canExpand && toggleButton) {
            toggleButton?.focus();
        }
    }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
        box.childBox?.refreshComponent(why);
    };

    onMount(() => {
        box.refreshComponent = refresh; 
        box.setFocus = setFocus;
        box.selectable = false;
        const childBox = box.childBox;
        if (childBox) {
            childBox.cssClass = cssClass;
        }
    });

    // Replaces afterUpdate()
    $effect(() => {
        box.refreshComponent = refresh;
    });

    const toggleExpanded = (event: MouseEvent | KeyboardEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        event.stopPropagation();
        event.preventDefault();
    };

    const addItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        AST.change(() => {
            const language = FreLanguage.getInstance();
            const propertyName = box.propertyName;
            const node = box.node;
            const typeName = node.freLanguageConcept();
            const property = language.classifierProperty(typeName, propertyName);
            let newConceptName = "";
            if (property.type) {
                newConceptName = property.type;
                if (newConceptName.startsWith('Abstract')) {
                    newConceptName = newConceptName.slice(8);
                } else if (newConceptName === "EventTask") { // HACK: Needed because of the multiple kinds of tasks
                    newConceptName = "Task";
                }
                const newElement = language.concept(newConceptName)?.creator({});
                (box.getPropertyValue() as unknown as FreNode[]).push(newElement);
                LOGGER.log("Added item: " + newConceptName);
             } else {
                LOGGER.error("Cannot add item " + newConceptName);
            }
        });
    }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="list-group {cssClass}">
    {#if canExpand}
        <button class="btn-icon p-0 ml-1 mr-1 toggle-button" bind:this={toggleButton} onclick={toggleExpanded} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), toggleExpanded(e))} title={isExpanded ? "Collapse" : "Expand"} tabindex="0">
            {#if isExpanded}
                <IconChevronDown size={16} />
            {:else}
                <IconChevronRight size={16} />
            {/if}
        </button>
    {:else}
        <span class="w-5"></span>   
    {/if}
    <span class="list-group-label">{label()} {#if canAdd}({itemCount()}){/if}</span>
    {#if canAdd}
        <button class="circle-button action-button" onclick={addItem} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(e))} title="Add" tabindex="0">
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
