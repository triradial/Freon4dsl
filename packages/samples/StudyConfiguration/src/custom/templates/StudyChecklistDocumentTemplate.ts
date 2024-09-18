import { nodent, undent } from "@bscotch/utility";
import { Timeline } from "custom/timeline/Timeline";
import { AbstractTask, Period, StudyConfiguration, Task, TaskReference } from "../../language/gen";

export class StudyChecklistDocumentTemplate {

  static getTimelineTablAsMarkdown(timeline: Timeline): string {

    var template = nodent`
      ## Table
      | Visit Name | Alternative Name | Phase | Window (-) | Day/Date | Window (+) |
      | :---------------------- | :--------------- | :-------- | :--------- | :------- | :--------- |
      ${timeline.getDays().map((timelineDay, counter) => timelineDay.getEventInstances().map ((eventInstance, index) => 
              nodent`| ${eventInstance.getName()} | ${eventInstance.scheduledEvent.configuredEvent.alternativeName} | ${(eventInstance.scheduledEvent.configuredEvent.freOwner() as Period).name} | ${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysBefore.count ?? ''} | ${(eventInstance.getStartDay()+1).toString() ?? ''} | ${eventInstance.scheduledEvent.configuredEvent.schedule.eventWindow?.daysAfter.count ?? ''} |`).join('')).join('')}`
    return template;
  }

  static getReferencesAsMarkdown(references) {
    let template = references.map((reference, referenceCounter) => nodent`- ${reference.title} ${reference.link}
    `).join('');
    return template;
  }

  static getPeopleAsMarkdown(people) {
    let template = people.map((person, personCounter) => nodent`- ${person.name} ${person.email} ${person.phoneNumber}
    `).join('');
    return template;
  }

  /**
   * Build a markdown string of the form:
   * # Period Name
   * ## Event Name
   * ### Checklist Name
   * #### Step 1: Step Title
   * Step Description
   * Reference: Reference Title [link]
   * 
   * @param studyConfiguration 
   * @returns 
   */
  static getVisitsByPeriodAsMarkdown(studyConfiguration: StudyConfiguration): string {

    var template = studyConfiguration.periods.map((period, periodCounter) => nodent`# ${period.name}
            ${period.events.map((event, eventCounter) => `## ${event.name}
              ${event.description.text}

              ${event.tasks.map((task, taskCounter) => {
                let t = task instanceof TaskReference ? (task as TaskReference).task.referred as Task : task as Task
                return `### ${t.name}

                        ${t.description.text}

                        ${t.steps.map((step, stepCounter) => nodent`#### Step ${stepCounter+1}: ${step.title}

                        ${step.detailsDescription.text}

                        **REFERENCES**
                        ${StudyChecklistDocumentTemplate.getReferencesAsMarkdown(step.references)}
                       
                        **PEOPLE**
                        ${StudyChecklistDocumentTemplate.getPeopleAsMarkdown(step.people)}

                        `).join('')}`;
              }).join('')}
            `).join('')}
        `).join('');
    return template;
  }

  static getStudyChecklistAsMarkdown(studyConfiguration: StudyConfiguration, timeline: Timeline): string {

    var template = 
nodent`Study 123ABC 
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

${StudyChecklistDocumentTemplate.getVisitsByPeriodAsMarkdown(studyConfiguration)}
` 
    return template;
  }

}
