<script lang="ts">
    import { onMount } from "svelte";
    import { ExternalStringBox } from "@freon4dsl/core";
    import { Clock } from '@lucide/svelte';
    const { box } = $props<{ box: ExternalStringBox }>();

    let inputElement: HTMLInputElement;
    let value = $state("");
    let isEditing = $state(false);
    getValue();

    // Helper to format time as 'h:mm A' (12-hour with AM/PM)
    function formatTime(val: string): string {
        if (!val) return '';
        const [h, m] = val.split(":");
        if (h === undefined || m === undefined) return val;
        let hour = parseInt(h, 10);
        const minute = m.padStart(2, '0');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        if (hour === 0) hour = 12;
        return `${hour}:${minute} ${ampm}`;
    }

    function getValue() {
        let startStr: string | undefined = box.getPropertyValue();
        if (typeof startStr === "string" && !!startStr && startStr.length > 0) {
            value = startStr;
        } else {
            value = "";
        }
        return value;
    }

    function toEditMode() {
        isEditing = true;
        setTimeout(() => {
            if (inputElement) inputElement.focus();
        }, 0);
    }
    function toDisplayMode() {
        isEditing = false;
    }

    const onInput = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
        value = event.currentTarget.value;
    };

    const onChange = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
        event.stopPropagation();
        if (getValidTime(value) !== undefined) {
            box.setPropertyValue(value);
        }
        toDisplayMode();
    };

    function getValidTime(timeString: string): String | undefined {
        // Regular expression to match the HH:MM format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(timeString)) {
            return undefined;
        }
        const [hours, minutes] = timeString.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        if (date instanceof Date && !isNaN(date.getTime())) {
            return timeString;
        } else {
            return undefined;
        }
    }

    // The following four functions need to be included for the editor to function properly.
    async function setFocus(): Promise<void> {
        isEditing = true;
        setTimeout(() => {
            if (inputElement) inputElement.focus();
        }, 0);
    }
    const refresh = (why?: string): void => {
        getValue();
    };
    onMount(() => {
        getValue();
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });
    $effect(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    function onInputKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === 'Escape') {
            toDisplayMode();
        }
    }
    function onInputBlur() {
        toDisplayMode();
    }
    function onIconClick() {
        if (inputElement) {
            inputElement.focus();
            // Try to open the native picker (not always possible programmatically)
            inputElement.click();
        }
    }
</script>

<div class="timepicker-container">
    {#if isEditing}
        <input
            id="default-timepicker"
            type="time"
            bind:value
            class="timepicker-input"
            placeholder="Select time"
            bind:this={inputElement}
            aria-label="Time input"
            oninput={onInput}
            onchange={onChange}
            onkeydown={onInputKeydown}
            onblur={onInputBlur}
            style="margin-right: 0.25rem;"
        />
        <button class="timepicker-icon-btn" aria-label="Show time picker" type="button" onclick={onIconClick} tabindex="-1">
            <Clock size={16} />
        </button>
    {:else}
        <span class="timepicker-display" onclick={toEditMode} tabindex="0" aria-label="Edit time">
            {value ? formatTime(value) : '—:--'}
        </span>
    {/if}
</div>
