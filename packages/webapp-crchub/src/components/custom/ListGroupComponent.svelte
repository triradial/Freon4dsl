<script lang="ts">
    import { AST, FreLanguage, FreLogger, PartWrapperBox, type FreNode } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onDestroy, onMount } from "svelte";
    import { expandCollapseStore } from "../../services/stores/expand-collapse-store.js";
// ts-ignore
    import { ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, EllipsisVertical as IconEllipsisVertical, Plus as IconPlus } from '@lucide/svelte';

    const LOGGER = new FreLogger("ListGroupComponent");
    FreLogger.unmute("ListGroupComponent");
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // Props - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let canAdd = $derived(box?.findParam("canAdd") === "true");
    let canCRUD = $derived(box?.findParam("canCRUD") === "true");
    let canExpand = $derived(box?.findParam("canExpand") === "true");
    // Store the language-defined default so we can restore it later
    let defaultIsExpanded = $derived(box?.findParam("isExpanded") === "true");
    let isExpanded = $state(false);
    // Content display value - directly controlled $state for reliable reactivity
    let contentDisplay = $state('none');
    let label = $derived(box?.findParam("label") || "");

    let id = $derived(box ? componentId(box) : 'group-for-unknown-box');
    
    // Initialize isExpanded and contentDisplay from defaultIsExpanded
    $effect(() => {
        if (defaultIsExpanded !== undefined) {
            isExpanded = defaultIsExpanded;
            contentDisplay = defaultIsExpanded ? 'block' : 'none';
        }
    });
    let contentElement: HTMLDivElement | undefined = $state();
    let toggleButton: HTMLButtonElement | undefined = $state();

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

    // Subscribe to expand/collapse all commands
    const unsubscribe = expandCollapseStore.subscribe((cmd) => {
        if (cmd && canExpand) {
            let newExpandedState = isExpanded;
            if (cmd.command === 'expand') {
                newExpandedState = true;
            } else if (cmd.command === 'collapse') {
                newExpandedState = false;
            } else if (cmd.command === 'default') {
                // Restore to the language-defined default state
                newExpandedState = defaultIsExpanded;
            }
            // Update state
            isExpanded = newExpandedState;
            box.isExpanded = newExpandedState;
            contentDisplay = newExpandedState ? 'block' : 'none';
            
            // Direct DOM manipulation as fallback
            if (contentElement) {
                contentElement.style.display = newExpandedState ? 'block' : 'none';
            }
        }
    });

    onDestroy(() => {
        unsubscribe();
    });

    // Replaces afterUpdate()
    $effect(() => {
        box.refreshComponent = refresh;
    });

    const toggleExpanded = (event: MouseEvent | KeyboardEvent) => {
        isExpanded = !isExpanded;
        box.isExpanded = isExpanded;
        contentDisplay = isExpanded ? 'block' : 'none';
        event.stopPropagation();
        event.preventDefault();
    };

    const addItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        // Expand the component if it's collapsed
        if (canExpand && !isExpanded) {
            isExpanded = true;
            box.isExpanded = true;
            contentDisplay = 'block';
        }
        AST.change(() => {
            const language = FreLanguage.getInstance();
            const propertyName = box.propertyName;
            const node = box.node;
            const typeName = node.freLanguageConcept();
            const property = language.classifierProperty(typeName, propertyName);
            let newConceptName = "";
            if (!property) {
                LOGGER.error(`Cannot find property '${propertyName}' on classifier '${typeName}'`);
                return;
            }
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
    <span class="list-group-label">{label} {#if canAdd}({itemCount()}){/if}</span>
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
<div class="list-group-content {cssClass}" bind:this={contentElement} style:display={contentDisplay}>
    <RenderComponent box={box.childBox} {editor} {cssClass} />
</div>
