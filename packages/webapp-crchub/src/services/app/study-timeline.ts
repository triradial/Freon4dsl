import { RtString } from "@freon4dsl/core";
import * as Sim from "@freon4dsl/study-configuration";
import { Simulator, StudyChecklistDocumentTemplate, StudyConfiguration, TimelineChartTemplate, TimelineTableTemplate } from "@freon4dsl/study-configuration";


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
