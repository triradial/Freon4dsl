/**
 * Performance Logger for Study Design
 * 
 * This utility helps diagnose performance issues by tracking:
 * - Save operations
 * - Change manager callbacks
 * - Component rendering
 * - Validator runs
 * - Error handling
 * 
 * Usage:
 *   import { perfLogger } from '../services/performance-logger.js';
 *   
 *   // Start a timer
 *   perfLogger.start('save-operation');
 *   
 *   // ... do work ...
 *   
 *   // End timer and log
 *   perfLogger.end('save-operation');
 *   
 *   // Or use the wrap function for async operations
 *   const result = await perfLogger.wrapAsync('fetch-data', async () => {
 *       return await fetchData();
 *   });
 */

export interface PerfEntry {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
}

export interface PerfSummary {
    operation: string;
    count: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
}

class PerformanceLogger {
    private enabled: boolean = true;
    private activeTimers: Map<string, PerfEntry> = new Map();
    private completedEntries: PerfEntry[] = [];
    private maxEntries: number = 500;
    private slowThresholdMs: number = 100; // Log warning if operation takes longer than this
    private freezeThresholdMs: number = 500; // Log error if operation takes longer than this
    
    // Categories for grouping operations
    private categories = {
        save: ['save-operation', 'debounced-save', 'force-save', 'model-save', 'server-save'],
        change: ['change-callback', 'prim-delta', 'part-delta', 'list-delta', 'part-list-delta'],
        render: ['render-component', 'refresh-component', 'projection-update', 'box-refresh'],
        validate: ['run-validator', 'error-count-update', 'error-refresh'],
        ui: ['tab-refresh', 'timeline-refresh', 'checklist-refresh', 'undo-redo'],
    };

