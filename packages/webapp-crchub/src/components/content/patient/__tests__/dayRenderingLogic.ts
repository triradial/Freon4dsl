/**
 * Extracted day rendering logic for testing
 * This mirrors the getDayRenderingInfo function from StudyPatients.svelte
 * 
 * The logic is extracted here so it can be unit tested independently of the Svelte component.
 */

import type { DayRenderingInfo, PatientDayData } from './Utils.js';

/**
 * Compute the rendering information for a day cell based on patient day data.
 * 
 * This function determines:
 * - Whether to show a window indicator
 * - What event (if any) should be displayed
 * - The state of the event (on-scheduled-date, in-window, out-of-window, canceled, missed)
 * - Whether the event is actual (completed) vs scheduled (planned)
 * - Whether the event is an unscheduled event
 * 
 * @param dayData - The patient day data for a specific day, or null if no data exists
 * @returns DayRenderingInfo object with all rendering decisions
 */
export function computeDayRenderingInfo(dayData: PatientDayData | null): DayRenderingInfo {
    // No data for this day - return empty rendering info
    if (!dayData) {
        return { 
            isWindow: false, 
            event: null, 
            state: '', 
            isActual: false, 
            eventType: '', 
            isUnscheduledEvent: false 
        };
    }
    
    // If it's a window day with no events (check both new windows array and legacy isWindow)
    if ((dayData.windows && dayData.windows.length > 0) || dayData.isWindow) {
        return { 
            isWindow: true, 
            event: null, 
            state: '', 
            isActual: false, 
            eventType: '', 
            isUnscheduledEvent: false 
        };
    }
    
    // Get the first event (unavailable days are now handled via available: false flag)
    const event = dayData.events && dayData.events.length > 0 ? dayData.events[0] : null;
    if (!event) {
        return { 
            isWindow: false, 
            event: null, 
            state: '', 
            isActual: false, 
            eventType: '', 
            isUnscheduledEvent: false 
        };
    }
    
    // Determine if it's actual based on event type
    const isActual = event.type === 'actual-event';
    const eventType = event.type || 'scheduled-event';
    
    // Check if event is an unscheduled event (via flag or type)
    const isUnscheduledEvent = event.isUnscheduledEvent === true || eventType === 'unscheduled-event';
    
    // Get state directly from event (already computed in data)
    let state = event.state || 'on-scheduled-date';
    
    // Handle cancelled/missed status with specific state values
    if (event.status === 'cancelled') {
        state = 'canceled-visit';
    } else if (event.status === 'missed') {
        state = 'missed-visit';
    }
    
    return { 
        isWindow: false, 
        event, 
        state, 
        isActual, 
        eventType, 
        isUnscheduledEvent 
    };
}

/**
 * Compute rendering info for all days in a patient's data
 * Useful for batch validation against expected fixtures
 * 
 * @param patientDays - Array of patient day data
 * @returns Map of day number to DayRenderingInfo
 */
export function computeAllDayRenderingInfo(patientDays: PatientDayData[]): Map<number, DayRenderingInfo> {
    const result = new Map<number, DayRenderingInfo>();
    
    for (const dayData of patientDays) {
        result.set(dayData.day, computeDayRenderingInfo(dayData));
    }
    
    return result;
}

/**
 * Check if a patient is unavailable on a given day
 * Based on the available flag in patient day data
 * 
 * @param dayData - The patient day data for a specific day
 * @returns true if patient is unavailable, false otherwise
 */
export function isPatientUnavailableOnDay(dayData: PatientDayData | null): boolean {
    if (!dayData) return false;
    return dayData.available === false;
}
