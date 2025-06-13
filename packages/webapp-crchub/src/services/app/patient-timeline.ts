import { Simulator, StudyConfiguration, TimelineChartTemplate, TimelineTableTemplate } from "@freon4dsl/samples-study-configuration";
import * as Sim from "@freon4dsl/samples-study-configuration/dist/custom/simjs/sim.js";
import { RtString } from "@freon4dsl/core";
import type { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";

export function getTimelineTable(node: StudyConfiguration) {
    let timeline = getTimelineAsOfADate(node);

    const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
    const html = `<div class="limited-width-container">${tableHTML}</div>`;

    return new RtString(html);
}

export function getTimelineChart(node: StudyConfiguration) {
    let timeline = getTimelineAsOfADate(node);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

export function getTimelineChartHtml(timeline: Timeline) {
    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

export function getTimelineAsOfADate(node: StudyConfiguration, referenceDate?: Date) : Timeline {
    var simulator;
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    let studyConfigurationUnit = node as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
    if (referenceDate) {
        simulator.setReferenceDate(referenceDate);
    } else {
        simulator.setReferenceDate(new Date(2024, 8, 30));
    }
    simulator.organizedByReferenceDate();
    simulator.run();
    let timeline = simulator.timeline;

    return timeline;
}
