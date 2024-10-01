import { Timeline } from "custom/timeline/Timeline";
import { ScheduledEventInstance } from "custom/timeline/ScheduledEventInstance";
import { StudyConfigurationModelModelUnitWriter } from "../../writer/gen/StudyConfigurationModelModelUnitWriter";
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
                                { start: new Date(${eventInstance.getStartDayAsDateString(timeline)}), end: new Date(${eventInstance.getEndOfStartDayAsDateString(timeline)}), group: "${eventInstance.getName()}", className: "treatment-visits", title: "${eventInstance.getName() + ": " + writer.writeToString((eventInstance as ScheduledEventInstance).getScheduledEvent().configuredEvent.schedule.eventStart).replace(/"/g, "")}", content: "&nbsp;", id: "${eventInstance.getName() + getUniqueNumber()}" },
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
            <title>Timeline Chart</title>
          ${TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript)}

          </body>
          </html>

              `;
    }

    static getTimelineAsHTMLBlock(timelineDataAsScript: string): string {
        return undent`  <style>
          body, html {
            font-family: arial, sans-serif;
            font-size: 11pt;
          }

          #visualization {
            box-sizing: border-box;
            width: 100%;
            height: 300px;
          }
          
          .not-available-row-label { font-color: red !important;}
          .vis-item.screening-phase { background-color: #5ceb5c; }
          .vis-item.treatment-phase { background-color: #9370ed; }
          .vis-item.window  { background-color: #c3c3be; }
          .vis-item.screening-visits  { background-color: #bceebc; }
          .vis-item.treatment-visits  { background-color: #ccbcf4; }
          .vis-item.patient  { background-color: #95a89a; }
          .vis-item.not-available  { background-color: red; }
          .vis-item.on-scheduled-date  { background-color: #000000; }
          .vis-item.staff  { background-color: #d0e14f; }
          .vis-item.out-of-window { background-color: orange; }
          .vis-item.visit-not-found { background-color: blue; }
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
      <div id="visualization" style="position: unset !important; height:100%"></div>     
        <br>
        <p>
          Viewing the timeline:
        </p>
        <ul>
          <li>Use mouse scroll wheel or touchpad to zoom in/out of the timeline. </li>
          <li>When zoomed in, hold mouse pointer down and drag to move forward or backward through the timeline.</li>
        </ul>
        <p>
          The meaning of the rows:
        </p>
        <ul>
          <li><b>Screen, V#</b> - Names of Events/Visits:</li>
          <ul>
            <li><b>Gray</b> - The window before and after an Event/Visit.</li>
            <li><b>Purple</b> - The scheduled time of an Event/Visit.</li>
          </ul>
          <li><b>Patient</b> - Things about the patient availability and actual events: </li>
          <ul>
            <li><b>Red</b> -  A date the patient is unavailable.</li>
            <li><b>Black</b> -  A date the patient visit occurred on the scheduled date.</li>
            <li><b>Black & White Stripes</b> -  A date the patient visit occurred in the scheduled window.</li>
          </ul>
            <li><b>Staff(#)</b> - '(#)' is the total amount of staff available for the study.  The number in the box is the staff on that date. The full staff is available on any date without a box with a number.</li>
        </ul>



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
