
<script lang="ts">
    import { AST, FreLogger, PartWrapperBox } from "@freon4dsl/core";
    import { componentId, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
    // ts-ignore
    const LOGGER = new FreLogger("TabFixComponent");
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // Props
    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let contentElement: HTMLDivElement | undefined = $state();

    let isEditing = $state(false);

    const getText = () => {
        const propertyName = "name";
        const node = box.node;
        return node[propertyName];
    }

    const setText = (value: string) => {

        //TODO: This is not being picked up by the undo/redo mechanism

        AST.change(() => {
            const propertyName = "name";
            const node = box.node;
            const oldValue = node[propertyName];
            console.debug(`[TabFixComponent] Changing property '${propertyName}' of node`, node, 'from', oldValue, 'to', value);
            node[propertyName] = value;
            // FreChangeManager.getInstance().setPrimitive(node, propertyName, value);
            // console.debug(`[ItemGroupComponent] Change registered with FreChangeManager for property '${propertyName}' of node`, node);
        });
    };

    let text = $state(getText());
    let hiddenValue = $state("");

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        // Focus the hidden input field
        // const hiddenInput = document.querySelector(`#${id} .hidden-input`) as HTMLInputElement;
        // if (hiddenInput) {
        //     hiddenInput.focus();
        // }
        console.log("TabFixComponent.setFocus - box.parent:", box.parent);
        console.log("TabFixComponent.setFocus - firstEditableChild:", box.parent?.firstEditableChild);
        
        // Use firstEditableChild to find the first editable element, even if the concept already has a selection
        // This handles the case where a concept has a selection but no other editable fields
        const editableChild = box.parent?.firstEditableChild;
        if (editableChild) {
            editableChild.setFocus();
        } else if (box.parent) {
            // Fallback to parent if no editable child found
            box.parent.setFocus();
        }
    }

    const refresh = (why?: string): void => {
        console.log("refreshing parent of parent of tab fix component", box.parent?.parent);
        box.parent?.parent?.refreshComponent();
    };

    onMount(() => {
        console.log("TabFixComponent: onMount2");
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    // Replaces afterUpdate()
    $effect(() => {
        console.log("TabFixComponent $effect - box.parent:", box.parent);
        console.log("TabFixComponent $effect - firstEditableChild:", box.parent?.firstEditableChild);
        // Don't automatically set focus in $effect - let the editor's selection mechanism handle it
        box.parent?.refreshComponent();
    });



</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="TabHereFix">
    <!-- Narrow text field that's part of tab sequence but only 1px wide -->
    <input 
        type="text" 
        class="narrow-input hidden-input"
        tabindex="0"
        bind:value={hiddenValue}
    />
</div>
<style>
    .narrow-input {
        width: 20px !important;
        height: 20px !important;
        padding: 2px !important;
        margin: 0 !important;
        border: 1px solid transparent !important;
        background: transparent !important;
        color: transparent !important;
        font-size: 12px !important;
        line-height: 1 !important;
        overflow: hidden !important;
        outline: none !important;
        resize: none !important;
    }
    
    .narrow-input:focus {
        border-color: red !important;
        box-shadow: 0 0 5px red !important;
        background-color: yellow !important;
        width: 50px !important;
        height: 30px !important;
    }
    
</style>

