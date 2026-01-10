<script lang="ts">
    import { onMount, tick } from "svelte";
    import { TimeField } from "bits-ui";
    import { AST, StringReplacerBox } from "@freon4dsl/core";
    import { parseTime, type TimeValue } from "@internationalized/date";

    const { box } = $props<{ box: StringReplacerBox }>();
    let value = $state<TimeValue | null>(null);
    let isEditing = $state(false);
    // svelte-ignore non_reactive_update
    let spanElement: HTMLSpanElement | null = null;
    // svelte-ignore non_reactive_update
    let timeFieldWrapper: HTMLDivElement | null = null;

    function isValidTimeString(val: string): boolean {
        // Checks for HH:MM or HH:MM:SS (24-hour)
        return /^\d{2}:\d{2}(:\d{2})?$/.test(val);
    }

    function formatTimeForDisplay(timeValue: TimeValue | null): string {
        if (!timeValue) {
            return "";
        }
        // Convert 24-hour format to 12-hour format with AM/PM
        let hours = timeValue.hour;
        const minutes = timeValue.minute;
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const minutesStr = minutes.toString().padStart(2, "0");
        return `${hours}:${minutesStr} ${period}`;
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

    async function startEditing() {
        isEditing = true;
        await tick(); // Wait for TimeField.Input to be rendered
        // Focus the first segment (hour)
        if (timeFieldWrapper) {
            const firstSegment = timeFieldWrapper.querySelector('[data-segment="hour"]') as HTMLElement;
            if (firstSegment && typeof firstSegment.focus === 'function') {
                firstSegment.focus();
            }
        }
    }

    function endEditing() {
        // Save the current value before exiting edit mode
        if (value) {
            const timeStr = value.toString();
            const currentBoxValue = box.getPropertyValue();
            // Only save if the value has changed
            if (timeStr !== currentBoxValue) {
                AST.changeNamed(`CustomTimePickerComponent: Set ${box.propertyName || 'property'} to ${timeStr}`, () => {
                    box.setPropertyValue(timeStr);
                });
            }
        }
        isEditing = false;
    }

    function setFocus() {
        startEditing();
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
        const timeStr = newValue?.toString();
        if (timeStr) {
            AST.changeNamed(`CustomTimePickerComponent: Set ${box.propertyName || 'property'} to ${timeStr}`, () => {
                box.setPropertyValue(timeStr);
            });
        }
    }

    function onMouseDown(event: MouseEvent) {
        if (event.button === 0) { // left click
            event.preventDefault();
            event.stopPropagation();
            startEditing();
        }
    }

    function onSpanKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            startEditing();
        }
    }

    function onSpanFocusIn() {
        startEditing();
    }

    function onFocusOut(event: FocusEvent) {
        // Get the element that is receiving focus
        const relatedTarget = event.relatedTarget as HTMLElement;
        
        // Check if focus is moving to an element inside our component
        if (relatedTarget && timeFieldWrapper) {
            // Check if the new focus target is inside the timeFieldWrapper
            if (timeFieldWrapper.contains(relatedTarget)) {
                // Focus is staying within the component, don't exit edit mode
                return;
            }
        }
        
        // Double-check that focus is truly outside the component
        setTimeout(() => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && timeFieldWrapper) {
                if (timeFieldWrapper.contains(activeElement)) {
                    // Focus came back to the component, don't exit
                    return;
                }
            }
            endEditing();
        }, 100);
    }

    const displayTime = $derived(formatTimeForDisplay(value));
</script>

<div class="ml-1">
    {#if isEditing}
        <div bind:this={timeFieldWrapper} onfocusout={onFocusOut}>
            <TimeField.Root bind:value={value} on:valueChange={e => onValueChange(e.detail)}>
                <div class="flex w-full max-w-[232px] flex-col">
                    <TimeField.Input 
                        class="custom-timepicker-input"
                    >
                        {#snippet children({ segments })}
                            {#each segments as { part, value }, i (part + i)}
                                <div class="inline-block select-none">
                                    {#if part === "literal"}
                                        <TimeField.Segment {part} class="segment-literal">{value}</TimeField.Segment>
                                    {:else}
                                        <TimeField.Segment 
                                            {part} 
                                            class="segment-value rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
                                        >
                                            {value}
                                        </TimeField.Segment>
                                    {/if}
                                </div>
                            {/each}
                        {/snippet}
                    </TimeField.Input>
                </div>
            </TimeField.Root>
        </div>
    {:else}
        <span
            bind:this={spanElement}
            class="text-component-text custom-timepicker-display"
            tabindex="0"
            role="textbox"
            onmousedown={onMouseDown}
            onkeydown={onSpanKeyDown}
            onfocusin={onSpanFocusIn}
        >
            {#if displayTime}
                {displayTime}
            {:else}
                <span class="text-component-text">--:-- --</span>
            {/if}
        </span>
    {/if}
</div>