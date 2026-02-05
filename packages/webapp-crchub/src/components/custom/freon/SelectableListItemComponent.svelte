<script lang="ts">
    import { AST, FragmentWrapperBox, FreLogger } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
    import SelectableWrapperComponent from "./SelectableWrapperComponent.svelte";

    const LOGGER = new FreLogger("SelectableListItemComponent");
    FreLogger.unmute("SelectableListItemComponent");

    let { editor, box }: FreComponentProps<FragmentWrapperBox> = $props();

    // Extract props from box params - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let canDelete = $derived(box?.findParam("canDelete") === "true");
    let inlineDisplay = $derived(box?.findParam("inlineDisplay") === "true");
    let hideDragHandle = $derived(box?.findParam("hideDragHandle") === "true");
    
    // Set hideDragHandle on the box so ListComponent can check it
    $effect(() => {
        if (box && hideDragHandle) {
            box.hideDragHandle = true;
        }
    });

    // State
    let id = $derived(box ? componentId(box) : 'selectable-list-item-unknown');
    let wrapperElement: HTMLDivElement | HTMLSpanElement | undefined = $state();

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")");
        box.childBox?.refreshComponent?.(why);
    };

    onMount(() => {
        if (box) {
            box.refreshComponent = refresh;
        }
    });

    $effect(() => {
        if (box) {
            box.refreshComponent = refresh;
        }
    });

    // Delete handler to pass to SelectableWrapperComponent
    const handleDelete = () => {
        AST.change(() => {
            const ownerDescriptor = box.node.freOwnerDescriptor();
            const parent = ownerDescriptor.owner;
            const propertyName = ownerDescriptor.propertyName;
            const index = ownerDescriptor.propertyIndex;

            if (parent && propertyName && typeof index === "number" && index >= 0) {
                parent[propertyName].splice(index, 1);
                LOGGER.log(`Deleted item at index ${index} from ${propertyName}`);
            } else {
                LOGGER.error("Could not determine parent, property name, or index for deletion");
            }
        });
    };
</script>

{#if inlineDisplay}
    <!-- Inline span display for truly inline text -->
    <span
        bind:this={wrapperElement}
        {id}
        class="inline-list-item {cssClass}"
        role="group"
    >
        <!-- Wrap content with SelectableWrapperComponent for selection box and delete -->
        <SelectableWrapperComponent {box} {editor} onDelete={canDelete ? handleDelete : undefined}>
            <RenderComponent box={box.childBox} {editor} />
        </SelectableWrapperComponent>
    </span>
{:else}
    <!-- Block display with selection box from SelectableWrapperComponent -->
    <div
        bind:this={wrapperElement}
        {id}
        class="selectable-list-item {cssClass}"
        role="group"
    >
        <!-- Wrap content with SelectableWrapperComponent for selection box and delete -->
        <SelectableWrapperComponent {box} {editor} onDelete={canDelete ? handleDelete : undefined}>
            <div class="selectable-list-item-content">
                <RenderComponent box={box.childBox} {editor} />
            </div>
        </SelectableWrapperComponent>
    </div>
{/if}

<style>
    /* Block display style - minimal wrapper */
    .selectable-list-item {
        position: relative;
        display: block;
    }

    .selectable-list-item-content {
        display: block;
    }

    /* Inline display style - minimal wrapper */
    .inline-list-item {
        display: inline;
        position: relative;
    }
</style>
