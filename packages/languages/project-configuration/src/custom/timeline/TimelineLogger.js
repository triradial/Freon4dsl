// Simple logger for JS files. Mirrors TimelineLogger.ts API.
// Toggle via localStorage key 'timeline:logs' or env var TIMELINE_LOGS.

function getInitialEnabled() {
  try {
    if (typeof window !== 'undefined' && window && window.localStorage) {
      const val = window.localStorage.getItem('timeline:logs');
      if (val === 'true') return true;
      if (val === 'false') return false;
    }
  } catch (_) {}
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      const envVal = process.env.TIMELINE_LOGS;
      if (envVal === 'true') return true;
      if (envVal === 'false') return false;
    }
  } catch (_) {}
  return false;
}

let enabled = getInitialEnabled();

const TimelineLogger = {
  enable() {
    enabled = true;
    try {
      if (typeof window !== 'undefined' && window && window.localStorage) {
        window.localStorage.setItem('timeline:logs', 'true');
      }
    } catch (_) {}
  },
  disable() {
    enabled = false;
    try {
      if (typeof window !== 'undefined' && window && window.localStorage) {
        window.localStorage.setItem('timeline:logs', 'false');
      }
    } catch (_) {}
  },
  isEnabled() {
    return enabled;
  },
  log(...args) {
    if (!enabled) return;
    console.log(...args);
  },
};

export default TimelineLogger;


