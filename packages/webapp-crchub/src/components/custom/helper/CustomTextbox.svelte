<script lang="ts">
    import { onMount, tick } from "svelte";
    import TextboxHelper from "./CustomTextboxHelper.js";
    const { id, value, setValue, getValue, placeholder = "", isEditing = false, onStartEditing, onEndEditing, required } = $props<{
        id: string,
        value: string,
        setValue: (v: string) => void,
        getValue: () => string,
        placeholder?: string,
        isEditing?: boolean,
        onStartEditing?: () => void,
        onEndEditing?: () => void,
        required?: boolean
    }>();

    let inputElement: HTMLInputElement | undefined = $state();
    let spanElement = $state();
    let widthSpan: HTMLSpanElement | undefined = $state();
    let localValue = $state(value);
    let editing = $state(isEditing);
    let helper;

    $effect(() => {
        localValue = value;
        helper?.setInputWidth(); // update width when value changes
    });

    function startEditing() {
        editing = true;
        onStartEditing?.();
        tick().then(() => {
            inputElement?.focus();
            inputElement?.select();
            helper?.setInputWidth(); // ensure width is correct after input is visible
        });
    }

    function endEditing() {
        editing = false;
        setValue(localValue);
        onEndEditing?.();
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" || event.key === "Escape") {
            endEditing();
            event.stopPropagation();
            return;
        }
        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key.length === 1 // printable characters
        ) {
            event.stopPropagation();
        }
        helper?.handleKeyDown(event, localValue, setValue);
    }

    function handleInput(event) {
        localValue = event.target.value;
        helper?.handleInput(event);
        helper?.setInputWidth(); // update width on every input
    }

    function handleFocus() {
        helper?.handleFocus();
    }

    function handleBlur() {
        endEditing(); // ensure we exit edit mode on blur
        helper?.handleBlur();
    }

    onMount(() => {
        helper = new TextboxHelper({
            getValue,
            setValue,
            placeholder,
        });
    });

    $effect(() => {
        if (helper) {
            helper.inputElement = inputElement;
            helper.widthSpan = widthSpan;
            helper.setInputWidth();
        }
    });
</script>

{#if editing}
    <span id="{id}-input-span">
        <input
            id="{id}-input"
            bind:this={inputElement}
            type="text"
            class="text-component-input"
            value={localValue}
            oninput={handleInput}
            onkeydown={handleKeyDown}
            onfocus={handleFocus}
            onfocusout={handleBlur}
            placeholder={placeholder}
            tabindex="0"
        />
        <span class="text-component-width" bind:this={widthSpan}></span>
    </span>
{:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
        id="{id}-span"
        bind:this={spanElement}
        class="text-component-text"
        tabindex="0"
        onclick={startEditing}
        onfocus={startEditing}
    >
        {#if !!localValue && localValue.length > 0}
            {localValue}
        {:else}
            <span class="text-component-placeholder{required ? ' required' : ''}">{placeholder}</span>
        {/if}
    </span>
{/if} 