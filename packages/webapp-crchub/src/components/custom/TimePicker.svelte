<script lang="ts">
    import { afterUpdate, onMount } from "svelte";
    import { ExternalStringBox, FreEditor } from "@freon4dsl/core";
    export let box: ExternalStringBox;

    let inputElement: any;
    let value: string = "";
    getValue();

    const onClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
        event.stopPropagation();
    };

    const onChange = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
        event.stopPropagation();
        let xx = getValidTime(value);
        if (xx !== undefined) {
            console.log("Changing value to: " + value);
            box.setPropertyValue(value);
        } else {
            console.log("Value: " + value + " is not a valid time");
        }
    };
    function getValidTime(timeString: string): String | undefined {
        // Regular expression to match the HH:MM format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!timeRegex.test(timeString)) {
            return undefined;
        }

        const [hours, minutes] = timeString.split(":").map(Number);

        // Create a Date object for today with the given time
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        if (date instanceof Date && !isNaN(date.getTime())) {
            return timeString;
        } else {
            return undefined;
        }
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

    // The following four functions need to be included for the editor to function properly.
    // Please, set the focus to the first editable/selectable element in this component.
    async function setFocus(): Promise<void> {
        inputElement.focus();
    }
    const refresh = (why?: string): void => {
        // do whatever needs to be done to refresh the elements that show information from the model
        getValue();
    };
    onMount(() => {
        getValue();
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
        id="default-timepicker"
        type="time"
        bind:value
        class="timepicker-input"
        placeholder="Select time"
        on:click={onClick}
        on:change={onChange}
        bind:this={inputElement}
    />
    <span class="validity"></span>
</div>

<style>
    .timepicker {
        position: relative;
        max-width: 24rem;
    }
    .timepicker-input {
        border-width: 1px;
        border-color: transparent;
        color: rgb(134, 151, 189);
        font-size: 0.875rem; /* 14px */
        line-height: 1.25rem; /* 20px */
        border-radius: 0.5rem; /* 8px */
        display: block;
        width: 100%;
        padding-inline-start: 2.5rem; /* 40px */
        padding: 0.625rem; /* 10px */
        color-scheme: dark;
    }
    .timepicker-input:hover,
    .timepicker-input:focus {
        --tw-ring-color: rgb(59 130 246);
        border-color: rgb(59 130 246);
        color: rgb(158, 33, 33);
        background-color: rgb(17, 10, 133);
        border-width: 1px;
    }

    input + span {
        padding-right: 30px;
    }

    input:invalid + span::after {
        position: absolute;
        content: "✖";
        padding-left: 5px;
    }

    input:valid + span::after {
        position: absolute;
        content: "✓";
        padding-left: 5px;
    }
    /* ::-webkit-calendar-picker-indicator {
        background-color: blue;
    } */
</style>
