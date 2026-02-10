/**
 * Test utilities for PatientTimelineSection tests
 * Following the same patterns as packages/languages/study-configuration/src/custom/__tests__/Utils.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Type definitions matching PatientTimelineSection.svelte interfaces
export interface PatientRecord {
    id: string;
    patientNumber: string;
    initials?: string;
}

export interface DayRenderingInfo {
    isWindow: boolean;
    event: any | null;
    state: string;
    isActual: boolean;
    eventType: string;
    isUnscheduledEvent: boolean;
}

export interface PatientDayEvent {
    id?: string;
    name: string;
    type: 'actual-event' | 'scheduled-event' | 'unscheduled-event';
    category?: 'initial' | 'scheduled' | 'unscheduled'; // Event origin category
    state: 'on-scheduled-date' | 'in-window' | 'out-of-window';
    status?: 'completed' | 'planned' | 'cancelled' | 'missed';
    isUnscheduledEvent?: boolean;
    window?: {
        daysAfter: number;
        daysBefore: number;
    };
    actualDay?: number;
    scheduledDay?: number;
    originalScheduledDay?: number;
}

export interface PatientDayData {
    day: number;
    date: string;
    events?: PatientDayEvent[];
    windows?: Array<{ eventId: string; eventName: string }>;
    isWindow?: boolean;  // Legacy flag
    available?: boolean;
}

export interface PatientData {
    patientId: string;
    referenceDate: string;
    days: PatientDayData[];
}

export interface PatientCentricData {
    initialDayNumber: number;
    patients: PatientData[];
}

// ========================================
// Patient Record Builders
// ========================================

/**
 * Create a patient record for testing
 */
export function createPatientRecord(id: string, patientNumber: string, initials?: string): PatientRecord {
    return { id, patientNumber, initials };
}

// ========================================
// DayRenderingInfo Builders
// ========================================

/**
 * Create a default DayRenderingInfo with optional overrides
 */
export function createDayRenderingInfo(overrides: Partial<DayRenderingInfo> = {}): DayRenderingInfo {
    return {
        isWindow: false,
        event: null,
        state: '',
        isActual: false,
        eventType: '',
        isUnscheduledEvent: false,
        ...overrides
    };
}

/**
 * Create a DayRenderingInfo for a scheduled event
 */
export function createScheduledDayRenderingInfo(state: string = 'on-scheduled-date', event?: any): DayRenderingInfo {
    return createDayRenderingInfo({
        event: event || null,
        state,
        isActual: false,
        eventType: 'scheduled-event',
        isUnscheduledEvent: false
    });
}

/**
 * Create a DayRenderingInfo for an actual (completed) event
 */
export function createActualDayRenderingInfo(state: string = 'on-scheduled-date', event?: any): DayRenderingInfo {
    return createDayRenderingInfo({
        event: event || null,
        state,
        isActual: true,
        eventType: 'actual-event',
        isUnscheduledEvent: false
    });
}

/**
 * Create a DayRenderingInfo for a window day (no event, just window indicator)
 */
export function createWindowDayRenderingInfo(): DayRenderingInfo {
    return createDayRenderingInfo({
        isWindow: true,
        event: null,
        state: '',
        isActual: false,
        eventType: '',
        isUnscheduledEvent: false
    });
}

/**
 * Create a DayRenderingInfo for an unscheduled event
 */
export function createUnscheduledDayRenderingInfo(state: string = 'on-scheduled-date', event?: any): DayRenderingInfo {
    return createDayRenderingInfo({
        event: event || null,
        state,
        isActual: false,
        eventType: 'unscheduled-event',
        isUnscheduledEvent: true
    });
}

// ========================================
// PatientDayData Builders
// ========================================

/**
 * Create patient day data with a scheduled event
 */
