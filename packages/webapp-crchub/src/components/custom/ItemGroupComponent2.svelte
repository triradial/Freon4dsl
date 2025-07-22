<script lang="ts">
    import {
      AST,
      FragmentBox,
      FragmentWrapperBox,
      FreEditor,
      FreLanguage,
      FreLogger,
      ownerOfType,
      ReferenceBox,
      RefWrapperBox,
      VerticalLayoutBox
    } from "@freon4dsl/core";
    import { componentId, RenderComponent } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
// ts-ignore
    import {
      ChevronDown as IconChevronDown,
      ChevronRight as IconChevronRight,
      Trash2 as IconDelete,
      Copy as IconDuplicate,
      EllipsisVertical as IconEllipsisVertical,
      Share2 as IconShare2,
    } from "@lucide/svelte";

    const LOGGER = new FreLogger("ItemGroupComponent")

    const { box, editor } = $props<{ box: FragmentWrapperBox; editor: FreEditor }>()

    // Props
    let cssClass = (box && box.findParam("cssClass")) || ""
    let canDelete = box && box.findParam("canDelete") === "true"
    let canCRUD = box && box.findParam("canCRUD") === "true"
    let canDuplicate = box && box.findParam("canDuplicate") === "true"
    let canShare = box && box.findParam("canShare") === "true"
    let canExpand = box && box.findParam("canExpand") === "true"
    let isExpanded = $state(box && box.findParam("isExpanded") === "true")
    let label = $derived(() => (box ? box.findParam("label") || "" : ""))

    let id: string = $state(!!box ? componentId(box) : "group-for-unknown-box")
    let contentElement: HTMLDivElement | undefined = $state()
    let contentStyle = $derived(() => (isExpanded ? "display:block;" : "display:none;"))
    let referenceBox: ReferenceBox | undefined = $state()
    let cssContainerClass = "h-20"

    const getText = () => {
        const propertyName = "name"
        const node = box.node
        return node[propertyName]
    }

    let text = $state(getText())

    $effect(() => {
        text = getText()
    })

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        const fragmentBox = box.childBox as FragmentBox
        const verticalLayoutBox = fragmentBox.childBox as VerticalLayoutBox
        const children = verticalLayoutBox.children
        const refWrapperBox = children[0] as RefWrapperBox
        const referenceBox = refWrapperBox.childBox as ReferenceBox
        referenceBox.setFocus()
    }

    const refresh = (why?: string): void => {
        LOGGER.log("REFRESH (" + why + ")")
    }

    onMount(() => {
        box.refreshComponent = refresh
        box.setFocus = setFocus
        const fragmentBox = box.childBox as FragmentBox
        const verticalLayoutBox = fragmentBox.childBox as VerticalLayoutBox
        const children = verticalLayoutBox.children
        const refWrapperBox = children[0] as RefWrapperBox
        referenceBox = refWrapperBox.childBox as ReferenceBox
    })

    // Replaces afterUpdate()
    $effect(() => {
        box.refreshComponent = refresh
    })

    const toggleExpanded = (event: MouseEvent) => {
        isExpanded = !isExpanded
        box.isExpanded = isExpanded
        event.stopPropagation()
    }

    const deleteItem = () => {
        AST.change(() => {
            const ownerDescriptor = box.node.freOwnerDescriptor()
            const parent = ownerDescriptor.owner
            const propertyName = ownerDescriptor.propertyName
            const index = ownerDescriptor.propertyIndex

            if (parent && propertyName && typeof index === "number" && index >= 0) {
                parent[propertyName].splice(index, 1)
                LOGGER.log(`Removed item at index ${index} from ${propertyName}`)
            } else {
                LOGGER.log("Could not determine parent, property name, or index for deletion")
            }
        })
    }

    const duplicateItem = () => {
        AST.change(() => {
            const language = FreLanguage.getInstance()
            const propertyName = box.propertyName
            const node = box.node
            const parentConceptName = node.freLanguageConcept()
            const owner = ownerOfType(node, parentConceptName)
            const index = owner.freOwnerDescriptor().propertyIndex //period.events.indexOf(event);
        })
    }

    const shareItem = () => {
        LOGGER.log("Not allowed to Sharing this item");
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div {id} class="item-group {cssClass}">
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
    <RenderComponent box={referenceBox} {editor} cssClass={cssContainerClass} />
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

<!-- {#key contentStyle}
    <div class="list-group-content {cssClass}" bind:this={contentElement} style={contentStyle()}>
        <RenderComponent box={box.childBox} {editor} {cssClass} />
    </div>
{/key} -->
