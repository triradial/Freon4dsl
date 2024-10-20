import { Timeline } from "../../custom/timeline/Timeline.js";
import { ScheduledEventInstance } from "../../custom/timeline/ScheduledEventInstance.js";
import { StudyConfigurationModelModelUnitWriter } from "../../writer/gen/StudyConfigurationModelModelUnitWriter.js";
import { nodent, undent } from "@bscotch/utility";

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

        //TODO: determine why the not-available-row-label class doesn't change the color of the text to red or find another way to highlight the differences in the cells in the row, e.g., adding a legend or changing the row label text.
        var template = nodent`var groups = new vis.DataSet([
            { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
            ${timeline
                .getUniqueEventInstanceNames()
                .map((uniqueEventName) => `{ "content": "${uniqueEventName}", "id": "${uniqueEventName}" },`)
                .join("\n")}
            ${timeline.anyPatientEventInstances() ? `{ "content": "<b>Patient Visits /<br><span class='not-available-row-label'>Not Available</span></b>", "id": "Patient", className: 'patient' },` : ""}
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
                            ) => nodent`${eventInstance.anyDaysBefore() ? `{ start: new Date(${eventInstance.startDayOfBeforeWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfBeforeWindowAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-${eventInstance.getName() + getUniqueNumber()}" },` : ""}
                                { start: new Date(${eventInstance.getStartDayAsDateString(timeline)}), end: new Date(${eventInstance.getEndOfStartDayAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "scheduled-event", title: "${eventInstance.getName() + ": " + writer.writeToString((eventInstance as ScheduledEventInstance).getScheduledEvent().configuredEvent.schedule.eventStart).replace(/"/g, "")}", content: "&nbsp;", id: "${eventInstance.getName() + getUniqueNumber()}" },
                                ${eventInstance.anyDaysAfter() ? `{ start: new Date(${eventInstance.startDayOfAfterWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfAfterWindowAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-${eventInstance.getName() + getUniqueNumber()}" },` : ""}`,
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
                            (patientEventInstance, index) =>
                                `{ start: new Date(${patientEventInstance.getStartDayAsDateString(timeline)}), end: new Date(${patientEventInstance.getEndDayAsDateString(timeline)}), group: "Patient", className: "${patientEventInstance.getClassForDisplay(timeline)}", title: "${patientEventInstance.getTitle()}", content: "&nbsp;", id: "${patientEventInstance.getName() + getUniqueNumber()}" },`,
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

    static getTimelineVisualizationHTML(timeline: Timeline): string {
        var template =
            "\n" +
            undent`
          // create visualization
          var container = document.getElementById('visualization');
            ${timeline.getOptions(timeline)}
          `;
        return template;
    }

    static getTimelineAsHTMLPage(timelineDataAsScript: string): string {
        return undent`<!DOCTYPE HTML>
          <html>
          <head>
          ${TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript)}
          </body>
          </html>
              `;
    }

    static getTimelineAsHTMLBlock(timelineDataAsScript: string): string {
        return undent`
      <title>Timeline Chart</title>
      <script type="text/javascript" src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
      <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
      <link id="theme-stylesheet" rel='stylesheet' href='/build/bundle-dark.css'>
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
            <div class="key-item"><div class="square on-scheduled-date"></div><span>Date patient visit occurred on the scheduled date</span></div>
            <div class="key-item"><div class="square in-window"></div><span>Date patient visit occurred in the scheduled window</span></div>
            <div class="key-item"><div class="square out-of-window"></div><span>Date patient visit occurred outside the scheduled window</span></div>
            <div class="key-item"><div class="square not-available"></div><span>Date(s) the patient is unavailable</span></div>
            <div class="key-item"><div class="square staff"></div><span>Staff(#) - '(#)' is the total amount of staff available for the study. The number in the box is the staff on that date. The full staff is available on any date without a box with a number</span></div>
        </div>
    </div>
      <script>
        ${timelineDataAsScript}
        var timeline = new vis.Timeline(container);
        timeline.setOptions(options);
        timeline.setGroups(groups);
        timeline.setItems(items);
      </script>
    `;
    }
}
