import { Timeline } from "custom/timeline/Timeline";
import { Period, StudyConfiguration } from "language/gen";

export class StudyChecklistDocumentTemplate {

  static getTimelineTablAsMarkdown(timeline: Timeline): string {

    var template = 
`
## Table
| Visit Name | Alternative Name | Phase | Window (-) | Day/Date | Window (+)
| :---------------------- | :--------------- | :-------- | :--------- | :------- | :--------- |
${timeline.getDays().map((timelineDay, counter) => timelineDay.getEventInstances().map ((eventInstance, index) => 
        `|
        | ${eventInstance.getName()}
        | ${eventInstance.scheduledEvent.configuredEvent.alternativeName}
        | ${(eventInstance.scheduledEvent.configuredEvent.freOwner() as Period).name}
        | ${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysBefore.count ?? ''}
        | ${(eventInstance.getStartDay()+1).toString() ?? ''}
        | ${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysAfter.count ?? ''}
        |`).join('')).join('')}
`
    return template;
  }

  static getVisitsAsMarkdown(studyConfiguration: StudyConfiguration): string {
    var template =
` `;
    return template
  }

  static getStudyChecklistAsMarkdown(studyConfiguration: StudyConfiguration, timeline: Timeline): string {

    var template = 
`Study 123ABC 
==============

The timeline and visit checklists for the study.

**Author:** *Mike Vogel CRC Manager*

[toc]

# Study Timeline 

${StudyChecklistDocumentTemplate.getTimelineTablAsMarkdown(timeline)}

## Chart

[View the interactive chart of the schedule](../timeline.html)


![Overview of Timeline](./example-schedule.png)

---

${StudyChecklistDocumentTemplate.getVisitsAsMarkdown(studyConfiguration)}
`
    return template;
  }

}
