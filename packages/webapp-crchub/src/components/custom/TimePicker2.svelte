<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import { ExternalStringBox } from "@freon4dsl/core";
    import flatpickr from "flatpickr";
    import "flatpickr/dist/flatpickr.min.css";

    export let box: ExternalStringBox;

    let inputElement: HTMLInputElement;
    let fp: any;
    let value: string = "";

    function initFlatpickr() {
        if (fp) {
            fp.destroy();
        }
        fp = flatpickr(inputElement, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            onChange: (selectedDates, dateStr) => {
                if (selectedDates.length > 0) {
                    value = dateStr;
                    box.setPropertyValue(value);
                }
            },
        });
    }

    function getValue() {
        value = box.getPropertyValue() ?? "";
        if (fp) {
            fp.setDate(value, false);
        }
    }

    async function setFocus(): Promise<void> {
        inputElement.focus();
    }

    const refresh = (): void => {
        getValue();
    };

    onMount(() => {
        getValue();
        initFlatpickr();
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });

    afterUpdate(() => {
        box.setFocus = setFocus;
        box.refreshComponent = refresh;
    });
</script>

<div class="timepicker">
    <input
        type="text"
        bind:this={inputElement}
        class="timepicker-input"
        placeholder="Select time"
        readonly
    />
</div>

<style>
    .timepicker {
        position: relative;
    }
    .timepicker-input {
        background-color: transparent;
        border: 1px solid var(--border-color, #ccc);
        color: var(--text-color, inherit);
        padding: 5px;
        border-radius: 4px;
        width: 100%;
    }
    :global(.flatpickr-calendar) {
        background-color: var(--background-color, #fff);
        color: var(--text-color, #000);
    }
    :global(.flatpickr-time) {
        border-radius: 0 0 5px 5px;
        background: var(--background-color, #fff);
    }
    :global(.flatpickr-time input:hover, .flatpickr-time .flatpickr-am-pm:hover, .flatpickr-time input:focus, .flatpickr-time .flatpickr-am-pm:focus) {
        background: var(--hover-background-color, #e6e6e6);
    }
</style>