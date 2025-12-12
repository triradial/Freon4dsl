import { RtString } from "@freon4dsl/core";
import * as Sim from "@freon4dsl/study-configuration";
import { Simulator, StudyChecklistDocumentTemplate, StudyConfiguration, TimelineChartTemplate, TimelineTableTemplate } from "@freon4dsl/study-configuration";
import { getTimelineAsOfADate } from "./patient-timeline.js";


export function getTimelineTable(node: StudyConfiguration) {
    let timeline = getTimeline(node);

    const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
    const html = `<div class="limited-width-container">${tableHTML}</div>`;

    return new RtString(html);
}

export function getTimelineChart(node: StudyConfiguration, hasPatientKey: boolean = false, hasStaffKey: boolean = false) {
    let timeline = getTimeline(node);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, hasPatientKey, hasStaffKey);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

function getTimeline(node: StudyConfiguration) {
    var simulator;
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    let studyConfigurationUnit = node as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
    simulator.run();
    let timeline = simulator.timeline;

    return timeline;
}

export function getChecklistAsMarkdown(studyConfigurationUnit: StudyConfiguration, showHeadingNumbers: boolean = false) {
    let timeline = getTimeline(studyConfigurationUnit);
    const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline, showHeadingNumbers);
    return studyChecklistAsMarkdown;
}

export function studyTimelineChart(node: StudyConfiguration, referenceDate: Date, hasPatientKey: boolean = false, hasStaffKey: boolean = false) {
    let timeline = getTimelineAsOfADate(node, referenceDate);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, hasPatientKey, hasStaffKey);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

export function getVisitChecklistAsMarkdown(studyConfigurationUnit: StudyConfiguration, targetDate: Date, referenceDate?: Date): string {
    // Get timeline for the reference date (or use the target date as reference if not provided)
    const refDate = referenceDate || targetDate;
    let timeline = getTimelineAsOfADate(studyConfigurationUnit, refDate);
    
    // Get the visit checklist for the target date
    const markdown = StudyChecklistDocumentTemplate.getVisitForDateAsMarkdown(timeline, targetDate, studyConfigurationUnit);
    return markdown;
}
