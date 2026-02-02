/**
 * Schema Mismatch Tracker
 * 
 * Captures and tracks schema mismatches that occur during model deserialization.
 * Since we can't modify the core FreLionwebSerializer, this service intercepts
 * console output during model loading to capture error messages about unknown
 * properties, concepts, and unresolved children.
 * 
 * These mismatches are expected when loading models created with older schema versions.
 * The tracker allows the UI to display these to the user so they understand what
 * data may not have been loaded.
 */

import { writable, type Writable } from 'svelte/store';

export interface SchemaMismatch {
    type: 'unknown_property' | 'unknown_concept' | 'unresolved_child' | 'other';
    message: string;
    details?: string;
}

export interface ModelLoadReport {
    modelName: string;
    unitName: string;
    timestamp: Date;
    mismatches: SchemaMismatch[];
    loadedSuccessfully: boolean;
}

// Store for the most recent load report
export const lastLoadReport: Writable<ModelLoadReport | null> = writable(null);

// Store to control popup visibility
export const showMismatchPopup: Writable<boolean> = writable(false);

class SchemaMismatchTracker {
    private isCapturing: boolean = false;
    private capturedMismatches: SchemaMismatch[] = [];
    private originalConsoleLog: typeof console.log | null = null;
    private currentModelName: string = '';
    private currentUnitName: string = '';

    /**
     * Start capturing console output to detect schema mismatches.
     * Call this before loading a model unit.
     */
    startCapturing(modelName: string, unitName: string): void {
        if (this.isCapturing) {
            this.stopCapturing();
        }

        this.isCapturing = true;
        this.capturedMismatches = [];
        this.currentModelName = modelName;
        this.currentUnitName = unitName;

        // Intercept console.log to capture FreLionwebSerializer error messages
        this.originalConsoleLog = console.log;
        console.log = (...args: any[]) => {
            // Call the original console.log
            this.originalConsoleLog?.apply(console, args);

            // Check if this is a FreLionwebSerializer error message
            this.parseConsoleOutput(args);
        };
    }

    /**
     * Stop capturing and generate a report of any mismatches found.
     * @param showPopupImmediately - If true, show the popup immediately. If false, call showReport() later.
     */
    stopCapturing(showPopupImmediately: boolean = true): ModelLoadReport {
        if (this.originalConsoleLog) {
            console.log = this.originalConsoleLog;
            this.originalConsoleLog = null;
        }

        // Deduplicate mismatches by message
        const uniqueMismatches = this.deduplicateMismatches(this.capturedMismatches);

        const report: ModelLoadReport = {
            modelName: this.currentModelName,
            unitName: this.currentUnitName,
            timestamp: new Date(),
            mismatches: uniqueMismatches,
            loadedSuccessfully: true // Assume success unless explicitly failed
        };

        this.isCapturing = false;
        this.capturedMismatches = [];

        // Update the store with the report if requested
        if (showPopupImmediately && report.mismatches.length > 0) {
            lastLoadReport.set(report);
            showMismatchPopup.set(true);
        }

        return report;
    }
    
    /**
     * Show the mismatch popup with the given report.
     * Use this after calling stopCapturing(false) to show the popup at a later time.
     */
    showReport(report: ModelLoadReport): void {
        if (report.mismatches.length > 0) {
            lastLoadReport.set(report);
            showMismatchPopup.set(true);
        }
    }
    
