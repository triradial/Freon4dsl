<script lang="ts">
    import { AST, StringReplacerBox } from "@freon4dsl/core";
    import { DateConcept, DateRange as StudyDateRange } from "@freon4dsl/project-configuration";
    import { CalendarDate, parseDate, today } from "@internationalized/date";
    import type { DateRange as BitsDateRange } from "bits-ui";
    import { DateRangePicker } from "bits-ui";
    import { runInAction } from "mobx";
    import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
    import CaretLeft from "phosphor-svelte/lib/CaretLeft";
    import CaretRight from "phosphor-svelte/lib/CaretRight";
    import { onMount } from "svelte";

    const { box } = $props<{ box: StringReplacerBox }>();
    let value = $state<BitsDateRange>({
        start: new CalendarDate(today("UTC").year, today("UTC").month, today("UTC").day),
        end: new CalendarDate(today("UTC").year, today("UTC").month, today("UTC").day),
    });
    let isOpen = $state(false);

    function isValidDateString(val: string): boolean {
        // Checks for YYYY-MM-DD
        return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(new Date(val).getTime());
    }

    function getValue() {
        let dateRange: StudyDateRange | undefined = box.getPropertyValue();
        const todayDate = today("UTC");
        
        if (dateRange != null) {
            let startDate: CalendarDate;
            let endDate: CalendarDate;
            
            // Check startDate separately
            if (dateRange.startDate != null) {
                const parsedStartDate = parseDate(dateRange.startDate.dateAsString);
                startDate = new CalendarDate(parsedStartDate.year, parsedStartDate.month, parsedStartDate.day);
            } else {
                startDate = new CalendarDate(todayDate.year, todayDate.month, todayDate.day);
            }
            
            // Check endDate separately
            if (dateRange.endDate != null) {
                const parsedEndDate = parseDate(dateRange.endDate.dateAsString);
                endDate = new CalendarDate(parsedEndDate.year, parsedEndDate.month, parsedEndDate.day);
            } else {
                endDate = new CalendarDate(todayDate.year, todayDate.month, todayDate.day);
            }
            
            value = {
                start: startDate,
                end: endDate
            };
        } else {
            // No dateRange at all, use today for both
            value = {
                start: new CalendarDate(todayDate.year, todayDate.month, todayDate.day),
                end: new CalendarDate(todayDate.year, todayDate.month, todayDate.day)
            };
        }
        return value;
    }

    function setFocus() {
        isOpen = true;
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

    function onRangeValueChange(newValue: BitsDateRange | null) {
        if (newValue) {
            runInAction(() => {
                value = newValue;
                AST.change(() => {
                    let dateRange: StudyDateRange | undefined = box.getPropertyValue();
                    if (!dateRange) {
                        dateRange = new StudyDateRange();
                    }
                    
                    // Ensure startDate and endDate are initialized
                    if (!dateRange.startDate) {
                        // Create a new DateConcept with today's date as default
                        const todayDate = today("UTC");
                        dateRange.startDate = DateConcept.create({
                            dateAsString: `${todayDate.year}-${String(todayDate.month).padStart(2, '0')}-${String(todayDate.day).padStart(2, '0')}`
                        });
                    }
                    if (!dateRange.endDate) {
                        // Create a new DateConcept with today's date as default
                        const todayDate = today("UTC");
                        dateRange.endDate = DateConcept.create({
                            dateAsString: `${todayDate.year}-${String(todayDate.month).padStart(2, '0')}-${String(todayDate.day).padStart(2, '0')}`
                        });
                    }
                    
                    // Only update if the values exist
                    if (newValue.start) {
                        dateRange.startDate.dateAsString = newValue.start.toString();
                    }
                    if (newValue.end) {
                        dateRange.endDate.dateAsString = newValue.end.toString();
                    }
                    box.setPropertyValue(dateRange);
                });
            });
        }
    }
</script>


<div class="ml-1">
<DateRangePicker.Root 
  bind:open={isOpen} 
  value={value} 
  onValueChange={onRangeValueChange} 
  weekdayFormat="short" 
  fixedWeeks={false}
  class="datapicker-container"
>
  <div class="flex w-full max-w-[400px] flex-col">
    <div class="flex items-center gap-2">
      {#each ["start", "end"] as const as type}
        <DateRangePicker.Input {type} class="datepicker-input flex-1">
          {#snippet children({ segments })}
            {#each segments as { part, value }, i (part + i)}
              <div class="inline-block select-none">
                {#if part === "literal"}
                  <DateRangePicker.Segment {part} class="text-muted-foreground p-1">{value}</DateRangePicker.Segment>
                {:else}
                  <DateRangePicker.Segment {part} class="rounded-5px hover:bg-muted focus:bg-muted focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1 dsl-date-text">{value}</DateRangePicker.Segment>
                {/if}
              </div>
            {/each}
          {/snippet}
        </DateRangePicker.Input>
        {#if type === "start"}
          <div aria-hidden="true" class="datepicker-separator">–</div>
        {/if}
      {/each}
      <DateRangePicker.Trigger class="text-foreground/60 hover:bg-muted active:bg-dark-10 inline-flex size-8 items-center justify-center rounded-[5px] transition-all">
        <CalendarBlank class="size-6" />
      </DateRangePicker.Trigger>
    </div>
    <DateRangePicker.Content sideOffset={6} class="z-50">
      <DateRangePicker.Calendar class="border-dark-10 shadow-popover rounded-[15px] border p-[22px] bg-background-alt" style="color: var(--text-primary-500);">
        {#snippet children({ months, weekdays })}
          <DateRangePicker.Header class="flex items-center justify-between">
            <DateRangePicker.PrevButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]" style="color: var(--text-primary-500);">
              <CaretLeft class="size-6" />
            </DateRangePicker.PrevButton>
            <DateRangePicker.Heading class="text-[15px] font-medium" style="color: var(--text-primary-500);" />
            <DateRangePicker.NextButton class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]" style="color: var(--text-primary-500);">
              <CaretRight class="size-6" />
            </DateRangePicker.NextButton>
          </DateRangePicker.Header>
          <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            {#each months as month (month.value)}
              <DateRangePicker.Grid class="w-full border-collapse select-none space-y-1">
                <DateRangePicker.GridHead>
                  <DateRangePicker.GridRow class="mb-1 grid w-full grid-cols-7 gap-1">
                    {#each weekdays as day (day)}
                      <DateRangePicker.HeadCell class="font-normal! w-10 rounded-md text-xs text-center" style="color: var(--text-primary-500);">
                        <div class="w-10 text-center">{day.slice(0, 2)}</div>
                      </DateRangePicker.HeadCell>
                    {/each}
                  </DateRangePicker.GridRow>
                </DateRangePicker.GridHead>
                <DateRangePicker.GridBody>
                  {#each month.weeks as weekDates (weekDates)}
                    <DateRangePicker.GridRow class="grid w-full grid-cols-7 gap-1">
                      {#each weekDates as date (date)}
                        <DateRangePicker.Cell {date} month={month.value} class="p-0 relative size-10 text-center text-sm">
                          <DateRangePicker.Day class="w-10 h-10 flex items-center justify-center rounded-md text-sm hover:bg-muted focus:bg-muted aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground aria-selected:focus:bg-primary aria-selected:focus:text-primary-foreground disabled:pointer-events-none disabled:opacity-50 data-outside-month:hidden" style="color: var(--text-primary-500);">
                            {date.day}
                          </DateRangePicker.Day>
                        </DateRangePicker.Cell>
                      {/each}
                    </DateRangePicker.GridRow>
                  {/each}
                </DateRangePicker.GridBody>
              </DateRangePicker.Grid>
            {/each}
          </div>
        {/snippet}
      </DateRangePicker.Calendar>
    </DateRangePicker.Content>
  </div>
</DateRangePicker.Root>
</div>

