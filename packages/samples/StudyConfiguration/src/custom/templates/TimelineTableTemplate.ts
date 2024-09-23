
import { Timeline } from '../timeline/Timeline';
import { ScheduledEventInstance } from '../timeline/ScheduledEventInstance';
import { Period } from "../../language/gen/index";
import {StudyConfigurationModelModelUnitWriter} from '../../writer/gen/StudyConfigurationModelModelUnitWriter';

export class TimelineTableTemplate {

  static getTimelineTableHTMLStyles(): string {
    var template = 
`
<style>
.table_component {
    overflow: auto;
    width: 95%;
}

.table_component table {
    border: 1px solid #dededf;
    height: 100%;
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 1px;
    text-align: left;
}

.table_component caption {
    caption-side: top;
    text-align: left;
}

.table_component th {
    border: 1px solid #dededf;
    background-color: #eceff1;
    color: #000000;
    padding: 5px;
}

.table_component td {
    border: 1px solid #dededf;
    background-color: #ffffff;
    color: #000000;
    padding: 5px;
}
</style>
`
    return template;
  }

  static getTimelineTableHTML(timeline: Timeline): string {

    var template = 
`
<div class="table_component" role="region" tabindex="0">
<table>
  <caption>Study Timeline Table</caption>
  <thead>
    <tr>
      <th>Visit Name</th>
      <th>Alternative Name</th>
      <th>Phase</th>
      <th>Window (-)</th>
      <th>Day/Date</th>
      <th>Window (+)</th>
    </tr>
    </thead>
    <tbody>

${timeline.getDays().map((timelineDay, counter) => timelineDay.getEventInstances().map ((eventInstance, index) => 
        `<tr>
        <td>${eventInstance.getName()}</td>
        <td>${eventInstance.scheduledEvent.configuredEvent.alternativeName}</td>
        <td>${(eventInstance.scheduledEvent.configuredEvent.freOwner() as Period).name}</td>
        <td>${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysBefore.count ?? ''}</td>
        <td>${(eventInstance.getStartDay()+1).toString() ?? ''}</td>
        <td>${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysAfter.count ?? ''}</td>
        </tr>`).join('')).join('')}
      </tr>
    </tbody>
  </table>
`
    return template;
  }

  static getTimeLineTableAndStyles(timeline: Timeline): string {
    return TimelineTableTemplate.getTimelineTableHTMLStyles() + TimelineTableTemplate.getTimelineTableHTML(timeline);
  }

  static getTimelineTableHTMLPage(timelineTableAsScript: string): string {
    return `<!DOCTYPE HTML>
<html>
<head>
</head>
<body>
  ${TimelineTableTemplate.getTimelineTableHTMLStyles()}
  ${timelineTableAsScript}
</body>
</html>
`;
  }

  static addSomeSpace(): string {
    return `<br><br><br>`;
  }

}