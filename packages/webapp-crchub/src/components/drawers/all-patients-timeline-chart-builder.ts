/**
 * Builds All Patients Timeline chart from database schedule data + study configuration.
 * Source: DB (PatientTable → schedule, Availability → unavailableDates).
 * Target: vis-timeline chart matching tmp/patient-event-overlay-test.html (phases, scheduled events, windows, on-scheduled-date, in-window, out-of-window, not-available).
 */

import type { StudyConfiguration } from "@freon4dsl/study-configuration";
import { getTimelineAsOfADate } from "@freon4dsl/study-configuration";
import type { Patient } from "../../../services/data/data-store.js";

export interface VisTimelineItem {
    start: string; // "year, month, day, h, m, s" for new Date(...)
    end: string;
    group: string;
    className: string;
    title: string;
    content: string;
    id: string;
}

export interface VisTimelineGroup {
    id: string;
    content: string;
    className: string;
    style?: string;
}

/** Day offset from a reference date (integer days). */
function dayOffsetFromDate(refDate: Date, date: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((date.getTime() - refDate.getTime()) / msPerDay);
}

/** Date from reference date + day offset (start of day or end of day). */
function dateFromDayOffset(refDate: Date, dayOffset: number, endOfDay: boolean): Date {
    const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    if (endOfDay) d.setHours(23, 59, 59, 999);
    return d;
}

function dateToVisString(d: Date, endOfDay: boolean): string {
    if (endOfDay) d.setHours(23, 59, 59, 999);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const h = d.getHours();
    const min = d.getMinutes();
    const s = d.getSeconds();
    return `${y}, ${m}, ${day}, ${h}, ${min}, ${s}`;
}

