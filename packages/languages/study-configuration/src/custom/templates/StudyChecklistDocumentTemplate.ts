import { Period, Person, StudyConfiguration, Task, TaskReference, UnscheduledEvent } from "../../freon/language/index.js";
import { StudyConfigurationModelModelUnitWriter } from "../../freon/writer/StudyConfigurationModelModelUnitWriter.js";
import { Timeline } from "../timeline/Timeline.js";

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

    /**
     * Add a checklist item with an HTML checkbox
     * @param text The text for the checklist item
     * @param checked Whether the checkbox is checked (default: false)
     * @param indent Indentation level (0 = task, 1 = step)
     */
    addChecklistItem(text: string, checked: boolean = false, indent: number = 0): this {
        const checkedAttr = checked ? ' checked' : '';
        const indentClass = indent > 0 ? ' checklist-step' : ' checklist-task';
        this.sections.push(`<div class="checklist-item${indentClass}"><label><input type="checkbox"${checkedAttr}> ${text}</label></div>`);
        return this;
    }

    /**
     * Add indented content under a checklist item
     * @param text The text to add
     * @param indent Indentation level to match the parent checklist item
     */
    addChecklistContent(text: string, indent: number = 1): this {
        const indentClass = indent > 1 ? 'checklist-step-content' : 'checklist-task-content';
        this.sections.push(`<div class="${indentClass}">${text}</div>`);
        return this;
    }

    /**
     * Add a markdown checkbox item (for Word document generation)
     * Uses standard markdown checkbox syntax: - [ ] or - [x]
     * @param text The text for the checkbox item
     * @param checked Whether the checkbox is checked (default: false)
     * @param indent Indentation level (0 = no indent, 1 = one level, etc.)
     */
    addMarkdownCheckbox(text: string, checked: boolean = false, indent: number = 0): this {
        const checkbox = checked ? '[x]' : '[ ]';
        const indentStr = '  '.repeat(indent);
        this.sections.push(`${indentStr}- ${checkbox} ${text}`);
        return this;
    }

    /**
     * Add indented plain text content (for Word document generation)
     * @param text The text to add
     * @param indent Indentation level
     */
    addIndentedText(text: string, indent: number = 1): this {
        if (text?.trim()) {
            const indentStr = '  '.repeat(indent);
            this.sections.push(`${indentStr}${text}`);
        }
        return this;
    }

    /**
     * Add an HTML block with markers for Word processing.
     * The content will be wrapped with <!--HTML_START--> and <!--HTML_END--> markers
     * so it can be parsed and converted to proper Word formatting.
     * @param html The HTML content to add
     * @param indent Indentation level (used for context in Word processing)
     */
    addHtmlBlock(html: string, indent: number = 0): this {
        if (html?.trim()) {
            this.sections.push(`<!--HTML_START:${indent}-->`);
            this.sections.push(html);
            this.sections.push(`<!--HTML_END-->`);
        }
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

    /**
     * Strip HTML tags from a string, preserving text content.
     * Used for PDF/Word generation where HTML formatting is not supported.
     */
    private static stripHtml(html: string): string {
        if (!html) return '';
        return html
            // Replace common HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&rsquo;/g, "'")
            .replace(/&lsquo;/g, "'")
            .replace(/&rdquo;/g, '"')
            .replace(/&ldquo;/g, '"')
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Clean up extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
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
            const actualPerson: Person | undefined = (person as any).person?.referred ?? (person as any).referred ?? person;
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
     * Render systems as sub-headings (for study-level systems section)
     * @param builder The markdown builder
     * @param systems The systems array to render
     * @param headingLevel The heading level to use for each system (default 2)
     */
    private static renderSystemsAsHeadings(builder: MarkdownBuilder, systems: any[], headingLevel: number = 2, useHtmlBlock: boolean = false): void {
        if (!systems || systems.length === 0) return;

        systems.forEach(system => {
            const s = (system as any).system?.referred ?? (system as any).referred ?? system;
            const name = s?.name ?? 'Unnamed System';
            const accessedAt = s?.accessedAt;
            const accessedUrl = typeof accessedAt === 'string' ? accessedAt : accessedAt?.url ?? '';
            const accessedPhone = typeof accessedAt === 'string' ? '' : (accessedAt?.phoneNumber ?? '');
            const desc = typeof s?.description === 'string' ? s.description : (s?.description?.text ?? s?.description?.rawText ?? '');

            // Add system name as heading
            builder.addHeading(headingLevel, name);

            // Add URL if present
            if (accessedUrl) {
                builder.addParagraph(`URL: [${accessedUrl}](${accessedUrl})`, true);
            }

            // Add phone number if present
            if (accessedPhone) {
                builder.addParagraph(`Phone: ${StudyChecklistDocumentTemplate.formatPhoneNumber(accessedPhone)}`, true);
            }

            // Add description if present
            if (desc?.trim()) {
                if (useHtmlBlock) {
                    builder.addHtmlBlock(desc, 0);
                } else {
                    builder.addParagraph(desc, true);
                }
            }
        });
    }

    /**
     * Render people/staffing as sub-headings (for study-level staffing section)
     * @param builder The markdown builder
     * @param people The people array to render
     * @param headingLevel The heading level to use for each person (default 2)
     * @param useHtmlBlock If true, use addHtmlBlock for descriptions (for Word); otherwise use addParagraph
     */
    private static renderPeopleAsHeadings(builder: MarkdownBuilder, people: any[], headingLevel: number = 2, useHtmlBlock: boolean = false): void {
        if (!people || people.length === 0) return;

        people.forEach(person => {
            const actualPerson = (person as any).person?.referred ?? (person as any).referred ?? person;
            if (!actualPerson) return;

            const personName = actualPerson.name ?? 'Unnamed Person';
            const role = actualPerson.role;
            const roleName = role?.referred?.name ?? role?.name ?? '';
            const email = actualPerson.email ?? '';
            const phone = actualPerson.phoneNumber ?? '';
            const descSource = actualPerson.description;
            const desc: string = typeof descSource === 'string' ? descSource : (descSource?.text ?? descSource?.rawText ?? '');

            // Add person name as heading (with role if present)
            const headingText = roleName ? `${personName} (${roleName})` : personName;
            builder.addHeading(headingLevel, headingText);

            // Add email if present
            if (email) {
                builder.addParagraph(`Email: ${email}`, true);
            }

            // Add phone number if present
            if (phone) {
                builder.addParagraph(`Phone: ${StudyChecklistDocumentTemplate.formatPhoneNumber(phone)}`, true);
            }

            // Add description if present
            if (desc?.trim()) {
                if (useHtmlBlock) {
                    builder.addHtmlBlock(desc, 0);
                } else {
                    builder.addParagraph(desc, true);
                }
            }
        });
    }

    /**
     * Render references as sub-headings (for study-level references section)
     * @param builder The markdown builder
     * @param references The references array to render
     * @param headingLevel The heading level to use for each reference (default 2)
     * @param useHtmlBlock If true, use addHtmlBlock for descriptions (for Word); otherwise use addParagraph
     */
    private static renderReferencesAsHeadings(builder: MarkdownBuilder, references: any[], headingLevel: number = 2, useHtmlBlock: boolean = false): void {
        if (!references || references.length === 0) return;

        references.forEach(reference => {
            // Handle both direct Reference and SharedReference (which has a reference to Reference)
            const ref = (reference as any).referenceName?.referred ?? (reference as any).reference?.referred ?? (reference as any).referred ?? reference;
            if (!ref) return;

            const name = ref?.name ?? 'Unnamed Reference';
            const link = ref?.link ?? '';
            const descSource = ref?.description;
            const desc: string = typeof descSource === 'string' ? descSource : (descSource?.text ?? descSource?.rawText ?? '');

            // Add reference name as heading
            builder.addHeading(headingLevel, name);

            // Add link if present
            if (link) {
                builder.addParagraph(`Link: [${link}](${link})`, true);
            }

            // Add description if present
            if (desc?.trim()) {
                if (useHtmlBlock) {
                    builder.addHtmlBlock(desc, 0);
                } else {
                    builder.addParagraph(desc, true);
                }
            }
        });
    }

    /**
     * Get references as plain markdown for PDF (no HTML elements)
     * @param references The references array to render
     * @returns Plain markdown string
     */
    private static getReferencesAsMarkdownForPdf(references: any[]): string {
        if (!references || references.length === 0) return '';

        const lines: string[] = [];
        references.forEach(reference => {
            const name = reference.name ?? '';
            const link = typeof reference.link === 'string' ? reference.link : '';
            const rawDesc = typeof reference.description === 'string'
                ? reference.description
                : (reference.description?.text ?? reference.description?.rawText ?? '');
            // Strip HTML from description for PDF
            const desc = StudyChecklistDocumentTemplate.stripHtml(rawDesc);
            const linkPart = link ? ` ([${link}](${link}))` : '';
            const title = name ? `**${name}**${linkPart}` : linkPart.replace(/^ \(/, '(');
            if (title) {
                lines.push(`- ${title}`);
                if (desc) {
                    // Use plain indented text instead of HTML div
                    lines.push(`  ${desc}`);
                }
            }
        });
        return lines.length ? `${lines.join('\n')}\n` : '';
    }

    /**
     * Get people as plain markdown for PDF (no HTML elements)
     * @param people The people array to render
     * @returns Plain markdown string
     */
    private static getPeopleAsMarkdownForPdf(people: any[]): string {
        if (!people || people.length === 0) return '';

        const lines: string[] = [];
        people.forEach((person) => {
            const actualPerson: Person | undefined = (person as any).person?.referred ?? (person as any).referred ?? person;
            if (!actualPerson) return;

            const personName = actualPerson.name ?? '';
            const role = actualPerson.role;
            const roleName = role?.referred?.name ?? role?.name ?? '';
            const email = actualPerson.email ?? '';
            const phone = actualPerson.phoneNumber ?? '';
            const descSource = actualPerson.description;
            const rawDesc: string = typeof descSource === 'string' ? descSource : (descSource?.text ?? descSource?.rawText ?? '');
            // Strip HTML from description for PDF
            const desc = StudyChecklistDocumentTemplate.stripHtml(rawDesc);

            if (personName) {
                const roleSuffix = roleName ? ` (${roleName})` : '';
                lines.push(`- **${personName}**${roleSuffix}`);
            }
            // Add email and phone as plain indented text
            if (email) {
                lines.push(`  Email: ${email}`);
            }
            if (phone) {
                lines.push(`  Phone: ${StudyChecklistDocumentTemplate.formatPhoneNumber(phone)}`);
            }
            if (desc) {
                lines.push(`  ${desc}`);
            }
        });
        return lines.length ? `${lines.join('\n')}\n` : '';
    }

    /**
     * Get systems as plain markdown for PDF (no HTML elements)
     * @param systems The systems array to render
     * @returns Plain markdown string
     */
    private static getSystemsAsMarkdownForPdf(systems: any[]): string {
        if (!systems || systems.length === 0) return '';

        const lines: string[] = [];
        systems.forEach(system => {
            const s = (system as any).system?.referred ?? (system as any).referred ?? system;
            const name = s?.name ?? '';
            const accessedAt = s?.accessedAt;
            const accessedUrl = typeof accessedAt === 'string' ? accessedAt : accessedAt?.url ?? '';
            const accessedPhone = typeof accessedAt === 'string' ? '' : (accessedAt?.phoneNumber ?? '');
            const rawDesc = typeof s?.description === 'string' ? s.description : (s?.description?.text ?? s?.description?.rawText ?? '');
            // Strip HTML from description for PDF
            const desc = StudyChecklistDocumentTemplate.stripHtml(rawDesc);
            const urlPart = accessedUrl ? `[${accessedUrl}](${accessedUrl})` : '';
            const phonePart = accessedPhone ? `${StudyChecklistDocumentTemplate.formatPhoneNumber(accessedPhone)}` : '';

            if (name) {
                lines.push(`- **${name}**`);
            }
            // Add URL and phone as plain indented text
            if (urlPart) {
                lines.push(`  URL: ${urlPart}`);
            }
            if (phonePart) {
                lines.push(`  Phone: ${phonePart}`);
            }
            if (desc) {
                lines.push(`  ${desc}`);
            }
        });
        return lines.length ? `${lines.join('\n')}\n` : '';
    }

    /**
     * Helper method to render a step as markdown (heading-based, for Study Checklist)
     * @param builder The markdown builder
     * @param step The step to render
     * @param stepCounter The step index (0-based)
     * @param headingLevel The heading level to use (default 4)
     */
    private static renderStepAsMarkdown(builder: MarkdownBuilder, step: any, stepCounter: number, headingLevel: number = 4): void {
        // Step heading with spacing and visual indicator
        builder.addHeading(headingLevel, `Step ${stepCounter + 1}: ${step.name}`);
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
     * Helper method to render a step as plain markdown for PDF (no HTML elements)
     * @param builder The markdown builder
     * @param step The step to render
     * @param stepCounter The step index (0-based)
     * @param headingLevel The heading level to use (default 4)
     */
    private static renderStepAsMarkdownForPdf(builder: MarkdownBuilder, step: any, stepCounter: number, headingLevel: number = 4): void {
        // Step heading with spacing and visual indicator
        builder.addHeading(headingLevel, `Step ${stepCounter + 1}: ${step.name}`);
        const rawStepDesc = step.description?.text ?? step.description?.rawText;
        // Strip HTML from description for PDF
        const stepDesc = StudyChecklistDocumentTemplate.stripHtml(rawStepDesc);
        if (stepDesc) {
            builder.addParagraph(stepDesc, true);
        }

        if (step.references?.length > 0) {
            builder.addParagraph('**REFERENCES**', false);
            builder.addEmptyLine();
            const referencesMarkdown = StudyChecklistDocumentTemplate.getReferencesAsMarkdownForPdf(step.references);
            if (referencesMarkdown) {
                builder.addRaw(referencesMarkdown);
            }
        }

        if (step.people?.length > 0) {
            builder.addParagraph('**PEOPLE**', false);
            builder.addEmptyLine();
            const peopleMarkdown = StudyChecklistDocumentTemplate.getPeopleAsMarkdownForPdf(step.people);
            if (peopleMarkdown) {
                builder.addRaw(peopleMarkdown);
            }
        }
        if (step.systems?.length > 0) {
            builder.addParagraph('**SYSTEMS**', false);
            builder.addEmptyLine();
            const systemsMarkdown = StudyChecklistDocumentTemplate.getSystemsAsMarkdownForPdf(step.systems);
            if (systemsMarkdown) {
                builder.addRaw(systemsMarkdown);
            }
        }
    }

    /**
     * Helper method to render a step as markdown with checkbox (for Visit Checklist)
     * @param builder The markdown builder
     * @param step The step to render
     * @param stepCounter The step index (0-based)
     */
    private static renderStepAsCheckbox(builder: MarkdownBuilder, step: any, stepCounter: number): void {
        // Step as checkbox item (indented under task)
        builder.addChecklistItem(`Step ${stepCounter + 1}: ${step.name}`, false, 1);

        const stepDesc = step.description?.text ?? step.description?.rawText;
        if (stepDesc) {
            builder.addChecklistContent(stepDesc, 2);
        }

        // Include people, systems, and references (same as renderStepAsMarkdown)
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
        if (step.references?.length > 0) {
            builder.addRaw('<p class="checklist-group-label">REFERENCES</p>');
            builder.addEmptyLine();
            const referencesMarkdown = StudyChecklistDocumentTemplate.getReferencesAsMarkdown(step.references);
            if (referencesMarkdown) {
                builder.addRaw(referencesMarkdown);
            }
        }
    }

    /**
     * Helper method to render a task as markdown (heading-based, for Study Checklist)
     * @param builder The markdown builder
     * @param task The task to render (can be Task or TaskReference)
     * @param taskCounter The task index (0-based)
     * @param taskPrefix Optional prefix for the task heading (e.g., emoji)
     * @param headingLevel The heading level to use (default 3)
     */
    private static renderTaskAsMarkdown(builder: MarkdownBuilder, task: Task | TaskReference, taskCounter: number, taskPrefix: string = "", headingLevel: number = 3): void {
        const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);

        // Task heading with spacing and visual indicator
        builder.addHeading(headingLevel, `${taskPrefix}Task: ${t.name}`);

        const taskDesc = t.description?.text ?? t.description?.rawText;
        if (taskDesc) {
            builder.addParagraph(taskDesc, true);
        }

        t.steps.forEach((step, stepCounter) => {
            StudyChecklistDocumentTemplate.renderStepAsMarkdown(builder, step, stepCounter, headingLevel + 1);
        });
    }

    /**
     * Helper method to render a task as plain markdown for PDF (no HTML elements)
     * @param builder The markdown builder
     * @param task The task to render (can be Task or TaskReference)
     * @param taskCounter The task index (0-based)
     * @param taskPrefix Optional prefix for the task heading (e.g., emoji)
     * @param headingLevel The heading level to use (default 3)
     */
    private static renderTaskAsMarkdownForPdf(builder: MarkdownBuilder, task: Task | TaskReference, taskCounter: number, taskPrefix: string = "", headingLevel: number = 3): void {
        const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);

        // Task heading with spacing and visual indicator
        builder.addHeading(headingLevel, `${taskPrefix}Task: ${t.name}`);

        const rawTaskDesc = t.description?.text ?? t.description?.rawText;
        // Strip HTML from description for PDF
        const taskDesc = StudyChecklistDocumentTemplate.stripHtml(rawTaskDesc);
        if (taskDesc) {
            builder.addParagraph(taskDesc, true);
        }

        t.steps.forEach((step, stepCounter) => {
            StudyChecklistDocumentTemplate.renderStepAsMarkdownForPdf(builder, step, stepCounter, headingLevel + 1);
        });
    }

    /**
     * Helper method to render a task as markdown with checkbox (for Visit Checklist)
     * @param builder The markdown builder
     * @param task The task to render (can be Task or TaskReference)
     */
    private static renderTaskAsCheckbox(builder: MarkdownBuilder, task: Task | TaskReference): void {
        const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);

        // Task as checkbox item
        builder.addChecklistItem(`Task: ${t.name}`, false, 0);

        const taskDesc = t.description?.text ?? t.description?.rawText;
        if (taskDesc) {
            builder.addChecklistContent(taskDesc, 1);
        }

        t.steps.forEach((step, stepCounter) => {
            StudyChecklistDocumentTemplate.renderStepAsCheckbox(builder, step, stepCounter);
        });

        // Add empty line after task for visual separation
        builder.addEmptyLine();
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
     * Helper method to render an event as plain markdown for PDF (no HTML elements)
     * @param builder The markdown builder
     * @param writer The model writer
     * @param event The event to render
     * @param eventCounter The event index (0-based)
     * @param headingPrefix Optional prefix for the event heading (e.g., emoji)
     * @param taskPrefix Optional prefix for task headings (e.g., emoji)
     */
    private static renderEventAsMarkdownForPdf(builder: MarkdownBuilder, writer: StudyConfigurationModelModelUnitWriter, event: any, eventCounter: number, headingPrefix: string = "", taskPrefix: string = ""): void {
        const timeOfDay = event.schedule.eventTimeOfDay
            ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
            : "";
        const eventRepeat = event.schedule.eventRepeat
            ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
            : "";

        // Event heading with spacing and visual indicator
        builder.addHeading(2, `${headingPrefix}${event.name}`);

        const rawEventDesc = event.description?.text ?? event.description?.rawText;
        // Strip HTML from description for PDF
        const eventDesc = StudyChecklistDocumentTemplate.stripHtml(rawEventDesc);
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
            StudyChecklistDocumentTemplate.renderTaskAsMarkdownForPdf(builder, task, taskCounter, taskPrefix);
        });
    }

    /**
     * Helper method to render an unscheduled event as plain markdown for PDF (no HTML elements)
     * @param builder The markdown builder
     * @param event The unscheduled event to render
     * @param eventCounter The event index (0-based)
     * @param headingPrefix Optional prefix for the event heading
     * @param taskPrefix Optional prefix for task headings
     * @param headingLevel Heading level for the event title
     */
    private static renderUnscheduledEventAsMarkdownForPdf(builder: MarkdownBuilder, event: UnscheduledEvent, _eventCounter: number, headingPrefix: string = "", taskPrefix: string = "", headingLevel: number = 3): void {
        builder.addHeading(headingLevel, `${headingPrefix}${event.name}`);

        const rawEventDesc = event.description?.text ?? event.description?.rawText;
        // Strip HTML from description for PDF
        const eventDesc = StudyChecklistDocumentTemplate.stripHtml(rawEventDesc);
        if (eventDesc) {
            builder.addParagraph(eventDesc, true);
        }

        builder.addParagraph('This is an unscheduled event that is triggered as needed.', true);

        // Render tasks with PDF-specific method (no HTML)
        event.tasks.forEach((task, taskCounter) => {
            StudyChecklistDocumentTemplate.renderTaskAsMarkdownForPdf(builder, task as Task | TaskReference, taskCounter, taskPrefix, headingLevel + 1);
        });
    }

    /**
     * Helper method to render an event as markdown with checkboxes for tasks/steps (for Visit Checklist)
     * @param builder The markdown builder
     * @param writer The model writer
     * @param event The event to render
     */
    private static renderEventWithCheckboxes(builder: MarkdownBuilder, writer: StudyConfigurationModelModelUnitWriter, event: any): void {
        // Event heading (keep as heading, not checkbox)
        builder.addHeading(2, event.name);

        const eventDesc = event.description?.text ?? event.description?.rawText;
        if (eventDesc) {
            builder.addParagraph(eventDesc, true);
        }

        const schedulingInfo = [
            `This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}`,
            `with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}`
        ];

        const eventRepeat = event.schedule.eventRepeat
            ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
            : "";
        const timeOfDay = event.schedule.eventTimeOfDay
            ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
            : "";

        if (eventRepeat) schedulingInfo.push(eventRepeat);
        if (timeOfDay) schedulingInfo.push(timeOfDay);

        builder.addParagraph(schedulingInfo.join(' '), true);

        // Render tasks with checkboxes
        event.tasks.forEach((task: Task | TaskReference) => {
            StudyChecklistDocumentTemplate.renderTaskAsCheckbox(builder, task);
        });
    }

    /**
     * Helper method to render an unscheduled event as markdown.
     * Similar to renderEventAsMarkdown but without scheduling information.
     * @param builder The markdown builder
     * @param event The unscheduled event to render
     * @param eventCounter The event index (0-based)
     * @param headingPrefix Optional prefix for the event heading
     * @param taskPrefix Optional prefix for task headings
     * @param headingLevel Heading level for the event title
     */
    private static renderUnscheduledEventAsMarkdown(builder: MarkdownBuilder, event: UnscheduledEvent, _eventCounter: number, headingPrefix: string = "", taskPrefix: string = "", headingLevel: number = 3): void {
        builder.addHeading(headingLevel, `${headingPrefix}${event.name}`);

        const eventDesc = event.description?.text ?? event.description?.rawText;
        if (eventDesc) {
            builder.addParagraph(eventDesc, true);
        }

        builder.addParagraph('This is an unscheduled event that is triggered as needed.', true);

        // Render tasks with proper heading level (one level below the event heading)
        event.tasks.forEach((task, taskCounter) => {
            StudyChecklistDocumentTemplate.renderTaskAsMarkdown(builder, task as Task | TaskReference, taskCounter, taskPrefix, headingLevel + 1);
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

            // Add period description if present
            const periodDesc = period.description?.text ?? period.description?.rawText;
            if (periodDesc) {
                builder.addParagraph(periodDesc, true);
            }

            period.events.forEach((event, eventCounter) => {
                StudyChecklistDocumentTemplate.renderEventAsMarkdown(builder, writer, event, eventCounter);
            });

            // Add unscheduled events for this period
            if (period.unscheduledEvents?.length > 0) {
                builder.addSectionBreak();
                builder.addHeading(2, "Unscheduled Events");
                period.unscheduledEvents.forEach((event, eventCounter) => {
                    StudyChecklistDocumentTemplate.renderUnscheduledEventAsMarkdown(builder, event, eventCounter);
                });
            }

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
     * Includes shared systems and references from the study configuration.
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
        builder.addHeading(1, `Visit Checklist for ${normalizedTargetDate.toLocaleDateString()}`);
        builder.addEmptyLine();

        // Format each event instance with checkboxes for tasks/steps
        eventInstances.forEach((eventInstance, index) => {
            const event = eventInstance.getScheduledEvent().configuredEvent;

            // Use the checkbox version for visit checklist
            StudyChecklistDocumentTemplate.renderEventWithCheckboxes(builder, writer, event);

            // Add separator between events (except after the last one)
            if (index < eventInstances.length - 1) {
                builder.addSectionBreak();
            }
        });

        // Add study-level shared systems section (same as getStudyChecklistAsMarkdown)
        if (studyConfiguration.systemAccesses?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Systems");
            StudyChecklistDocumentTemplate.renderSystemsAsHeadings(builder, studyConfiguration.systemAccesses, 2);
        }

        // Add study-level shared references section (same as getStudyChecklistAsMarkdown)
        if (studyConfiguration.sharedReferences?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "References");
            StudyChecklistDocumentTemplate.renderReferencesAsHeadings(builder, studyConfiguration.sharedReferences, 2);
        }

        // Add study-level staffing section (same as getStudyChecklistAsMarkdown)
        if (studyConfiguration.staffing?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Staffing");
            StudyChecklistDocumentTemplate.renderPeopleAsHeadings(builder, studyConfiguration.staffing, 2);
        }

        return builder.build();
    }

    /**
     * Get visits/events for a specific date as markdown for PDF/Word generation.
     * This uses heading-based rendering (same as Study Checklist) instead of HTML checkboxes.
     * Reuses the same rendering methods as getStudyChecklistAsMarkdown for consistency.
     *
     * @param timeline The timeline to search
     * @param targetDate The date to get visits for
     * @param studyConfiguration The study configuration (needed for event details)
     * @returns Markdown string with the visit checklist for that date (heading-based format)
     */
    static getVisitForDateAsMarkdownForPdf(timeline: Timeline, targetDate: Date, studyConfiguration: StudyConfiguration): string {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter();

        // Normalize target date to midnight for comparison
        const normalizedTargetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);

        // Find the day number that corresponds to this date
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
        builder.addHeading(1, `Visit Checklist for ${normalizedTargetDate.toLocaleDateString()}`);
        builder.addEmptyLine();

        // Format each event instance using heading-based rendering (same as Study Checklist)
        eventInstances.forEach((eventInstance, index) => {
            const event = eventInstance.getScheduledEvent().configuredEvent;

            // Use the heading-based version (same as Study Checklist) for PDF/Word generation
            StudyChecklistDocumentTemplate.renderEventAsMarkdown(builder, writer, event, index);

            // Add separator between events (except after the last one)
            if (index < eventInstances.length - 1) {
                builder.addSectionBreak();
            }
        });

        // Add study-level shared systems section (same as getStudyChecklistAsMarkdown)
        if (studyConfiguration.systemAccesses?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Systems");
            StudyChecklistDocumentTemplate.renderSystemsAsHeadings(builder, studyConfiguration.systemAccesses, 2);
        }

        // Add study-level shared references section (same as getStudyChecklistAsMarkdown)
        if (studyConfiguration.sharedReferences?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "References");
            StudyChecklistDocumentTemplate.renderReferencesAsHeadings(builder, studyConfiguration.sharedReferences, 2);
        }

        // Add study-level staffing section (same as getStudyChecklistAsMarkdown)
        if (studyConfiguration.staffing?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Staffing");
            StudyChecklistDocumentTemplate.renderPeopleAsHeadings(builder, studyConfiguration.staffing, 2);
        }

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

        // Add study-level unscheduled events
        if (studyConfiguration.unscheduledEvents?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Study Unscheduled Events");
            studyConfiguration.unscheduledEvents.forEach((event, eventCounter) => {
                StudyChecklistDocumentTemplate.renderUnscheduledEventAsMarkdown(builder, event, eventCounter, "", "", 2);
            });
        }

        // Add study-level systems section
        if (studyConfiguration.systemAccesses?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Systems");
            StudyChecklistDocumentTemplate.renderSystemsAsHeadings(builder, studyConfiguration.systemAccesses, 2);
        }

        // Add study-level references section
        if (studyConfiguration.sharedReferences?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "References");
            StudyChecklistDocumentTemplate.renderReferencesAsHeadings(builder, studyConfiguration.sharedReferences, 2);
        }

        // Add study-level staffing section
        if (studyConfiguration.staffing?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Staffing");
            StudyChecklistDocumentTemplate.renderPeopleAsHeadings(builder, studyConfiguration.staffing, 2);
        }

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

    /**
     * Get checklist for a specific event by name as markdown.
     * Searches through periods and study-level unscheduled events to find the event.
     * Includes study-level systems, references, and staffing sections.
     *
     * @param studyConfiguration The study configuration
     * @param eventName The name of the event to get the checklist for
     * @returns Markdown string with the event checklist, or empty string if event not found
     */
    static getEventChecklistByName(studyConfiguration: StudyConfiguration, eventName: string): string {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter();
        let eventFound = false;

        // Search in periods for the event
        for (const period of studyConfiguration.periods || []) {
            if (eventFound) break;

            // Check scheduled events
            for (const event of period.events || []) {
                if (event.name === eventName) {
                    StudyChecklistDocumentTemplate.renderEventWithCheckboxes(builder, writer, event);
                    eventFound = true;
                    break;
                }
            }

            if (eventFound) break;

            // Check period-level unscheduled events
            for (const event of period.unscheduledEvents || []) {
                if (event.name === eventName) {
                    // Render unscheduled event with checkboxes (same format)
                    builder.addHeading(2, event.name);
                    const eventDesc = event.description?.text ?? event.description?.rawText;
                    if (eventDesc) {
                        builder.addParagraph(eventDesc);
                    }
                    builder.addParagraph('This is an unscheduled event that is triggered as needed.', true);
                    // Render tasks with checkboxes
                    for (const task of event.tasks || []) {
                        StudyChecklistDocumentTemplate.renderTaskAsCheckbox(builder, task as Task | TaskReference);
                    }
                    eventFound = true;
                    break;
                }
            }
        }

        // Check study-level unscheduled events if not found yet
        if (!eventFound) {
            for (const event of studyConfiguration.unscheduledEvents || []) {
                if (event.name === eventName) {
                    builder.addHeading(2, event.name);
                    const eventDesc = event.description?.text ?? event.description?.rawText;
                    if (eventDesc) {
                        builder.addParagraph(eventDesc);
                    }
                    builder.addParagraph('This is an unscheduled event that is triggered as needed.', true);
                    // Render tasks with checkboxes
                    for (const task of event.tasks || []) {
                        StudyChecklistDocumentTemplate.renderTaskAsCheckbox(builder, task as Task | TaskReference);
                    }
                    eventFound = true;
                    break;
                }
            }
        }

        // Event not found
        if (!eventFound) {
            return "";
        }

        // Add study-level shared systems section
        if (studyConfiguration.systemAccesses?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Systems");
            StudyChecklistDocumentTemplate.renderSystemsAsHeadings(builder, studyConfiguration.systemAccesses, 2);
        }

        // Add study-level shared references section
        if (studyConfiguration.sharedReferences?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "References");
            StudyChecklistDocumentTemplate.renderReferencesAsHeadings(builder, studyConfiguration.sharedReferences, 2);
        }

        // Add study-level staffing section
        if (studyConfiguration.staffing?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(1, "Staffing");
            StudyChecklistDocumentTemplate.renderPeopleAsHeadings(builder, studyConfiguration.staffing, 2);
        }

        return builder.build();
    }

    /**
     * Get checklist for a specific event by name as markdown for PDF/Word generation.
     * Uses heading-based rendering instead of HTML checkboxes for better document compatibility.
     * Searches through periods and study-level unscheduled events to find the event.
     * Includes study-level systems, references, and staffing sections.
     *
     * @param studyConfiguration The study configuration
     * @param eventName The name of the event to get the checklist for
     * @returns Markdown string with the event checklist (heading-based format), or empty string if event not found
     */
    static getEventChecklistByNameForPdf(studyConfiguration: StudyConfiguration, eventName: string): string {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter();
        let eventFound = false;

        // Search in periods for the event
        for (const period of studyConfiguration.periods || []) {
            if (eventFound) break;

            // Check scheduled events
            for (const event of period.events || []) {
                if (event.name === eventName) {
                    // Use PDF-specific rendering (no HTML elements)
                    StudyChecklistDocumentTemplate.renderEventAsMarkdownForPdf(builder, writer, event, 0);
                    eventFound = true;
                    break;
                }
            }

            if (eventFound) break;

            // Check period-level unscheduled events
            for (const event of period.unscheduledEvents || []) {
                if (event.name === eventName) {
                    // Use PDF-specific rendering for unscheduled events (no HTML elements)
                    StudyChecklistDocumentTemplate.renderUnscheduledEventAsMarkdownForPdf(builder, event, 0, "", "", 2);
                    eventFound = true;
                    break;
                }
            }
        }

        // Check study-level unscheduled events if not found yet
        if (!eventFound) {
            for (const event of studyConfiguration.unscheduledEvents || []) {
                if (event.name === eventName) {
                    StudyChecklistDocumentTemplate.renderUnscheduledEventAsMarkdownForPdf(builder, event, 0, "", "", 2);
                    eventFound = true;
                    break;
                }
            }
        }

        // Event not found
        if (!eventFound) {
            return "";
        }

        // Add study-level shared systems section (uses heading-based rendering which is already PDF-safe)
        // Use h2 to match event heading level for consistent TOC alignment
        if (studyConfiguration.systemAccesses?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(2, "Systems");
            StudyChecklistDocumentTemplate.renderSystemsAsHeadings(builder, studyConfiguration.systemAccesses, 3);
        }

        // Add study-level shared references section (uses heading-based rendering which is already PDF-safe)
        // Use h2 to match event heading level for consistent TOC alignment
        if (studyConfiguration.sharedReferences?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(2, "References");
            StudyChecklistDocumentTemplate.renderReferencesAsHeadings(builder, studyConfiguration.sharedReferences, 3);
        }

        // Add study-level staffing section (uses heading-based rendering which is already PDF-safe)
        // Use h2 to match event heading level for consistent TOC alignment
        if (studyConfiguration.staffing?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(2, "Staffing");
            StudyChecklistDocumentTemplate.renderPeopleAsHeadings(builder, studyConfiguration.staffing, 3);
        }

        return builder.build();
    }

    /**
     * Helper method to render a step with markdown checkbox (for Word document generation)
     * @param builder The markdown builder
     * @param step The step to render
     * @param stepCounter The step index (0-based)
     */
    private static renderStepForWord(builder: MarkdownBuilder, step: any, stepCounter: number): void {
        // Step as markdown checkbox (indented under task)
        builder.addMarkdownCheckbox(`Step ${stepCounter + 1}: ${step.name}`, false, 1);

        const rawStepDesc = step.description?.text ?? step.description?.rawText;
        if (rawStepDesc?.trim()) {
            // Use HTML block for rich content, indent level 2 (under step)
            builder.addHtmlBlock(rawStepDesc, 2);
        }

        // Include references
        if (step.references?.length > 0) {
            builder.addIndentedText('**REFERENCES**', 2);
            const referencesMarkdown = StudyChecklistDocumentTemplate.getReferencesAsMarkdownForPdf(step.references);
            if (referencesMarkdown) {
                // Indent each line
                referencesMarkdown.split('\n').forEach(line => {
                    if (line.trim()) builder.addIndentedText(line, 2);
                });
            }
        }

        // Include people
        if (step.people?.length > 0) {
            builder.addIndentedText('**PEOPLE**', 2);
            const peopleMarkdown = StudyChecklistDocumentTemplate.getPeopleAsMarkdownForPdf(step.people);
            if (peopleMarkdown) {
                peopleMarkdown.split('\n').forEach(line => {
                    if (line.trim()) builder.addIndentedText(line, 2);
                });
            }
        }

        // Include systems
        if (step.systems?.length > 0) {
            builder.addIndentedText('**SYSTEMS**', 2);
            const systemsMarkdown = StudyChecklistDocumentTemplate.getSystemsAsMarkdownForPdf(step.systems);
            if (systemsMarkdown) {
                systemsMarkdown.split('\n').forEach(line => {
                    if (line.trim()) builder.addIndentedText(line, 2);
                });
            }
        }
    }

    /**
     * Helper method to render a task with markdown checkbox (for Word document generation)
     * @param builder The markdown builder
     * @param task The task to render (can be Task or TaskReference)
     */
    private static renderTaskForWord(builder: MarkdownBuilder, task: Task | TaskReference): void {
        const t = task instanceof TaskReference ? ((task as TaskReference).task.referred as Task) : (task as Task);

        // Task as markdown checkbox
        builder.addMarkdownCheckbox(`Task: ${t.name}`, false, 0);

        const rawTaskDesc = t.description?.text ?? t.description?.rawText;
        if (rawTaskDesc?.trim()) {
            // Use HTML block for rich content, indent level 1 (under task)
            builder.addHtmlBlock(rawTaskDesc, 1);
        }

        // Render steps
        t.steps.forEach((step, stepCounter) => {
            StudyChecklistDocumentTemplate.renderStepForWord(builder, step, stepCounter);
        });
    }

    /**
     * Helper method to render an event with markdown checkboxes (for Word document generation)
     * @param builder The markdown builder
     * @param writer The model writer
     * @param event The event to render
     */
    private static renderEventForWord(builder: MarkdownBuilder, writer: StudyConfigurationModelModelUnitWriter, event: any): void {
        const timeOfDay = event.schedule.eventTimeOfDay
            ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
            : "";
        const eventRepeat = event.schedule.eventRepeat
            ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
            : "";

        // Event heading
        builder.addHeading(2, event.name);

        const rawEventDesc = event.description?.text ?? event.description?.rawText;
        if (rawEventDesc?.trim()) {
            // Use HTML block for rich content, indent level 0 (event level)
            builder.addHtmlBlock(rawEventDesc, 0);
        }

        const schedulingInfo = [
            `This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}`,
            `with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}`
        ];

        if (eventRepeat) schedulingInfo.push(eventRepeat);
        if (timeOfDay) schedulingInfo.push(timeOfDay);

        builder.addParagraph(schedulingInfo.join(' '), true);

        // Render tasks with markdown checkboxes
        event.tasks.forEach((task: Task | TaskReference) => {
            StudyChecklistDocumentTemplate.renderTaskForWord(builder, task);
        });
    }

    /**
     * Helper method to render an unscheduled event with markdown checkboxes (for Word document generation)
     * @param builder The markdown builder
     * @param event The unscheduled event to render
     */
    private static renderUnscheduledEventForWord(builder: MarkdownBuilder, event: UnscheduledEvent): void {
        builder.addHeading(2, event.name);

        const rawEventDesc = event.description?.text ?? event.description?.rawText;
        if (rawEventDesc?.trim()) {
            // Use HTML block for rich content, indent level 0 (event level)
            builder.addHtmlBlock(rawEventDesc, 0);
        }

        builder.addParagraph('This is an unscheduled event that is triggered as needed.', true);

        // Render tasks with markdown checkboxes
        event.tasks.forEach((task) => {
            StudyChecklistDocumentTemplate.renderTaskForWord(builder, task as Task | TaskReference);
        });
    }

    /**
     * Get checklist for a specific event by name as markdown for Word document generation.
     * Uses markdown checkbox syntax (- [ ]) for tasks and steps that can be converted
     * to actual Word checkboxes by the docx library.
     * Searches through periods and study-level unscheduled events to find the event.
     * Includes study-level systems, references, and staffing sections.
     *
     * @param studyConfiguration The study configuration
     * @param eventName The name of the event to get the checklist for
     * @returns Markdown string with checkbox syntax, or empty string if event not found
     */
    static getEventChecklistByNameForWord(studyConfiguration: StudyConfiguration, eventName: string): string {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter();
        let eventFound = false;

        // Search in periods for the event
        for (const period of studyConfiguration.periods || []) {
            if (eventFound) break;

            // Check scheduled events
            for (const event of period.events || []) {
                if (event.name === eventName) {
                    StudyChecklistDocumentTemplate.renderEventForWord(builder, writer, event);
                    eventFound = true;
                    break;
                }
            }

            if (eventFound) break;

            // Check period-level unscheduled events
            for (const event of period.unscheduledEvents || []) {
                if (event.name === eventName) {
                    StudyChecklistDocumentTemplate.renderUnscheduledEventForWord(builder, event);
                    eventFound = true;
                    break;
                }
            }
        }

        // Check study-level unscheduled events if not found yet
        if (!eventFound) {
            for (const event of studyConfiguration.unscheduledEvents || []) {
                if (event.name === eventName) {
                    StudyChecklistDocumentTemplate.renderUnscheduledEventForWord(builder, event);
                    eventFound = true;
                    break;
                }
            }
        }

        // Event not found
        if (!eventFound) {
            return "";
        }

        // Add study-level shared systems section (useHtmlBlock=true for Word)
        if (studyConfiguration.systemAccesses?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(2, "Systems");
            StudyChecklistDocumentTemplate.renderSystemsAsHeadings(builder, studyConfiguration.systemAccesses, 3, true);
        }

        // Add study-level shared references section (useHtmlBlock=true for Word)
        if (studyConfiguration.sharedReferences?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(2, "References");
            StudyChecklistDocumentTemplate.renderReferencesAsHeadings(builder, studyConfiguration.sharedReferences, 3, true);
        }

        // Add study-level staffing section (useHtmlBlock=true for Word)
        if (studyConfiguration.staffing?.length > 0) {
            builder.addSectionBreak();
            builder.addHeading(2, "Staffing");
            StudyChecklistDocumentTemplate.renderPeopleAsHeadings(builder, studyConfiguration.staffing, 3, true);
        }

        return builder.build();
    }
}
