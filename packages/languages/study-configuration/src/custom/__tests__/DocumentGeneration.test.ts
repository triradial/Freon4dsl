import * as path from "path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { StudyConfigurationModelEnvironment } from "../../freon/config/StudyConfigurationModelEnvironment.js";
import { StudyConfiguration, StudyConfigurationModel } from "../../freon/language/index.js";
import { Sim } from "../simjs/sim.js";
import { StudyChecklistDocumentTemplate } from "../templates/StudyChecklistDocumentTemplate.js";
import { resetTimelineScriptTemplate, TimelineChartTemplate } from "../templates/TimelineChartTemplate.js";
import { Simulator } from "../timeline/Simulator.js";
import { Timeline } from "../timeline/Timeline.js";
import * as utils from "./Utils";

describe("Generating Documents", () => {
    let simulator;
    const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    var studyConfigurationUnit: StudyConfiguration;
    var studyConfigurationModel: StudyConfigurationModel;
    const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.

    // Store the original getToday method so we can restore it after tests
    const originalGetToday = Timeline.getToday;

    beforeEach(() => {
        // Set a fixed reference date for tests to ensure consistent results
        Timeline.getToday = () => new Date(2024, 0, 1);

        new Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
        // const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
        studyConfigurationModel = studyConfigurationModelEnvironment.newModel(modelName) as StudyConfigurationModel;
        studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
        simulator = new Simulator(studyConfigurationUnit);
        resetTimelineScriptTemplate();
    });

    afterEach(() => {
        // Restore the original getToday method
        Timeline.getToday = originalGetToday;
    });

    describe("Generation of Study Checklists Document", () => {
        it("generate a document for a one visit,one checklist, one task study", () => {
            // GIVEN a study configuration loaded from a file and the study is simulated
            const studyFolderPath: string = path.resolve(__dirname, "..", "__tests__", "modelstore", "OneVisitOneChecklist");
            // const studyFolderPath: string = path.resolve(__dirname, "..", "__tests__", "modelstore", "ScheduleExample2");
            const studyConfigurationUnit = utils.loadModelUnit("OneVisitOneChecklist", "StudyConfiguration", studyFolderPath) as StudyConfiguration;
            // const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration", studyFolderPath) as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // WHEN the study checklist document is generated
            const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline);
            // const studyChecklistAsMarkdown = "";
            expect(true).toBe(true);

            // THEN the generated study checklist document has the expected content
            utils.saveChecklistDocument(studyChecklistAsMarkdown);
            const expectedMarkdown = utils.readTestDataFile("StudyChecklistOneVisitOneChecklist.md");
            const normalizedActualMarkdown = studyChecklistAsMarkdown.replace(/\s+/g, "");
            const normalizedExpectedMarkdown = expectedMarkdown.replace(/\s+/g, "");
            expect(normalizedActualMarkdown).toEqual(normalizedExpectedMarkdown);
        });
    });
});

function testStudyInFile(studyName: string, studyConfigurationModel: StudyConfigurationModel, expectedTimelineDataAsScript: string, referenceDate?: Date) {
    // GIVEN a study configuration loaded from a file
    const studyConfigurationUnit = utils.loadModelUnit(studyName, "StudyConfiguration") as StudyConfiguration;
    studyConfigurationModel.addUnit(studyConfigurationUnit);

    // WHEN the study is simulated and a timeline picture is generated
    let simulator = new Simulator(studyConfigurationUnit);
    if (referenceDate) {
        simulator.setReferenceDate(referenceDate);
        simulator.organizedByReferenceDate();
    }
    simulator.run();
    let timeline = simulator.timeline;

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    // Save full HTML of chart for viewing / debugging
    utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

    const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
    const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
    // Then the generated timeline picture has the expected events on the expected event days
    expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
}
