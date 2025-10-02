import { Timeline } from "../../custom/timeline/Timeline.js";
import { NoComplianceWindow, Period, StudyConfiguration, Task, TaskReference } from "../../language/gen/index.js";
import { StudyConfigurationModelModelUnitWriter } from "../../writer/gen/StudyConfigurationModelModelUnitWriter.js";

class MarkdownBuilder {
    private sections: string[] = [];
    
    addHeading(level: number, text: string): this {
        this.sections.push('#'.repeat(level) + ' ' + text);
        return this;
    }
    
    addParagraph(text: string): this {
        if (text?.trim()) {
            this.sections.push(text);
        }
        return this;
    }
    
    addEmptyLine(): this {
        this.sections.push('');
        return this;
    }
    
    addSeparator(): this {
        this.sections.push('\n---\n');
        return this;
    }
    
    addTable(headers: string[], rows: string[][]): this {
        const headerRow = '| ' + headers.join(' | ') + ' |';
        const separatorRow = '| ' + headers.map(() => ':----------').join(' | ') + ' |';
        const dataRows = rows.map(row => '| ' + row.join(' | ') + ' |');
        
        this.sections.push(headerRow);
        this.sections.push(separatorRow);
        this.sections.push(...dataRows);
        return this;
    }
    
    addList(items: string[], ordered: boolean = false): this {
        items.forEach((item, index) => {
            const prefix = ordered ? `${index + 1}. ` : '- ';
            this.sections.push(prefix + item);
        });
        return this;
    }
    
    addRaw(content: string): this {
        this.sections.push(content);
        return this;
    }
    
    build(): string {
        return this.sections.join('\n');
    }
    
    clear(): this {
        this.sections = [];
        return this;
    }
}

export class StudyChecklistDocumentTemplate {
    static getTimelineTablAsMarkdown(timeline: Timeline): string {
        const builder = new MarkdownBuilder();
        
        const headers = ["Visit Name", "Alternative Name", "Phase", "Window (-)", "Day/Date", "Window (+)"];
        const rows = timeline
            .getDays()
            .flatMap((timelineDay, counter) =>
                timelineDay
                    .getEventInstances()
                    .map((eventInstance, index) => [
                        eventInstance.getName(),
                        eventInstance.getScheduledEvent().configuredEvent.alternativeName,
                        (eventInstance.getScheduledEvent().configuredEvent.freOwner() as Period).name,
                        eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysBefore.count?.toString() ?? "",
                        (eventInstance.getStartDay() + 1).toString(),
                        eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysAfter.count?.toString() ?? ""
                    ])
            );
            
        return builder.addTable(headers, rows).build();
    }

    static getReferencesAsMarkdown(references) {
        if (!references || references.length === 0) return '';
        
        const builder = new MarkdownBuilder();
        const items = references.map(reference => `${reference.title} ${reference.link}`);
        return builder.addList(items).build();
    }

    static getPeopleAsMarkdown(people) {
        if (!people || people.length === 0) return '';
        
        const builder = new MarkdownBuilder();
        const items = people.map(person => `${person.name} (${person.role}) ${person.email} ${person.phoneNumber}`);
        return builder.addList(items).build();
    }

    /**
     * Build a markdown string of the form
     *
     * @param studyConfiguration
     * @returns
     */
    static getVisitsByPeriodAsMarkdown(studyConfiguration: StudyConfiguration): string {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter();

        studyConfiguration.periods.forEach((period, periodCounter) => {
            builder.addHeading(1, period.name);

            period.events.forEach((event, eventCounter) => {
                const timeOfDay = event.schedule.eventTimeOfDay
                    ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
                    : "";
                const eventRepeat = event.schedule.eventRepeat
                    ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
                    : "";
                let complianceWindow = " with no extra compliance window";
                if (
                    event.schedule.eventWindow.complianceWindow != undefined ||
                    event.schedule.eventWindow.complianceWindow instanceof ComplianceWindowOf
                ) {
                    complianceWindow = writer.writeToString(event.schedule.eventWindow.complianceWindow).replace(/"/g, "");
                }

                builder.addHeading(2, event.name);
                
                if (event.description?.text) {
                    builder.addParagraph(event.description.text);
                }

                const schedulingInfo = [
                    `This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}`,
                    `with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}`
                ];
                
                if (eventRepeat) schedulingInfo.push(eventRepeat);
                if (timeOfDay) schedulingInfo.push(timeOfDay);
                
                builder.addParagraph(schedulingInfo.join(' '));

                event.tasks.forEach((task, taskCounter) => {
                    const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);
                    
                    builder.addHeading(3, `Task: ${t.name}`);
                    
                    if (t.description?.text) {
                        builder.addParagraph(t.description.text);
                    }

                    t.steps.forEach((step, stepCounter) => {
                        builder.addHeading(4, `Step ${stepCounter + 1}: ${step.name}`);
                        builder.addParagraph(step.description.text);

                        if (step.references.length > 0) {
                            builder.addParagraph("**REFERENCES**");
                            const referencesMarkdown = StudyChecklistDocumentTemplate.getReferencesAsMarkdown(step.references);
                            if (referencesMarkdown) {
                                builder.addRaw(referencesMarkdown);
                            }
                        }

                        if (step.people.length > 0) {
                            builder.addParagraph("**PEOPLE**");
                            const peopleMarkdown = StudyChecklistDocumentTemplate.getPeopleAsMarkdown(step.people);
                            if (peopleMarkdown) {
                                builder.addRaw(peopleMarkdown);
                            }
                        }
                    });
                });
            });

            if (periodCounter < studyConfiguration.periods.length - 1) {
                builder.addSeparator();
            }
        });

        const result = builder.build();
        console.log("getVisitsByPeriodAsMarkdown visitsByPeriodMarkdown: ", result);
        return result;
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
        const builder = new MarkdownBuilder();
        
        builder
            .addSeparator()
            .addEmptyLine()
            .addHeading(1, "Timeline")
            .addEmptyLine()
            .addRaw(StudyChecklistDocumentTemplate.getTimelineTablAsMarkdown(timeline))
            .addEmptyLine()
            .addSeparator()
            .addEmptyLine()
            .addRaw(StudyChecklistDocumentTemplate.getVisitsByPeriodAsMarkdown(studyConfiguration));

        let markdown = builder.build();

        // Apply heading numbers if requested
        if (showHeadingNumbers) {
            markdown = StudyChecklistDocumentTemplate.addHeadingNumbers(markdown);
        }

        return markdown;
    }
}
