<script lang="ts">
    import { AST, FragmentWrapperBox, FreLogger } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
    import SelectableWrapperComponent from "./freon/SelectableWrapperComponent.svelte";

    const LOGGER = new FreLogger("ReferenceComponent");

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
    let id = $derived(box ? componentId(box) : 'reference-unknown');
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
        class="inline-reference {cssClass}"
        role="group"
    >
        <SelectableWrapperComponent {box} {editor} onDelete={canDelete ? handleDelete : undefined}>
            <span class="reference-content-inline">
                <RenderComponent box={box.childBox} {editor} />
            </span>
        </SelectableWrapperComponent>
    </span>
{:else}
    <!-- Block display with selection box from SelectableWrapperComponent -->
    <div
        bind:this={wrapperElement}
        {id}
        class="reference-item {cssClass}"
        role="group"
    >
        <SelectableWrapperComponent {box} {editor} onDelete={canDelete ? handleDelete : undefined}>
            <div class="reference-item-content">
                <RenderComponent box={box.childBox} {editor} />
            </div>
        </SelectableWrapperComponent>
    </div>
{/if}

<style>
    /* Block display style */
    .reference-item {
        position: relative;
        display: block;
    }

    .reference-item-content {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    /* Inline display style */
    .inline-reference {
        display: inline;
        position: relative;
    }

    .reference-content-inline {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
</style>
