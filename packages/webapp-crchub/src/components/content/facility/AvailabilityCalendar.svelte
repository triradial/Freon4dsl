<script lang="ts">
    import { onMount } from "svelte";
    import type { DateRange } from "../../../services/data/availability-service.js";
    import { calculateDailyAvailability } from "../../../services/data/availability-service.js";
    // @ts-ignore
    import { ChevronUp as IconChevronUp, ChevronDown as IconChevronDown } from '@lucide/svelte';
    
    // Format date as YYYY-MM-DD without timezone issues
    function formatDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let { 
        selectedPersonId = $bindable(),
        selectedPersonName = $bindable(),
        totalStaff = 0,
        unavailableDates = [],
        onDatesChanged,
        allStaffAvailability,
        staffNames,
        organizationStartDate,
        organizationEndDate,
        entityType = "staff",
        monthsToShow = 2
    } = $props<{
        selectedPersonId?: string | null;
        selectedPersonName?: string | null;
        totalStaff?: number;
        unavailableDates?: DateRange[];
        onDatesChanged?: (personId: string, dates: DateRange[]) => void;
        allStaffAvailability?: Map<string, DateRange[]>; // For showing counts when no person selected (staff only)
        staffNames?: Map<string, string>; // Map of personId to personName for tooltips (staff only)
        organizationStartDate?: string | null; // Organization start date (YYYY-MM-DD)
        organizationEndDate?: string | null; // Organization end date (YYYY-MM-DD)
        entityType?: "staff" | "patient"; // Type of entity: staff (supports aggregation) or patient (individual only)
        monthsToShow?: number; // Number of months to display (default 3)
    }>();

    let weekendsUnavailable = $state(false);

    let startMonth = $state(new Date());
    let isSelecting = $state(false);
    
    // Dynamically determine months to show based on screen height
    let effectiveMonthsToShow = $state(monthsToShow);
    
    // Update months to show based on viewport height
    $effect(() => {
        function updateMonthsToShow() {
            if (window.innerHeight >= 900) {
                effectiveMonthsToShow = 3;
            } else {
                effectiveMonthsToShow = 2;
            }
        }
        
        updateMonthsToShow();
        window.addEventListener('resize', updateMonthsToShow);
        
        return () => {
            window.removeEventListener('resize', updateMonthsToShow);
        };
    });
    let selectionStart: Date | null = null;
    let selectionEnd: Date | null = null;
    
    let tooltipPosition = $state({ x: 0, y: 0 });
    let tooltipVisible = $state(false);
    let tooltipDate = $state<Date | null>(null);
    let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    function previousMonth() {
        startMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1);
    }

    function nextMonth() {
        startMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1);
    }

    function getMonthDays(monthDate: Date): Date[] {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Start from Sunday of the week containing the first day
        const startDay = new Date(firstDay);
        startDay.setDate(startDay.getDate() - startDay.getDay());
        
        // End on Saturday of the week containing the last day
        const endDay = new Date(lastDay);
        endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));
        
        const days: Date[] = [];
        const current = new Date(startDay);
        
        while (current <= endDay) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    }

    // Get all visible months
    function getVisibleMonths(): Date[] {
        const months: Date[] = [];
        for (let i = 0; i < effectiveMonthsToShow; i++) {
            const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
            months.push(monthDate);
        }
        return months;
    }

    function isDateUnavailable(date: Date): boolean {
        if (!selectedPersonId || !unavailableDates || unavailableDates.length === 0) return false;
        
        const dateStr = formatDateString(date);
        
        for (const range of unavailableDates) {
            // Compare date strings directly - no timezone issues
            if (dateStr >= range.startDate && dateStr <= range.endDate) {
                return true;
            }
        }
        return false;
    }
    
    // Debug: Log when unavailableDates changes
    $effect(() => {
        console.log('[AvailabilityCalendar] unavailableDates changed:', unavailableDates);
        console.log('[AvailabilityCalendar] selectedPersonId:', selectedPersonId);
    });
    
    // Filter weekends from unavailable dates when weekends unavailable checkbox is toggled
    $effect(() => {
        if (weekendsUnavailable && selectedPersonId && unavailableDates && unavailableDates.length > 0) {
            const filtered = filterWeekendsFromRanges(unavailableDates);
            if (filtered.length !== unavailableDates.length || 
                JSON.stringify(filtered) !== JSON.stringify(unavailableDates)) {
                // Dates changed, need to update
                console.log('[AvailabilityCalendar] Filtering weekends from unavailable dates');
                if (onDatesChanged && selectedPersonId) {
                    onDatesChanged(selectedPersonId, filtered);
                }
            }
        }
    });

    function isDateInMonth(date: Date, monthDate: Date): boolean {
        return date.getMonth() === monthDate.getMonth() && 
               date.getFullYear() === monthDate.getFullYear();
    }

    function isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    function onDateMouseDown(date: Date) {
        if (!canClickDate(date)) return;
        
        isSelecting = true;
        selectionStart = date;
        selectionEnd = date;
    }

    function onDateMouseEnter(date: Date) {
        if (isSelecting && selectionStart) {
            selectionEnd = date;
        }
    }

    function onDateMouseUp() {
        if (!isSelecting || !selectionStart || !canClickDate(selectionStart)) return;
        
        const start = selectionStart < (selectionEnd || selectionStart) ? selectionStart : (selectionEnd || selectionStart);
        const end = selectionStart < (selectionEnd || selectionStart) ? (selectionEnd || selectionStart) : selectionStart;
        
        // If no person selected and in staff mode, toggle availability for all staff
        if (!selectedPersonId && entityType === "staff") {
            toggleAllStaffAvailability(start, end);
        } else if (selectedPersonId || entityType === "patient") {
            // Individual person toggle
            const newRange: DateRange = {
                startDate: formatDateString(start),
                endDate: formatDateString(end)
            };
            
            // Check if this range overlaps with existing unavailable dates
            const isCurrentlyUnavailable = isDateUnavailable(start);
            
            let newUnavailableDates = [...unavailableDates];
            
            if (isCurrentlyUnavailable) {
                // Remove this range from unavailable dates
                newUnavailableDates = removeRangeFromDates(newUnavailableDates, newRange);
            } else {
                // Add this range to unavailable dates
                newUnavailableDates.push(newRange);
                newUnavailableDates = mergeOverlappingRanges(newUnavailableDates);
            }
            
            // Filter out weekends if weekends are marked as unavailable
            newUnavailableDates = filterWeekendsFromRanges(newUnavailableDates);
            
            // Filter out dates outside organization date range
            newUnavailableDates = newUnavailableDates.filter(range => {
                const rangeStart = range.startDate;
                const rangeEnd = range.endDate;
                // Keep range if at least part of it is within org range
                return isDateInOrgRange(rangeStart) || isDateInOrgRange(rangeEnd) ||
                       (organizationStartDate && rangeEnd >= organizationStartDate && rangeStart <= (organizationEndDate || '9999-12-31')) ||
                       (!organizationStartDate && !organizationEndDate);
            });
            
            // Clip ranges to organization boundaries if needed
            newUnavailableDates = newUnavailableDates.map(range => {
                let startDate = range.startDate;
                let endDate = range.endDate;
                
                if (organizationStartDate && startDate < organizationStartDate) {
                    startDate = organizationStartDate;
                }
                if (organizationEndDate && endDate > organizationEndDate) {
                    endDate = organizationEndDate;
                }
                
                return { startDate, endDate };
            }).filter(range => range.startDate <= range.endDate);
            
            if (onDatesChanged) {
                onDatesChanged(selectedPersonId, newUnavailableDates);
            }
        }
        
        isSelecting = false;
        selectionStart = null;
        selectionEnd = null;
    }

    function toggleAllStaffAvailability(startDate: Date, endDate: Date) {
        if (!allStaffAvailability || allStaffAvailability.size === 0) return;
        
        const dateStr = formatDateString(startDate);
        const unavailableCount = getUnavailableCountForDate(startDate);
        
        // Only allow bulk toggle in staff mode
        if (entityType !== "staff" || !allStaffAvailability || allStaffAvailability.size === 0) {
            return;
        }
        
        // Determine action: if all or some are unavailable, make all available; if all available, make all unavailable
        const shouldMakeUnavailable = unavailableCount === 0;
        
        // Update all staff members
        for (const [personId, dates] of allStaffAvailability.entries()) {
            const newRange: DateRange = {
                startDate: formatDateString(startDate),
                endDate: formatDateString(endDate)
            };
            
            let newUnavailableDates = [...dates];
            
            if (shouldMakeUnavailable) {
                // Add this range to unavailable dates
                newUnavailableDates.push(newRange);
                newUnavailableDates = mergeOverlappingRanges(newUnavailableDates);
            } else {
                // Remove this range from unavailable dates
                newUnavailableDates = removeRangeFromDates(newUnavailableDates, newRange);
            }
            
            // Filter out weekends if weekends unavailable
            newUnavailableDates = filterWeekendsFromRanges(newUnavailableDates);
            
            // Filter out dates outside organization date range
            newUnavailableDates = newUnavailableDates.filter(range => {
                const rangeStart = range.startDate;
                const rangeEnd = range.endDate;
                // Keep range if at least part of it is within org range
                return isDateInOrgRange(rangeStart) || isDateInOrgRange(rangeEnd) ||
                       (organizationStartDate && rangeEnd >= organizationStartDate && rangeStart <= (organizationEndDate || '9999-12-31')) ||
                       (!organizationStartDate && !organizationEndDate);
            });
            
            // Clip ranges to organization boundaries if needed
            newUnavailableDates = newUnavailableDates.map(range => {
                let startDate = range.startDate;
                let endDate = range.endDate;
                
                if (organizationStartDate && startDate < organizationStartDate) {
                    startDate = organizationStartDate;
                }
                if (organizationEndDate && endDate > organizationEndDate) {
                    endDate = organizationEndDate;
                }
                
                return { startDate, endDate };
            }).filter(range => range.startDate <= range.endDate);
            
            // Call onDatesChanged for each person
            if (onDatesChanged) {
                onDatesChanged(personId, newUnavailableDates);
            }
        }
    }

    function removeRangeFromDates(dates: DateRange[], rangeToRemove: DateRange): DateRange[] {
        const result: DateRange[] = [];
        const removeStart = rangeToRemove.startDate;
        const removeEnd = rangeToRemove.endDate;
        
        for (const range of dates) {
            const rangeStart = range.startDate;
            const rangeEnd = range.endDate;
            
            // If ranges don't overlap, keep the original
            if (rangeEnd < removeStart || rangeStart > removeEnd) {
                result.push(range);
                continue;
            }
            
            // If there's a part before the removed range
            if (rangeStart < removeStart) {
                // Calculate previous day as string (YYYY-MM-DD)
                const removeStartDate = new Date(removeStart + 'T12:00:00'); // Use noon to avoid timezone issues
                removeStartDate.setDate(removeStartDate.getDate() - 1);
                const endBeforeRemove = formatDateString(removeStartDate);
                
                if (endBeforeRemove >= rangeStart) {
                    result.push({
                        startDate: rangeStart,
                        endDate: endBeforeRemove
                    });
                }
            }
            
            // If there's a part after the removed range
            if (rangeEnd > removeEnd) {
                // Calculate next day as string (YYYY-MM-DD)
                const removeEndDate = new Date(removeEnd + 'T12:00:00'); // Use noon to avoid timezone issues
                removeEndDate.setDate(removeEndDate.getDate() + 1);
                const startAfterRemove = formatDateString(removeEndDate);
                
                if (startAfterRemove <= rangeEnd) {
                    result.push({
                        startDate: startAfterRemove,
                        endDate: rangeEnd
                    });
                }
            }
        }
        
        return result;
    }

    function mergeOverlappingRanges(ranges: DateRange[]): DateRange[] {
        if (ranges.length === 0) return [];
        
        const sorted = [...ranges].sort((a, b) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        
        const merged: DateRange[] = [sorted[0]];
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            
            const lastEnd = new Date(last.endDate);
            const currentStart = new Date(current.startDate);
            
            lastEnd.setDate(lastEnd.getDate() + 1);
            if (currentStart <= lastEnd) {
                const currentEnd = new Date(current.endDate);
                const mergedEnd = new Date(last.endDate);
                if (currentEnd > mergedEnd) {
                    last.endDate = current.endDate;
                }
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }

    function filterWeekendsFromRanges(ranges: DateRange[]): DateRange[] {
        if (!weekendsUnavailable || ranges.length === 0) return ranges;
        
        const result: DateRange[] = [];
        
        for (const range of ranges) {
            const startParts = range.startDate.split('-');
            const endParts = range.endDate.split('-');
            const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
            const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
            
            const nonWeekendDates: string[] = [];
            const currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                if (!isWeekend(currentDate)) {
                    nonWeekendDates.push(formatDateString(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Group consecutive non-weekend dates into ranges
            if (nonWeekendDates.length > 0) {
                let rangeStart = nonWeekendDates[0];
                let rangeEnd = nonWeekendDates[0];
                
                for (let i = 1; i < nonWeekendDates.length; i++) {
                    const current = nonWeekendDates[i];
                    const prev = nonWeekendDates[i - 1];
                    const currentDate = new Date(current + 'T12:00:00');
                    const prevDate = new Date(prev + 'T12:00:00');
                    prevDate.setDate(prevDate.getDate() + 1);
                    
                    if (currentDate.getTime() === prevDate.getTime()) {
                        // Consecutive date, extend range
                        rangeEnd = current;
                    } else {
                        // Gap found, save current range and start new one
                        result.push({ startDate: rangeStart, endDate: rangeEnd });
                        rangeStart = current;
                        rangeEnd = current;
                    }
                }
                
                // Add the last range
                result.push({ startDate: rangeStart, endDate: rangeEnd });
            }
        }
        
        return mergeOverlappingRanges(result);
    }

    function isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    }

    function getUnavailableCountForDate(date: Date): number {
        const dateStr = formatDateString(date);
        
        // Don't count dates outside organization range
        if (!isDateInOrgRange(dateStr)) {
            return 0;
        }
        
        // Don't show counts for weekends when weekends are marked unavailable
        if (weekendsUnavailable && isWeekend(date)) {
            return 0;
        }
        
        if (!allStaffAvailability || allStaffAvailability.size === 0) return 0;
        
        let count = 0;
        
        for (const [personId, dates] of allStaffAvailability.entries()) {
            for (const range of dates) {
                if (dateStr >= range.startDate && dateStr <= range.endDate) {
                    count++;
                    break; // Count each person only once per date
                }
            }
        }
        
        return count;
    }

    function getUnavailablePersonNamesForDate(date: Date): string[] {
        if (!allStaffAvailability || !staffNames || allStaffAvailability.size === 0) return [];
        
        const dateStr = formatDateString(date);
        
        // Don't show names for dates outside organization range
        if (!isDateInOrgRange(dateStr)) {
            return [];
        }
        
        const names: string[] = [];
        
        for (const [personId, dates] of allStaffAvailability.entries()) {
            for (const range of dates) {
                if (dateStr >= range.startDate && dateStr <= range.endDate) {
                    const name = staffNames.get(personId);
                    if (name) {
                        names.push(name);
                    }
                    break; // Count each person only once per date
                }
            }
        }
        
        return names;
    }

    function getAvailabilityStatusClass(date: Date): string {
        // Only apply availability status classes when showing counts (staff mode, no person selected)
        if (selectedPersonId || entityType !== "staff" || !allStaffAvailability || allStaffAvailability.size === 0) {
            return "";
        }
        
        const dateStr = formatDateString(date);
        
        // Don't apply status classes to dates outside organization range
        if (!isDateInOrgRange(dateStr)) {
            return "";
        }
        
        // Don't apply status classes to weekends when weekends are marked unavailable
        if (weekendsUnavailable && isWeekend(date)) {
            return "";
        }
        
        const unavailableCount = getUnavailableCountForDate(date);
        
        if (unavailableCount === 0) {
            return " all-available";
        } else if (unavailableCount === totalStaff) {
            return " all-unavailable";
        } else {
            return " partial-availability";
        }
    }

    function getDayClasses(date: Date, monthDate: Date): string {
        let classes = "calendar-day";
        
        if (!isDateInMonth(date, monthDate)) {
            classes += " other-month";
        }
        
        if (isToday(date)) {
            classes += " today";
        }
        
        // If weekends are marked unavailable, make them gray and disabled
        // Note: isDateInMonth check will be done in template
        if (weekendsUnavailable && isWeekend(date)) {
            classes += " weekend-unavailable";
        }
        
        // Individual calendar: add available/unavailable classes (for selected person or patient)
        if (selectedPersonId || entityType === "patient") {
            const dateStr = formatDateString(date);
            if (!isDateInOrgRange(dateStr)) {
                // Outside org range - don't show as available or unavailable
                classes += " disabled outside-org-range";
            } else if (isDateUnavailable(date)) {
                classes += " unavailable";
            } else {
                classes += " available";
            }
        } else if (!selectedPersonId && entityType === "staff") {
            // Add availability status class when showing counts (staff mode, no selection)
            classes += getAvailabilityStatusClass(date);
        }
        
        // Don't disable if showing counts
        if (!selectedPersonId && !allStaffAvailability) {
            classes += " disabled";
        }
        
        // Add disabled class for dates outside organization range
        const dateStr = formatDateString(date);
        if (!isDateInOrgRange(dateStr)) {
            classes += " disabled outside-org-range";
        }
        
        return classes;
    }

    // Check if a date is within the organization's valid date range
    function isDateInOrgRange(dateStr: string): boolean {
        // If no start date is set, it means forever to the past
        if (organizationStartDate && dateStr < organizationStartDate) {
            return false;
        }
        // If no end date is set, it means forever to the future
        if (organizationEndDate && dateStr > organizationEndDate) {
            return false;
        }
        return true;
    }

    function canClickDate(date: Date): boolean {
        // Can't click dates outside organization date range
        const dateStr = formatDateString(date);
        if (!isDateInOrgRange(dateStr)) {
            return false;
        }
        // Can't click if weekends unavailable and it's a weekend
        if (weekendsUnavailable && isWeekend(date)) {
            return false;
        }
        // Can click if person selected OR if showing all staff (for bulk toggle)
        return true;
    }

    let visibleMonths = $derived(getVisibleMonths());
    
    // Helper to determine if we should show day numbers (for counts view)
    function shouldShowDayNumber(): boolean {
        // Show day numbers only in staff mode when no person is selected (showing counts)
        return !selectedPersonId && entityType === "staff";
    }
    
    // Helper to determine if we should show day number in top left (for person view)
    function shouldShowDayNumberInPersonView(): boolean {
        // Show day number in top left when person is selected or in patient mode
        return (selectedPersonId !== null && selectedPersonId !== undefined) || entityType === "patient";
    }
    
    // Helper to determine if we should show unavailable count
    function shouldShowUnavailableCount(): boolean {
        // Show counts only in staff mode when no person is selected
        return !selectedPersonId && entityType === "staff";
    }
</script>

<div class="availability-calendar">
    <h3 class="calendar-title">Availability Calendar</h3>
    
    <div class="calendar-toolbar">
        <div class="nav-buttons">
            <button type="button" class="nav-button" onclick={previousMonth}>
                <IconChevronUp size={24} />
            </button>
            <button type="button" class="nav-button" onclick={nextMonth}>
                <IconChevronDown size={24} />
            </button>
        </div>
        <label class="weekends-checkbox-header">
            <input type="checkbox" bind:checked={weekendsUnavailable} />
            <span>Weekends Unavailable</span>
        </label>
    </div>

    <div class="calendar-months">
        {#each visibleMonths as monthDate (monthDate.getTime())}
            {@const monthDays = getMonthDays(monthDate)}
            <div class="month-section">
                <h4 class="month-header">
                    {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                </h4>
                <div class="calendar-grid">
                    <div class="day-names">
                        {#each dayNames as dayName}
                            <div class="day-name">{dayName}</div>
                        {/each}
                    </div>
                    
                    <div 
                        class="days-grid"
                        role="grid"
                        tabindex="0"
                        onmouseup={onDateMouseUp}
                        onmouseleave={() => { if (isSelecting) onDateMouseUp(); }}
                    >
                        {#each monthDays as date (date.getTime())}
                            {#if isDateInMonth(date, monthDate)}
                                {@const dayClasses = getDayClasses(date, monthDate)}
                                {@const unavailableCount = shouldShowUnavailableCount() ? getUnavailableCountForDate(date) : 0}
                                {@const showUnavailableCount = shouldShowUnavailableCount() && unavailableCount > 0}
                                {@const unavailableNames = shouldShowUnavailableCount() ? getUnavailablePersonNamesForDate(date) : []}
                                <div 
                                    class={dayClasses}
                                    role="gridcell"
                                    tabindex="0"
                                    onmousedown={() => onDateMouseDown(date)}
                                    onmouseenter={(e) => {
                                        onDateMouseEnter(date);
                                        if (unavailableNames.length > 0) {
                                            // Clear any existing timeout
                                            if (tooltipTimeout) {
                                                clearTimeout(tooltipTimeout);
                                            }
                                            // Set position immediately but delay showing
                                            tooltipPosition = { x: e.clientX, y: e.clientY };
                                            tooltipDate = date;
                                            tooltipTimeout = setTimeout(() => {
                                                tooltipVisible = true;
                                            }, 500); // 500ms delay
                                        }
                                    }}
                                    onmousemove={(e) => {
                                        if (unavailableNames.length > 0 && !tooltipVisible) {
                                            // Only update position if tooltip isn't visible yet
                                            tooltipPosition = { x: e.clientX, y: e.clientY };
                                        }
                                    }}
                                    onmouseleave={() => {
                                        if (tooltipTimeout) {
                                            clearTimeout(tooltipTimeout);
                                            tooltipTimeout = null;
                                        }
                                        tooltipVisible = false;
                                        tooltipDate = null;
                                    }}
                                >
                                    {#if shouldShowDayNumberInPersonView()}
                                        <span class="day-number">{date.getDate()}</span>
                                    {:else if shouldShowDayNumber()}
                                        <span class="day-number">{date.getDate()}</span>
                                    {/if}
                                    {#if showUnavailableCount}
                                        <span class="unavailable-count-centered">{unavailableCount}</span>
                                    {/if}
                                </div>
                            {:else}
                                <div class="calendar-day-empty"></div>
                            {/if}
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>
    
    {#if tooltipVisible && tooltipDate}
        {@const unavailableNames = shouldShowUnavailableCount() ? getUnavailablePersonNamesForDate(tooltipDate) : []}
        {#if unavailableNames.length > 0}
            <div 
                class="day-tooltip"
                style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
            >
                <div class="tooltip-content">
                    <div class="tooltip-date">{tooltipDate.getDate()}-{monthNames[tooltipDate.getMonth()].substring(0, 3)}</div>
                    <div class="tooltip-names-list">
                        {#each unavailableNames as name}
                            <div class="tooltip-name">{name}</div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    {/if}
    
    <div class="calendar-footer">
        <div class="calendar-legend">
            <div class="legend-item">
                <span class="legend-color available"></span>
                <span>{selectedPersonId ? 'Available' : 'All Available'}</span>
            </div>
            <div class="legend-item">
                <span class="legend-color unavailable"></span>
                <span>Unavailable</span>
            </div>
        </div>
    </div>
</div>
