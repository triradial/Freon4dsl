<script lang="ts">
    import { onMount } from "svelte";
    import { TimeField } from "bits-ui";
    import { StringReplacerBox } from "@freon4dsl/core";
    import { parseTime, type TimeValue } from "@internationalized/date";

    const { box } = $props<{ box: StringReplacerBox }>();
    let value = $state<TimeValue | null>(null);
    let isOpen = $state(false);
    let triggerElement: HTMLButtonElement | null = null;

    function isValidTimeString(val: string): boolean {
        // Checks for HH:MM or HH:MM:SS (24-hour)
        return /^\d{2}:\d{2}(:\d{2})?$/.test(val);
    }

    function getValue() {
        let startStr: string | undefined = box.getPropertyValue();
        if (typeof startStr === "string" && isValidTimeString(startStr)) {
            value = parseTime(startStr);
        } else {
            value = null;
        }
        return value;
    }

    function setFocus() {
        isOpen = true;
        setTimeout(() => {
            if (triggerElement) triggerElement.focus();
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

    function onValueChange(newValue: TimeValue) {
        value = newValue;
        box.setPropertyValue(newValue?.toString());
    }
</script>

<div class="ml-1" >
    <TimeField.Root value={value} on:valueChange={e => onValueChange(e.detail)}>
        <div class="flex w-full max-w-[232px] flex-col" >
            <TimeField.Input class="timepicker-input">
                {#snippet children({ segments })}
                    {#each segments as { part, value }, i (part + i)}
                        <div class="inline-block">
                            {#if part === "literal"}
                                <TimeField.Segment {part} class="segment-literal">{value}</TimeField.Segment>
                            {:else}
                                <TimeField.Segment {part} class="segment-value">{value}</TimeField.Segment>
                            {/if}
                        </div>
                    {/each}
                {/snippet}
            </TimeField.Input>
        </div>
    </TimeField.Root>
</div>