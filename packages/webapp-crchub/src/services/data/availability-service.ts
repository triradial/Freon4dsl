/**
 * Availability Service
 * Manages staff availability data for facilities
 * Stores data in a UI-friendly format: staff member -> list of unavailable date ranges
 */

export interface DateRange {
    startDate: string; // ISO date format YYYY-MM-DD
    endDate: string;   // ISO date format YYYY-MM-DD
}

export interface StaffAvailability {
    personId: string;
    personName: string;
    unavailableDates: DateRange[]; // List of date ranges when staff is NOT available
}

export interface FacilityAvailabilityData {
    studyId: string;
    organizationId: string;
    totalStaff: number;
    staffAvailability: StaffAvailability[];
}

/**
 * Calculate the number of staff available for each date range
 * Returns a map of date ranges to staff counts
 */
export function calculateStaffLevelsFromAvailability(
    totalStaff: number,
    staffAvailability: StaffAvailability[]
): Map<string, { count: number; dateRange: DateRange }> {
    if (totalStaff === 0) {
        return new Map();
    }

    // Collect all date ranges and events
    interface DateEvent {
        date: Date;
        personId: string;
        type: 'start' | 'end'; // start of unavailability or end
    }

    const events: DateEvent[] = [];

    for (const staff of staffAvailability) {
        for (const range of staff.unavailableDates) {
            // Parse dates as local dates to avoid timezone issues
            const startParts = range.startDate.split('-');
            const endParts = range.endDate.split('-');
            const startDate = new Date(
                parseInt(startParts[0]), 
                parseInt(startParts[1]) - 1, 
                parseInt(startParts[2])
            );
            const endDate = new Date(
                parseInt(endParts[0]), 
                parseInt(endParts[1]) - 1, 
                parseInt(endParts[2])
            );
            
            events.push({
                date: startDate,
                personId: staff.personId,
                type: 'start'
            });
            // End event is the day after the last unavailable day
            const endDatePlusOne = new Date(endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            events.push({
                date: endDatePlusOne,
                personId: staff.personId,
                type: 'end'
            });
        }
    }

    // Sort events by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log('[calculateStaffLevels] Total events:', events.length);
    console.log('[calculateStaffLevels] Events:', events.map(e => ({
        date: formatDate(e.date),
        personId: e.personId.substring(0, 8),
        type: e.type
    })));

    // Track which staff are currently unavailable
    const currentlyUnavailable = new Set<string>();
    const staffLevels = new Map<string, { count: number; dateRange: DateRange }>();

    let currentRangeStart: Date | null = null;
    let currentAvailableCount = totalStaff;

    // Helper function to close the current range
    const closeCurrentRange = (endDate: Date) => {
        if (currentRangeStart !== null && currentAvailableCount < totalStaff) {
            const rangeEnd = new Date(endDate);
            rangeEnd.setDate(rangeEnd.getDate() - 1);
            
            // Only add if the range is valid (end >= start)
            if (rangeEnd >= currentRangeStart) {
                const key = `${formatDate(currentRangeStart)}_${formatDate(rangeEnd)}`;
                const unavailableCount = totalStaff - currentAvailableCount;
                console.log(`[calculateStaffLevels] Creating range: ${formatDate(currentRangeStart)} to ${formatDate(rangeEnd)}, available: ${currentAvailableCount}, unavailable: ${unavailableCount}`);
                staffLevels.set(key, {
                    count: currentAvailableCount,
                    dateRange: {
                        startDate: formatDate(currentRangeStart),
                        endDate: formatDate(rangeEnd)
                    }
                });
            }
        }
    };

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0); // Normalize to start of day

        if (event.type === 'start') {
            // Before this person becomes unavailable, close the current range if it exists
            closeCurrentRange(eventDate);

            // Person becomes unavailable
            currentlyUnavailable.add(event.personId);
            const newAvailableCount = totalStaff - currentlyUnavailable.size;
            
            console.log(`[calculateStaffLevels] Start event on ${formatDate(eventDate)}: person ${event.personId.substring(0, 8)} becomes unavailable. Available: ${newAvailableCount}/${totalStaff}`);
            
            // If we're starting a new period of reduced availability
            if (newAvailableCount < totalStaff) {
                currentAvailableCount = newAvailableCount;
                currentRangeStart = eventDate;
            }

        } else if (event.type === 'end') {
            // Before this person becomes available again, close the current range
            closeCurrentRange(eventDate);

            // Person becomes available
            currentlyUnavailable.delete(event.personId);
            const newAvailableCount = totalStaff - currentlyUnavailable.size;
            
            console.log(`[calculateStaffLevels] End event on ${formatDate(eventDate)}: person ${event.personId.substring(0, 8)} becomes available. Available: ${newAvailableCount}/${totalStaff}`);
            
            // If we still have reduced availability, start a new range
            if (newAvailableCount < totalStaff) {
                currentAvailableCount = newAvailableCount;
                currentRangeStart = eventDate;
            } else {
                // All staff are available again
                currentRangeStart = null;
                currentAvailableCount = totalStaff;
            }
        }
    }

    // Close any remaining range (if we ended with reduced availability)
    if (currentRangeStart !== null && currentAvailableCount < totalStaff) {
        // Use the last event date to close the range
        const finalDate = events.length > 0 
            ? new Date(events[events.length - 1].date)
            : new Date();
        closeCurrentRange(finalDate);
    }

    console.log('[calculateStaffLevels] Final staff levels before merging:', Array.from(staffLevels.values()).map(sl => 
        `${sl.dateRange.startDate} to ${sl.dateRange.endDate}: ${sl.count} available (${totalStaff - sl.count} unavailable)`
    ));

    // Merge consecutive ranges with the same available count
    const mergedLevels = mergeConsecutiveRanges(Array.from(staffLevels.values()));
    
    console.log('[calculateStaffLevels] Final staff levels after merging:', mergedLevels.map(sl => 
        `${sl.dateRange.startDate} to ${sl.dateRange.endDate}: ${sl.count} available (${totalStaff - sl.count} unavailable)`
    ));

    // Convert back to Map
    const mergedMap = new Map<string, { count: number; dateRange: DateRange }>();
    for (const level of mergedLevels) {
        const key = `${level.dateRange.startDate}_${level.dateRange.endDate}`;
        mergedMap.set(key, level);
    }

    return mergedMap;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Merge consecutive date ranges with the same available count
 */
