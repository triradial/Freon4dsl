import * as Sim from "../simjs/sim.js";
import { Timeline } from "../timeline/Timeline";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance";
import { PeriodEventInstance } from "../timeline/PeriodEventInstance";
import { TimelineEventInstance, TimelineInstanceState } from "../timeline/TimelineEventInstance";
import { Simulator } from "../timeline/Simulator";
import { StudyConfiguration, Period, Event, StudyConfigurationModel, PatientInfo, PatientVisit, PatientHistory } from "../../language/gen/index";
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
            utils.checkTimelineChart(timeline, "", "", true); // No checking done on chart. Just save full HTML of chart for viewing / debugging

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
            utils.checkTimelineChart(timeline, "", "", true); // No checking done on chart. Just save full HTML of chart for viewing / debugging
            expectedTimeline.setCurrentDay(7);
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
            utils.checkTimelineChart(timeline, "", "", true); // No checking done on chart. Just save full HTML of chart for viewing / debugging
            expectedTimeline.setCurrentDay(8);
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
            let expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
          { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
          { "content": "V1", "id": "V1" },
          { "content": "V2", "id": "V2" },
          { "content": "V3", "id": "V3" },
          { "content": "V4", "id": "V4" },
          { "content": "V5", "id": "V5" },
          { "content": "V6", "id": "V6" },
          { "content": "V7, V10, V12", "id": "V7, V10, V12" },
          { "content": "V8", "id": "V8" },
          { "content": "V9", "id": "V9" },
          { "content": "V11", "id": "V11" },
          { "content": "V13", "id": "V13" },
          { "content": "V14", "id": "V14" },
          { "content": "FU", "id": "FU" },
        ]);

      var items = new vis.DataSet([
          { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
          { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2025, 01, 10, 23, 59, 59), group: "Phase", className: "baseline-phase", title: "Day: 0", content: "<b>Baseline</b>", id: "Baseline1" },
          
          { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1", className: "treatment-visits", title: "V1: Study Start - 28", content: "&nbsp;", id: "V12" },
          { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V13" },
          { start: new Date(2024, 00, 13, 00, 00, 00), end: new Date(2024, 00, 13, 23, 59, 59), group: "V2", className: "treatment-visits", title: "V2: Study Start - 16", content: "&nbsp;", id: "V24" },
          { start: new Date(2024, 00, 14, 00, 00, 00), end: new Date(2024, 00, 27, 23, 59, 59), group: "V2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V25" },
          { start: new Date(2024, 00, 14, 00, 00, 00), end: new Date(2024, 00, 14, 23, 59, 59), group: "V3", className: "treatment-visits", title: "V3: Study Start - 15", content: "&nbsp;", id: "V36" },
          { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "V3", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V37" },
          { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V4", className: "treatment-visits", title: "V4: Study Start", content: "&nbsp;", id: "V48" },
          
          { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V5", className: "treatment-visits", title: "V5: when V4 completed + 4 weeks", content: "&nbsp;", id: "V59" },
          
          { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V6", className: "treatment-visits", title: "V6: Study Start + 8 weeks", content: "&nbsp;", id: "V610" },
          { start: new Date(2024, 03, 17, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V7, V10, V1211" },
          { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V7, V10, V12", className: "treatment-visits", title: "V7, V10, V12: Study Start + 12 weeks", content: "&nbsp;", id: "V7, V10, V1212" },
          { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V7, V10, V1213" },{ start: new Date(2024, 04, 15, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V814" },
          { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8", className: "treatment-visits", title: "V8: Study Start + 16 weeks", content: "&nbsp;", id: "V815" },
          { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V816" },{ start: new Date(2024, 05, 12, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V9", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V917" },
          { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V9", className: "treatment-visits", title: "V9: Study Start + 20 weeks", content: "&nbsp;", id: "V918" },
          { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V9", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V919" },{ start: new Date(2024, 06, 10, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V7, V10, V1220" },
          { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V7, V10, V12", className: "treatment-visits", title: "V7, V10, V12: Study Start + 12 weeks", content: "&nbsp;", id: "V7, V10, V1221" },
          { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V7, V10, V1222" },{ start: new Date(2024, 07, 07, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V11", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1123" },
          { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V11", className: "treatment-visits", title: "V11: Study Start + 28 weeks", content: "&nbsp;", id: "V1124" },
          { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V11", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1125" },{ start: new Date(2024, 09, 02, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V7, V10, V1226" },
          { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V7, V10, V12", className: "treatment-visits", title: "V7, V10, V12: Study Start + 12 weeks", content: "&nbsp;", id: "V7, V10, V1227" },
          { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V7, V10, V1228" },{ start: new Date(2024, 10, 27, 00, 00, 00), end: new Date(2024, 11, 01, 23, 59, 59), group: "V13", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1329" },
          { start: new Date(2024, 11, 02, 00, 00, 00), end: new Date(2024, 11, 02, 23, 59, 59), group: "V13", className: "treatment-visits", title: "V13: Study Start + 44 weeks", content: "&nbsp;", id: "V1330" },
          { start: new Date(2024, 11, 03, 00, 00, 00), end: new Date(2024, 11, 07, 23, 59, 59), group: "V13", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1331" },{ start: new Date(2025, 00, 22, 00, 00, 00), end: new Date(2025, 00, 26, 23, 59, 59), group: "V14", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1432" },
          { start: new Date(2025, 00, 27, 00, 00, 00), end: new Date(2025, 00, 27, 23, 59, 59), group: "V14", className: "treatment-visits", title: "V14: Study Start + 52 weeks", content: "&nbsp;", id: "V1433" },
          { start: new Date(2025, 00, 28, 00, 00, 00), end: new Date(2025, 01, 01, 23, 59, 59), group: "V14", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1434" },
          { start: new Date(2025, 01, 10, 00, 00, 00), end: new Date(2025, 01, 10, 23, 59, 59), group: "FU", className: "treatment-visits", title: "FU: Study Start + 54 weeks", content: "&nbsp;", id: "FU35" },
         ])
        `;
            // GIVEN a study configuration loaded from a file
            // const studyConfigurationUnit = utils.loadModel("Example1", 'StudyConfiguration');
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample1", "StudyConfiguration") as StudyConfiguration;
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

        it("generate a chart for the example study 2", () => {
            let expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "V1 rando", "id": "V1 rando" },
    { "content": "V1 run in", "id": "V1 run in" },
    { "content": "V2 rando", "id": "V2 rando" },
    { "content": "V2 run in", "id": "V2 run in" },
    { "content": "V3-rando", "id": "V3-rando" },
    { "content": "V4-V7-rando", "id": "V4-V7-rando" },
    { "content": "V4-V7 run in", "id": "V4-V7 run in" },
    { "content": "V8-V13-rando", "id": "V8-V13-rando" },
    { "content": "V8-V13 run in", "id": "V8-V13 run in" },
    { "content": "V14-V18 rando", "id": "V14-V18 rando" },
    { "content": "V14-V18 run in", "id": "V14-V18 run in" },
    { "content": "V19-rando", "id": "V19-rando" },
    { "content": "V19-run in", "id": "V19-run in" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
    
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1 rando", className: "treatment-visits", title: "V1 rando: Study Start - 4 weeks", content: "&nbsp;", id: "V1 rando2" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "V1 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1 run in3" },
    { start: new Date(2024, 00, 04, 00, 00, 00), end: new Date(2024, 00, 04, 23, 59, 59), group: "V1 run in", className: "treatment-visits", title: "V1 run in: when V1 rando completed + 3 days", content: "&nbsp;", id: "V1 run in4" },
    { start: new Date(2024, 00, 05, 00, 00, 00), end: new Date(2024, 00, 06, 23, 59, 59), group: "V1 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1 run in5" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "V2 rando", className: "treatment-visits", title: "V2 rando: Study Start - 2 weeks", content: "&nbsp;", id: "V2 rando6" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V2 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V2 run in7" },
    { start: new Date(2024, 00, 18, 00, 00, 00), end: new Date(2024, 00, 18, 23, 59, 59), group: "V2 run in", className: "treatment-visits", title: "V2 run in: when V2 rando completed + 3 days", content: "&nbsp;", id: "V2 run in8" },
    { start: new Date(2024, 00, 19, 00, 00, 00), end: new Date(2024, 00, 20, 23, 59, 59), group: "V2 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V2 run in9" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V3-rando", className: "treatment-visits", title: "V3-rando: Study Start", content: "&nbsp;", id: "V3-rando10" },
    { start: new Date(2024, 01, 03, 00, 00, 00), end: new Date(2024, 01, 04, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando11" },
    { start: new Date(2024, 01, 05, 00, 00, 00), end: new Date(2024, 01, 05, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando12" },
    { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando13" },{ start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in14" },
    { start: new Date(2024, 01, 08, 00, 00, 00), end: new Date(2024, 01, 08, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in15" },
    { start: new Date(2024, 01, 09, 00, 00, 00), end: new Date(2024, 01, 10, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in16" },{ start: new Date(2024, 01, 10, 00, 00, 00), end: new Date(2024, 01, 11, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando17" },
    { start: new Date(2024, 01, 12, 00, 00, 00), end: new Date(2024, 01, 12, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando18" },
    { start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando19" },{ start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in20" },
    { start: new Date(2024, 01, 15, 00, 00, 00), end: new Date(2024, 01, 15, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in21" },
    { start: new Date(2024, 01, 16, 00, 00, 00), end: new Date(2024, 01, 17, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in22" },{ start: new Date(2024, 01, 17, 00, 00, 00), end: new Date(2024, 01, 18, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando23" },
    { start: new Date(2024, 01, 19, 00, 00, 00), end: new Date(2024, 01, 19, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando24" },
    { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando25" },{ start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in26" },
    { start: new Date(2024, 01, 22, 00, 00, 00), end: new Date(2024, 01, 22, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in27" },
    { start: new Date(2024, 01, 23, 00, 00, 00), end: new Date(2024, 01, 24, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in28" },{ start: new Date(2024, 01, 24, 00, 00, 00), end: new Date(2024, 01, 25, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando29" },
    { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando30" },
    { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando31" },{ start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in32" },
    { start: new Date(2024, 01, 29, 00, 00, 00), end: new Date(2024, 01, 29, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in33" },
    { start: new Date(2024, 02, 01, 00, 00, 00), end: new Date(2024, 02, 02, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in34" },{ start: new Date(2024, 02, 09, 00, 00, 00), end: new Date(2024, 02, 10, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando35" },
    { start: new Date(2024, 02, 11, 00, 00, 00), end: new Date(2024, 02, 11, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando36" },
    { start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando37" },{ start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in38" },
    { start: new Date(2024, 02, 14, 00, 00, 00), end: new Date(2024, 02, 14, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in39" },
    { start: new Date(2024, 02, 15, 00, 00, 00), end: new Date(2024, 02, 16, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in40" },{ start: new Date(2024, 02, 23, 00, 00, 00), end: new Date(2024, 02, 24, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando41" },
    { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando42" },
    { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando43" },{ start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in44" },
    { start: new Date(2024, 02, 28, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in45" },
    { start: new Date(2024, 02, 29, 00, 00, 00), end: new Date(2024, 02, 30, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in46" },{ start: new Date(2024, 03, 06, 00, 00, 00), end: new Date(2024, 03, 07, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando47" },
    { start: new Date(2024, 03, 08, 00, 00, 00), end: new Date(2024, 03, 08, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando48" },
    { start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando49" },{ start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in50" },
    { start: new Date(2024, 03, 11, 00, 00, 00), end: new Date(2024, 03, 11, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in51" },
    { start: new Date(2024, 03, 12, 00, 00, 00), end: new Date(2024, 03, 13, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in52" },{ start: new Date(2024, 03, 20, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando53" },
    { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando54" },
    { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando55" },{ start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in56" },
    { start: new Date(2024, 03, 25, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in57" },
    { start: new Date(2024, 03, 26, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in58" },{ start: new Date(2024, 04, 04, 00, 00, 00), end: new Date(2024, 04, 05, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando59" },
    { start: new Date(2024, 04, 06, 00, 00, 00), end: new Date(2024, 04, 06, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando60" },
    { start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando61" },{ start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in62" },
    { start: new Date(2024, 04, 09, 00, 00, 00), end: new Date(2024, 04, 09, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in63" },
    { start: new Date(2024, 04, 10, 00, 00, 00), end: new Date(2024, 04, 11, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in64" },{ start: new Date(2024, 04, 18, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando65" },
    { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando66" },
    { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando67" },{ start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in68" },
    { start: new Date(2024, 04, 23, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in69" },
    { start: new Date(2024, 04, 24, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in70" },{ start: new Date(2024, 05, 15, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando71" },
    { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando72" },
    { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando73" },{ start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in74" },
    { start: new Date(2024, 05, 20, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in75" },
    { start: new Date(2024, 05, 21, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in76" },{ start: new Date(2024, 06, 13, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando77" },
    { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando78" },
    { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando79" },{ start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in80" },
    { start: new Date(2024, 06, 18, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in81" },
    { start: new Date(2024, 06, 19, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in82" },{ start: new Date(2024, 07, 10, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando83" },
    { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando84" },
    { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando85" },{ start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in86" },
    { start: new Date(2024, 07, 15, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in87" },
    { start: new Date(2024, 07, 16, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in88" },{ start: new Date(2024, 08, 07, 00, 00, 00), end: new Date(2024, 08, 08, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando89" },
    { start: new Date(2024, 08, 09, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando90" },
    { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando91" },{ start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in92" },
    { start: new Date(2024, 08, 12, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in93" },
    { start: new Date(2024, 08, 13, 00, 00, 00), end: new Date(2024, 08, 14, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in94" },{ start: new Date(2024, 09, 05, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando95" },
    { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando96" },
    { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando97" },{ start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in98" },
    { start: new Date(2024, 09, 10, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in99" },
    { start: new Date(2024, 09, 11, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in100" },{ start: new Date(2024, 09, 12, 00, 00, 00), end: new Date(2024, 09, 13, 23, 59, 59), group: "V19-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19-rando101" },
    { start: new Date(2024, 09, 14, 00, 00, 00), end: new Date(2024, 09, 14, 23, 59, 59), group: "V19-rando", className: "treatment-visits", title: "V19-rando: when V14-V18 rando completed + 7 days", content: "&nbsp;", id: "V19-rando102" },
    { start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19-rando103" },{ start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19-run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19-run in104" },
    { start: new Date(2024, 09, 17, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "V19-run in", className: "treatment-visits", title: "V19-run in: when V19-rando completed + 3 days", content: "&nbsp;", id: "V19-run in105" },
    { start: new Date(2024, 09, 18, 00, 00, 00), end: new Date(2024, 09, 19, 23, 59, 59), group: "V19-run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19-run in106" },
  ])`;
            // GIVEN a study configuration loaded from a file
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
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

            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample3", "StudyConfiguration") as StudyConfiguration;
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

        it("generates a chart for a visit on day 1 that patient completed", () => {
            const expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
                    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
                    { "content": "Visit 1", "id": "Visit 1" },
                    { "content": "<b>Completed Visits</b>", "id": "Patient", className: 'patient' },
                ]);

                var items = new vis.DataSet([
                    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Phase", className: "period-phase", title: "Day: 0", content: "<b>Period</b>", id: "Period0" },
                    
                    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 11" },
                    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 12" },
                        
                    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Patient", className: "patient", title: "PATIENT", content: "&nbsp;", id: "Patient3" }

                ]) `;
            const expectedTimelineVisualizationHTML = `// create visualization
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
                    start: new Date(2024,0,1),
                    end: new Date(2024, 0, 1, 23, 59, 59),
                    min: new Date(2024, 0, 1),
                    max: new Date(2024, 0, 1, 23, 59, 59),
                    margin: {
                        item: {
                            horizontal: 0,
                        },
                    },
                };`;
            // GIVEN a study configuration with one period and one event and a patient that completed the event
            const eventName = "Visit 1";
            let eventSchedule = utils.createEventScheduleStartingOnADay(eventName, 0, 0);
            let period = new Period("Screening");
            utils.createEventAndAddToPeriod(period, eventName, eventSchedule);
            studyConfigurationUnit.periods.push(period);
            const visitToComplete = studyConfigurationUnit.periods[0].events[0];
            const patientInfoUnit = utils.createPatientInfoWithACompletedVisit(visitToComplete.name, "1", "January", "2024", 1);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit, patientInfoUnit.patientHistories[0]);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has one event on the expected event day and the corresponding patient visit completion
            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });

        it("generate a chart for the example study ScheduleExample2 with the first 10 visits completed", () => {
            let expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "V1 rando", "id": "V1 rando" },
    { "content": "V1 run in", "id": "V1 run in" },
    { "content": "V2 rando", "id": "V2 rando" },
    { "content": "V2 run in", "id": "V2 run in" },
    { "content": "V3-rando", "id": "V3-rando" },
    { "content": "V4-V7-rando", "id": "V4-V7-rando" },
    { "content": "V4-V7 run in", "id": "V4-V7 run in" },
    { "content": "V8-V13-rando", "id": "V8-V13-rando" },
    { "content": "V8-V13 run in", "id": "V8-V13 run in" },
    { "content": "V14-V18 rando", "id": "V14-V18 rando" },
    { "content": "V14-V18 run in", "id": "V14-V18 run in" },
    { "content": "V19-rando", "id": "V19-rando" },
    { "content": "V19-run in", "id": "V19-run in" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
    
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1 rando", className: "treatment-visits", title: "V1 rando: Study Start - 4 weeks", content: "&nbsp;", id: "V1 rando2" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "V1 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1 run in3" },
    { start: new Date(2024, 00, 04, 00, 00, 00), end: new Date(2024, 00, 04, 23, 59, 59), group: "V1 run in", className: "treatment-visits", title: "V1 run in: when V1 rando completed + 3 days", content: "&nbsp;", id: "V1 run in4" },
    { start: new Date(2024, 00, 05, 00, 00, 00), end: new Date(2024, 00, 06, 23, 59, 59), group: "V1 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1 run in5" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "V2 rando", className: "treatment-visits", title: "V2 rando: Study Start - 2 weeks", content: "&nbsp;", id: "V2 rando6" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V2 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V2 run in7" },
    { start: new Date(2024, 00, 18, 00, 00, 00), end: new Date(2024, 00, 18, 23, 59, 59), group: "V2 run in", className: "treatment-visits", title: "V2 run in: when V2 rando completed + 3 days", content: "&nbsp;", id: "V2 run in8" },
    { start: new Date(2024, 00, 19, 00, 00, 00), end: new Date(2024, 00, 20, 23, 59, 59), group: "V2 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V2 run in9" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V3-rando", className: "treatment-visits", title: "V3-rando: Study Start", content: "&nbsp;", id: "V3-rando10" },
    { start: new Date(2024, 01, 03, 00, 00, 00), end: new Date(2024, 01, 04, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando11" },
    { start: new Date(2024, 01, 05, 00, 00, 00), end: new Date(2024, 01, 05, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando12" },
    { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando13" },{ start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in14" },
    { start: new Date(2024, 01, 08, 00, 00, 00), end: new Date(2024, 01, 08, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in15" },
    { start: new Date(2024, 01, 09, 00, 00, 00), end: new Date(2024, 01, 10, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in16" },{ start: new Date(2024, 01, 10, 00, 00, 00), end: new Date(2024, 01, 11, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando17" },
    { start: new Date(2024, 01, 12, 00, 00, 00), end: new Date(2024, 01, 12, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando18" },
    { start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando19" },{ start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in20" },
    { start: new Date(2024, 01, 15, 00, 00, 00), end: new Date(2024, 01, 15, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in21" },
    { start: new Date(2024, 01, 16, 00, 00, 00), end: new Date(2024, 01, 17, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in22" },{ start: new Date(2024, 01, 17, 00, 00, 00), end: new Date(2024, 01, 18, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando23" },
    { start: new Date(2024, 01, 19, 00, 00, 00), end: new Date(2024, 01, 19, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando24" },
    { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando25" },{ start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in26" },
    { start: new Date(2024, 01, 22, 00, 00, 00), end: new Date(2024, 01, 22, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in27" },
    { start: new Date(2024, 01, 23, 00, 00, 00), end: new Date(2024, 01, 24, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in28" },{ start: new Date(2024, 01, 24, 00, 00, 00), end: new Date(2024, 01, 25, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7-rando29" },
    { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V4-V7-rando", className: "treatment-visits", title: "V4-V7-rando: when V3-rando completed + 1 weeks", content: "&nbsp;", id: "V4-V7-rando30" },
    { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7-rando31" },{ start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 run in32" },
    { start: new Date(2024, 01, 29, 00, 00, 00), end: new Date(2024, 01, 29, 23, 59, 59), group: "V4-V7 run in", className: "treatment-visits", title: "V4-V7 run in: when V4-V7-rando each completed + 3 days", content: "&nbsp;", id: "V4-V7 run in33" },
    { start: new Date(2024, 02, 01, 00, 00, 00), end: new Date(2024, 02, 02, 23, 59, 59), group: "V4-V7 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 run in34" },{ start: new Date(2024, 02, 09, 00, 00, 00), end: new Date(2024, 02, 10, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando35" },
    { start: new Date(2024, 02, 11, 00, 00, 00), end: new Date(2024, 02, 11, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando36" },
    { start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando37" },{ start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in38" },
    { start: new Date(2024, 02, 14, 00, 00, 00), end: new Date(2024, 02, 14, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in39" },
    { start: new Date(2024, 02, 15, 00, 00, 00), end: new Date(2024, 02, 16, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in40" },{ start: new Date(2024, 02, 23, 00, 00, 00), end: new Date(2024, 02, 24, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando41" },
    { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando42" },
    { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando43" },{ start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in44" },
    { start: new Date(2024, 02, 28, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in45" },
    { start: new Date(2024, 02, 29, 00, 00, 00), end: new Date(2024, 02, 30, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in46" },{ start: new Date(2024, 03, 06, 00, 00, 00), end: new Date(2024, 03, 07, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando47" },
    { start: new Date(2024, 03, 08, 00, 00, 00), end: new Date(2024, 03, 08, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando48" },
    { start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando49" },{ start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in50" },
    { start: new Date(2024, 03, 11, 00, 00, 00), end: new Date(2024, 03, 11, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in51" },
    { start: new Date(2024, 03, 12, 00, 00, 00), end: new Date(2024, 03, 13, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in52" },{ start: new Date(2024, 03, 20, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando53" },
    { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando54" },
    { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando55" },{ start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in56" },
    { start: new Date(2024, 03, 25, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in57" },
    { start: new Date(2024, 03, 26, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in58" },{ start: new Date(2024, 04, 04, 00, 00, 00), end: new Date(2024, 04, 05, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando59" },
    { start: new Date(2024, 04, 06, 00, 00, 00), end: new Date(2024, 04, 06, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando60" },
    { start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando61" },{ start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in62" },
    { start: new Date(2024, 04, 09, 00, 00, 00), end: new Date(2024, 04, 09, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in63" },
    { start: new Date(2024, 04, 10, 00, 00, 00), end: new Date(2024, 04, 11, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in64" },{ start: new Date(2024, 04, 18, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13-rando65" },
    { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8-V13-rando", className: "treatment-visits", title: "V8-V13-rando: when V4-V7-rando completed + 2 weeks", content: "&nbsp;", id: "V8-V13-rando66" },
    { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13-rando67" },{ start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 run in68" },
    { start: new Date(2024, 04, 23, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "V8-V13 run in", className: "treatment-visits", title: "V8-V13 run in: when V8-V13-rando each completed + 3 days", content: "&nbsp;", id: "V8-V13 run in69" },
    { start: new Date(2024, 04, 24, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8-V13 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 run in70" },{ start: new Date(2024, 05, 15, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando71" },
    { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando72" },
    { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando73" },{ start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in74" },
    { start: new Date(2024, 05, 20, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in75" },
    { start: new Date(2024, 05, 21, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in76" },{ start: new Date(2024, 06, 13, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando77" },
    { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando78" },
    { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando79" },{ start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in80" },
    { start: new Date(2024, 06, 18, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in81" },
    { start: new Date(2024, 06, 19, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in82" },{ start: new Date(2024, 07, 10, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando83" },
    { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando84" },
    { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando85" },{ start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in86" },
    { start: new Date(2024, 07, 15, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in87" },
    { start: new Date(2024, 07, 16, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in88" },{ start: new Date(2024, 08, 07, 00, 00, 00), end: new Date(2024, 08, 08, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando89" },
    { start: new Date(2024, 08, 09, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando90" },
    { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando91" },{ start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in92" },
    { start: new Date(2024, 08, 12, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in93" },
    { start: new Date(2024, 08, 13, 00, 00, 00), end: new Date(2024, 08, 14, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in94" },{ start: new Date(2024, 09, 05, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 rando95" },
    { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V14-V18 rando", className: "treatment-visits", title: "V14-V18 rando: when V8-V13-rando completed + 4 weeks", content: "&nbsp;", id: "V14-V18 rando96" },
    { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 rando97" },{ start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 run in98" },
    { start: new Date(2024, 09, 10, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "V14-V18 run in", className: "treatment-visits", title: "V14-V18 run in: when V14-V18 rando each completed + 3 days", content: "&nbsp;", id: "V14-V18 run in99" },
    { start: new Date(2024, 09, 11, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V14-V18 run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 run in100" },{ start: new Date(2024, 09, 12, 00, 00, 00), end: new Date(2024, 09, 13, 23, 59, 59), group: "V19-rando", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19-rando101" },
    { start: new Date(2024, 09, 14, 00, 00, 00), end: new Date(2024, 09, 14, 23, 59, 59), group: "V19-rando", className: "treatment-visits", title: "V19-rando: when V14-V18 rando completed + 7 days", content: "&nbsp;", id: "V19-rando102" },
    { start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19-rando", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19-rando103" },{ start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19-run in", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19-run in104" },
    { start: new Date(2024, 09, 17, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "V19-run in", className: "treatment-visits", title: "V19-run in: when V19-rando completed + 3 days", content: "&nbsp;", id: "V19-run in105" },
    { start: new Date(2024, 09, 18, 00, 00, 00), end: new Date(2024, 09, 19, 23, 59, 59), group: "V19-run in", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19-run in106" },
  ])`;
            // GIVEN a study configuration loaded from a file
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);
            // const patientInfoUnit = utils.loadModelUnit("ScheduleExample2", "PatientInfo") as PatientInfo;
            // studyConfigurationModel.addUnit(patientInfoUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            let shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [
                { name: "V2 rando", instance: 1, shift: -1, numberFound: 0 },
                { name: "V4-V7-rando", instance: 1, shift: -4, numberFound: 0 },
                { name: "V4-V7-rando", instance: 2, shift: 2, numberFound: 0 },
            ];
            let completedPatientVisits: PatientVisit[] = createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
            timeline.addPatientVisits(completedPatientVisits);

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("generates a chart for a visit on day 1 showing staff level", () => {
            const expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
                    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
                    { "content": "Visit 1", "id": "Visit 1" },
                    { "content": "<b>Completed Visits</b>", "id": "Patient", className: 'patient' },
                ]);

                var items = new vis.DataSet([
                    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Phase", className: "period-phase", title: "Day: 0", content: "<b>Period</b>", id: "Period0" },
                    
                    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 11" },
                    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 12" },
                        
                    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Patient", className: "patient", title: "PATIENT", content: "&nbsp;", id: "Patient3" }

                ]) `;
            const expectedTimelineVisualizationHTML = `// create visualization
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
                    start: new Date(2024,0,1),
                    end: new Date(2024, 0, 1, 23, 59, 59),
                    min: new Date(2024, 0, 1),
                    max: new Date(2024, 0, 1, 23, 59, 59),
                    margin: {
                        item: {
                            horizontal: 0,
                        },
                    },
                };`;
            // GIVEN a study configuration with one period and one event and a patient that completed the event
            const eventName = "Visit 1";
            let eventSchedule = utils.createEventScheduleStartingOnADay(eventName, 0, 0);
            let period = new Period("Screening");
            utils.createEventAndAddToPeriod(period, eventName, eventSchedule);
            studyConfigurationUnit.periods.push(period);
            const visitToComplete = studyConfigurationUnit.periods[0].events[0];
            const availability = utils.createAvailabilityWithACompletedVisit(visitToComplete.name, "1", "January", "2024", 1);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit, availability);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has one event on the expected event day and the corresponding staff level
            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
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
            const expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "Visit 1", "id": "Visit 1" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 0", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2023, 11, 31, 00, 00, 00), end: new Date(2023, 11, 31, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 11" },
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 12" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 13" },{ start: new Date(2024, 00, 07, 00, 00, 00), end: new Date(2024, 00, 07, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 14" },
    { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 15" },
    { start: new Date(2024, 00, 09, 00, 00, 00), end: new Date(2024, 00, 09, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 16" },{ start: new Date(2024, 00, 14, 00, 00, 00), end: new Date(2024, 00, 14, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 17" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 18" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 16, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 19" },
  ])`;
            // GIVEN
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", eventDay: 0, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, "", true);
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
            const studyConfigurationUnit = utils.loadModelUnit("OneVisitOneChecklist", "StudyConfiguration") as StudyConfiguration;
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

type ShiftsFromScheduledVisit = { name: string; instance: number; shift: number; numberFound: number };

function createCompletedPatientVisits(numberToCreate: number, timeline: Timeline, shiftsFromScheduledVisit: ShiftsFromScheduledVisit[]): PatientVisit[] {
    let completedPatientVisits: PatientVisit[] = [];
    let i = 0;
    let stopAddingVisits = false;
    const referenceDate = timeline.getReferenceDate();
    timeline.printTimelineOfScheduledEventInstances();
    timeline.getScheduleEventInstancesOrderByDay().forEach((scheduledEventInstance) => {
        if (i++ < numberToCreate) {
            let dateOfVisit: Date = new Date();
            const startDay = scheduledEventInstance.getStartDay();
            const matchingShiftsFromScheduledVisit = shiftsFromScheduledVisit.filter((record) => record.name === scheduledEventInstance.getName());
            matchingShiftsFromScheduledVisit.forEach((shiftFromScheduledVisit) => {
                if (!!shiftFromScheduledVisit) {
                    shiftFromScheduledVisit.numberFound++;
                    if (shiftFromScheduledVisit.numberFound === shiftFromScheduledVisit.instance)
                        dateOfVisit = addDays(referenceDate, startDay + shiftFromScheduledVisit.shift);
                    else dateOfVisit = addDays(referenceDate, startDay);
                } else {
                    dateOfVisit = addDays(referenceDate, startDay);
                }
                const patientVisit = utils.createACompletedPatientVisit(
                    scheduledEventInstance.getName(),
                    dateOfVisit.getDate().toString(),
                    timeline.getMonthName(dateOfVisit.getMonth()),
                    dateOfVisit.getFullYear().toString(),
                    scheduledEventInstance.getInstanceNumber(),
                );
                console.log(
                    "Adding completed visit: " +
                        scheduledEventInstance.getName() +
                        " instance: " +
                        scheduledEventInstance.getInstanceNumber() +
                        " on " +
                        dateOfVisit.toDateString(),
                );
                completedPatientVisits.push(patientVisit);
            });
        }
    });
    return completedPatientVisits;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
