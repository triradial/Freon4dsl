import { Timeline } from "../timeline/Timeline.js";
import { Period, RecommendedWindowOf } from "../../language/gen/index.js";

export class TimelineTableTemplate {
    static getTimelineTableHTMLStyles(external: boolean = false): string {
        var template = ``;
        if (external == false) {
            return template;
        } else {
            return ``;
        }
    }

    static getTimelineTableHTML(timeline: Timeline): string {
        var template = `
<div class="table_component" role="region" tabindex="0">
<table>
  <caption>Study Timeline</caption>
  <thead>
    <tr>
      <th class="stretch">Visit Name</th>
      <th class="stretch">Alternative Name</th>
      <th class="stretch">Phase</th>
      <th class="fit">Window (-)</th>
      <th class="fit">Day/Date</th>
      <th class="fit">Window (+)</th>
      <th></th>
    </tr>
    </thead>
    <tbody>

${timeline
    .getDays()
    .map((timelineDay, counter) =>
        timelineDay
            .getEventInstances()
            .map((eventInstance, index) => {
                const eventWindow = eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow;
                const daysBefore = eventWindow instanceof RecommendedWindowOf ? eventWindow.daysBefore.count.toString() : "";
                const daysAfter = eventWindow instanceof RecommendedWindowOf ? eventWindow.daysAfter.count.toString() : "";
                return `<tr>
        <td>${eventInstance.getName()}</td>
        <td>${eventInstance.getAlternativeName()}</td>
        <td>${(eventInstance.getScheduledEvent().configuredEvent.freOwner() as Period).name}</td>
        <td class="text-center">${daysBefore}</td>
        <td class="text-center">${(eventInstance.getStartDay() + 1).toString() ?? ""}</td>
        <td class="text-center">${daysAfter}</td>
        <td>&nbsp;</td>
        </tr>`;
            })
            .join(""),
    )
    .join("")}
      </tr>
    </tbody>
  </table>
</div>
`;
        return template;
    }

    static getTimeLineTableAndStyles(timeline: Timeline): string {
        return TimelineTableTemplate.getTimelineTableHTMLStyles() + TimelineTableTemplate.getTimelineTableHTML(timeline);
    }

    static getTimelineTableHTMLPage(timelineTableAsScript: string): string {
        return `<!DOCTYPE HTML>
<html>
<head>
    <title>Timeline Table</title>
</head>
<body>
  ${TimelineTableTemplate.getTimelineTableHTMLStyles()}
  ${timelineTableAsScript}
</body>
</html>
`;
    }
}
