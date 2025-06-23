import {
    Simulator,
    StudyChecklistDocumentTemplate,
    StudyConfiguration,
    TimelineChartTemplate,
    TimelineTableTemplate,
} from "@freon4dsl/samples-study-configuration";
import * as Sim from "@freon4dsl/samples-study-configuration/dist/custom/simjs/sim.js";
import { RtString } from "@freon4dsl/core";
import type { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";

export function getTimelineTable(node: StudyConfiguration) : RtString {
    let timeline = getTimeline(node);

    const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
    const html = `<div class="limited-width-container">${tableHTML}</div>`;

    return new RtString(html);
}

export function getTimelineChart(node: StudyConfiguration) : RtString {
    let timeline = getTimeline(node);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

function getTimeline(node: StudyConfiguration) : Timeline {
    let simulator;
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    const studyConfigurationUnit = node as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
    simulator.run();
    const timeline = simulator.getTimeline();

    return timeline;
}

export function getChecklistAsMarkdown(studyConfigurationUnit: StudyConfiguration, showHeadingNumbers: boolean = false) {
    let timeline = getTimeline(studyConfigurationUnit);
    const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline, showHeadingNumbers);
    // const markdown = `<div class="limited-width-container">${studyChecklistAsMarkdown}</div>`;
    return studyChecklistAsMarkdown;
}
