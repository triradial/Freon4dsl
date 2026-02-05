<script lang="ts">
    import { AST, Box, FragmentBox, FragmentWrapperBox, FreLogger, VerticalLayoutBox } from "@freon4dsl/core";
    import { componentId, RenderComponent, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
// ts-ignore
    import { Trash2 as IconDelete } from '@lucide/svelte';

    const LOGGER = new FreLogger("SingleLineItemComponent");
    FreLogger.unmute("SingleLineItemComponent");
    
    // const { box, editor } = $props<{ box: FragmentWrapperBox, editor: FreEditor }>();
    let { editor, box }: FreComponentProps<FragmentWrapperBox> = $props();
    let inputElement: HTMLInputElement;

    // Props - use $derived to properly react to box changes
    let cssClass = $derived(box?.findParam("cssClass") || "");
    let canDelete = $derived(box?.findParam("canDelete") === "true");
    let label = $derived(() => {
        if (box) {
            // First try to get label from parameters
            const paramLabel = box.findParam("label");
            if (paramLabel) return paramLabel;
            
            // If no parameter label, try to get name from the node
            const node = box.node;
            if (node && node.name) return node.name;
            
            // Fallback to concept name
            if (node && node.freLanguageConcept) return node.freLanguageConcept();
        }
        return "";
    });
    let children: Box[] | undefined = $state()

    let id = $derived(box ? componentId(box) : 'single-line-for-unknown-box');

    // The following three functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        // console.log("setFocus children: ", children);
        if (children && children.length > 0) {
            children[0]?.setFocus();
        }
    }

    const refresh = (why?: string): void => {
        // console.log("REFRESH (" + why + ")");
        box.childBox.refreshComponent(why);
        box.refreshComponent = refresh;
    };

    onMount(() => {
        box.refreshComponent = refresh;   
        box.setFocus = setFocus;
    });

    $effect(() => {
        box.refreshComponent = refresh;
        const fragmentBox = box.childBox as FragmentBox;
        const verticalLayoutBox = fragmentBox.childBox as VerticalLayoutBox;
        children = verticalLayoutBox.children;
    })

    const deleteItem = (event?: MouseEvent | KeyboardEvent) => {
        if (event) {
            event.stopPropagation();
        }
        AST.change(() => {
            // console.log("deleteItem box: ", box);
            // console.log("deleteItem box.node: ", box.node);
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


</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="single-line-item {cssClass}">
    <span class="single-line-item-label" tabindex="-1">{label()}</span>
    {#each children as child}
        <RenderComponent box={child} editor={editor} />
    {/each}
    {#if canDelete}
        <button class="circle-button action-button" onclick={deleteItem} onkeydown={(e) => e.key === 'Enter' && deleteItem(e)} title="Delete" tabindex="0">
            <IconDelete size={14} />
        </button>
    {/if}
</div>
