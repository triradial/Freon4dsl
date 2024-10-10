<script lang="ts">
    import { afterUpdate, onMount } from "svelte";
    import { FreEditor, FreUtils, PartWrapperBox } from "@freon4dsl/core";
    import { RenderComponent } from "@freon4dsl/core-svelte";
    export let box: PartWrapperBox;
    export let editor: FreEditor;

    let inputElement;

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        inputElement.focus();
    }
    const refresh = (why?: string): void => {
        FreUtils.initializeObject(box.childBox, { selectable: true, cssClass: "align-top" });
        // do whatever needs to be done to refresh the elements that show information from the model
    };
    onMount(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
        FreUtils.initializeObject(box.childBox, { selectable: true, cssClass: "align-top" });
    });
    afterUpdate(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
        FreUtils.initializeObject(box.childBox, { selectable: true, cssClass: "align-top" });
    });
</script>

<div class="wrapper">
    Part Wrapper
    <RenderComponent box={box.childBox} {editor} />
</div>
