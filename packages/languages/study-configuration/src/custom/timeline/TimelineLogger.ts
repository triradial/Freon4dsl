/*
 * Simple logger for timeline code. Can be toggled on/off globally via:
 * - localStorage key 'timeline:logs' = 'true' | 'false' (browser)
 * - process.env.TIMELINE_LOGS = 'true' (build/runtime)
 * Defaults to off.
 */

function getInitialEnabled(): boolean {
    try {
        // Prefer localStorage if available (browser)
        // eslint-disable-next-line no-undef
        if (typeof window !== "undefined" && window && window.localStorage) {
            const val = window.localStorage.getItem("timeline:logs");
            if (val === "true") return true;
            if (val === "false") return false;
        }
    } catch (_) {
        // ignore
    }
    try {
        // Fallback to env var if present
        // eslint-disable-next-line no-undef
        if (typeof process !== "undefined" && process && process.env) {
            const envVal = process.env.TIMELINE_LOGS;
            if (envVal === "true") return true;
            if (envVal === "false") return false;
        }
    } catch (_) {
        // ignore
    }
    return false;
}

let enabled = getInitialEnabled();

export const TimelineLogger = {
    enable(): void {
        enabled = true;
        try {
            if (typeof window !== "undefined" && window && window.localStorage) {
                window.localStorage.setItem("timeline:logs", "true");
            }
        } catch (_) {}
    },
    disable(): void {
        enabled = false;
        try {
            if (typeof window !== "undefined" && window && window.localStorage) {
                window.localStorage.setItem("timeline:logs", "false");
            }
        } catch (_) {}
    },
    isEnabled(): boolean {
        return enabled;
    },
    log(...args: any[]): void {
        if (!enabled) return;
        // eslint-disable-next-line no-console
        console.log(...args);
    },
};

export default TimelineLogger;


