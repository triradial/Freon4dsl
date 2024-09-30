import { Timeline } from "custom/timeline/Timeline";
import { ScheduledEventInstance } from "custom/timeline/ScheduledEventInstance";
import { StudyConfigurationModelModelUnitWriter } from "../../writer/gen/StudyConfigurationModelModelUnitWriter";

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

        var template = `var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    ${timeline
        .getUniqueEventInstanceNames()
        .map((uniqueEventName) => `{ "content": "${uniqueEventName}", "id": "${uniqueEventName}" },`)
        .join("\n    ")}
    ${timeline.anyPatientEventInstances() ? `{ "content": "<b>Completed Visits</b>", "id": "Patient", className: 'patient' },` : ""}
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
                    ) => `${eventInstance.anyDaysBefore() ? `{ start: new Date(${eventInstance.startDayOfBeforeWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfBeforeWindowAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-${eventInstance.getName() + getUniqueNumber()}" },` : ""}
    { start: new Date(${eventInstance.getStartDayAsDateString(timeline)}), end: new Date(${eventInstance.getEndOfStartDayAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "treatment-visits", title: "${eventInstance.getName() + ": " + writer.writeToString((eventInstance as ScheduledEventInstance).getScheduledEvent().configuredEvent.schedule.eventStart).replace(/"/g, "")}", content: "&nbsp;", id: "${eventInstance.getName() + getUniqueNumber()}" },
    ${eventInstance.anyDaysAfter() ? `{ start: new Date(${eventInstance.startDayOfAfterWindowAsDateString(timeline)}), end: new Date(${eventInstance.endDayOfAfterWindowAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-${eventInstance.getName() + getUniqueNumber()}" },` : ""}`,
                )
                .filter((item) => item !== "")
                .join("\n    "),
        )
        .filter((item) => item !== "")
        .join("")}
        
    ${timeline
        .getDays()
        .map((timelineDay, counter) =>
            timelineDay
                .getPatientEventInstances()
                .map(
                    (patientEventInstance, index) =>
                        `{ start: new Date(${patientEventInstance.getStartDayAsDateString(timeline)}), end: new Date(${patientEventInstance.getEndOfStartDayAsDateString(timeline)}), group: "Patient", className: "${patientEventInstance.getClassForDisplay(timeline)}", title: "Patient visit:'${patientEventInstance.getName() + "'" + (patientEventInstance.getVisitInstanceNumber() > 1 ? " #" + patientEventInstance.getVisitInstanceNumber() : "")}", content: "&nbsp;", id: "${patientEventInstance.getName() + getUniqueNumber()}" },`,
                )
                .filter((item) => item !== "")
                .join("\n    "),
        )
        .filter((item) => item !== "")
        .join("")}

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
        .join("")}

  ])`;
        return template;
    }

    static getTimelineVisualizationHTML(timeline: Timeline): string {
        var template = ` // create visualization
  var container = document.getElementById('visualization');
    ${timeline.getOptions(timeline)}
  `;
        return template;
    }

    static getTimelineAsHTMLPage(timelineDataAsScript: string): string {
        return `<!DOCTYPE HTML>
<html>
<head>
  <title>Timeline Chart</title>

  <style>
    body, html {
      font-family: arial, sans-serif;
      font-size: 11pt;
    }

    #visualization {
      box-sizing: border-box;
      width: 100%;
      height: 300px;
    }
    
    .vis-item.screen  { background-color: #B0E2FF; }
    .vis-item.screening-phase { background-color: #5ceb5c; }
    .vis-item.treatment-phase { background-color: #9370ed; }
    .vis-item.window  { background-color: #c3c3be; }
    .vis-item.screening-visits  { background-color: #bceebc; }
    .vis-item.treatment-visits  { background-color: #ccbcf4; }
    .vis-item.patient  { background-color: #95a89a; }
    .vis-item.on-scheduled-date  { background-color: #000000; }
    .vis-item.staff  { background-color: #d0e14f; }
    .vis-item.out-of-window { background-color: orange; }
    .vis-item.visit-not-found { background-color: red; }
    .vis-item.in-window {
      background-image: repeating-linear-gradient(
        45deg,
        black,
        black 5px,
        white 2px,
        white 7px
      );
    }


    
  </style>

<script type="text/javascript" src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
<link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
<!--    -->
</head>
<body>
<h1>
  Study Timeline
</h1>
<div id="visualization"></div>

<script>
  ${timelineDataAsScript}


  var timeline = new vis.Timeline(container);
  timeline.setOptions(options);
  timeline.setGroups(groups);
  timeline.setItems(items);

</script>
</body>
</html>

    `;
    }

    static getTimelineAsHTMLBlock(timelineDataAsScript: string): string {
        return `  <style>
    body, html {
      font-family: arial, sans-serif;
      font-size: 11pt;
    }

    #visualization {
      box-sizing: border-box;
      width: 100%;
      height: auto;
    }
    
    .vis-item.screen  { background-color: #B0E2FF; }
    .vis-item.v2      { background-color: #EAEAEA; }
    .vis-item.v3 { background-color: #FA8072; }
    .vis-item.screening-phase { background-color: #5ceb5c; }
    .vis-item.treatment-phase { background-color: #9370ed; }
    .vis-item.v5  { background-color: #FFFFCC; }
    .vis-item.window  { background-color: #c3c3be; }
    .vis-item.screening-visits  { background-color: #bceebc; }
    .vis-item.treatment-visits  { background-color: #ccbcf4; }
    .vis-item.any-day  { background-color: #95a89a; }

    .vis-item-content:after {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
  </style>

<script type="text/javascript" src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
<link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
<!--    -->
<h1>
  Study Timeline
</h1>
<div id="visualization"></div>

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
