
import { EventInstance, Timeline, TimelineEventInstance } from '../timeline/Timeline';
import {StudyConfigurationModelModelUnitWriter} from '../../writer/gen/StudyConfigurationModelModelUnitWriter';

let uniqueCounter = 0;

export function resetTimelineScriptTemplate() {
  uniqueCounter = 0;
}

function getUniqueNumber(): number {
  return uniqueCounter++;
}

const referenceDate = new Date(2024, 0, 1);
// const referenceDate = new Date(2023, 11, 31);

export class TimelineScriptTemplate {

  static getTimelineDataHTML(timeline: Timeline): string {
    let writer = new StudyConfigurationModelModelUnitWriter();

    var template = 
`var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    ${timeline.getUniqueEventInstanceNames().map((uniqueEventName) => `{ "content": "${uniqueEventName}", "id": "${uniqueEventName}" },`).join('\n    ')}
  ]);

var items = new vis.DataSet([
    ${timeline.getDays().map((timelineDay, counter) => {
      const periodInstances = timelineDay.getPeriodInstances();
      if (periodInstances.length === 0) {
        return '';
      }
      return periodInstances.map((periodInstance, index) => 
        `{ start: new Date(${periodInstance.getStartDayAsDateString(referenceDate, timeline)}), end: new Date(${periodInstance.getEndDayStringAsDateFrom(referenceDate, timeline)}), group: "Phase", className: "${periodInstance.getName().toLowerCase()}-phase", title: "Day: ${periodInstance.getStartDay()}", content: "<b>${periodInstance.getName()}</b>", id: "${periodInstance.getName() + getUniqueNumber()}" },`
      ).filter(item => item !== '').join('');
    }).filter(item => item !== '').join("\n    ")}
    ${timeline.getDays().map((timelineDay, counter) => timelineDay.getEventInstances().map((eventInstance, index) => `${eventInstance.anyDaysBefore()  ? `{ start: new Date(${eventInstance.startDayOfBeforeWindowAsDateString(referenceDate, timeline)}), end: new Date(${eventInstance.endDayOfBeforeWindowAsDateString(referenceDate, timeline)}), group: "${eventInstance.getName()}", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-${eventInstance.getName()+ getUniqueNumber()}" },` : ''}
    { start: new Date(${eventInstance.getStartDayAsDateString(referenceDate, timeline)}), end: new Date(${eventInstance.getEndOfStartDayAsDateString(referenceDate, timeline)}), group: "${eventInstance.getName()}", className: "treatment-visits", title: "${eventInstance.getName() + ": " + writer.writeToString((eventInstance as EventInstance).scheduledEvent.configuredEvent.schedule.eventStart).replace(/"/g, '')}", content: "&nbsp;", id: "${eventInstance.getName()+ getUniqueNumber()}" },
    ${eventInstance.anyDaysAfter()  ? `{ start: new Date(${eventInstance.startDayOfAfterWindowAsDateString(referenceDate, timeline)}), end: new Date(${eventInstance.endDayOfAfterWindowAsDateString(referenceDate, timeline)}), group: "${eventInstance.getName()}", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-${eventInstance.getName()+ getUniqueNumber()}" },` : ''}`).filter(item => item !== '').join('\n    ')).filter(item => item !== '').join('')}
  ])`
    return template;
  }


  static getTimelineVisualizationHTML(timeline: Timeline): string {
    var template = 
` // create visualization
  var container = document.getElementById('visualization');
  var options = {
    format: {
        minorLabels: {
            millisecond:'',
            second:     '',
            minute:     '',
            hour:       '',
            weekday:    '',
            day:        'DDD',
            week:       '',
            month:      '',
            year:       ''
        },
    },
    timeAxis: {scale: 'day', step: 1},
    showMajorLabels: false,
    orientation: 'both',
    start: new Date(2024,0,1),
    end: new Date(2024, 0, ${timeline.getMaxDayOnTimeline()+1}, 23, 59, 59),
    min: new Date(2024, 0, 1),
    max: new Date(2024, 0, ${timeline.getMaxDayOnTimeline()+1}, 23, 59, 59),
    margin: {
        item: {
            horizontal: 0,
        },
    },
  };`
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
    .vis-item.v2      { background-color: #EAEAEA; }
    .vis-item.v3 { background-color: #FA8072; }
    .vis-item.screening-phase { background-color: #5ceb5c; }
    .vis-item.treatment-phase { background-color: #9370ed; }
    .vis-item.v5  { background-color: #FFFFCC; }
    .vis-item.window  { background-color: #c3c3be; }
    .vis-item.screening-visits  { background-color: #bceebc; }
    .vis-item.treatment-visits  { background-color: #ccbcf4; }
    .vis-item.any-day  { background-color: #95a89a; }

    
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

    `;  }

}