/** Escape for use inside double-quoted JS string. */
function escapeJsString(s: string): string {
    return (s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Build chart reference date: earliest patient schedule reference date, or today.
 */
function getChartReferenceDate(patients: Patient[]): Date {
    let earliest: Date | null = null;
    for (const p of patients) {
        const ref = p.schedule?.referenceDate;
        if (ref) {
            const [y, m, d] = ref.split("-").map(Number);
            const date = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0);
            if (!earliest || date.getTime() < earliest.getTime()) earliest = date;
        }
    }
    if (earliest) return earliest;
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
}

/**
 * Build All Patients timeline chart HTML (script + container) from DB schedules and study config.
 * Uses same simulated study schedule (no re-simulation); overlays patient events from DB.
 */
export function buildAllPatientsTimelineChartHtml(
    patients: Patient[],
    studyConfig: StudyConfiguration
): string {
    if (patients.length === 0) {
        return `<div class="limited-width-container"><div class='text-yellow-500'>No patients found for this study</div></div>`;
    }

    const chartRefDate = getChartReferenceDate(patients);
    let timeline: ReturnType<typeof getTimelineAsOfADate>;
    try {
        timeline = getTimelineAsOfADate(studyConfig, chartRefDate, undefined);
    } catch (e: unknown) {
        console.error("[AllPatientsTimeline] getTimelineAsOfADate error:", e);
        console.error((e as Error)?.stack);
        throw e;
    }
    const refDate = timeline.getReferenceDate();
    const offset = (timeline as any).getOffsetOfFirstEventInstance?.() ?? 0;

    // Build sets of day numbers (relative to chart ref): scheduled event days and window days (for classifying patient events)
    const scheduledDays = new Set<number>();
    const windowDays = new Set<number>();
    const days = (timeline.getDays() ?? []).filter((d): d is NonNullable<typeof d> => d != null);
    for (const timelineDay of days) {
        if (!timelineDay) continue;
        for (const ev of timelineDay.getEventInstances?.() ?? []) {
            if (!ev) continue;
            const startDay = ev.getStartDay?.() ?? 0;
            scheduledDays.add(startDay + offset);
            const before = (ev as any).anyDaysBefore?.();
            const after = (ev as any).anyDaysAfter?.();
            if (before) {
                const beforeCount = (ev as any).getScheduledEvent?.()?.configuredEvent?.schedule?.eventWindow?.daysBefore?.count ?? 0;
                for (let i = 1; i <= beforeCount; i++) windowDays.add(startDay - i + offset);
            }
            if (after) {
                const afterCount = (ev as any).getScheduledEvent?.()?.configuredEvent?.schedule?.eventWindow?.daysAfter?.count ?? 0;
                for (let i = 1; i <= afterCount; i++) windowDays.add(startDay + i + offset);
            }
        }
    }

    const groups: VisTimelineGroup[] = [
        { id: "Phase", content: "<b>Phase</b>", className: "phase" }
    ];
    for (const p of patients) {
        const label = p.initials || p.patientNumber || p.id;
        groups.push({
            id: `Patient-${p.id}`,
            content: `<b>${escapeJsString(label)}</b>`,
            className: "patient",
            style: "cursor: pointer;"
        });
    }

    const items: VisTimelineItem[] = [];
    let idCounter = 0;
    const nextId = () => `item-${idCounter++}`;

    // Phase items from timeline
    for (const timelineDay of days) {
        if (!timelineDay) continue;
        const periodInstances = timelineDay.getPeriodInstances?.() ?? [];
        for (const pi of periodInstances) {
            if (!pi) continue;
            const startDay = pi.getStartDay?.() ?? 0;
            const endDay = pi.getEndDay?.(timeline) ?? startDay;
            const startDate = dateFromDayOffset(refDate, startDay + offset, false);
            const endDate = dateFromDayOffset(refDate, endDay + offset, true);
            const name = (pi as any).getName?.() ?? "Phase";
            const className = `${String(name).toLowerCase().replace(/\s+/g, "-")}-phase`;
            items.push({
                start: dateToVisString(startDate, false),
                end: dateToVisString(endDate, true),
                group: "Phase",
                className,
                title: name,
                content: `<b>${escapeJsString(name)}</b>`,
                id: nextId()
            });
        }
    }

    // Per-patient: scheduled + window items from timeline, then overlay DB events
    for (const patient of patients) {
        const groupId = `Patient-${patient.id}`;
        const patientRefDate = patient.schedule?.referenceDate
            ? (() => {
                const [y, m, d] = patient.schedule!.referenceDate.split("-").map(Number);
                return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0);
            })()
            : chartRefDate;

        // Map (dayOffset from chart ref) -> overlay class (on-scheduled-date | in-window) and content; and list of out-of-window items
        const overlayByDay = new Map<number, { className: string; content: string; title: string }>();
        const outOfWindowItems: { dayOffset: number; eventName: string; title: string }[] = [];

        if (patient.schedule?.days) {
            for (const dayObj of patient.schedule.days) {
                if (!dayObj) continue;
                const dayNum = dayObj.day ?? 0;
                const actualDate = dateFromDayOffset(patientRefDate, dayNum, false);
                const dayOffset = dayOffsetFromDate(chartRefDate, actualDate);
                for (const ev of dayObj.events || []) {
                    if (!ev) continue;
                    const actualDay = ev.actualDay ?? ev.scheduledDay ?? dayNum;
                    const evDate = dateFromDayOffset(patientRefDate, actualDay, false);
                    const evDayOffset = dayOffsetFromDate(chartRefDate, evDate);
                    const eventName = ev?.name ?? "Visit";
                    const title = `${eventName} - ${ev.status === "completed" ? "On date" : ev.status || "Planned"}`;
                    if (scheduledDays.has(evDayOffset)) {
                        overlayByDay.set(evDayOffset, { className: "on-scheduled-date", content: "✓", title });
                    } else if (windowDays.has(evDayOffset)) {
                        overlayByDay.set(evDayOffset, { className: "in-window", content: "✓", title });
                    } else {
                        outOfWindowItems.push({ dayOffset: evDayOffset, eventName, title });
                    }
                }
            }
        }

        // Scheduled + window items for this patient (from timeline).
        // Match reference: one window item per day (before-window days, scheduled day, after-window days).
        for (const timelineDay of days) {
            if (!timelineDay) continue;
            for (const ev of timelineDay.getEventInstances?.() ?? []) {
                if (!ev) continue;
                const sei = ev as any;
                const eventName = sei.getName?.() ?? "Event";
                const before = sei.anyDaysBefore?.();
                const after = sei.anyDaysAfter?.();
                const beforeCount = before ? ((sei.getScheduledEvent?.()?.configuredEvent?.schedule?.eventWindow?.daysBefore?.count as number) ?? 1) : 0;
                const afterCount = after ? ((sei.getScheduledEvent?.()?.configuredEvent?.schedule?.eventWindow?.daysAfter?.count as number) ?? 1) : 0;
                const mainStart = sei.getStartDayAsDateString?.(timeline);
                const mainEnd = sei.getEndOfStartDayAsDateString?.(timeline);
                const startDay = ev.getStartDay?.() ?? 0;

                for (let i = 1; i <= beforeCount; i++) {
                    const dayOffset = startDay - i + offset;
                    const ov = overlayByDay.get(dayOffset);
                    const startDate = dateFromDayOffset(refDate, dayOffset, false);
                    const endDate = dateFromDayOffset(refDate, dayOffset, true);
                    items.push({
                        start: dateToVisString(startDate, false),
                        end: dateToVisString(endDate, true),
                        group: groupId,
                        className: ov?.className ?? "window",
                        title: ov?.title ?? (i === 1 ? "Window before Event" : `Window before ${eventName}`),
                        content: ov?.content ?? "&nbsp;",
                        id: nextId()
                    });
                }
                if (mainStart && mainEnd) {
                    const dayOffset = startDay + offset;
                    const ov = overlayByDay.get(dayOffset);
                    items.push({
                        start: mainStart,
                        end: mainEnd,
                        group: groupId,
                        className: ov?.className ?? "scheduled-event",
                        title: ov?.title ?? `${eventName} - Scheduled`,
                        content: ov?.content ?? "&nbsp;",
                        id: nextId()
                    });
                }
                for (let i = 1; i <= afterCount; i++) {
                    const dayOffset = startDay + i + offset;
                    const ov = overlayByDay.get(dayOffset);
                    const startDate = dateFromDayOffset(refDate, dayOffset, false);
                    const endDate = dateFromDayOffset(refDate, dayOffset, true);
                    items.push({
                        start: dateToVisString(startDate, false),
                        end: dateToVisString(endDate, true),
                        group: groupId,
                        className: ov?.className ?? "window",
                        title: ov?.title ?? (i === 1 ? "Window after Event" : `Window after ${eventName}`),
                        content: ov?.content ?? "&nbsp;",
                        id: nextId()
                    });
                }
            }
        }

        // Out-of-window patient events (separate items)
        for (const { dayOffset, eventName, title } of outOfWindowItems) {
            const startDate = dateFromDayOffset(chartRefDate, dayOffset, false);
            const endDate = dateFromDayOffset(chartRefDate, dayOffset, true);
            items.push({
                start: dateToVisString(startDate, false),
                end: dateToVisString(endDate, true),
                group: groupId,
                className: "out-of-window",
                title,
                content: "✗",
                id: nextId()
            });
        }

        // Not-available blocks from DB
        const unavail = (patient as any).unavailableDates ?? [];
        for (const dateStr of unavail) {
            const parts = dateStr.split("-").map(Number);
            if (parts.length >= 3) {
                const startDate = new Date(parts[0], (parts[1] ?? 1) - 1, parts[2], 0, 0, 0);
                const endDate = new Date(parts[0], (parts[1] ?? 1) - 1, parts[2], 23, 59, 59);
                items.push({
                    start: dateToVisString(startDate, false),
                    end: dateToVisString(endDate, true),
                    group: groupId,
                    className: "not-available",
                    title: "Not available",
                    content: "&nbsp;",
                    id: nextId()
                });
            }
        }
    }

    // Build script: groups and items as vis.DataSet, then options and timeline
    const groupsScript = `var groups = new vis.DataSet(${JSON.stringify(groups)});`;
    const itemsScript = "var items = new vis.DataSet([\n" + items.map((it) => {
        return `  { start: new Date(${it.start}), end: new Date(${it.end}), group: "${escapeJsString(it.group)}", className: "${escapeJsString(it.className)}", title: "${escapeJsString(it.title)}", content: "${escapeJsString(it.content)}", id: "${escapeJsString(it.id)}" }`;
    }).join(",\n") + "\n]);";

    const chartStart = new Date(chartRefDate.getFullYear(), chartRefDate.getMonth(), chartRefDate.getDate(), 0, 0, 0);
    const maxDay = Math.max((timeline as any).getMaxDayOnTimeline?.() ?? 365, 30);
    const chartEnd = new Date(chartStart);
    chartEnd.setDate(chartEnd.getDate() + maxDay);
    chartEnd.setHours(23, 59, 59, 999);
    const viewEnd = new Date(chartStart);
    viewEnd.setDate(viewEnd.getDate() + Math.min(30, maxDay));
    viewEnd.setHours(23, 59, 59, 999);
    const dayMs = 24 * 60 * 60 * 1000;
    const zoomMinMs = dayMs;
    const zoomMaxMs = dayMs * 365 * 2;
    const optionsScript = `
  var options = {
    format: {
      minorLabels: { millisecond: '', second: '', minute: '', hour: '', weekday: '', day: 'D', week: '', month: 'MM', year: 'YYYY' },
      majorLabels: { millisecond: 'HH:mm:ss', second: 'D MMMM HH:mm', minute: 'ddd D MMMM', hour: 'ddd D MMMM', weekday: 'MMMM YYYY', day: 'MMMM YYYY', week: 'MMMM YYYY', month: 'YYYY', year: '' }
    },
    timeAxis: { scale: 'day', step: 1 },
    showMajorLabels: true,
    orientation: 'both',
    start: new Date(${dateToVisString(chartStart, false)}),
    end: new Date(${dateToVisString(viewEnd, true)}),
    min: new Date(${dateToVisString(chartStart, false)}),
    max: new Date(${dateToVisString(chartEnd, true)}),
    margin: { item: { horizontal: 0 } },
    stack: true,
    zoomMin: ${zoomMinMs},
    zoomMax: ${zoomMaxMs}
  };
  var container = document.getElementById('all-patients-visualization');
  if (container && typeof vis !== 'undefined') {
    var timeline = new vis.Timeline(container);
    timeline.setOptions(options);
    timeline.setGroups(groups);
    timeline.setItems(items);
  } else {
    if (!container) console.error('[AllPatientsTimeline] #all-patients-visualization not found');
    if (typeof vis === 'undefined') console.error('[AllPatientsTimeline] vis not loaded');
  }
`;

    const css = `
    .all-patients-timeline-chart { font-family: arial, sans-serif; font-size: 11pt; margin: 20px; }
    .all-patients-timeline-chart h1 { margin-top: 0; }
    #all-patients-visualization { box-sizing: border-box; width: 100%; height: 600px; position: relative; border: 1px solid #ccc; margin-bottom: 20px; }
    .vis-item.screening-phase { background-color: #005e4c; color: white; }
    .vis-item.treatment-phase { background-color: #600078; color: white; }
    .vis-item.window { background-color: #c3c3be; opacity: 0.6; }
    .vis-item.scheduled-event { background-color: #485bc7; }
    .vis-item.on-scheduled-date { background-color: #000000; color: white; }
    .vis-item.in-window { background-image: repeating-linear-gradient(45deg, black, black 5px, white 2px, white 7px); }
    .vis-item.out-of-window { background-image: repeating-linear-gradient(45deg, rgb(189, 124, 5), rgb(189, 124, 5) 5px, white 2px, white 7px); }
    .vis-item.not-available { background-color: #b0395f; }
    .vis-timeline .vis-item { box-sizing: border-box; height: 30px !important; line-height: 30px !important; }
    .vis-timeline .vis-item-content { display: flex; align-items: center; justify-content: center; height: 100%; }
    .all-patients-timeline-legend { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #485bc7; }
    .all-patients-timeline-legend h3 { margin-top: 0; color: #485bc7; }
    .all-patients-timeline-legend ul { margin: 0; padding-left: 20px; }
  `;

    const scriptContent = groupsScript + "\n" + itemsScript + "\n" + optionsScript;
    return `
<div class="limited-width-container all-patients-timeline-chart">
  <style>${css}</style>
  <h1>All Patients Timeline</h1>
  <p>Phases, scheduled events, windows, and patient events (on-scheduled-date, in-window, out-of-window, not-available). Scroll to zoom, drag to pan.</p>
  <div id="all-patients-visualization"></div>
  <div class="all-patients-timeline-legend">
    <h3>Legend</h3>
    <ul>
      <li><strong>Phase</strong> (green/purple): Screening, Treatment.</li>
      <li><strong>Window</strong> (grey): Before/after scheduled date.</li>
      <li><strong>Scheduled</strong> (blue): Planned visit day.</li>
      <li><strong>✓ On date</strong> (black): Patient visit on scheduled date.</li>
      <li><strong>✓ In window</strong> (striped): Patient visit within window.</li>
      <li><strong>✗ Out of window</strong> (amber striped): Visit outside window.</li>
      <li><strong>Not available</strong> (red): Unavailable day.</li>
    </ul>
  </div>
  <script type="text/javascript">
${scriptContent}
  </script>
</div>`;
}
