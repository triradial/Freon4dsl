import { Timeline } from "../../custom/timeline/Timeline.js";
import { NoComplianceWindow, Period, StudyConfiguration, Task, TaskReference } from "../../language/gen/index.js";
import { StudyConfigurationModelModelUnitWriter } from "../../writer/gen/StudyConfigurationModelModelUnitWriter.js";

class MarkdownBuilder {
    private sections: string[] = [];
    private currentLevel: number = 0;

    addHeading(level: number, text: string, addSpacing: boolean = true): this {
        if (addSpacing && this.sections.length > 0) {
            // Add single line spacing before headings (except the first one)
            this.sections.push('');
        }
        this.sections.push('#'.repeat(level) + ' ' + text);
        if (addSpacing) {
            // Add spacing after headings
            this.sections.push('');
        }
        return this;
    }
    
    addParagraph(text: string, addSpacing: boolean = false): this {
        if (text?.trim()) {
            this.sections.push(text);
            if (addSpacing) {
                this.sections.push('');
            }
        }
        return this;
    }
    
    addEmptyLine(): this {
        this.sections.push('');
        return this;
    }
    
    addSeparator(): this {
        this.sections.push('');
        this.sections.push('---');
        this.sections.push('');
        return this;
    }
    
    addTable(headers: string[], rows: string[][]): this {
        const headerRow = '| ' + headers.join(' | ') + ' |';
        const separatorRow = '| ' + headers.map(() => ':----------').join(' | ') + ' |';
        const dataRows = rows.map(row => '| ' + row.join(' | ') + ' |');
        
        this.sections.push('');
        this.sections.push(headerRow);
        this.sections.push(separatorRow);
        this.sections.push(...dataRows);
        this.sections.push('');
        return this;
    }
    
    addList(items: string[], ordered: boolean = false): this {
        this.sections.push('');
        items.forEach((item, index) => {
            const prefix = ordered ? `${index + 1}. ` : '- ';
            this.sections.push(prefix + item);
        });
        this.sections.push('');
        return this;
    }
    
    addVisualSeparator(): this {
        this.sections.push('');
        this.sections.push('---');
        this.sections.push('');
        return this;
    }

    addSectionBreak(): this {
        this.sections.push('');
        this.sections.push('---');
        this.sections.push('');
        return this;
    }
    
    addSpace(): this {
        this.sections.push('');
        return this;
    }
    
    addExtraSpace(): this {
        this.sections.push('');
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
        
        // Create table with spacing between each row
        const headerRow = '| ' + headers.join(' | ') + ' |';
        const separatorRow = '| ' + headers.map(() => ':----------').join(' | ') + ' |';
        
        builder.addRaw(headerRow);
        builder.addRaw(separatorRow);
        
        // Add each row without extra spacing
        rows.forEach((row) => {
            const dataRow = '| ' + row.join(' | ') + ' |';
            builder.addRaw(dataRow);
        });
            
        return builder.build();
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
            // Add period heading with proper spacing
            builder.addHeading(1, period.name);

            period.events.forEach((event, eventCounter) => {
                const timeOfDay = event.schedule.eventTimeOfDay
                    ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
                    : "";
                const eventRepeat = event.schedule.eventRepeat
                    ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
                    : "";
                let complianceWindow = " with no extra compliance window";
                if (!event.schedule.eventWindow.complianceWindow) {
                    event.schedule.eventWindow.complianceWindow = new NoComplianceWindow();
                }
                complianceWindow = writer.writeToString(event.schedule.eventWindow.complianceWindow).replace(/"/g, "");

                // Event heading with spacing and visual indicator
                builder.addHeading(2, `📋 ${event.name}`);
                
                if (event.description?.text) {
                    builder.addParagraph(event.description.text, true);
                }

                const schedulingInfo = [
                    `This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}`,
                    `with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}`
                ];
                
                if (eventRepeat) schedulingInfo.push(eventRepeat);
                if (timeOfDay) schedulingInfo.push(timeOfDay);
                
                builder.addParagraph(schedulingInfo.join(' '), true);

                event.tasks.forEach((task, taskCounter) => {
                    const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);
                    
                    // Task heading with spacing and visual indicator
                    builder.addHeading(3, `✅ Task: ${t.name}`);
                    
                    if (t.description?.text) {
                        builder.addParagraph(t.description.text, true);
                    }

                    t.steps.forEach((step, stepCounter) => {
                        // Step heading with spacing and visual indicator
                        builder.addHeading(4, `Step ${stepCounter + 1}: ${step.name}`);
                        if (step.description?.text) {
                            builder.addParagraph(step.description.text, true);
                        }

                        if (step.references.length > 0) {
                            builder.addParagraph("* REFERENCES**");
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

            // Add visual separator between periods (except after the last one)
            if (periodCounter < studyConfiguration.periods.length - 1) {
                builder.addSectionBreak();
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
        
        // Add timeline section
        builder
            .addHeading(1, "Timeline Table", false)  // Don't add extra spacing for first heading
            .addRaw(StudyChecklistDocumentTemplate.getTimelineTablAsMarkdown(timeline))
            .addSectionBreak();

        // Add visits by period section with enhanced visual spacing
        const visitsMarkdown = StudyChecklistDocumentTemplate.getVisitsByPeriodAsMarkdown(studyConfiguration);
        builder.addRaw(visitsMarkdown);

        let markdown = builder.build();

        // Apply heading numbers if requested
        if (showHeadingNumbers) {
            markdown = StudyChecklistDocumentTemplate.addHeadingNumbers(markdown);
        }

        return markdown;
    }
}
