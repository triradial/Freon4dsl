import { nodent, undent } from "@bscotch/utility";
import { Timeline } from "../../custom/timeline/Timeline.js";
import { AbstractTask, Period, StudyConfiguration, Task, TaskReference } from "../../language/gen/index.js";

export class StudyChecklistDocumentTemplate {
    static getTimelineTablAsMarkdown(timeline: Timeline): string {
        var template = nodent`
      ## Table
      | Visit Name | Alternative Name | Phase | Window (-) | Day/Date | Window (+) |
      | :---------------------- | :--------------- | :-------- | :--------- | :------- | :--------- |
      ${timeline
          .getDays()
          .map((timelineDay, counter) =>
              timelineDay
                  .getEventInstances()
                  .map(
                      (eventInstance, index) =>
                          nodent`| ${eventInstance.getName()} | ${eventInstance.getScheduledEvent().configuredEvent.alternativeName} | ${(eventInstance.getScheduledEvent().configuredEvent.freOwner() as Period).name} | ${eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysBefore.count ?? ""} | ${(eventInstance.getStartDay() + 1).toString() ?? ""} | ${eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysAfter.count ?? ""} |`,
                  )
                  .join(""),
          )
          .join("")}`;
        return template;
    }

    static getReferencesAsMarkdown(references) {
        let template = references
            .map(
                (reference, referenceCounter) => `- ${reference.title} ${reference.link}
    `,
            )
            .join("");
        return template;
    }

    static getPeopleAsMarkdown(people) {
        let template = people
            .map(
                (person, personCounter) => `- ${person.name} (${person.role}) ${person.email} ${person.phoneNumber}
    `,
            )
            .join("");
        return template;
    }

    /**
     * Build a markdown string of the form
     *
     * @param studyConfiguration
     * @returns
     */
    static getVisitsByPeriodAsMarkdown(studyConfiguration: StudyConfiguration): string {
        var template = studyConfiguration.periods
            .map(
                (period, periodCounter) => nodent`# ${period.name}
            ${period.events
                .map(
                    (event, eventCounter) => `## ${event.name}
              ${event.description.text}

              ${event.tasks
                  .map((task, taskCounter) => {
                      let t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);
                      return `### ${t.name}

                        ${t.description.text}

                        ${t.steps
                            .map(
                                (step, stepCounter) => nodent`#### Step ${stepCounter + 1}: ${step.title}

                        ${step.detailsDescription.text}

                        ${step.references.length > 0 ? "**REFERENCES**" : ""}
                        ${StudyChecklistDocumentTemplate.getReferencesAsMarkdown(step.references)}
                       
                        ${step.people.length > 0 ? "**PEOPLE**" : ""}
                        ${StudyChecklistDocumentTemplate.getPeopleAsMarkdown(step.people)}

                        `,
                            )
                            .join("")}`;
                  })
                  .join("")}
            `,
                )
                .join("")}
        `,
            )
            .join("");
        return template;
    }

    static getStudyChecklistAsMarkdown(studyConfiguration: StudyConfiguration, timeline: Timeline): string {
        var template = nodent`Study 123ABC 
==============

The timeline and visit checklists for the study.

[toc]

# Study Timeline 

${StudyChecklistDocumentTemplate.getTimelineTablAsMarkdown(timeline)}

## Chart

[View the interactive chart of the schedule](./timeline.html)


![Overview of Timeline](./docs/example-schedule.png)

---

${StudyChecklistDocumentTemplate.getVisitsByPeriodAsMarkdown(studyConfiguration)}
`;
        return template;
    }
}