export function createScheduledEventDayData(day: number, date: string, eventName: string, state: string = 'on-scheduled-date'): PatientDayData {
    return {
        day,
        date,
        events: [{
            id: `${eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
            name: eventName,
            type: 'scheduled-event',
            category: 'scheduled',
            state: state as any,
            status: 'planned',
            scheduledDay: day
        }]
    };
}

/**
 * Create patient day data with an actual (completed) event
 */
export function createActualEventDayData(
    day: number, 
    date: string, 
    eventName: string, 
    scheduledDay: number,
    state?: string
): PatientDayData {
    // Compute state based on difference between actual and scheduled if not provided
    const shift = day - scheduledDay;
    const computedState = state || (shift === 0 ? 'on-scheduled-date' : (Math.abs(shift) <= 2 ? 'in-window' : 'out-of-window'));
    
    return {
        day,
        date,
        events: [{
            id: `${eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
            name: eventName,
            type: 'actual-event',
            category: 'scheduled',
            state: computedState as any,
            status: 'completed',
            actualDay: day,
            scheduledDay
        }]
    };
}

/**
 * Create patient day data for a window day (no events)
 */
export function createWindowDayData(day: number, date: string, eventId: string, eventName: string): PatientDayData {
    return {
        day,
        date,
        windows: [{
            eventId,
            eventName
        }]
    };
}

/**
 * Create patient day data for a window day using legacy isWindow flag
 */
export function createLegacyWindowDayData(day: number, date: string): PatientDayData {
    return {
        day,
        date,
        isWindow: true
    };
}

/**
 * Create patient day data with a cancelled event
 */
export function createCancelledEventDayData(day: number, date: string, eventName: string): PatientDayData {
    return {
        day,
        date,
        events: [{
            id: `${eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
            name: eventName,
            type: 'actual-event',
            category: 'scheduled',
            state: 'on-scheduled-date',
            status: 'cancelled',
            actualDay: day,
            scheduledDay: day
        }]
    };
}

/**
 * Create patient day data with a missed event
 */
export function createMissedEventDayData(day: number, date: string, eventName: string): PatientDayData {
    return {
        day,
        date,
        events: [{
            id: `${eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
            name: eventName,
            type: 'actual-event',
            category: 'scheduled',
            state: 'on-scheduled-date',
            status: 'missed',
            actualDay: day,
            scheduledDay: day
        }]
    };
}

/**
 * Create patient day data with an unscheduled event
 */
export function createUnscheduledEventDayData(day: number, date: string, eventName: string): PatientDayData {
    return {
        day,
        date,
        events: [{
            id: `${eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
            name: eventName,
            type: 'unscheduled-event',
            category: 'unscheduled',
            state: 'on-scheduled-date',
            status: 'completed',
            isUnscheduledEvent: true,
            actualDay: day
        }]
    };
}

/**
 * Create empty patient day data (no events, no windows)
 */
export function createEmptyDayData(day: number, date: string): PatientDayData {
    return {
        day,
        date
    };
}

// ========================================
// Complete Patient Data Builders
// ========================================

/**
 * Create a complete patient data structure
 */
export function createPatientData(patientId: string, referenceDate: string, days: PatientDayData[]): PatientData {
    return {
        patientId,
        referenceDate,
        days
    };
}

/**
 * Create a patient-centric data structure with multiple patients
 */
export function createPatientCentricData(initialDayNumber: number, patients: PatientData[]): PatientCentricData {
    return {
        initialDayNumber,
        patients
    };
}

// ========================================
// File Utilities (for fixture-based testing)
// ========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load expected rendering data from a fixture file
 */
export function loadExpectedRenderingData(scenarioName: string): any {
    const dataPath = path.join(__dirname, "data", `expected-rendering-${scenarioName}.json`);
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Expected rendering data file not found: ${dataPath}`);
    }
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

/**
 * Load patient test data from a fixture file
 */
export function loadPatientTestData(fileName: string): PatientCentricData {
    const dataPath = path.join(__dirname, "data", fileName);
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Patient test data file not found: ${dataPath}`);
    }
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

/**
 * Save test data to a file (for generating fixtures during test development)
 */
export function saveTestData(fileName: string, data: any): void {
    const dataPath = path.join(__dirname, "data", fileName);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

// ========================================
// Date Utilities
// ========================================

/**
 * Format a date as YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get date from a reference date and day offset
 */
export function getDateFromDayOffset(referenceDate: string, dayOffset: number): string {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + dayOffset);
    return formatDateString(date);
}

/**
 * Create a series of dates starting from a reference date
 */
export function createDateSeries(referenceDate: string, days: number[]): string[] {
    return days.map(day => getDateFromDayOffset(referenceDate, day));
}
