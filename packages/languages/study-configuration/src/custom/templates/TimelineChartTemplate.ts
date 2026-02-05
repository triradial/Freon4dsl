import { StudyConfigurationModelModelUnitWriter } from "../../freon/writer/StudyConfigurationModelModelUnitWriter.js";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance.js";
import { Timeline } from "../timeline/Timeline.js";
import { dedent } from "../utils/dedent.js";

let uniqueCounter = 0;

export function resetTimelineScriptTemplate() {
    uniqueCounter = 0;
}

function getUniqueNumber(): number {
    return uniqueCounter++;
}

export class TimelineChartTemplate {
    static getTimelineDataHTML(timeline: Timeline): string {
        let writer = new StudyConfigurationModelModelUnitWriter();
        const isMultiPatient = timeline.getUniquePatientIdentifiers().length > 1;

        //TODO: determine why the not-available-row-label class doesn't change the color of the text to red or find another way to highlight the differences in the cells in the row, e.g., adding a legend or changing the row label text.
        var template = dedent`var groups = new vis.DataSet([
            { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
            ${isMultiPatient ? "" : timeline
                .getUniqueEventInstanceNames()
                .map((uniqueEventName) => `{ "content": "${uniqueEventName}", "id": "${uniqueEventName}" },`)
                .join("\n")}
            ${timeline.anyPatientEventInstances() ? (
                timeline.getUniquePatientIdentifiers().length > 0
                    ? (() => {
                        const patientIds = timeline.getUniquePatientIdentifiers();
                        // Use shorter labels for multi-patient timelines
                        const patientLabel = isMultiPatient 
                            ? (patientId: string) => `{ "content": "<b>${patientId}</b>", "id": "Patient-${patientId}", className: 'patient', style: 'cursor: pointer;' },`
                            : (patientId: string) => `{ "content": "<b>Patient: ${patientId}</b>", "id": "Patient-${patientId}", className: 'patient' },`;
                        return patientIds.map(patientLabel).join("\n");
                    })()
                    : `{ "content": "<b>Patient Visits /<br><span class='not-available-row-label'>Not Available</span></b>", "id": "Patient", className: 'patient' },`
            ) : ""}
            ${timeline.anyStaffAvailabilityEventInstances() ? `{ "content": "<b>Staff(${timeline.getBaselineStaff()})</b>", "id": "Staff", className: 'staff' },` : ""}
          ]);

        var items = new vis.DataSet([
            ${timeline
                .getDays()
                .map((timelineDay, counter) => {
                    const periodInstances = timelineDay.getPeriodInstances();
                    if (periodInstances.length === 0) {
                        return "";
                    }
                    return periodInstances
                        .map(
                            (periodInstance, index) =>
                                `{ start: new Date(${periodInstance.getStartDayAsDateString(timeline)}), end: new Date(${periodInstance.getEndDayStringAsDateFrom(timeline)}), group: "Phase", className: "${periodInstance.getName().toLowerCase()}-phase", title: "Day: ${periodInstance.getStartDay()}", content: "<b>${periodInstance.getName()}</b>", id: "${periodInstance.getName() + getUniqueNumber()}" },`,
                        )
                        .filter((item) => item !== "")
                        .join("");
                })
                .filter((item) => item !== "")
                .join("\n    ")}
            ${timeline
                .getDays()
                .map((timelineDay, counter) =>
                    timelineDay
                        .getEventInstances()
                        .map(
                            (
                                eventInstance,
                                index,
                            ) => {
                                const eventName = eventInstance.getName();
                                let groups: string[];
                                
                                if (isMultiPatient) {
                                    // For multi-patient, assign scheduled events to ALL patient groups
                                    // This shows the study schedule in each patient's row
                                    const allPatientIds = timeline.getUniquePatientIdentifiers();
                                    groups = allPatientIds.map(pid => `Patient-${pid}`);
                                } else {
                                    // For single patient, use event name as group
                                    groups = [eventName];
                                }
                                
                                // Generate items for each group
                                return groups.map(groupId => {
                                    const beforeWindow = eventInstance.anyDaysBefore() 
                                        ? `{ start: new Date(${eventInstance.startDayOfBeforeWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfBeforeWindowAsDateString(timeline)}), group: "${groupId}", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-${eventInstance.getName() + getUniqueNumber()}" },`
                                        : "";
                                    const mainEvent = `{ start: new Date(${eventInstance.getStartDayAsDateString(timeline)}), end: new Date(${eventInstance.getEndOfStartDayAsDateString(timeline)}), group: "${groupId}", className: "scheduled-event", title: "${eventInstance.getNameWithInstanceNumber(timeline) + ": " + writer.writeToString((eventInstance as ScheduledEventInstance).getScheduledEvent().configuredEvent.schedule.eventStart).replace(/["`]/g, "")}", content: "&nbsp;", id: "${eventInstance.getName() + getUniqueNumber()}" },`;
                                    const afterWindow = eventInstance.anyDaysAfter() 
                                        ? `{ start: new Date(${eventInstance.startDayOfAfterWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfAfterWindowAsDateString(timeline)}), group: "${groupId}", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-${eventInstance.getName() + getUniqueNumber()}" },`
                                        : "";
                                    return beforeWindow + mainEvent + afterWindow;
                                }).join("");
                            }
                        )
                        .filter((item) => item !== "")
                        .join("\n    "),
                )
                .filter((item) => item !== "")
                .join("\n")}
                
            ${timeline
                .getDays()
                .map((timelineDay, counter) =>
                    timelineDay
                        .getPatientEventInstances()
                        .map(
                            (patientEventInstance, index) => {
                                const patientId = patientEventInstance.getPatientIdentifier();
                                const groupId = patientId
                                  ? `Patient-${patientId}`
                                  : "NO-Patient-ID";
                                return `{ start: new Date(${patientEventInstance.getStartDayAsDateString(timeline)}), end: new Date(${patientEventInstance.getEndDayAsDateString(timeline)}), group: "${groupId}", className: "${patientEventInstance.getClassForDisplay(timeline)}", title: "${patientEventInstance.getTitle()}", content: "&nbsp;", id: "${patientEventInstance.getName() + getUniqueNumber()}" },`;
                            }
                        )
                        .filter((item) => item !== "")
                        .join("\n    "),
                )
                .filter((item) => item !== "")
                .join("\n")}

            ${timeline
                .getDays()
                .map((timelineDay, counter) =>
                    timelineDay
                        .getStaffAvailabilityEventInstances()
                        .map(
                            (staffAvailabilityEventInstance, index) =>
                                `{ start: new Date(${staffAvailabilityEventInstance.getStartDayAsDateString(timeline)}), end: new Date(${staffAvailabilityEventInstance.getEndDayAsDateString(timeline)}), group: "Staff", className: "staff", title: "${staffAvailabilityEventInstance.getStaffAvailable().toString()}", content: "${staffAvailabilityEventInstance.getStaffAvailable().toString()}", id: "${staffAvailabilityEventInstance.getName() + getUniqueNumber()}" },`,
                        )
                        .filter((item) => item !== "")
                        .join("\n    "),
                )
                .filter((item) => item !== "")
                .join("\n")}
          ])`;
        return template;
    }

    static getPatientsTimelineHTML(timeline: Timeline): string {
        let writer = new StudyConfigurationModelModelUnitWriter();
        const patientIds = timeline.getUniquePatientIdentifiers();
        const isMultiPatient = patientIds.length > 1;

        //TODO: determine why the not-available-row-label class doesn't change the color of the text to red or find another way to highlight the differences in the cells in the row, e.g., adding a legend or changing the row label text.
        var template = dedent`var groups = new vis.DataSet([
            { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
            ${patientIds.length > 0
                ? (() => {
                    // Always use shorter labels for patient grouping
                    const patientLabel = (patientId: string) => `{ "content": "<b>${patientId}</b>", "id": "Patient-${patientId}", className: 'patient', style: 'cursor: pointer;' },`;
                    return patientIds.map(patientLabel).join("\n");
                })()
                : `{ "content": "<b>Patient Visits /<br><span class='not-available-row-label'>Not Available</span></b>", "id": "Patient", className: 'patient' },`
            }
            ${timeline.anyStaffAvailabilityEventInstances() ? `{ "content": "<b>Staff(${timeline.getBaselineStaff()})</b>", "id": "Staff", className: 'staff' },` : ""}
          ]);

        var items = new vis.DataSet([
            ${timeline
                .getDays()
                .map((timelineDay, counter) => {
                    const periodInstances = timelineDay.getPeriodInstances();
                    if (periodInstances.length === 0) {
                        return "";
                    }
                    return periodInstances
                        .map(
                            (periodInstance, index) =>
                                `{ start: new Date(${periodInstance.getStartDayAsDateString(timeline)}), end: new Date(${periodInstance.getEndDayStringAsDateFrom(timeline)}), group: "Phase", className: "${periodInstance.getName().toLowerCase()}-phase", title: "Day: ${periodInstance.getStartDay()}", content: "<b>${periodInstance.getName()}</b>", id: "${periodInstance.getName() + getUniqueNumber()}" },`,
                        )
                        .filter((item) => item !== "")
                        .join("");
                })
                .filter((item) => item !== "")
                .join("\n    ")}
            ${timeline
                .getDays()
                .map((timelineDay, counter) =>
                    timelineDay
                        .getEventInstances()
                        .map(
                            (
                                eventInstance,
                                index,
                            ) => {
                                // For patient-based grouping, assign scheduled events to patient groups
                                // When there are patient identifiers, show scheduled events in each patient's row
                                const groups: string[] = patientIds.length > 0
                                    ? patientIds.map(pid => `Patient-${pid}`)
                                    : ["Patient"]; // Fallback if no patient IDs
                                
                                // Generate items for each patient group
                                return groups.map(groupId => {
                                    const beforeWindow = eventInstance.anyDaysBefore() 
                                        ? `{ start: new Date(${eventInstance.startDayOfBeforeWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfBeforeWindowAsDateString(timeline)}), group: "${groupId}", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-${eventInstance.getName() + getUniqueNumber()}" },`
                                        : "";
                                    const mainEvent = `{ start: new Date(${eventInstance.getStartDayAsDateString(timeline)}), end: new Date(${eventInstance.getEndOfStartDayAsDateString(timeline)}), group: "${groupId}", className: "scheduled-event", title: "${eventInstance.getName() + ": " + writer.writeToString((eventInstance as ScheduledEventInstance).getScheduledEvent().configuredEvent.schedule.eventStart).replace(/["`]/g, "")}", content: "&nbsp;", id: "${eventInstance.getName() + getUniqueNumber()}" },`;
                                    const afterWindow = eventInstance.anyDaysAfter() 
                                        ? `{ start: new Date(${eventInstance.startDayOfAfterWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfAfterWindowAsDateString(timeline)}), group: "${groupId}", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-${eventInstance.getName() + getUniqueNumber()}" },`
                                        : "";
                                    return beforeWindow + mainEvent + afterWindow;
                                }).join("");
                            }
                        )
                        .filter((item) => item !== "")
                        .join("\n    "),
                )
                .filter((item) => item !== "")
                .join("\n")}
                
            ${timeline
                .getDays()
                .map((timelineDay, counter) =>
                    timelineDay
                        .getPatientEventInstances()
                        .map(
                            (patientEventInstance, index) => {
                                const patientId = patientEventInstance.getPatientIdentifier();
                                const groupId = patientId
                                  ? `Patient-${patientId}`
                                  : "NO-Patient-ID";
                                return `{ start: new Date(${patientEventInstance.getStartDayAsDateString(timeline)}), end: new Date(${patientEventInstance.getEndDayAsDateString(timeline)}), group: "${groupId}", className: "${patientEventInstance.getClassForDisplay(timeline)}", title: "${patientEventInstance.getTitle()}", content: "&nbsp;", id: "${patientEventInstance.getName() + getUniqueNumber()}" },`;
                            }
                        )
                        .filter((item) => item !== "")
                        .join("\n    "),
                )
                .filter((item) => item !== "")
                .join("\n")}

            ${timeline
                .getDays()
                .map((timelineDay, counter) =>
                    timelineDay
                        .getStaffAvailabilityEventInstances()
                        .map(
                            (staffAvailabilityEventInstance, index) =>
                                `{ start: new Date(${staffAvailabilityEventInstance.getStartDayAsDateString(timeline)}), end: new Date(${staffAvailabilityEventInstance.getEndDayAsDateString(timeline)}), group: "Staff", className: "staff", title: "${staffAvailabilityEventInstance.getStaffAvailable().toString()}", content: "${staffAvailabilityEventInstance.getStaffAvailable().toString()}", id: "${staffAvailabilityEventInstance.getName() + getUniqueNumber()}" },`,
                        )
                        .filter((item) => item !== "")
                        .join("\n    "),
                )
                .filter((item) => item !== "")
                .join("\n")}
          ])`;
        return template;
    }

    static getTimelineVisualizationHTML(timeline: Timeline, isMultiPatient: boolean = false): string {
        var template =
            "\n" +
            dedent`
          // create visualization
          var container = document.getElementById('visualization');
            ${timeline.getOptions(timeline, isMultiPatient)}
          `;
        return template;
    }

    static getTimelineAsHTMLPage(timelineDataAsScript: string): string {
        return dedent`<!DOCTYPE HTML>
          <html>
          <head>
          ${TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript, false, false, false, false)}
          </body>
          </html>
              `;
    }

    /**
     * Generate timeline HTML block.
     * @param timelineDataAsScript - The timeline data as a script
     * @param hasPatientKey - Whether to show patient key
     * @param hasStaffKey - Whether to show staff key  
     * @param isMultiPatient - Whether this is a multi-patient timeline
     * @param embedded - If true (default), the HTML will be embedded in the main page and theme stylesheet is not included.
     *                   If false, a theme stylesheet link is included for standalone pages.
     */
    static getTimelineAsHTMLBlock(timelineDataAsScript: string, hasPatientKey: boolean = false, hasStaffKey: boolean = false, isMultiPatient: boolean = false, embedded: boolean = true): string {
        let patientKey = hasPatientKey
          ? dedent`
            <div class="key-item"><div class="square on-scheduled-date"></div><span>Date patient visit occurred on the scheduled date</span></div>
            <div class="key-item"><div class="square in-window"></div><span>Date patient visit occurred in the scheduled window</span></div>
            <div class="key-item"><div class="square out-of-window"></div><span>Date patient visit occurred outside the scheduled window</span></div>
            <div class="key-item"><div class="square planned-visit"></div><span>Planned patient visit</span></div>
            <div class="key-item"><div class="square missed-visit"></div><span>Missed patient visit</span></div>
            <div class="key-item"><div class="square canceled-visit"></div><span>Canceled patient visit</span></div>
            <div class="key-item"><div class="square not-available"></div><span>Date(s) the patient is unavailable</span></div>
        `
          : "";
        let staffKey = hasStaffKey ? dedent`
            <div class="key-item"><div class="square staff"></div><span>Staff(#) - '(#)' is the total amount of staff available for the study. The number in the box is the staff on that date. The full staff is available on any date without a box with a number</span></div>
        ` : "";
        
        // Enhanced compact styles for multi-patient timelines
        const compactStyles = isMultiPatient ? `
        /* Enhanced compact styles for multi-patient timelines */
        .vis-label {
          font-size: 11px !important;
          padding: 1px 3px !important;
          line-height: 1.2 !important;
        }
        .vis-group.phase .vis-label {
          font-size: 11px !important;
          padding: 2px 4px !important;
        }
        .vis-group.patient .vis-label {
          font-size: 10px !important;
          padding: 1px 2px !important;
          font-weight: 600 !important;
        }
        .vis-item {
          height: 14px !important;
          margin-top: 0px !important;
          margin-bottom: 0px !important;
          border-radius: 2px !important;
        }
        .vis-item.scheduled-event {
          height: 12px !important;
        }
        .vis-item.window {
          height: 10px !important;
          opacity: 0.6 !important;
        }
        .vis-timeline {
          border: none !important;
        }
        .vis-time-axis .vis-text {
          font-size: 10px !important;
        }
        .vis-group {
          min-height: 16px !important;
        }
        .vis-group.patient {
          min-height: 14px !important;
        }` : `
        /* Standard styles */
        .vis-label {
          font-size: 12px !important;
          padding: 2px 4px !important;
        }
        .vis-group.patient .vis-label {
          font-size: 11px !important;
          padding: 1px 3px !important;
        }
        .vis-item {
          height: 18px !important;
          margin-top: 1px !important;
          margin-bottom: 1px !important;
        }`;
        
        // Only include theme stylesheet for standalone pages (not embedded)
        const themeStylesheet = embedded ? '' : dedent`
      <link id="theme-stylesheet" rel='stylesheet' href='/styles/bundle-dark.css'>
      <script>
        // Dynamically switch theme based on localStorage
        (function() {
          var theme = 'dark';
          try {
            theme = localStorage.getItem('theme') || 'dark';
          } catch (e) {}
          if (theme !== 'dark' && theme !== 'light') theme = 'dark';
          var link = document.getElementById('theme-stylesheet');
          if (link) {
            link.href = '/styles/bundle-' + theme + '.css';
          }
        })();
      </script>`;
        
        return dedent`
      <script type="text/javascript" src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
      <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
      ${themeStylesheet}
      <style>
        ${compactStyles}
      </style>
       <!--    -->
      </head>
      <body>
      <div id="visualization" style="position: unset !important; height:auto"></div>  
      <div class="timeline-instructions">
        <ul style="list-style-type: none;">
            <li>Use mouse scroll wheel or touchpad to zoom in/out of the timeline </li>
            <li>When zoomed in, hold mouse pointer down and drag to move forward or backward through the timeline</li>
        </ul>
        <div class="timeline-key">
            <div class="key-item"><div class="square scheduled-event"></div><span>Scheduled time of an Event/Visit</span></div>
            <div class="key-item"><div class="square window"></div><span>Window before and after a Scheduled Event/Visit</span></div>
            ${patientKey}
            ${staffKey}
        </div>
    </div>
      <script>
        ${timelineDataAsScript}
        var timeline = new vis.Timeline(container);
        timeline.setOptions(options);
        timeline.setGroups(groups);
        timeline.setItems(items);
        
        ${isMultiPatient ? `
        // Add click handlers to patient groups to open individual patient timeline
        timeline.on('select', function(properties) {
          if (properties.group) {
            const groupId = properties.group;
            if (groupId.startsWith('Patient-')) {
              const patientId = groupId.replace('Patient-', '');
              // Dispatch custom event to open patient timeline
              const event = new CustomEvent('openPatientTimeline', { 
                detail: { patientId: patientId },
                bubbles: true 
              });
              container.dispatchEvent(event);
            }
          }
        });
        
        // Also handle clicks on group labels
        timeline.on('click', function(properties) {
          if (properties.what === 'group-label' && properties.group) {
            const groupId = properties.group;
            if (groupId.startsWith('Patient-')) {
              const patientId = groupId.replace('Patient-', '');
              const event = new CustomEvent('openPatientTimeline', { 
                detail: { patientId: patientId },
                bubbles: true 
              });
              container.dispatchEvent(event);
            }
          }
        });
        ` : ''}
      </script>
    `;
    }
}
