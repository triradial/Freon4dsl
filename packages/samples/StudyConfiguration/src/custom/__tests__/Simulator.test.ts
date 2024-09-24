import * as Sim from "../simjs/sim.js";
import { Timeline } from "../timeline/Timeline";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance";
import { PeriodEventInstance } from "../timeline/PeriodEventInstance";
import { TimelineEventInstance, TimelineInstanceState } from "../timeline/TimelineEventInstance";
import { Simulator } from "../timeline/Simulator";
import { StudyConfiguration, Period, Event, StudyConfigurationModel } from "../../language/gen/index";
import * as utils from "./Utils";
import { resetTimelineScriptTemplate, TimelineChartTemplate } from "../templates/TimelineChartTemplate";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate";
import { StudyChecklistDocumentTemplate } from "../templates/StudyChecklistDocumentTemplate";
import { EventsToAdd, addEventAndInstanceToTimeline } from "./Utils";
import { ScheduledEventState } from "../timeline/ScheduledEvent";
import { StudyConfigurationModelEnvironment } from "../../config/gen/StudyConfigurationModelEnvironment";

describe("Study Simulation", () => {
    var simulator;
    const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    var studyConfigurationUnit: StudyConfiguration;
    var studyConfigurationModel: StudyConfigurationModel;
    const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.

    beforeEach(() => {
        new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
        // const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
        studyConfigurationModel = studyConfigurationModelEnvironment.newModel(modelName) as StudyConfigurationModel;
        studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
        simulator = new Simulator(studyConfigurationUnit);
        resetTimelineScriptTemplate();
    });

    describe("Simulation of Trial Events to Generate the Timeline in the same period", () => {
        it("generates a one visit timeline for a visit on day 0", () => {
            // GIVEN a study configuration with one period and one event
            let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 0);
            let period = new Period("Screening");
            utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
            studyConfigurationUnit.periods.push(period);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            // Then the generated timeline has one event on the expected event day
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 1",
                0,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
                0,
            );
            expectedTimeline.setCurrentDay(0);
            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a one visit timeline for a visit on day 1 that patient completed", () => {
            // GIVEN a study configuration with one period and one event and a patient that completed the event
            const eventName = "Visit 1";
            let eventSchedule = utils.createEventScheduleStartingOnADay(eventName, 0, 0);
            let period = new Period("Screening");
            utils.createEventAndAddToPeriod(period, eventName, eventSchedule);
            studyConfigurationUnit.periods.push(period);
            const visitToComplete = studyConfigurationUnit.periods[0].events[0];
            const patientInfoUnit = utils.createCompletedPatientVisit(visitToComplete);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit, patientInfoUnit);
            simulator.run();
            let timeline = simulator.timeline;

            utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            // Then the generated timeline has one event on the expected event day
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 1",
                0,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
                0,
            );
            expectedTimeline.setCurrentDay(0);
            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a two visit timeline with a visit on day 0 and 7 in the same period", () => {
            // GIVEN a study configuration with one period and two events
            let period = Period.create({ name: "Screening" });
            studyConfigurationUnit.periods.push(period);
            let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 0, 0);
            utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
            eventSchedule = utils.createEventScheduleStartingOnADay("Visit 2", 7);
            utils.createEventAndAddToPeriod(period, "Visit 2", eventSchedule);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 1",
                0,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
            );
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 2",
                7,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
                7,
            );
            expectedTimeline.setCurrentDay(7);

            utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a two visit timeline for a visit 7 days after the study start day in the same period", () => {
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "StudyStart",
                0,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
            );
            // TODO: Decide whether the period completes on the day the visit completes or the day after. Currently it is the day after.
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 2",
                7,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
                7,
            );
            expectedTimeline.setCurrentDay(7);

            utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect(timeline).toEqual(expectedTimeline);
        });

        it("[Start Day of 1] generates a two visit timeline for a visit 7 days after the study start day", () => {
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit.studyStartDayNumber = 1;
            studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days with the reflecting a study start day of 1
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "StudyStart",
                0,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
            );
            // TODO: Decide whether the period completes on the day the visit completes or the day after. Currently it is the day after.
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 2",
                8,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                0,
                8,
            );
            expectedTimeline.setCurrentDay(8);

            utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a two visit timeline for a visit in the second period 7 days after the end of the first visit", () => {
            // GIVEN a study configuration with one period and two events
            let listOfEventsToAdd: EventsToAdd[] = [
                { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 1",
                1,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                1,
                7,
            );
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                1,
                "Visit 2",
                8,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Treatment",
                8,
                8,
            );
            expectedTimeline.setCurrentDay(8);

            // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a three visit timeline for visits 7 days after the end of the previous visit", () => {
            // GIVEN a study configuration with one period and two events
            let listOfEventsToAdd: EventsToAdd[] = [
                { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment" },
                { eventName: "Visit 3", eventDay: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days
            let expectedTimeline = new Timeline();
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 1",
                1,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                1,
                7,
            );
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                1,
                "Visit 2",
                8,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Treatment",
                8,
            );
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                1,
                "Visit 3",
                15,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Treatment",
                8,
                15,
            );
            expectedTimeline.setCurrentDay(15);

            // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a three visit timeline for a visit that repeats twice", () => {
            // GIVEN a study configuration with one period and two events
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", eventDay: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has three instances of the repeating event on the expected days
            let expectedTimeline = new Timeline();
            let eventInstance1 = addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                0,
                "Visit 1",
                1,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Screening",
                1,
                15,
            );
            expectedTimeline.setCompleted(eventInstance1);
            let eventInstance2 = new ScheduledEventInstance(eventInstance1.scheduledEvent, 8);
            expectedTimeline.setCompleted(eventInstance2);
            expectedTimeline.addEvent(eventInstance2);
            let eventInstance3 = new ScheduledEventInstance(eventInstance1.scheduledEvent, 15);
            expectedTimeline.setCompleted(eventInstance3);
            expectedTimeline.addEvent(eventInstance3);
            expectedTimeline.setCurrentDay(15);

            // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect(expectedTimeline.days[0].events[0]).toEqual(timeline.days[0].events[0]);
            expect(expectedTimeline.days[0].events[1]).toEqual(timeline.days[0].events[1]);
            expect(expectedTimeline.days[1].events[0]).toEqual(timeline.days[1].events[0]);
            expect(timeline).toEqual(expectedTimeline);
        });

        it("can access the first instance of a period on the timeline", () => {
            // GIVEN a study configuration with one period and one event
            let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 1);
            let period = Period.create({ name: "Screening" });
            let scheduledEvent = utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
            studyConfigurationUnit.periods.push(period);

            // WHEN the study is simulated with no period is active yet and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();

            // Then the generated timeline has one event on the expected event day
            let timeline = simulator.timeline;
            let expectedTimeline = new Timeline();
            let scheduledPeriod = simulator.scheduledStudyConfiguration.scheduledPeriods[0];
            let periodInstance = new PeriodEventInstance(scheduledPeriod, 1);
            periodInstance.setCompleted(1);
            expectedTimeline.addEvent(periodInstance as unknown as TimelineEventInstance);
            expectedTimeline.setCurrentDay(1);

            // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            expect((timeline.getPeriods()[0] as PeriodEventInstance).scheduledPeriod.getName()).toEqual("Screening");
            expect(expectedTimeline.getPeriods()[0]).toEqual(timeline.getPeriods()[0]); // First instance on the timeline should be the period
        });

        it("can access the second instance of a period on the timeline", () => {
            // GIVEN a study configuration with two periods and two events
            let listOfEventsToAdd: EventsToAdd[] = [
                { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated with no period is active yet and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();

            // Then the generated timeline has two periods on the expected day
            let timeline = simulator.timeline;

            // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

            let periodsOnTimeline = timeline.getPeriods();
            expect(periodsOnTimeline.length).toEqual(2);
            expect(periodsOnTimeline[0].getName()).toEqual("Screening");
            expect(periodsOnTimeline[1].getName()).toEqual("Treatment");
            expect(periodsOnTimeline[0].startDay).toEqual(1);
            expect(periodsOnTimeline[1].startDay).toEqual(8);
            let currentPeriod = timeline.getPeriods()[1] as PeriodEventInstance;
            expect(currentPeriod.scheduledPeriod.getName()).toEqual("Treatment");
            expect(currentPeriod.startDay).toEqual(8);
        });
    });

    describe("Generation of Timeline Chart from Timeline", () => {
        it("generate a chart for a two visit and one period timeline for a visit 7 days after the end of the first visit", () => {
            // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
            let expectedTimelineDataAsScript = ` var groups = new vis.DataSet([
            { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
            { "content": "Visit 1", "id": "Visit 1" },{ "content": "Visit 2", "id": "Visit 2" },
          ]);

          var items = new vis.DataSet([
            { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 0", content: "<b>Screening</b>", id: "Screening0" },
            { start: new Date(2023, 11, 31, 00, 00, 00), end: new Date(2023, 11, 31, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 11" },
            { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 12" },
            { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 13" },
            { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "Visit 2: Study Start + 7", content: "&nbsp;", id: "Visit 24" },
          ])
        `;

            let expectedTimelineVisualizationHTML = ` // create visualization
          var container = document.getElementById('visualization');
          var options = {
            format: {
                minorLabels: {
                    millisecond:'',
                    second:     '',
                    minute:     '',
                    hour:       '',
                    weekday:    '',
                    day:        'DDD',
                    week:       '',
                    month:      '',
                    year:       ''
                },
            },
            timeAxis: {scale: 'day', step: 1},
            showMajorLabels: false,
            orientation: 'both',
            start: new Date(2024, 0, 1),
            end: new Date(2024, 0, 8, 23, 59, 59),
            min: new Date(2024, 0, 1),
            max: new Date(2024, 0, 8, 23, 59, 59),
            margin: {
                item: {
                    horizontal: 0,
                },
            },
          };
        `;
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "Visit 1", 0, "Visit 2", 7);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });

        it("generate a chart for two periods", () => {
            // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
            let expectedTimelineDataAsScript = `var groups = new vis.DataSet([
          { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
          { "content": "Visit 1", "id": "Visit 1" },
          { "content": "Visit 2", "id": "Visit 2" },
        ]);

        var items = new vis.DataSet([
          { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 07, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 0", content: "<b>Screening</b>", id: "Screening0" },
          { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 7", content: "<b>Treatment</b>", id: "Treatment1" },
          { start: new Date(2023, 11, 31, 00, 00, 00), end: new Date(2023, 11, 31, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 12" },
          { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 13" },
          { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 14" },
          { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "Visit 2: when Visit 1 completed + 7 days", content: "&nbsp;", id: "Visit 25" },
        ])
        `;
            // GIVEN a study configuration with one period and two events
            // where second visit has no window before or after
            let listOfEventsToAdd: EventsToAdd[] = [
                { eventName: "Visit 1", eventDay: 0, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, "", true);
        });

        it("generate a chart for the example study 1", () => {
            let expectedTimelineDataAsScript = `var groups = new vis.DataSet([
           { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
           { "content": "Visit 1", "id": "Visit 1" },{ "content": "Visit 2", "id": "Visit 2" },
           { "content": "Any Day", "id": "AnyDay", className: 'any-day' },
         ]);

        var items = new vis.DataSet([
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 1", content: "<b>Screening</b>", id: "Screening" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 8", content: "<b>Treatment</b>", id: "Treatment" },
          { start: new Date(2024, 0, 0), end: new Date(2024, 0, 0, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 1" },
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "day 1", content: "&nbsp;", id: "Visit 1" },
          { start: new Date(2024, 0, 2), end: new Date(2024, 0, 2, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 1" },
          { start: new Date(2024, 0, 7), end: new Date(2024, 0, 7, 23, 59, 59), group: "Visit 2", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 2" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "when Visit 1 + 7", content: "&nbsp;", id: "Visit 2" },
          { start: new Date(2024, 0, 9), end: new Date(2024, 0, 9, 23, 59, 59), group: "Visit 2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 2" },
          { start: new Date(2024, 0, 6), end: new Date(2024, 0, 8, 23, 59, 59), group: "AnyDay", className: "any-day", title: "Adverse Event", content: "Unscheduled Adverse Event Visit", id: "911" },
         ])
        `;
            // GIVEN a study configuration loaded from a file
            // const studyConfigurationUnit = utils.loadModel("Example1", 'StudyConfiguration');
            const studyConfigurationUnit = utils.loadModel("ScheduleExample1", "StudyConfiguration");
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("generate a chart for the example study 2", () => {
            let expectedTimelineDataAsScript = `var groups = new vis.DataSet([
           { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
           { "content": "Visit 1", "id": "Visit 1" },{ "content": "Visit 2", "id": "Visit 2" },
           { "content": "Any Day", "id": "AnyDay", className: 'any-day' },
         ]);

        var items = new vis.DataSet([
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 1", content: "<b>Screening</b>", id: "Screening" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 8", content: "<b>Treatment</b>", id: "Treatment" },
          { start: new Date(2024, 0, 0), end: new Date(2024, 0, 0, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 1" },
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "day 1", content: "&nbsp;", id: "Visit 1" },
          { start: new Date(2024, 0, 2), end: new Date(2024, 0, 2, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 1" },
          { start: new Date(2024, 0, 7), end: new Date(2024, 0, 7, 23, 59, 59), group: "Visit 2", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 2" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "when Visit 1 + 7", content: "&nbsp;", id: "Visit 2" },
          { start: new Date(2024, 0, 9), end: new Date(2024, 0, 9, 23, 59, 59), group: "Visit 2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 2" },
          { start: new Date(2024, 0, 6), end: new Date(2024, 0, 8, 23, 59, 59), group: "AnyDay", className: "any-day", title: "Adverse Event", content: "Unscheduled Adverse Event Visit", id: "911" },
         ])
        `;
            // GIVEN a study configuration loaded from a file
            const studyConfigurationUnit = utils.loadModel("ScheduleExample2", "StudyConfiguration");
            // const studyConfigurationUnit = utils.loadModel("EachCompleteTest", 'StudyConfiguration');
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("generate a chart for the example study 3", () => {
            const expectedTimelineDataAsScript = `var groups = new vis.DataSet([
                  { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
                  { "content": "ICF (1A)", "id": "ICF (1A)" },
                  { "content": "Screening (1B/1C)", "id": "Screening (1B/1C)" },
                  { "content": "BAE (2A)", "id": "BAE (2A)" },
                  { "content": "BAE (2B)", "id": "BAE (2B)" },
                  { "content": "Randomization (3A)", "id": "Randomization (3A)" },
                  { "content": "Dose Admin (3A)", "id": "Dose Admin (3A)" },
                  { "content": "Dose Admin (3B)", "id": "Dose Admin (3B)" },
                  { "content": "Dose Admin (3C)", "id": "Dose Admin (3C)" },
                  { "content": "Dose Admin (3D)", "id": "Dose Admin (3D)" },
                  { "content": "Dose Admin (3E)", "id": "Dose Admin (3E)" },
                  { "content": "PAC1 (4A)", "id": "PAC1 (4A)" },
                  { "content": "Dose admin/PAC1 (3F/4B)", "id": "Dose admin/PAC1 (3F/4B)" },
                  { "content": "Dose Admin (3G)", "id": "Dose Admin (3G)" },
                  { "content": "Dose Admin (3H)", "id": "Dose Admin (3H)" },
                  { "content": "End of dose (3I)", "id": "End of dose (3I)" },
                  { "content": "PAC2 (4C)", "id": "PAC2 (4C)" },
                  { "content": "PAC2 (4D)", "id": "PAC2 (4D)" },
                  { "content": "PAC3 (4E)", "id": "PAC3 (4E)" },
                  { "content": "PAC3 (4F)", "id": "PAC3 (4F)" },
                  { "content": "Follow up (5)", "id": "Follow up (5)" },
                ]);

              var items = new vis.DataSet([
                  { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -57", content: "<b>Screening</b>", id: "Screening0" },
                  { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2025, 03, 08, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
                  
                  { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "ICF (1A)", className: "treatment-visits", title: "ICF (1A): Study Start - 57", content: "&nbsp;", id: "ICF (1A)2" },
                  { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Screening (1B/1C)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Screening (1B/1C)3" },
                  { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Screening (1B/1C)", className: "treatment-visits", title: "Screening (1B/1C): Study Start - 56", content: "&nbsp;", id: "Screening (1B/1C)4" },
                  { start: new Date(2024, 00, 03, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "Screening (1B/1C)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Screening (1B/1C)5" },
                  { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 06, 23, 59, 59), group: "BAE (2A)", className: "treatment-visits", title: "BAE (2A): Study Start - 21 days", content: "&nbsp;", id: "BAE (2A)6" },
                  
                  { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 20, 23, 59, 59), group: "BAE (2B)", className: "treatment-visits", title: "BAE (2B): Study Start - 7 days", content: "&nbsp;", id: "BAE (2B)7" },
                  { start: new Date(2024, 01, 21, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "BAE (2B)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-BAE (2B)8" },
                  { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 27, 23, 59, 59), group: "Randomization (3A)", className: "treatment-visits", title: "Randomization (3A): Study Start", content: "&nbsp;", id: "Randomization (3A)9" },
                  { start: new Date(2024, 02, 24, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "Dose Admin (3A)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3A)10" },
                  { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 26, 23, 59, 59), group: "Dose Admin (3A)", className: "treatment-visits", title: "Dose Admin (3A): when Randomization (3A) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3A)11" },
                  { start: new Date(2024, 02, 27, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "Dose Admin (3A)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3A)12" },{ start: new Date(2024, 03, 21, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "Dose Admin (3B)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3B)13" },
                  { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 23, 23, 59, 59), group: "Dose Admin (3B)", className: "treatment-visits", title: "Dose Admin (3B): when Dose Admin (3A) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3B)14" },
                  { start: new Date(2024, 03, 24, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "Dose Admin (3B)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3B)15" },{ start: new Date(2024, 04, 19, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "Dose Admin (3C)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3C)16" },
                  { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 21, 23, 59, 59), group: "Dose Admin (3C)", className: "treatment-visits", title: "Dose Admin (3C): when Dose Admin (3B) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3C)17" },
                  { start: new Date(2024, 04, 22, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "Dose Admin (3C)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3C)18" },{ start: new Date(2024, 05, 16, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "Dose Admin (3D)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3D)19" },
                  { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 18, 23, 59, 59), group: "Dose Admin (3D)", className: "treatment-visits", title: "Dose Admin (3D): when Dose Admin (3C) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3D)20" },
                  { start: new Date(2024, 05, 19, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "Dose Admin (3D)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3D)21" },{ start: new Date(2024, 06, 14, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "Dose Admin (3E)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3E)22" },
                  { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 16, 23, 59, 59), group: "Dose Admin (3E)", className: "treatment-visits", title: "Dose Admin (3E): when Dose Admin (3D) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3E)23" },
                  { start: new Date(2024, 06, 17, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "Dose Admin (3E)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3E)24" },{ start: new Date(2024, 07, 11, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "PAC1 (4A)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC1 (4A)25" },
                  { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 13, 23, 59, 59), group: "PAC1 (4A)", className: "treatment-visits", title: "PAC1 (4A): when Dose Admin (3E) completed + 4 weeks", content: "&nbsp;", id: "PAC1 (4A)26" },
                  { start: new Date(2024, 07, 14, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "PAC1 (4A)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC1 (4A)27" },{ start: new Date(2024, 08, 08, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "Dose admin/PAC1 (3F/4B)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose admin/PAC1 (3F/4B)28" },
                  { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 10, 23, 59, 59), group: "Dose admin/PAC1 (3F/4B)", className: "treatment-visits", title: "Dose admin/PAC1 (3F/4B): when PAC1 (4A) completed + 4 weeks", content: "&nbsp;", id: "Dose admin/PAC1 (3F/4B)29" },
                  { start: new Date(2024, 08, 11, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "Dose admin/PAC1 (3F/4B)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose admin/PAC1 (3F/4B)30" },{ start: new Date(2024, 09, 06, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "Dose Admin (3G)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3G)31" },
                  { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 08, 23, 59, 59), group: "Dose Admin (3G)", className: "treatment-visits", title: "Dose Admin (3G): when Dose admin/PAC1 (3F/4B) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3G)32" },
                  { start: new Date(2024, 09, 09, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "Dose Admin (3G)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3G)33" },{ start: new Date(2024, 10, 03, 00, 00, 00), end: new Date(2024, 10, 04, 23, 59, 59), group: "Dose Admin (3H)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3H)34" },
                  { start: new Date(2024, 10, 05, 00, 00, 00), end: new Date(2024, 10, 05, 23, 59, 59), group: "Dose Admin (3H)", className: "treatment-visits", title: "Dose Admin (3H): when Dose Admin (3G) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3H)35" },
                  { start: new Date(2024, 10, 06, 00, 00, 00), end: new Date(2024, 10, 07, 23, 59, 59), group: "Dose Admin (3H)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3H)36" },{ start: new Date(2024, 11, 01, 00, 00, 00), end: new Date(2024, 11, 02, 23, 59, 59), group: "End of dose (3I)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-End of dose (3I)37" },
                  { start: new Date(2024, 11, 03, 00, 00, 00), end: new Date(2024, 11, 03, 23, 59, 59), group: "End of dose (3I)", className: "treatment-visits", title: "End of dose (3I): when Dose Admin (3H) completed + 4 weeks", content: "&nbsp;", id: "End of dose (3I)38" },
                  { start: new Date(2024, 11, 04, 00, 00, 00), end: new Date(2024, 11, 05, 23, 59, 59), group: "End of dose (3I)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-End of dose (3I)39" },{ start: new Date(2025, 00, 05, 00, 00, 00), end: new Date(2025, 00, 06, 23, 59, 59), group: "PAC2 (4C)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC2 (4C)40" },
                  { start: new Date(2025, 00, 07, 00, 00, 00), end: new Date(2025, 00, 07, 23, 59, 59), group: "PAC2 (4C)", className: "treatment-visits", title: "PAC2 (4C): when End of dose (3I) completed + 5 weeks", content: "&nbsp;", id: "PAC2 (4C)41" },
                  { start: new Date(2025, 00, 08, 00, 00, 00), end: new Date(2025, 00, 09, 23, 59, 59), group: "PAC2 (4C)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC2 (4C)42" },
                  { start: new Date(2025, 00, 05, 00, 00, 00), end: new Date(2025, 00, 06, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC2 (4D)43" },
                  { start: new Date(2025, 00, 07, 00, 00, 00), end: new Date(2025, 00, 07, 23, 59, 59), group: "PAC2 (4D)", className: "treatment-visits", title: "PAC2 (4D): when End of dose (3I) completed + 5 weeks", content: "&nbsp;", id: "PAC2 (4D)44" },
                  { start: new Date(2025, 00, 08, 00, 00, 00), end: new Date(2025, 00, 09, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC2 (4D)45" },{ start: new Date(2025, 00, 19, 00, 00, 00), end: new Date(2025, 00, 20, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC2 (4D)46" },
                  { start: new Date(2025, 00, 21, 00, 00, 00), end: new Date(2025, 00, 21, 23, 59, 59), group: "PAC2 (4D)", className: "treatment-visits", title: "PAC2 (4D): when PAC2 (4C) completed + 2 weeks", content: "&nbsp;", id: "PAC2 (4D)47" },
                  { start: new Date(2025, 00, 22, 00, 00, 00), end: new Date(2025, 00, 23, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC2 (4D)48" },{ start: new Date(2025, 02, 23, 00, 00, 00), end: new Date(2025, 02, 24, 23, 59, 59), group: "PAC3 (4E)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC3 (4E)49" },
                  { start: new Date(2025, 02, 25, 00, 00, 00), end: new Date(2025, 02, 25, 23, 59, 59), group: "PAC3 (4E)", className: "treatment-visits", title: "PAC3 (4E): when PAC2 (4D) completed + 11 weeks", content: "&nbsp;", id: "PAC3 (4E)50" },
                  { start: new Date(2025, 02, 26, 00, 00, 00), end: new Date(2025, 02, 27, 23, 59, 59), group: "PAC3 (4E)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC3 (4E)51" },{ start: new Date(2025, 03, 06, 00, 00, 00), end: new Date(2025, 03, 07, 23, 59, 59), group: "PAC3 (4F)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC3 (4F)52" },
                  { start: new Date(2025, 03, 08, 00, 00, 00), end: new Date(2025, 03, 08, 23, 59, 59), group: "PAC3 (4F)", className: "treatment-visits", title: "PAC3 (4F): when PAC3 (4E) completed + 2 weeks", content: "&nbsp;", id: "PAC3 (4F)53" },
                  { start: new Date(2025, 03, 09, 00, 00, 00), end: new Date(2025, 03, 10, 23, 59, 59), group: "PAC3 (4F)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC3 (4F)54" },
                  { start: new Date(2025, 03, 03, 00, 00, 00), end: new Date(2025, 03, 07, 23, 59, 59), group: "Follow up (5)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Follow up (5)55" },
                  { start: new Date(2025, 03, 08, 00, 00, 00), end: new Date(2025, 03, 08, 23, 59, 59), group: "Follow up (5)", className: "treatment-visits", title: "Follow up (5): when PAC3 (4F) completed + 0 days", content: "&nbsp;", id: "Follow up (5)56" },
                  { start: new Date(2025, 03, 09, 00, 00, 00), end: new Date(2025, 03, 13, 23, 59, 59), group: "Follow up (5)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Follow up (5)57" },
              ])`;
            // GIVEN a study configuration loaded from a file

            const studyConfigurationUnit = utils.loadModel("ScheduleExample3", "StudyConfiguration");
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it.skip("generate a chart from the text version of the study", () => {
            // GIVEN a study configuration loaded from a string
            const configAsText = `StudyConfiguration StudyConfiguration {
    showActivityDetails true
    showSystems false
    showScheduling true
    showPeriods true
    studyStartDayNumber 0
    periods
        Period: Screening
        Description: " "
        EVENTS
            Event: V1
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start - 28
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  16 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V2
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start - 16
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  14 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V3
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start - 15
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  14 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

        Period: Baseline
        Description: " "
        EVENTS
            Event: V4
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V5
            Type: site
            Description: " "
            Schedule:
                First scheduled: when V4 completed + 4 weeks
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V6
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "8" weeks
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V7, V10, V12
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start + "12" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats: frequency: Every: "12" weeks
                                  max 2 times
                                  until
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V8
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "16" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V9
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "20" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V11
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "28" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V13
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "44" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V14
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start + "52" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: FU
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "54" weeks
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

    tasks
        Task 1
        "<p>ssss</p>"
    systemAccesses

    staffing Roles:

             Assignments:

}`;
            const studyConfigurationUnit = studyConfigurationModelEnvironment.reader.readFromString(
                configAsText,
                "StudyConfiguration",
                studyConfigurationModel,
            ) as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            // const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
            // const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
            // Then the generated timeline picture has two events on the expected event days
            // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("generates a CHART for a three visit timeline for a visit that repeats twice", () => {
            // GIVEN
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", eventDay: 0, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);
            // utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });
    });
    describe("Generation of Timeline Table from Timeline", () => {
        it("generates a TABLE for a three visit timeline for a visit that repeats twice", () => {
            // GIVEN
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", eventDay: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const expectedTimelineTableAsHTML = `<div class="table_component" role="region" tabindex="0">
              <table>
                <caption>Study Timeline Table</caption>
                <thead>
                  <tr>
                    <th>Visit Name</th>
                    <th>Alternative Name</th>
                    <th>Phase</th>
                    <th>Window (-)</th>
                    <th>Day/Date</th>
                    <th>Window (+)</th>
                  </tr>
                  </thead>
                  <tbody>

              <tr>
                      <td>Visit 1</td>
                      <td> </td>
                      <td>Screening</td>
                      <td>1</td>
                      <td>2</td>
                      <td>1</td>
                      </tr><tr>
                      <td>Visit 1</td>
                      <td> </td>
                      <td>Screening</td>
                      <td>1</td>
                      <td>9</td>
                      <td>1</td>
                      </tr><tr>
                      <td>Visit 1</td>
                      <td> </td>
                      <td>Screening</td>
                      <td>1</td>
                      <td>16</td>
                      <td>1</td>
                      </tr>
                    </tr>
                  </tbody>
                </table>
              `;
            const timelineTableAsHTML = TimelineTableTemplate.getTimelineTableHTML(timeline);
            // Save full HTML of table for viewing / debugging
            utils.saveTimelineTable(timelineTableAsHTML);

            const normalizedTimelineDataAsScript = timelineTableAsHTML.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineTableAsHTML.replace(/\s+/g, "");
            // Then the generated timeline table has the expected data in it
            expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });
    });

    describe("Generation of Study Checklists Document", () => {
        it("generate a document for a one visit,one checklist, one task study", () => {
            // GIVEN a study configuration loaded from a file and the study is simulated
            const studyConfigurationUnit = utils.loadModel("OneVisitOneChecklist", "StudyConfiguration");
            studyConfigurationModel.addUnit(studyConfigurationUnit);
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // WHEN the study checklist document is generated
            const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline);

            // THEN the generated study checklist document has the expected content
            utils.saveToFile(studyChecklistAsMarkdown, "StudyChecklistOneVisitOneChecklist.md");
            const expectedMarkdown = utils.readTestDataFile("StudyChecklistOneVisitOneChecklist.md");
            const normalizedActualMarkdown = studyChecklistAsMarkdown.replace(/\s+/g, "");
            const normalizedExpectedMarkdown = expectedMarkdown.replace(/\s+/g, "");
            expect(normalizedActualMarkdown).toEqual(normalizedExpectedMarkdown);
        });
    });
});
