<script lang="ts">
    import { FreEditor, FreLogger, PartWrapperBox } from "@freon4dsl/core";
    import { componentId, type FreComponentProps } from "@freon4dsl/core-svelte";
    import { onMount } from "svelte";
    // ts-ignore
    const LOGGER = new FreLogger("ItemGroupComponent");
    
    const { editor, box }: FreComponentProps<PartWrapperBox> = $props();

    // Props
    let id: string = $state(!!box ? componentId(box) : 'group-for-unknown-box');
    let rawTextPropertyName = box && box.findParam("rawTextPropertyName") || "rawText";

    const getText = () => {
        const node = box.node;
        return node[rawTextPropertyName];
    }
    
    const getAbbreviatedText = () => {
        const text = getText();
        let abbreviatedText = "";
        if (text) {
            if (text.length > 25) {
                abbreviatedText = text.substring(0, 25) + "...";
            } else {
                abbreviatedText = text;
            }
        }
        return abbreviatedText;
    }

    let abbreviatedText = $derived(() => getAbbreviatedText());

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    // async function setFocus(): Promise<void> {
    // }

    const refresh = (why?: string): void => {
    };

    onMount(() => {
    });


</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if abbreviatedText()}
<div id="{id}" class="abbreviation-text">{abbreviatedText()}</div>
{/if}
