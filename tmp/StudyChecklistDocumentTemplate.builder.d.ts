import { Timeline } from "@freon4dsl/study-configuration/src/custom/timeline/Timeline.js";
import { StudyConfiguration } from "@freon4dsl/study-configuration/src/language/gen/index.js";
export declare class StudyChecklistDocumentTemplateBuilder {
    static getTimelineTablAsMarkdown(timeline: Timeline): string;
    static getReferencesAsMarkdown(references: any): string;
    static getPeopleAsMarkdown(people: any): string;
    static getSystemsAsMarkdown(systems: any): string;
    private static renderStepAsMarkdown;
    private static renderTaskAsMarkdown;
    private static renderEventAsMarkdown;
    static getVisitsByPeriodAsMarkdown(studyConfiguration: StudyConfiguration): string;
    static addHeadingNumbers(markdown: string): string;
    static getVisitForDateAsMarkdown(timeline: Timeline, targetDate: Date, studyConfiguration: StudyConfiguration): string;
    static getStudyChecklistAsMarkdown(studyConfiguration: StudyConfiguration, timeline: Timeline, showHeadingNumbers?: boolean): string;
}
//# sourceMappingURL=StudyChecklistDocumentTemplate.builder.d.ts.map