function mergeConsecutiveRanges(levels: Array<{ count: number; dateRange: DateRange }>): Array<{ count: number; dateRange: DateRange }> {
    if (levels.length === 0) return [];
    
    // Sort by start date, then by end date
    const sorted = [...levels].sort((a, b) => {
        const startCompare = a.dateRange.startDate.localeCompare(b.dateRange.startDate);
        if (startCompare !== 0) return startCompare;
        return a.dateRange.endDate.localeCompare(b.dateRange.endDate);
    });
    
    const merged: Array<{ count: number; dateRange: DateRange }> = [{ ...sorted[0] }];
    
    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];
        
        // Parse dates to compare properly
        const lastEndParts = last.dateRange.endDate.split('-');
        const currentStartParts = current.dateRange.startDate.split('-');
        const lastEnd = new Date(
            parseInt(lastEndParts[0]), 
            parseInt(lastEndParts[1]) - 1, 
            parseInt(lastEndParts[2])
        );
        const currentStart = new Date(
            parseInt(currentStartParts[0]), 
            parseInt(currentStartParts[1]) - 1, 
            parseInt(currentStartParts[2])
        );
        
        // Calculate the day after last range ends
        const dayAfterLastEnd = new Date(lastEnd);
        dayAfterLastEnd.setDate(dayAfterLastEnd.getDate() + 1);
        
        // Check if ranges are consecutive (current starts the day after last ends) and have the same count
        const dayAfterLastEndStr = formatDate(dayAfterLastEnd);
        const currentStartStr = current.dateRange.startDate;
        
        if (last.count === current.count && dayAfterLastEndStr === currentStartStr) {
            // Merge: extend the last range to include current range
            last.dateRange.endDate = current.dateRange.endDate;
        } else {
            // Start a new range (create a copy to avoid reference issues)
            merged.push({ ...current });
        }
    }
    
    return merged;
}

/**
 * Format date as YYYY-MM-DD (exported version)
 */
export function formatDateString(date: Date): string {
    return formatDate(date);
}

/**
 * Calculate availability summary for each day in a given range
 * Returns a map of date -> { available: number, unavailable: number }
 */
export function calculateDailyAvailability(
    startDate: Date,
    endDate: Date,
    totalStaff: number,
    staffAvailability: StaffAvailability[]
): Map<string, { available: number; unavailable: number }> {
    const dailyAvailability = new Map<string, { available: number; unavailable: number }>();

    // Iterate through each day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        let unavailableCount = 0;

        // Check each staff member
        for (const staff of staffAvailability) {
            for (const range of staff.unavailableDates) {
                const rangeStart = new Date(range.startDate);
                const rangeEnd = new Date(range.endDate);
                if (currentDate >= rangeStart && currentDate <= rangeEnd) {
                    unavailableCount++;
                    break; // Staff can only be counted once per day
                }
            }
        }

        dailyAvailability.set(dateStr, {
            available: totalStaff - unavailableCount,
            unavailable: unavailableCount
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyAvailability;
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateStr: string): Date {
    return new Date(dateStr);
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
    const dateTime = date.getTime();
    const startTime = new Date(range.startDate).getTime();
    const endTime = new Date(range.endDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
}

/**
 * Merge overlapping or adjacent date ranges for a single staff member
 */
export function mergeRanges(ranges: DateRange[]): DateRange[] {
    if (ranges.length === 0) return [];

    // Sort by start date
    const sorted = [...ranges].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const merged: DateRange[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];
        
        const lastEnd = new Date(last.endDate);
        const currentStart = new Date(current.startDate);
        
        // Check if ranges overlap or are adjacent (within 1 day)
        lastEnd.setDate(lastEnd.getDate() + 1);
        if (currentStart <= lastEnd) {
            // Merge ranges
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

