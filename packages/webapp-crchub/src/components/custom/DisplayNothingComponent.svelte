<script lang="ts">
    import { onMount } from "svelte";
    import { AST, FreEditor, FreLanguage, FreLogger, ownerOfType, PartWrapperBox } from "@freon4dsl/core";
    import { componentId, type FreComponentProps } from "@freon4dsl/core-svelte";
    // ts-ignore
    const LOGGER = new FreLogger("ItemGroupComponent");
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // Props - use $derived to properly react to box changes
    let id = $derived(box ? componentId(box) : 'group-for-unknown-box');
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
            console.debug(`[ItemGroupComponent] Changing property '${propertyName}' of node`, node, 'from', oldValue, 'to', value);
            node[propertyName] = value;
            // FreChangeManager.getInstance().setPrimitive(node, propertyName, value);
            // console.debug(`[ItemGroupComponent] Change registered with FreChangeManager for property '${propertyName}' of node`, node);
        });
    };

    let text = $state(getText());

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    // async function setFocus(): Promise<void> {
    // }

    const refresh = (why?: string): void => {
    };

    onMount(() => {
        console.log("DisplayNothingComponent: onMount");
    });

    // Replaces afterUpdate()
    $effect(() => {
    });



</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="{id}" class="DisplayNothing">
</div>
