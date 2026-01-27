<script lang="ts">
    // Timeline Calendar Header - Shared component for month and day headers
    // Used by both Patient and Staff timeline sections
    // Note: This component outputs header rows directly (no wrapper div)
    // It's meant to be placed inside a days-container
    
    export interface MonthGroup {
        month: number;
        year: number;
        startIndex: number;
        endIndex: number;
        backgroundColor: string;
    }
    
    let { 
        visibleDays = [],
        monthGroups = [],
        getDateFromDay,
        isWeekend,
        isToday,
        getMonthName,
        getDayOfWeekAbbr,
        getMonthForDay
    } = $props<{
        visibleDays: number[];
        monthGroups: MonthGroup[];
        getDateFromDay: (day: number) => Date;
        isWeekend: (date: Date) => boolean;
        isToday: (day: number) => boolean;
        getMonthName: (date: Date) => string;
        getDayOfWeekAbbr: (date: Date) => string;
        getMonthForDay: (day: number) => { month: number; year: number };
    }>();
</script>

<!-- Month headers with background -->
<div class="month-headers-row">
    {#each monthGroups as group}
        <div 
            class="month-header" 
            style="grid-column: {group.startIndex + 1} / {group.endIndex + 2}; background-color: {group.backgroundColor};"
        >
            {getMonthName(new Date(group.year, group.month, 1))} {group.year}
        </div>
    {/each}
</div>

<!-- Day headers - date above day of week -->
<div class="day-headers-row">
    {#each visibleDays as day}
        {@const date = getDateFromDay(day)}
        {@const monthGroup = monthGroups.find(g => {
            const dayMonth = getMonthForDay(day);
            return g.month === dayMonth.month && g.year === dayMonth.year;
        })}
        <div 
            class="day-header" 
            class:weekend={isWeekend(date)}
            class:today={isToday(day)}
            style={monthGroup && !isWeekend(date) && !isToday(day) ? `background-color: ${monthGroup.backgroundColor};` : ''}
        >
            <span class="day-number">{date.getDate()}</span>
            <span class="day-of-week">{getDayOfWeekAbbr(date)}</span>
        </div>
    {/each}
</div>