    /**
     * Remove duplicate mismatches based on message content.
     */
    private deduplicateMismatches(mismatches: SchemaMismatch[]): SchemaMismatch[] {
        const seen = new Set<string>();
        const unique: SchemaMismatch[] = [];
        
        for (const mismatch of mismatches) {
            // Create a unique key from type and the core message (extract property/concept name)
            const key = `${mismatch.type}:${mismatch.message}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(mismatch);
            }
        }
        
        return unique;
    }

    /**
     * Safely convert a value to string, handling circular references.
     */
    private safeStringify(arg: any): string {
        if (typeof arg === 'string') {
            return arg;
        }
        if (arg === null) {
            return 'null';
        }
        if (arg === undefined) {
            return 'undefined';
        }
        if (typeof arg !== 'object') {
            return String(arg);
        }
        try {
            // Try simple stringify first - works for most cases
            return JSON.stringify(arg);
        } catch {
            // Handle circular references by returning a simple representation
            // This prevents the error from bubbling up and breaking model loading
            if (Array.isArray(arg)) {
                return `[Array(${arg.length})]`;
            }
            const constructorName = arg?.constructor?.name || 'Object';
            return `[${constructorName}]`;
        }
    }

    /**
     * Parse console output to detect schema mismatch error messages.
     */
    private parseConsoleOutput(args: any[]): void {
        if (!this.isCapturing || args.length === 0) return;

        // Convert args to string for pattern matching, safely handling circular references
        const message = args.map(arg => this.safeStringify(arg)).join(' ');

        // Check for FreLionwebSerializer error patterns
        // Pattern: ERROR: FreLionwebSerializer: NULL PROPERTY for key -key-...
        if (message.includes('ERROR:') && message.includes('FreLionwebSerializer')) {
            const mismatch = this.parseFreLionwebError(message);
            if (mismatch) {
                this.capturedMismatches.push(mismatch);
            }
        }
    }

    /**
     * Parse a FreLionwebSerializer error message into a structured mismatch object.
     */
    private parseFreLionwebError(message: string): SchemaMismatch | null {
        // Pattern: NULL PROPERTY for key -key-ConceptName-propertyName
        const nullPropertyMatch = message.match(/NULL PROPERTY for key ([^\s]+)/);
        if (nullPropertyMatch) {
            const key = nullPropertyMatch[1];
            const propertyName = this.extractPropertyName(key);
            return {
                type: 'unknown_property',
                message: `"${propertyName}" property removed`
            };
        }

        // Pattern: Unknown property: -key-... for concept -key-... ignored
        const unknownPropertyMatch = message.match(/Unknown property: ([^\s]+) for concept ([^\s]+)/);
        if (unknownPropertyMatch) {
            const propertyKey = unknownPropertyMatch[1];
            const propertyName = this.extractPropertyName(propertyKey);
            return {
                type: 'unknown_property',
                message: `"${propertyName}" property removed`
            };
        }

        // Pattern: Cannot read json 3: -key-ConceptName unknown
        const unknownConceptMatch = message.match(/Cannot read json \d+: ([^\s]+) unknown/);
        if (unknownConceptMatch) {
            const conceptKey = unknownConceptMatch[1];
            const conceptName = this.extractConceptName(conceptKey);
            return {
                type: 'unknown_concept',
                message: `"${conceptName}" element removed`
            };
        }

        // Pattern: Child cannot be resolved: ID-xxx
        const unresolvedChildMatch = message.match(/Child cannot be resolved: ([^\s]+)/);
        if (unresolvedChildMatch) {
            const childId = unresolvedChildMatch[1];
            return {
                type: 'unresolved_child',
                message: `Element "${childId}" removed (orphaned reference)`
            };
        }

        // Pattern: Unknown reference property
        const unknownRefMatch = message.match(/Unknown reference property: ([^\s]+) for concept ([^\s]+)/);
        if (unknownRefMatch) {
            const propertyKey = unknownRefMatch[1];
            const propertyName = this.extractPropertyName(propertyKey);
            return {
                type: 'unknown_property',
                message: `"${propertyName}" reference removed`
            };
        }

        // Generic FreLionwebSerializer error - skip these to avoid noise
        return null;
    }
    
    /**
     * Extract a clean property name from a key like "-key-ConceptName-propertyName"
     */
    private extractPropertyName(key: string): string {
        const parts = key.split('-').filter(p => p && p !== 'key');
        // Property name is typically the last part after concept name
        if (parts.length >= 2) {
            return parts[parts.length - 1];
        }
        return parts.length > 0 ? parts[0] : key;
    }
    
    /**
     * Extract a clean concept name from a key like "-key-ConceptName"
     */
    private extractConceptName(key: string): string {
        const parts = key.split('-').filter(p => p && p !== 'key');
        return parts.length > 0 ? parts[parts.length - 1] : key;
    }

    /**
     * Clear the current report and hide the popup.
     */
    clearReport(): void {
        lastLoadReport.set(null);
        showMismatchPopup.set(false);
    }

    /**
     * Get the current mismatches being captured (useful for debugging).
     */
    getCurrentMismatches(): SchemaMismatch[] {
        return [...this.capturedMismatches];
    }

    /**
     * Check if we're currently capturing.
     */
    isCurrentlyCapturing(): boolean {
        return this.isCapturing;
    }
}

// Export singleton instance
export const schemaMismatchTracker = new SchemaMismatchTracker();
