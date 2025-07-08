<script lang="ts">
    import { onMount } from "svelte";
    import { ExternalStringBox } from "@freon4dsl/core";
    /* ts-ignore */
    import { CalendarDays as CalendarIcon } from '@lucide/svelte';

    const { box } = $props<{ box: ExternalStringBox }>();

    let inputElement: HTMLInputElement;
    let value = $state("");
    let isEditing = $state(false);
    getValue();

    // Helper to format date as 'MMM D, YYYY'
    function formatDate(val: string): string {
        if (!val) return '';
        const [yyyy, mm, dd] = val.split('-');
        if (!yyyy || !mm || !dd) return val;
        const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        if (isNaN(date.getTime())) return val;
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getValue() {
        let startStr: string | undefined = box.getPropertyValue();
        if (typeof startStr === "string" && !!startStr && startStr.length > 0) {
            value = startStr;
        } else {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            value = `${yyyy}-${mm}-${dd}`;
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
        if (getValidDate(value) !== undefined) {
            box.setPropertyValue(value);
        }
        toDisplayMode();
    };

    function getValidDate(d: string): Date | undefined {
        const dateArray = d.split("-");
        if (dateArray.length !== 3) {
            return undefined;
        }
        const [year, month, day] = dateArray;
        const newDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        let date = new Date(newDate);
        if (date instanceof Date && !isNaN(date.getTime())) {
            return date;
        } else {
            return undefined;
        }
    }

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
            inputElement.click();
        }
    }
</script>

<div class="datepicker-container">
    {#if isEditing}
        <input
            id="default-datepicker"
            type="date"
            bind:value
            class="datepicker-input"
            placeholder="Select date"
            bind:this={inputElement}
            aria-label="Date input"
            oninput={onInput}
            onchange={onChange}
            onkeydown={onInputKeydown}
            onblur={onInputBlur}
            style="margin-right: 0.25rem;"
        />
        <!-- <button class="datepicker-icon-btn" aria-label="Show date picker" type="button" onclick={onIconClick} tabindex="-1">
            <CalendarIcon size={20} />
        </button> -->
    {:else}
        <span class="datepicker-display" onclick={toEditMode} tabindex="0" aria-label="Edit date">
            {value ? formatDate(value) : '—'}
        </span>
    {/if}
</div>
