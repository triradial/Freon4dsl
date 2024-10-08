
import { Simulator, StudyConfiguration,TimelineChartTemplate, TimelineTableTemplate } from "@freon4dsl/samples-study-configuration";
import * as Sim from "@freon4dsl/samples-study-configuration/dist/custom/simjs/sim.js";
import { RtString } from "@freon4dsl/core";
import { WebappConfigurator } from "@freon4dsl/webapp-lib";

export function getTimelineTable(node: StudyConfiguration) {

    let timeline = getTimeline(node);

    const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
    const html = `<div class="limited-width-container">${tableHTML}</div>`;

    return new RtString(html);
}

export function getTimelineChart(node: StudyConfiguration) {

    let timeline = getTimeline(node);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
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