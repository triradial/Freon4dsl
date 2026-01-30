"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyChecklistDocumentTemplateBuilder = void 0;
const index_js_1 = require("@freon4dsl/study-configuration/src/language/gen/index.js");
const StudyConfigurationModelModelUnitWriter_js_1 = require("@freon4dsl/study-configuration/src/writer/gen/StudyConfigurationModelModelUnitWriter.js");
class MarkdownBuilder {
    constructor() {
        this.sections = [];
        this.currentLevel = 0;
    }
    addHeading(level, text, addSpacing = true) {
        if (addSpacing && this.sections.length > 0) {
            this.sections.push('');
        }
        this.sections.push('#'.repeat(level) + ' ' + text);
        if (addSpacing) {
            this.sections.push('');
        }
        return this;
    }
    addParagraph(text, addSpacing = false) {
        if (text?.trim()) {
            this.sections.push(text);
            if (addSpacing) {
                this.sections.push('');
            }
        }
        return this;
    }
    addEmptyLine() {
        this.sections.push('');
        return this;
    }
    addSeparator() {
        this.sections.push('');
        this.sections.push('---');
        this.sections.push('');
        return this;
    }
    addTable(headers, rows) {
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
    addList(items, ordered = false) {
        this.sections.push('');
        items.forEach((item, index) => {
            const prefix = ordered ? `${index + 1}. ` : '- ';
            this.sections.push(prefix + item);
        });
        this.sections.push('');
        return this;
    }
    addVisualSeparator() {
        this.sections.push('');
        this.sections.push('---');
        this.sections.push('');
        return this;
    }
    addSectionBreak() {
        this.sections.push('');
        this.sections.push('---');
        this.sections.push('');
        return this;
    }
    addSpace() {
        this.sections.push('');
        return this;
    }
    addExtraSpace() {
        this.sections.push('');
        return this;
    }
    addRaw(content) {
        this.sections.push(content);
        return this;
    }
    build() {
        return this.sections.join('\n');
    }
    clear() {
        this.sections = [];
        return this;
    }
}
class StudyChecklistDocumentTemplateBuilder {
    static getTimelineTablAsMarkdown(timeline) {
        const builder = new MarkdownBuilder();
        const headers = ["Visit Name", "Alternative Name", "Phase", "Window (-)", "Day/Date", "Window (+)"];
        const rows = timeline
            .getDays()
            .flatMap((timelineDay, counter) => timelineDay
            .getEventInstances()
            .map((eventInstance, index) => [
            eventInstance.getName(),
            eventInstance.getScheduledEvent().configuredEvent.alternativeName,
            eventInstance.getScheduledEvent().configuredEvent.freOwner().name,
            eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysBefore.count?.toString() ?? "",
            (eventInstance.getStartDay() + 1).toString(),
            eventInstance.getScheduledEvent().configuredEvent.schedule.eventWindow?.daysAfter.count?.toString() ?? ""
        ]));
        const headerRow = '| ' + headers.join(' | ') + ' |';
        const separatorRow = '| ' + headers.map(() => ':----------').join(' | ') + ' |';
        builder.addRaw(headerRow);
        builder.addRaw(separatorRow);
        rows.forEach((row) => {
            const dataRow = '| ' + row.join(' | ') + ' |';
            builder.addRaw(dataRow);
        });
        return builder.build();
    }
    static getReferencesAsMarkdown(references) {
        console.log('references', references);
        if (!references || references.length === 0)
            return '';
        const builder = new MarkdownBuilder();
        const items = references.map(reference => `${reference.title} ${reference.link}`);
        return builder.addList(items).build();
    }
    static getPeopleAsMarkdown(people) {
        console.log('people', people);
        if (!people || people.length === 0)
            return '';
        const builder = new MarkdownBuilder();
        const items = people.map(person => `${person.name} (${person.role}) ${person.email} ${person.phoneNumber}`);
        return builder.addList(items).build();
    }
    static getSystemsAsMarkdown(systems) {
        console.log('systems', systems);
        if (!systems || systems.length === 0)
            return '';
        const builder = new MarkdownBuilder();
        const items = systems.map(system => `${system.name} (${system.accessedAt}) ${system.description}`);
        return builder.addList(items).build();
    }
    static renderStepAsMarkdown(builder, step, stepCounter) {
        console.log('renderStepAsMarkdown step', step);
        builder.addHeading(4, `Step ${stepCounter + 1}: ${step.name}`);
        if (step.description?.text) {
            builder.addParagraph(step.description.text, true);
        }
        console.log('step.references', step.references);
        if (step.references.length > 0) {
            builder.addParagraph("**REFERENCES**");
            const referencesMarkdown = StudyChecklistDocumentTemplateBuilder.getReferencesAsMarkdown(step.references);
            if (referencesMarkdown) {
                builder.addRaw(referencesMarkdown);
            }
        }
        if (step.people.length > 0) {
            builder.addParagraph("**PEOPLE**");
            const peopleMarkdown = StudyChecklistDocumentTemplateBuilder.getPeopleAsMarkdown(step.people);
            if (peopleMarkdown) {
                builder.addRaw(peopleMarkdown);
            }
        }
        console.log('step.systems', step.systems);
        if (step.systems.length > 0) {
            builder.addParagraph("**SYSTEMS**");
            const systemsMarkdown = StudyChecklistDocumentTemplateBuilder.getSystemsAsMarkdown(step.systems);
            if (systemsMarkdown) {
                builder.addRaw(systemsMarkdown);
            }
        }
    }
    static renderTaskAsMarkdown(builder, task, taskCounter, taskPrefix = "") {
        console.log('renderTaskAsMarkdown task', task);
        const t = task instanceof index_js_1.TaskReference ? task.task.referred : task;
        builder.addHeading(3, `${taskPrefix}Task: ${t.name}`);
        if (t.description?.text) {
            builder.addParagraph(t.description.text, true);
        }
        t.steps.forEach((step, stepCounter) => {
            StudyChecklistDocumentTemplateBuilder.renderStepAsMarkdown(builder, step, stepCounter);
        });
    }
    static renderEventAsMarkdown(builder, writer, event, eventCounter, headingPrefix = "", taskPrefix = "") {
        const timeOfDay = event.schedule.eventTimeOfDay
            ? "limited to " + writer.writeToString(event.schedule.eventTimeOfDay).replace(/"/g, "")
            : "";
        const eventRepeat = event.schedule.eventRepeat
            ? "and then repeats " + writer.writeToString(event.schedule.eventRepeat).replace(/"/g, "")
            : "";
        let complianceWindow = "";
        if (event.schedule.eventWindow?.complianceWindow) {
            complianceWindow = " " + writer.writeToString(event.schedule.eventWindow.complianceWindow).replace(/"/g, "");
        }
        else {
            complianceWindow = " with no extra compliance window";
        }
        builder.addHeading(2, `${headingPrefix}${event.name}`);
        if (event.description?.text) {
            builder.addParagraph(event.description.text, true);
        }
        const schedulingInfo = [
            `This event is first scheduled ${writer.writeToString(event.schedule.eventStart).replace(/"/g, "")}`,
            `with a window of ${writer.writeToString(event.schedule.eventWindow).replace(/[\r\n]+/g, " ")}`
        ];
        if (eventRepeat)
            schedulingInfo.push(eventRepeat);
        if (timeOfDay)
            schedulingInfo.push(timeOfDay);
        builder.addParagraph(schedulingInfo.join(' '), true);
        console.log('renderEventAsMarkdown event.tasks', event.tasks);
        event.tasks.forEach((task, taskCounter) => {
            console.log('renderEventAsMarkdown event.tasks task', task);
            StudyChecklistDocumentTemplateBuilder.renderTaskAsMarkdown(builder, task, taskCounter, taskPrefix);
        });
    }
    static getVisitsByPeriodAsMarkdown(studyConfiguration) {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter_js_1.StudyConfigurationModelModelUnitWriter();
        studyConfiguration.periods.forEach((period, periodCounter) => {
            builder.addHeading(1, period.name);
            period.events.forEach((event, eventCounter) => {
                StudyChecklistDocumentTemplateBuilder.renderEventAsMarkdown(builder, writer, event, eventCounter);
            });
            if (periodCounter < studyConfiguration.periods.length - 1) {
                builder.addSectionBreak();
            }
        });
        const result = builder.build();
        return result;
    }
    static addHeadingNumbers(markdown) {
        const lines = markdown.split('\n');
        const headingCounters = [0, 0, 0, 0, 0, 0];
        return lines.map(line => {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const title = headingMatch[2];
                for (let i = level; i < headingCounters.length; i++) {
                    headingCounters[i] = 0;
                }
                headingCounters[level - 1]++;
                const number = headingCounters.slice(0, level).join('.');
                return `${headingMatch[1]} ${number}. ${title}`;
            }
            return line;
        }).join('\n');
    }
    static getVisitForDateAsMarkdown(timeline, targetDate, studyConfiguration) {
        const builder = new MarkdownBuilder();
        const writer = new StudyConfigurationModelModelUnitWriter_js_1.StudyConfigurationModelModelUnitWriter();
        const normalizedTargetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        let targetDay = undefined;
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
        const eventInstances = timeline.getScheduledEventInstancessForDay(targetDay);
        if (eventInstances.length === 0) {
            builder.addHeading(1, `No visits scheduled for ${normalizedTargetDate.toLocaleDateString()}`);
            return builder.build();
        }
        builder.addHeading(1, `Checklist for ${normalizedTargetDate.toLocaleDateString()}`);
        builder.addEmptyLine();
        eventInstances.forEach((eventInstance, index) => {
            const event = eventInstance.getScheduledEvent().configuredEvent;
            StudyChecklistDocumentTemplateBuilder.renderEventAsMarkdown(builder, writer, event, index, "📋 ", "✅ ");
            if (index < eventInstances.length - 1) {
                builder.addSectionBreak();
            }
        });
        return builder.build();
    }
    static getStudyChecklistAsMarkdown(studyConfiguration, timeline, showHeadingNumbers = false) {
        const builder = new MarkdownBuilder();
        builder
            .addHeading(1, "Timeline Table", false)
            .addRaw(StudyChecklistDocumentTemplateBuilder.getTimelineTablAsMarkdown(timeline))
            .addSectionBreak();
        const visitsMarkdown = StudyChecklistDocumentTemplateBuilder.getVisitsByPeriodAsMarkdown(studyConfiguration);
        builder.addRaw(visitsMarkdown);
        let markdown = builder.build();
        if (showHeadingNumbers) {
            markdown = StudyChecklistDocumentTemplateBuilder.addHeadingNumbers(markdown);
        }
        return markdown;
    }
}
exports.StudyChecklistDocumentTemplateBuilder = StudyChecklistDocumentTemplateBuilder;
//# sourceMappingURL=StudyChecklistDocumentTemplate.builder.js.map