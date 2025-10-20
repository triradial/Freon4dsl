<script lang="ts">
    import { AST, StringReplacerBox } from "@freon4dsl/core";
    import type { DateValue } from "@internationalized/date";
    import { parseDate } from "@internationalized/date";
    import { DatePicker } from "bits-ui";
    import { runInAction } from "mobx";
    import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
    import CaretLeft from "phosphor-svelte/lib/CaretLeft";
    import CaretRight from "phosphor-svelte/lib/CaretRight";
    import { onMount } from "svelte";

    const { box } = $props<{ box: StringReplacerBox }>();
    let value = $state<DateValue>(parseDate(formatToday()));
    let isOpen = $state(false);
    let triggerElement = $state<HTMLElement | null>(null);

    function isValidDateString(val: string): boolean {
        // Checks for YYYY-MM-DD
        return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(new Date(val).getTime());
    }

    function formatToday(): string {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function getValue() {
        let startStr: string | undefined = box.getPropertyValue();
        if (typeof startStr === "string" && isValidDateString(startStr)) {
            value = parseDate(startStr);
        } else {
            // keep already-initialized valid default (today)
            value = parseDate(formatToday());
        }
        return value;
    }

    function setFocus() {
        isOpen = true;
        setTimeout(() => {
            const el: any = triggerElement;
            if (el && typeof el.focus === "function") {
                el.focus();
            }
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

    function onValueChange(newValue: DateValue) {
        runInAction(() => {
            value = newValue;
            AST.change(() => {
                box.setPropertyValue(newValue?.toString());
            });
        });
    }
</script>

<style>
    /* Ensure date text and separators render white inside the input */
    :global(.dsl-input-text) {
        color: var(--white) !important;
    }
    :global(.datepicker-input .text-muted-foreground) {
        color: var(--white) !important;
    }
    /* Optional: make the calendar icon match */
    :global(.datepicker-input) button {
        color: var(--white);
    }
</style>

<div class="ml-1">
<DatePicker.Root bind:open={isOpen} value={value} onValueChange={onValueChange} weekdayFormat="short" fixedWeeks={false}>
    <div class="flex w-full max-w-[232px] flex-col">
        <DatePicker.Input class="datepicker-input">
            {#snippet children({ segments })}
                {#each segments as { part, value }, i (part + i)}
                    <div class="inline-block select-none">
                        {#if part === "literal"}
                            <DatePicker.Segment {part} class="p-1 dsl-input-text">{value}</DatePicker.Segment>
                        {:else}
                            <DatePicker.Segment {part} class="rounded-5px hover:bg-muted focus:bg-muted focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1 dsl-input-text">{value}</DatePicker.Segment>
                        {/if}
                    </div>
                {/each}
                <DatePicker.Trigger bind:ref={triggerElement} class="text-foreground/60 hover:bg-muted active:bg-dark-10 ml-auto inline-flex size-8 items-center justify-center rounded-[5px] transition-all">
                    <CalendarBlank class="size-6" />
                </DatePicker.Trigger>
            {/snippet}
        </DatePicker.Input>
        <DatePicker.Content sideOffset={6} class="z-50">
            <DatePicker.Calendar class="border-dark-10 shadow-popover rounded-[15px] border p-[22px]" style="background: var(--card-background, var(--gray-800)); opacity: 1; color: var(--text-primary-500);">
                {#snippet children({ months, weekdays })}
                    <DatePicker.Header class="flex items-center justify-between">
                        <DatePicker.PrevButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]" style="color: var(--text-primary-500);">
                            <CaretLeft class="size-6" />
                        </DatePicker.PrevButton>
                        <DatePicker.Heading class="text-[15px] font-medium" style="color: var(--text-primary-500);" />
                        <DatePicker.NextButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]" style="color: var(--text-primary-500);">
                            <CaretRight class="size-6" />
                        </DatePicker.NextButton>
                    </DatePicker.Header>
                    <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                        {#each months as month (month.value)}
                            <DatePicker.Grid class="w-full border-collapse select-none space-y-1">
                                <DatePicker.GridHead>
                                    <DatePicker.GridRow class="mb-1 grid w-full grid-cols-7 gap-1">
                                        {#each weekdays as day (day)}
                                            <DatePicker.HeadCell class="font-normal! w-10 rounded-md text-xs text-center" style="color: var(--text-primary-500);">
                                                <div class="w-10 text-center">{day.slice(0, 2)}</div>
                                            </DatePicker.HeadCell>
                                        {/each}
                                    </DatePicker.GridRow>
                                </DatePicker.GridHead>
                                <DatePicker.GridBody>
                                    {#each month.weeks as weekDates (weekDates)}
                                        <DatePicker.GridRow class="grid w-full grid-cols-7 gap-1">
                                            {#each weekDates as date (date)}
                                                <DatePicker.Cell {date} month={month.value} class="p-0 relative size-10 text-center text-sm">
                                                    <DatePicker.Day class="w-10 h-10 flex items-center justify-center rounded-md text-sm hover:bg-muted focus:bg-muted aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground aria-selected:focus:bg-primary aria-selected:focus:text-primary-foreground disabled:pointer-events-none disabled:opacity-50 data-outside-month:hidden" style="color: var(--text-primary-500);">
                                                        {date.day}
                                                    </DatePicker.Day>
                                                </DatePicker.Cell>
                                            {/each}
                                        </DatePicker.GridRow>
                                    {/each}
                                </DatePicker.GridBody>
                            </DatePicker.Grid>
                        {/each}
                    </div>
                {/snippet}
            </DatePicker.Calendar>
        </DatePicker.Content>
        </div>
    </DatePicker.Root>
</div>
