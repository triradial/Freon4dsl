
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
        console.log("TabFixComponent: onMount1");
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
    
    /* CSS-only approach: Highlight layout-component when input has focus */
    .layout-component:has(.TabHereFix:focus-within) {
        background-color: lightsteelblue !important;
        border: 8px solid steelblue !important;
        outline: 10px solid navy !important;
        box-shadow: 0 0 30px rgba(70, 130, 180, 0.6) !important;
        transform: scale(1.01) !important;
        transition: all 0.4s ease !important;
    }
    
    /* Highlight all children of the focused layout-component */
    .layout-component:has(.TabHereFix:focus-within) * {
        background-color: rgba(70, 130, 180, 0.05) !important;
        border: 1px solid rgba(70, 130, 180, 0.2) !important;
        transition: all 0.3s ease !important;
    }
</style>

