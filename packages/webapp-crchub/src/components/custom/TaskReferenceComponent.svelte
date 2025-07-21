<script lang="ts">
    import { AST, FreEditor, FreLogger, RefWrapperBox } from "@freon4dsl/core";
    import { componentId, RenderComponent } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
// ts-ignore
    import { Trash2 as IconDelete, EllipsisVertical as IconEllipsisVertical } from '@lucide/svelte';

    const LOGGER = new FreLogger("ItemGroupComponent");
    FreLogger.unmute("ItemGroupComponent");
    
    const { box, editor } = $props<{ box: RefWrapperBox, editor: FreEditor }>();

    // Props
    let cssClass = box && box.findParam("cssClass") || "";
    let canDelete = box && box.findParam("canDelete") === "true";
    let canCRUD = box && box.findParam("canCRUD") === "true";
    let label = $derived(() => box ? box.findParam("label") || "" : "");

    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    // let contentElement: HTMLDivElement | undefined = $state();
    // let contentStyle = $derived(() => isExpanded ? 'display:block;' : 'display:none;');
    let cssContainerClass = "h-20"

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        box.childBox.setFocus();
    }

    const refresh = (why?: string): void => {
        box.refresh;
        LOGGER.log("REFRESH (" + why + ")");
    };

    onMount(() => {
        console.log("TaskReferenceComponent onMount box: ", box);
        console.log("TaskReferenceComponent onMount box.node: ", box.node);
        box.refreshComponent = refresh;
        box.setFocus = setFocus;
    });

    const deleteItem = () => {
        AST.change(() => {
            console.log("deleteItem box: ", box);
            console.log("deleteItem box.node: ", box.node);
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
<div id="{id}" class="item-group {cssClass}">
    <span class="w-5"></span>
    <span class="item-group-label" tabindex="-1">{label()}:</span>
    <RenderComponent box={box.childBox} {editor} cssClass={cssContainerClass} />

    {#if canDelete}
        <button class="circle-button action-button" onclick={deleteItem} title="Delete" tabindex="0">
            <IconDelete size={14} />
        </button>
    {/if}
    {#if canCRUD}
        <button class="circle-button action-button" title="More..." tabindex="0">
            <IconEllipsisVertical size={14} />
        </button> 
    {/if}
</div>
