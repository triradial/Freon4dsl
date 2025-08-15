<script lang="ts">
    import { onMount } from "svelte";
    import { DatePicker } from "bits-ui";
    import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
    import CaretLeft from "phosphor-svelte/lib/CaretLeft";
    import CaretRight from "phosphor-svelte/lib/CaretRight";
    import { StringReplacerBox } from "@freon4dsl/core";
    import { parseDate } from "@internationalized/date";
    import type { DateValue } from "@internationalized/date";

    const { box } = $props<{ box: StringReplacerBox }>();
    let value = $state<DateValue | null>(null);
    let isOpen = $state(false);
    let triggerElement: HTMLButtonElement | null = null;

    function isValidDateString(val: string): boolean {
        // Checks for YYYY-MM-DD
        return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(new Date(val).getTime());
    }

    function getValue() {
        let startStr: string | undefined = box.getPropertyValue();
        if (typeof startStr === "string" && isValidDateString(startStr)) {
            value = parseDate(startStr);
        } else {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            value = parseDate(`${yyyy}-${mm}-${dd}`);
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

    function onValueChange(newValue: DateValue) {
        value = newValue;
        box.setPropertyValue(newValue?.toString());
    }
</script>

<div class="ml-1">
<DatePicker.Root bind:open={isOpen} value={value} on:valueChange={e => onValueChange(e.detail)} weekdayFormat="short" fixedWeeks={true}>
    <div class="flex w-full max-w-[232px] flex-col">
        <DatePicker.Input class="datepicker-input">
            {#snippet children({ segments })}
                {#each segments as { part, value }, i (part + i)}
                    <div class="inline-block select-none">
                        {#if part === "literal"}
                            <DatePicker.Segment {part} class="text-muted-foreground p-1">{value}</DatePicker.Segment>
                        {:else}
                            <DatePicker.Segment {part} class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1">{value}</DatePicker.Segment>
                        {/if}
                    </div>
                {/each}
                <DatePicker.Trigger bind:this={triggerElement} class="text-foreground/60 hover:bg-muted active:bg-dark-10 ml-auto inline-flex size-8 items-center justify-center rounded-[5px] transition-all">
                    <CalendarBlank class="size-6" />
                </DatePicker.Trigger>
            {/snippet}
        </DatePicker.Input>
        <DatePicker.Content sideOffset={6} class="z-50">
            <DatePicker.Calendar class="border-dark-10 bg-background-alt shadow-popover rounded-[15px] border p-[22px]">
                {#snippet children({ months, weekdays })}
                    <DatePicker.Header class="flex items-center justify-between">
                        <DatePicker.PrevButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]">
                            <CaretLeft class="size-6" />
                        </DatePicker.PrevButton>
                        <DatePicker.Heading class="text-[15px] font-medium" />
                        <DatePicker.NextButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]">
                            <CaretRight class="size-6" />
                        </DatePicker.NextButton>
                    </DatePicker.Header>
                    <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                        {#each months as month (month.value)}
                            <DatePicker.Grid class="w-full border-collapse select-none space-y-1">
                                <DatePicker.GridHead>
                                    <DatePicker.GridRow class="mb-1 flex w-full justify-between">
                                        {#each weekdays as day (day)}
                                            <DatePicker.HeadCell class="text-muted-foreground font-normal! w-10 rounded-md text-xs">
                                                <div>{day.slice(0, 2)}</div>
                                            </DatePicker.HeadCell>
                                        {/each}
                                    </DatePicker.GridRow>
                                </DatePicker.GridHead>
                                <DatePicker.GridBody>
                                    {#each month.weeks as weekDates (weekDates)}
                                        <DatePicker.GridRow class="flex w-full">
                                            {#each weekDates as date (date)}
                                                <DatePicker.Cell {date} month={month.value} class="p-0! relative size-10 text-center text-sm">
                                                    <DatePicker.Day class="rounded-9px text-foreground hover:border-foreground data-selected:bg-foreground data-disabled:text-foreground/30 data-selected:text-background data-unavailable:text-muted-foreground data-disabled:pointer-events-none data-outside-month:pointer-events-none data-selected:font-medium data-unavailable:line-through group relative inline-flex size-10 items-center justify-center whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal transition-all">
                                                        <div class="bg-foreground group-data-selected:bg-background group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"></div>
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
