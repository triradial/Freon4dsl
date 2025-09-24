
<script lang="ts">
    import { AST, FreEditor, FreLogger, PartWrapperBox } from "@freon4dsl/core";
    import { componentId } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
    // ts-ignore
    const LOGGER = new FreLogger("TabFixComponent");
    
    const { box, editor } = $props<{ box: PartWrapperBox, editor: FreEditor }>();

    // Props
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
        const hiddenInput = document.querySelector(`#${id} .hidden-input`) as HTMLInputElement;
        if (hiddenInput) {
            hiddenInput.focus();
        }
    }

    const refresh = (why?: string): void => {
    };

    onMount(() => {
        console.log("TabFixComponent: onMount");        
    });

    // Replaces afterUpdate()
    $effect(() => {
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
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 1px solid transparent !important;
        background: transparent !important;
        color: transparent !important;
        font-size: 1px !important;
        line-height: 1px !important;
        overflow: hidden !important;
        outline: none !important;
        resize: none !important;
    }
    
    .narrow-input:focus {
        border-color: red !important;
        box-shadow: 0 0 5px red !important;
        background-color: yellow !important;
    }
    
    /* Highlight the parent div when the input has focus */
    .TabHereFix:focus-within {
        background-color: lightblue !important;
        border: 2px solid blue !important;
        outline: 3px solid orange !important;
    }
</style>
