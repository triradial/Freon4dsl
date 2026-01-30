import { ComplianceWindowOf, Period, StudyConfiguration, Task, TaskReference } from "../../language/gen/index.js";
import { StudyConfigurationModelModelUnitWriter } from "../../writer/gen/StudyConfigurationModelModelUnitWriter.js";
import { Timeline } from "../timeline/Timeline.js";
import { dedent } from "../utils/dedent.js";

export class StudyChecklistDocumentTemplate {
    static getTimelineTablAsMarkdown(timeline: Timeline): string {
        const header = "| Visit Name | Alternative Name | Phase | Window (-) | Day/Date | Window (+) |\n| :---------------------- | :--------------- | :-------- | :--------- | :------- | :--------- |";
        
        const rows = timeline
            .getDays()
            .map((timelineDay, counter) =>
                timelineDay
                    .getEventInstances()
                    .map(
                        (eventInstance, index) =>
                            `| ${eventInstance.getName()} | ${eventInstance.getScheduledEvent().configuredEvent.alternativeName} | ${(eventInstance.getScheduledEvent().configuredEvent.freOwner() as Period).name} | ${eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysBefore.count ?? ""} | ${(eventInstance.getStartDay() + 1).toString() ?? ""} | ${eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysAfter.count ?? ""} |`,
                    )
                    .join("\n"),
            )
            .join("\n");
            
        return `${header}\n${rows}`;
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
        let writer = new StudyConfigurationModelModelUnitWriter();

        var visitsByPeriodMarkdown = studyConfiguration.periods
            .map(
                (period, periodCounter) => `
                # ${period.name}
                    ${period.events
                        .map((event, eventCounter) => {
                            const timeOfDay = event.schedule.eventTimeOfDay
                                ? "limited to" + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
                                : "";
                            const eventRepeat = event.schedule.eventRepeat
                                ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
                                : "";
                            var complianceWindow = " with no extra compliance window";
                            if (
                                event.schedule.eventWindow.complianceWindow != undefined ||
                                event.schedule.eventWindow.complianceWindow instanceof ComplianceWindowOf
                            ) {
                                complianceWindow = writer.writeToString(event.schedule.eventWindow.complianceWindow).replace(/"/g, "");
                            }

                            return `
                ## ${event.name}

                ${event.description ? event.description.text : ""}

                This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}
                with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}  
                ${eventRepeat}
                ${timeOfDay}
                ${event.tasks
                    .map((task, taskCounter) => {
                        let t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);
                        return `
                ### Task:${t.name}

                ${t.description ? t.description.text : ""}

                ${t.steps
                    .map(
                        (step, stepCounter) => `
                #### Step ${stepCounter + 1}: ${step.name}

                ${step.description.text}

                ${step.references.length > 0 ? "**REFERENCES**" : ""}
                ${StudyChecklistDocumentTemplate.getReferencesAsMarkdown(step.references)}
            
                ${step.people.length > 0 ? "**PEOPLE**" : ""}
                ${StudyChecklistDocumentTemplate.getPeopleAsMarkdown(step.people)}

                `,
                        )
                        .join("\n")}`;
                        })
                    .join("\n")}
                `;
                })
                .join(`

                ---
                
                `)}
                `,
                )
            .join("\n");
        visitsByPeriodMarkdown = dedent`${visitsByPeriodMarkdown}`;
        console.log("getVisitsByPeriodAsMarkdown visitsByPeriodMarkdown: ", visitsByPeriodMarkdown);
        return visitsByPeriodMarkdown;
    }

    /**
     * Generic function to add hierarchical heading numbers to any markdown content
     * @param markdown The markdown content to process
     * @returns The markdown content with heading numbers added
     */
    static addHeadingNumbers(markdown: string): string {
        const lines = markdown.split('\n');
        const headingCounters: number[] = [0, 0, 0, 0, 0, 0]; // Support up to 6 heading levels
        
        return lines.map(line => {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const title = headingMatch[2];
                
                // Reset counters for deeper levels
                for (let i = level; i < headingCounters.length; i++) {
                    headingCounters[i] = 0;
                }
                
                // Increment counter for current level
                headingCounters[level - 1]++;
                
                // Build the hierarchical number
                const number = headingCounters.slice(0, level).join('.');
                return `${headingMatch[1]} ${number}. ${title}`;
            }
            return line;
        }).join('\n');
    }

    static getStudyChecklistAsMarkdown(studyConfiguration: StudyConfiguration, timeline: Timeline, showHeadingNumbers: boolean = false): string {
        let markdown = dedent` 

---


# Timeline 

${StudyChecklistDocumentTemplate.getTimelineTablAsMarkdown(timeline)}

---

${StudyChecklistDocumentTemplate.getVisitsByPeriodAsMarkdown(studyConfiguration)}
`;

        // Apply heading numbers if requested
        if (showHeadingNumbers) {
            markdown = StudyChecklistDocumentTemplate.addHeadingNumbers(markdown);
        }

        return markdown;
    }
}
