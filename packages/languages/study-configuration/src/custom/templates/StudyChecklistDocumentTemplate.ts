import { Timeline } from "../timeline/Timeline.js";
import { Period, Person, PersonReference, StudyConfiguration, Task, TaskReference } from "../../freon/language/index.js";
import { StudyConfigurationModelModelUnitWriter } from "../../freon/writer/StudyConfigurationModelModelUnitWriter.js";

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
    private static indentMultilineHtml(html: string): string {
        return html.replace(/\r?\n/g, '\n  ');
    }

    private static formatPhoneNumber(raw: string): string {
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        if (digits.length === 11 && digits.startsWith('1')) {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return raw;
    }
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

        const lines: string[] = [];
        references.forEach(reference => {
            const name = reference.name ?? '';
            const link = typeof reference.link === 'string' ? reference.link : '';
            const desc = typeof reference.description === 'string'
                ? reference.description
                : (reference.description?.text ?? reference.description?.rawText ?? '');
            const linkPart = link ? ` ([${link}](${link}))` : '';
            const title = name ? `**${name}**${linkPart}` : linkPart.replace(/^ \(/, '(');
            if (title) {
                lines.push(`- ${title}`);
                if (desc) {
                    const indentedDesc = StudyChecklistDocumentTemplate.indentMultilineHtml(desc);
                    lines.push(`  <div class="checklist-subtext">${indentedDesc}</div>`);
                }
            }
        });
        return lines.length ? `${lines.join('\n')}\n` : '';
    }

    static getPeopleAsMarkdown(people) {
        if (!people || people.length === 0) return '';
        
        const DEBUG_PEOPLE = false; // set to true to log people data used for checklist (email, phone, description)
        if (DEBUG_PEOPLE) {
            console.log('[StudyChecklist getPeopleAsMarkdown] people count:', people?.length);
        }

        const lines: string[] = [];
        people.forEach((person, index) => {
            const actualPerson: Person | undefined = person instanceof PersonReference
                ? (person as PersonReference).person?.referred
                : (person as Person);
            if (!actualPerson) {
                if (DEBUG_PEOPLE) console.log('[StudyChecklist getPeopleAsMarkdown] person', index, '— no actualPerson', { personKeys: person != null ? Object.keys(person as object) : null });
                return;
            }
            const personName = actualPerson.name ?? '';
            const role = actualPerson.role;
            const roleName = role?.referred?.name ?? role?.name ?? '';
            const email = actualPerson.email ?? '';
            const phone = actualPerson.phoneNumber ?? '';
            const descSource = actualPerson.description;
            const desc: string = typeof descSource === 'string' ? descSource : (descSource?.text ?? descSource?.rawText ?? '');
            const metaParts: string[] = [];
            // Role displayed in name line
            if (email) metaParts.push(`${email}`);
            if (phone) metaParts.push(`${StudyChecklistDocumentTemplate.formatPhoneNumber(phone)}`);

            if (DEBUG_PEOPLE) {
                const descObj = actualPerson.description as { text?: string; rawText?: string } | undefined;
                console.log('[StudyChecklist getPeopleAsMarkdown] person', index, 'actualPerson:', {
                    name: actualPerson.name,
                    email: actualPerson.email,
                    phoneNumber: actualPerson.phoneNumber,
                    description: actualPerson.description,
                    descriptionType: typeof actualPerson.description,
                    descText: descObj?.text,
                    descRawText: descObj?.rawText,
                    roleName: role?.referred?.name ?? (role as { name?: string })?.name,
                    computed: { personName, email, phone, desc, roleName },
                    output: { personName, metaParts, desc }
                });
            }
            if (personName) {
                const roleSuffix = roleName ? ` (${roleName})` : '';
                lines.push(`- **${personName}**${roleSuffix}`);
            } else if (metaParts.length > 0) {
                lines.push(`- **${metaParts[0]}**`);
                metaParts.shift();
            }
            metaParts.forEach(part => {
                lines.push(`  <div class="checklist-subtext">${part}</div>`);
            });
            if (desc) {
                const indentedDesc = StudyChecklistDocumentTemplate.indentMultilineHtml(desc);
                lines.push(`  <div class="checklist-subtext">${indentedDesc}</div>`);
            }
        });
        return lines.length ? `${lines.join('\n')}\n` : '';
    }

    static getSystemsAsMarkdown(systems) {
        if (!systems || systems.length === 0) return '';
        
        const lines: string[] = [];
        systems.forEach(system => {
            const s = (system as any).system?.referred ?? (system as any).referred ?? system;
            const name = s?.name ?? '';
            const accessedAt = s?.accessedAt;
            const accessedUrl = typeof accessedAt === 'string' ? accessedAt : accessedAt?.url ?? '';
            const accessedPhone = typeof accessedAt === 'string' ? '' : (accessedAt?.phoneNumber ?? '');
            const desc = typeof s?.description === 'string' ? s.description : (s?.description?.text ?? s?.description?.rawText ?? '');
            const urlPart = accessedUrl ? `([${accessedUrl}](${accessedUrl}))` : '';
            const phonePart = accessedPhone ? `${StudyChecklistDocumentTemplate.formatPhoneNumber(accessedPhone)}` : '';
            const accessParts = [urlPart, phonePart].filter(Boolean);
            const accessPart = accessParts.length > 0 ? ` ${accessParts.join(' ')}` : '';
            if (name) {
                lines.push(`- **${name}**${accessPart}`);
            } else if (accessPart) {
                lines.push(`- ${accessPart.trim()}`);
            }
            if (desc) {
                const indentedDesc = StudyChecklistDocumentTemplate.indentMultilineHtml(desc);
                lines.push(`  <div class="checklist-subtext">${indentedDesc}</div>`);
            }
        });
        return lines.length ? `${lines.join('\n')}\n` : '';
    }

    /**
     * Helper method to render a step as markdown
     * @param builder The markdown builder
     * @param step The step to render
     * @param stepCounter The step index (0-based)
     */
    private static renderStepAsMarkdown(builder: MarkdownBuilder, step: any, stepCounter: number): void {
        // Step heading with spacing and visual indicator
        builder.addHeading(4, `Step ${stepCounter + 1}: ${step.name}`);
        const stepDesc = step.description?.text ?? step.description?.rawText;
        if (stepDesc) {
            builder.addParagraph(stepDesc, true);
        }

        if (step.references?.length > 0) {
            builder.addRaw('<p class="checklist-group-label">REFERENCES</p>');
            builder.addEmptyLine();
            const referencesMarkdown = StudyChecklistDocumentTemplate.getReferencesAsMarkdown(step.references);
            if (referencesMarkdown) {
                builder.addRaw(referencesMarkdown);
            }
        }

        if (step.people?.length > 0) {
            builder.addRaw('<p class="checklist-group-label">PEOPLE</p>');
            builder.addEmptyLine();
            const peopleMarkdown = StudyChecklistDocumentTemplate.getPeopleAsMarkdown(step.people);
            if (peopleMarkdown) {
                builder.addRaw(peopleMarkdown);
            }
        }
        if (step.systems?.length > 0) {
            builder.addRaw('<p class="checklist-group-label">SYSTEMS</p>');
            builder.addEmptyLine();
            const systemsMarkdown = StudyChecklistDocumentTemplate.getSystemsAsMarkdown(step.systems);
            if (systemsMarkdown) {
                builder.addRaw(systemsMarkdown);
            }
        }
    }

    /**
     * Helper method to render a task as markdown
     * @param builder The markdown builder
     * @param task The task to render (can be Task or TaskReference)
     * @param taskCounter The task index (0-based)
     * @param taskPrefix Optional prefix for the task heading (e.g., emoji)
     */
    private static renderTaskAsMarkdown(builder: MarkdownBuilder, task: Task | TaskReference, taskCounter: number, taskPrefix: string = ""): void {
        const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);
        
        // Task heading with spacing and visual indicator
        builder.addHeading(3, `${taskPrefix}Task: ${t.name}`);
        
        const taskDesc = t.description?.text ?? t.description?.rawText;
        if (taskDesc) {
            builder.addParagraph(taskDesc, true);
        }

        t.steps.forEach((step, stepCounter) => {
            StudyChecklistDocumentTemplate.renderStepAsMarkdown(builder, step, stepCounter);
        });
    }

    /**
     * Helper method to render an event as markdown
     * @param builder The markdown builder
     * @param writer The model writer
     * @param event The event to render
     * @param eventCounter The event index (0-based)
     * @param headingPrefix Optional prefix for the event heading (e.g., emoji)
     * @param taskPrefix Optional prefix for task headings (e.g., emoji)
     */
    private static renderEventAsMarkdown(builder: MarkdownBuilder, writer: StudyConfigurationModelModelUnitWriter, event: any, eventCounter: number, headingPrefix: string = "", taskPrefix: string = ""): void {
        const timeOfDay = event.schedule.eventTimeOfDay
            ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
            : "";
        const eventRepeat = event.schedule.eventRepeat
            ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
            : "";
        let complianceWindow = "";
        if (event.schedule.eventWindow?.complianceWindow) {
            complianceWindow = " " + writer.writeToString(event.schedule.eventWindow.complianceWindow).replace(/"/g, "");
        } else {
            complianceWindow = " with no extra compliance window";
        }

        // Event heading with spacing and visual indicator
        builder.addHeading(2, `${headingPrefix}${event.name}`);
        
        const eventDesc = event.description?.text ?? event.description?.rawText;
        if (eventDesc) {
            builder.addParagraph(eventDesc, true);
        }

        const schedulingInfo = [
            `This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}`,
            `with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}`
        ];
        
        if (eventRepeat) schedulingInfo.push(eventRepeat);
        if (timeOfDay) schedulingInfo.push(timeOfDay);
        
        builder.addParagraph(schedulingInfo.join(' '), true);

        event.tasks.forEach((task, taskCounter) => {
            StudyChecklistDocumentTemplate.renderTaskAsMarkdown(builder, task, taskCounter, taskPrefix);
        });
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
                StudyChecklistDocumentTemplate.renderEventAsMarkdown(builder, writer, event, eventCounter);
            });

            // Add visual separator between periods (except after the last one)
            if (periodCounter < studyConfiguration.periods.length - 1) {
                builder.addSectionBreak();
            }
        });

        const result = builder.build();
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
                
                // Build the hierarchical number (no period after the last digit)
                const number = headingCounters.slice(0, level).join('.');
                return `${headingMatch[1]} ${number}: ${title}`;
            }
            return line;
        }).join('\n');
    }

    /**
     * Generate a slug for a heading that matches the UI's markdown-it ID generation.
     */
    static slugifyHeading(text: string): string {
        return text.toLowerCase()
            .replace(/[^\w\- ]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Build a numbered TOC with links for all headings in the markdown.
     */
    static getTableOfContentsAsMarkdown(markdown: string): string {
        const lines = markdown.split('\n');
        const tocLines: string[] = [];
        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (!headingMatch) continue;
            const level = headingMatch[1].length;
            const title = headingMatch[2];
            const id = StudyChecklistDocumentTemplate.slugifyHeading(title);
            const indent = '    '.repeat(Math.max(0, level - 1));
            tocLines.push(`${indent}1. [${title}](#${id})`);
        }

        if (tocLines.length === 0) return '';
        return ['## Table of Contents', '', ...tocLines, ''].join('\n');
    }

    /**
     * Get visits/events for a specific date as markdown.
     * This creates a checklist for just the events scheduled for that date.
     * Uses the main template rendering logic to eliminate duplication.
     * 
     * @param timeline The timeline to search
     * @param targetDate The date to get visits for
     * @param studyConfiguration The study configuration (needed for event details)
     * @returns Markdown string with the visit checklist for that date
     */
    static getVisitForDateAsMarkdown(timeline: Timeline, targetDate: Date, studyConfiguration: StudyConfiguration): string {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter();
        
        // Normalize target date to midnight for comparison
        const normalizedTargetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        
        // Find the day number that corresponds to this date
        // We need to search through all days in the timeline to find the one matching the target date
        let targetDay: number | undefined = undefined;
        
        // Search through all days in the timeline to find the one matching the target date
        for (const timelineDay of timeline.getDays()) {
            const eventInstances = timelineDay.getEventInstances();
            if (eventInstances.length > 0) {
                const dayDate = eventInstances[0].getStartDayAsDate(timeline);
                if (dayDate) {
                    const normalizedDayDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);
                    if (normalizedDayDate.getTime() === normalizedTargetDate.getTime()) {
                        targetDay = timelineDay.day;
                        break;
                    }
                }
            }
        }
        
        if (targetDay === undefined) {
            builder.addHeading(1, `No visits scheduled for ${normalizedTargetDate.toLocaleDateString()}`);
            return builder.build();
        }
        
        // Get all event instances for this day
        const eventInstances = timeline.getScheduledEventInstancessForDay(targetDay);
        
        if (eventInstances.length === 0) {
            builder.addHeading(1, `No visits scheduled for ${normalizedTargetDate.toLocaleDateString()}`);
            return builder.build();
        }
        
        // Add date heading
        builder.addHeading(1, `Checklist for ${normalizedTargetDate.toLocaleDateString()}`);
        builder.addEmptyLine();
        
        // Format each event instance using the main template rendering logic
        eventInstances.forEach((eventInstance, index) => {
            const event = eventInstance.getScheduledEvent().configuredEvent;
            
            // Use the main template method to render the event (with emoji prefixes for visit checklist)
            StudyChecklistDocumentTemplate.renderEventAsMarkdown(builder, writer, event, index, "📋 ", "✅ ");
            
            // Add separator between events (except after the last one)
            if (index < eventInstances.length - 1) {
                builder.addSectionBreak();
            }
        });
        
        return builder.build();
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

        const tocMarkdown = StudyChecklistDocumentTemplate.getTableOfContentsAsMarkdown(markdown);
        if (tocMarkdown) {
            markdown = `${tocMarkdown}\n${markdown}`;
        }

        return markdown;
    }
}
