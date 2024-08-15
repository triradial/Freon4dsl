
import { EventInstance, Timeline } from '../timeline/Timeline';
import { Period } from "../../language/gen/index";
import {StudyConfigurationModelModelUnitWriter} from '../../writer/gen/StudyConfigurationModelModelUnitWriter';

export class TimelineTableTemplate {

  static getTimelineTableHTML(timeline: Timeline): string {
    let writer = new StudyConfigurationModelModelUnitWriter();

    var template = 
`<table>
  <tr>
    <th>Visit Name</th>
    <th>Alternative Name</th>
    <th>Phase</th>
    <th>Window (-)</th>
    <th>Date</th>
    <th>Window (+)</th>
  </tr>${timeline.getDays().map((timelineDay, counter) => timelineDay.getEventInstances().map ((eventInstance, index) => 
    `<tr>
    <td>${eventInstance.getName()}</td>
    <td>${eventInstance.scheduledEvent.configuredEvent.alternativeName}</td>
    <td>${(eventInstance.scheduledEvent.configuredEvent.freOwner() as Period).name}</td>
    <td>${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysBefore.count ?? ''}</td>
    <td>${eventInstance.scheduledEvent?.day(timeline) ?? ''}</td>
    <td>${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysAfter.count ?? ''}</td>
    </tr>`).join('')).join('')}
  </tr>
</table>
`
    return template;
  }

  static getTimelineTableHTMLPage(timelineTableAsScript: string): string {
    return `<!DOCTYPE HTML>
<html>
<head>
</head>
<body>
<h1>
  Study Timeline Table
</h1>
  ${timelineTableAsScript}
</body>
</html>
`;
  }

}