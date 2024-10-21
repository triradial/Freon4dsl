<script lang="ts">
    import { afterUpdate, onMount } from "svelte";
    import { ExternalStringBox, FreEditor } from "@freon4dsl/core";
    export let box: ExternalStringBox;
    export let editor: FreEditor;

    let inputElement: HTMLInputElement;
    
    let value: string = "";
    getValue();

    const onClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
        event.stopPropagation();
    };

    const onChange = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
        event.stopPropagation();
        let xx = getValidDate(value);
        if (xx !== undefined) {
            console.log("Changing value to: " + value);
            box.setPropertyValue(value);
        } else {
            console.log("Value: " + value + " is not a valid date");
        }
        // return undefined;
    };
    function getValidDate(d: string): Date | undefined {
        const dateArray = d.split("-");
        if (dateArray.length !== 3) {
            return undefined;
        }
        const [year, month, day] = dateArray;
        const newDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        console.log("In getValidDate: " + newDate); // YYYY-MM-DD format
        let date = new Date(newDate);
        if (date instanceof Date) {
            return date;
        } else {
            return undefined;
        }
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

<div class="datepicker">
    <input
        id="default-datepicker"
        type="date"
        bind:value
        class="datepicker-input"
        placeholder="Select date"
        on:click={onClick}
        on:change={onChange}
        bind:this={inputElement}
    />
</div>


