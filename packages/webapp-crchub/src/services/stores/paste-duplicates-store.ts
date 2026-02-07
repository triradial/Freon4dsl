/**
 * Paste Report Store
 *
 * Tracks and displays information about paste operations in the ListGroupComponent,
 * including duplicate items that were skipped and error conditions.
 */

import { writable, type Writable } from 'svelte/store';

export type PasteReportType = 'duplicates' | 'error';

export interface PasteReport {
    type: PasteReportType;
    // For duplicates
    addedCount?: number;
    skippedItems?: string[];
    // For errors
    errorTitle?: string;
    errorMessage?: string;
    timestamp: Date;
}

// Store for the most recent paste report
export const lastPasteReport: Writable<PasteReport | null> = writable(null);

// Store to control popup visibility
export const showPasteReportPopup: Writable<boolean> = writable(false);

/**
 * Show the paste duplicates popup with the given report.
 */
export function showPasteDuplicatesReport(addedCount: number, skippedItems: string[]): void {
    if (skippedItems.length > 0) {
        lastPasteReport.set({
            type: 'duplicates',
            addedCount,
            skippedItems,
            timestamp: new Date()
        });
        showPasteReportPopup.set(true);
    }
}

/**
 * Show a paste error message.
 */
export function showPasteError(title: string, message: string): void {
    lastPasteReport.set({
        type: 'error',
        errorTitle: title,
        errorMessage: message,
        timestamp: new Date()
    });
    showPasteReportPopup.set(true);
}

/**
 * Clear the current report and hide the popup.
 */
export function clearPasteReport(): void {
    lastPasteReport.set(null);
    showPasteReportPopup.set(false);
}