    constructor() {
        // Check localStorage for enabled state
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem('perf-logger-enabled');
            if (stored !== null) {
                this.enabled = stored === 'true';
            }
        }
    }

    /**
     * Enable or disable the performance logger
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('perf-logger-enabled', String(enabled));
        }
        console.log(`⏱️ Performance logger ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if the logger is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Set the threshold for slow operation warnings (in ms)
     */
    setSlowThreshold(ms: number): void {
        this.slowThresholdMs = ms;
    }

    /**
     * Set the threshold for freeze warnings (in ms)
     */
    setFreezeThreshold(ms: number): void {
        this.freezeThresholdMs = ms;
    }

    /**
     * Start timing an operation
     */
    start(name: string, metadata?: Record<string, unknown>): void {
        if (!this.enabled) return;
        
        const entry: PerfEntry = {
            name,
            startTime: performance.now(),
            metadata,
        };
        
        this.activeTimers.set(name, entry);
        console.log(`⏱️ START: ${name}`, metadata ? metadata : '');
    }

    /**
     * End timing an operation and log the result
     */
    end(name: string, additionalMetadata?: Record<string, unknown>): number | undefined {
        if (!this.enabled) return undefined;
        
        const entry = this.activeTimers.get(name);
        if (!entry) {
            console.warn(`⏱️ END: No timer found for "${name}"`);
            return undefined;
        }
        
        entry.endTime = performance.now();
        entry.duration = entry.endTime - entry.startTime;
        
        if (additionalMetadata) {
            entry.metadata = { ...entry.metadata, ...additionalMetadata };
        }
        
        this.activeTimers.delete(name);
        this.addCompletedEntry(entry);
        
        // Log with appropriate level based on duration
        const durationStr = `${entry.duration.toFixed(2)}ms`;
        
        if (entry.duration >= this.freezeThresholdMs) {
            console.error(`⏱️🔴 FREEZE: ${name} took ${durationStr}`, entry.metadata || '');
        } else if (entry.duration >= this.slowThresholdMs) {
            console.warn(`⏱️🟡 SLOW: ${name} took ${durationStr}`, entry.metadata || '');
        } else {
            console.log(`⏱️✅ END: ${name} took ${durationStr}`, entry.metadata || '');
        }
        
        return entry.duration;
    }

    /**
     * Mark a point in time (useful for tracking sequence of events)
     */
    mark(name: string, metadata?: Record<string, unknown>): void {
        if (!this.enabled) return;
        
        const entry: PerfEntry = {
            name: `MARK: ${name}`,
            startTime: performance.now(),
            endTime: performance.now(),
            duration: 0,
            metadata,
        };
        
        this.addCompletedEntry(entry);
        console.log(`⏱️📍 MARK: ${name}`, metadata ? metadata : '');
    }

    /**
     * Wrap a synchronous function with timing
     */
    wrap<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
        if (!this.enabled) return fn();
        
        this.start(name, metadata);
        try {
            const result = fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name, { error: String(error) });
            throw error;
        }
    }

    /**
     * Wrap an async function with timing
     */
    async wrapAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
        if (!this.enabled) return fn();
        
        this.start(name, metadata);
        try {
            const result = await fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name, { error: String(error) });
            throw error;
        }
    }

    /**
     * Get a summary of all completed operations
     */
    getSummary(): PerfSummary[] {
        const summaryMap = new Map<string, { times: number[], count: number }>();
        
        for (const entry of this.completedEntries) {
            if (entry.duration === undefined) continue;
            
            // Extract base name (remove MARK: prefix if present)
            const baseName = entry.name.replace(/^MARK: /, '');
            
            if (!summaryMap.has(baseName)) {
                summaryMap.set(baseName, { times: [], count: 0 });
            }
            
            const data = summaryMap.get(baseName)!;
            data.times.push(entry.duration);
            data.count++;
        }
        
        const summaries: PerfSummary[] = [];
        
        for (const [operation, data] of summaryMap) {
            const totalTime = data.times.reduce((a, b) => a + b, 0);
            summaries.push({
                operation,
                count: data.count,
                totalTime,
                avgTime: totalTime / data.count,
                minTime: Math.min(...data.times),
                maxTime: Math.max(...data.times),
            });
        }
        
        // Sort by total time descending
        return summaries.sort((a, b) => b.totalTime - a.totalTime);
    }

    /**
     * Print a formatted summary to the console
     */
    printSummary(): void {
        const summaries = this.getSummary();
        
        if (summaries.length === 0) {
            console.log('⏱️ No performance data collected yet');
            return;
        }
        
        console.log('\n⏱️ ═══════════════════════════════════════════════════════════');
        console.log('⏱️ PERFORMANCE SUMMARY');
        console.log('⏱️ ═══════════════════════════════════════════════════════════');
        
        console.table(summaries.map(s => ({
            Operation: s.operation,
            Count: s.count,
            'Total (ms)': s.totalTime.toFixed(2),
            'Avg (ms)': s.avgTime.toFixed(2),
            'Min (ms)': s.minTime.toFixed(2),
            'Max (ms)': s.maxTime.toFixed(2),
        })));
        
        // Highlight potential problem areas
        const slowOps = summaries.filter(s => s.maxTime >= this.slowThresholdMs);
        if (slowOps.length > 0) {
            console.log('\n⏱️🟡 SLOW OPERATIONS (max >= ' + this.slowThresholdMs + 'ms):');
            for (const op of slowOps) {
                console.log(`   - ${op.operation}: max ${op.maxTime.toFixed(2)}ms, avg ${op.avgTime.toFixed(2)}ms (${op.count} calls)`);
            }
        }
        
        const freezeOps = summaries.filter(s => s.maxTime >= this.freezeThresholdMs);
        if (freezeOps.length > 0) {
            console.log('\n⏱️🔴 FREEZE OPERATIONS (max >= ' + this.freezeThresholdMs + 'ms):');
            for (const op of freezeOps) {
                console.log(`   - ${op.operation}: max ${op.maxTime.toFixed(2)}ms, avg ${op.avgTime.toFixed(2)}ms (${op.count} calls)`);
            }
        }
        
        console.log('⏱️ ═══════════════════════════════════════════════════════════\n');
    }

    /**
     * Get recent entries (for debugging)
     */
    getRecentEntries(count: number = 50): PerfEntry[] {
        return this.completedEntries.slice(-count);
    }

    /**
     * Print recent entries to console
     */
    printRecentEntries(count: number = 20): void {
        const entries = this.getRecentEntries(count);
        
        console.log('\n⏱️ ═══════════════════════════════════════════════════════════');
        console.log(`⏱️ RECENT ENTRIES (last ${count})`);
        console.log('⏱️ ═══════════════════════════════════════════════════════════');
        
        for (const entry of entries) {
            const duration = entry.duration !== undefined ? `${entry.duration.toFixed(2)}ms` : 'N/A';
            const icon = entry.duration && entry.duration >= this.freezeThresholdMs ? '🔴' :
                        entry.duration && entry.duration >= this.slowThresholdMs ? '🟡' : '✅';
            console.log(`${icon} ${entry.name}: ${duration}`, entry.metadata || '');
        }
        
        console.log('⏱️ ═══════════════════════════════════════════════════════════\n');
    }

    /**
     * Clear all collected data
     */
    clear(): void {
        this.activeTimers.clear();
        this.completedEntries = [];
        console.log('⏱️ Performance data cleared');
    }

    /**
     * Get active (uncompleted) timers - useful for detecting stuck operations
     */
    getActiveTimers(): Map<string, PerfEntry> {
        return new Map(this.activeTimers);
    }

    /**
     * Print active timers (operations that haven't completed)
     */
    printActiveTimers(): void {
        const active = this.getActiveTimers();
        
        if (active.size === 0) {
            console.log('⏱️ No active timers');
            return;
        }
        
        console.log('\n⏱️ ═══════════════════════════════════════════════════════════');
        console.log('⏱️ ACTIVE TIMERS (potentially stuck operations)');
        console.log('⏱️ ═══════════════════════════════════════════════════════════');
        
        const now = performance.now();
        for (const [name, entry] of active) {
            const elapsed = now - entry.startTime;
            const icon = elapsed >= this.freezeThresholdMs ? '🔴' :
                        elapsed >= this.slowThresholdMs ? '🟡' : '⏳';
            console.log(`${icon} ${name}: running for ${elapsed.toFixed(2)}ms`, entry.metadata || '');
        }
        
        console.log('⏱️ ═══════════════════════════════════════════════════════════\n');
    }

    private addCompletedEntry(entry: PerfEntry): void {
        this.completedEntries.push(entry);
        
        // Keep only the last maxEntries
        if (this.completedEntries.length > this.maxEntries) {
            this.completedEntries = this.completedEntries.slice(-this.maxEntries);
        }
    }
}

// Export singleton instance
export const perfLogger = new PerformanceLogger();

// Export class for testing or custom instances
export { PerformanceLogger };

// Expose to window for console debugging
if (typeof window !== 'undefined') {
    (window as any).perfLogger = perfLogger;
}
