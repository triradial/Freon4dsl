import * as Sim from "../simjs/sim.js";
import { Timeline } from "../timeline/Timeline";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance";
import { PeriodEventInstance } from "../timeline/PeriodEventInstance";
import { TimelineEventInstance, TimelineInstanceState } from "../timeline/TimelineEventInstance";
import { Simulator } from "../timeline/Simulator";
import {
    StudyConfiguration,
    Period,
    Event,
    StudyConfigurationModel,
    PatientInfo,
    PatientVisit,
    PatientHistory,
    Availability,
    PatientNotAvailable,
    DateRange,
} from "../../language/gen/index";
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
                { eventName: "Visit 1", daysToAdd: 1, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", daysToAdd: 7, repeat: 0, period: "Treatment" },
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
                { eventName: "Visit 1", daysToAdd: 0, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", daysToAdd: 7, repeat: 0, period: "Treatment" },
                { eventName: "Visit 3", daysToAdd: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

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
                6,
            );
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                1,
                "Visit 2",
                7,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Treatment",
                7,
            );
            addEventAndInstanceToTimeline(
                studyConfigurationUnit,
                1,
                "Visit 3",
                14,
                expectedTimeline,
                ScheduledEventState.Completed,
                TimelineInstanceState.Completed,
                "Treatment",
                7,
                14,
            );
            expectedTimeline.setCurrentDay(14);

            utils.generateChart(timeline, true); // Save full HTML of chart for viewing / debugging

            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a three visit timeline for a visit that repeats twice", () => {
            // GIVEN a study configuration with one period and two events
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 1, repeat: 2, period: "Screening" }];
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
            let eventInstance2 = new ScheduledEventInstance(eventInstance1.scheduledEvent, 8, 2);
            eventInstance2.setEndDay(8);
            expectedTimeline.setCompleted(eventInstance2);
            expectedTimeline.addEvent(eventInstance2);
            let eventInstance3 = new ScheduledEventInstance(eventInstance1.scheduledEvent, 15, 3);
            eventInstance3.setEndDay(15);
            expectedTimeline.setCompleted(eventInstance3);
            expectedTimeline.addEvent(eventInstance3);
            expectedTimeline.setCurrentDay(15);

            // utils.generateChart(timeline, true); // Save full HTML of chart for viewing / debugging

            expect(expectedTimeline.days[0].events[0]).toEqual(timeline.days[0].events[0]);
            expect(expectedTimeline.days[0].events[1]).toEqual(timeline.days[0].events[1]);
            expect(expectedTimeline.days[1].events[0]).toEqual(timeline.days[1].events[0]);
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
                { eventName: "Visit 1", daysToAdd: 1, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", daysToAdd: 7, repeat: 0, period: "Treatment" },
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
            { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 12" },
            { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 13" },
            { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 2", className: "scheduled-event", title: "Visit 2: at the start day of the Study plus 7 days", content: "&nbsp;", id: "Visit 24" },
          ])
        `;

            let expectedTimelineVisualizationHTML = ` // create visualization
          var container = document.getElementById('visualization');
          var options = {
            showCurrentTime: false,
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
                majorLabels: {
                        millisecond:'',
                        second:     '',
                        minute:     '',
                        hour:       '',
                        weekday:    '',
                        day:        'w',
                        week:       '',
                        month:      '',
                        year:       ''
                    }
            },
            timeAxis: {scale: 'day', step: 1},
            showMajorLabels: true,
            orientation: 'both',
            start: new Date(2024, 0, 1),
            end: new Date(2024, 0, 9),
            min: new Date(2024, 0, 1),
            max: new Date(2024, 0, 9),
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
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 12" },
                { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 13" },
                { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 2", className: "scheduled-event", title: "Visit 2: when Visit 1 completed + 7 days", content: "&nbsp;", id: "Visit 24" },
        ])
        `;
            // GIVEN a study configuration with one period and two events
            // where second visit has no window before or after
            let listOfEventsToAdd: EventsToAdd[] = [
                { eventName: "Visit 1", daysToAdd: 0, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", daysToAdd: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, "", true);
        });

        it("generate a chart for the study with screen event starting 7 days before the study start", () => {
            let expectedTimelineDataAsScript = `var groups = new vis.DataSet([
              { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
              { "content": "Screen", "id": "Screen" },
              { "content": "StudyStart", "id": "StudyStart" },
              ]);
              
              var items = new vis.DataSet([
              { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 07, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -7", content: "<b>Screening</b>", id: "Screening0" },
              { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
              { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Screen", className: "scheduled-event", title: "Screen: at the start day of the Study - 7 days", content: "&nbsp;", id: "Screen2" },
              { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "StudyStart", className: "scheduled-event", title: "StudyStart: at the start day of the Study", content: "&nbsp;", id: "StudyStart3" },
              ])
              `;
            testStudyInFile("StartMinusDays", studyConfigurationModel, expectedTimelineDataAsScript);
        });

        it("generate a chart for the example study 1", () => {
            let expectedTimelineDataAsScript = `var groups = new vis.DataSet([
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
              { start: new Date(2018, 02, 13, 00, 00, 00), end: new Date(2018, 03, 09, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
              { start: new Date(2018, 03, 10, 00, 00, 00), end: new Date(2019, 03, 23, 23, 59, 59), group: "Phase", className: "baseline-phase", title: "Day: 0", content: "<b>Baseline</b>", id: "Baseline1" },
              { start: new Date(2018, 02, 13, 00, 00, 00), end: new Date(2018, 02, 13, 23, 59, 59), group: "V1", className: "scheduled-event", title: "V1: at the start day of the Study - 28 days", content: "&nbsp;", id: "V12" },
              { start: new Date(2018, 02, 14, 00, 00, 00), end: new Date(2018, 02, 28, 23, 59, 59), group: "V1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V13" },
              { start: new Date(2018, 02, 25, 00, 00, 00), end: new Date(2018, 02, 25, 23, 59, 59), group: "V2", className: "scheduled-event", title: "V2: at the start day of the Study - 16 days", content: "&nbsp;", id: "V24" },
              { start: new Date(2018, 02, 26, 00, 00, 00), end: new Date(2018, 03, 08, 23, 59, 59), group: "V2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V25" },
              { start: new Date(2018, 02, 26, 00, 00, 00), end: new Date(2018, 02, 26, 23, 59, 59), group: "V3", className: "scheduled-event", title: "V3: at the start day of the Study - 15 days", content: "&nbsp;", id: "V36" },
              { start: new Date(2018, 02, 27, 00, 00, 00), end: new Date(2018, 03, 09, 23, 59, 59), group: "V3", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V37" },
              { start: new Date(2018, 03, 10, 00, 00, 00), end: new Date(2018, 03, 10, 23, 59, 59), group: "V4", className: "scheduled-event", title: "V4: at the start day of the Study", content: "&nbsp;", id: "V48" },
              { start: new Date(2018, 04, 07, 00, 00, 00), end: new Date(2018, 04, 08, 23, 59, 59), group: "V5", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V59" },
              { start: new Date(2018, 04, 09, 00, 00, 00), end: new Date(2018, 04, 09, 23, 59, 59), group: "V5", className: "scheduled-event", title: "V5: when V4 completed + 4 weeks", content: "&nbsp;", id: "V510" },
              { start: new Date(2018, 04, 10, 00, 00, 00), end: new Date(2018, 04, 11, 23, 59, 59), group: "V5", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V511" },
              { start: new Date(2018, 04, 31, 00, 00, 00), end: new Date(2018, 05, 04, 23, 59, 59), group: "V6", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V612" },
              { start: new Date(2018, 05, 05, 00, 00, 00), end: new Date(2018, 05, 05, 23, 59, 59), group: "V6", className: "scheduled-event", title: "V6: at the start day of the Study + 8 weeks", content: "&nbsp;", id: "V613" },
              { start: new Date(2018, 05, 06, 00, 00, 00), end: new Date(2018, 05, 10, 23, 59, 59), group: "V6", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V614" },
              { start: new Date(2018, 05, 28, 00, 00, 00), end: new Date(2018, 06, 02, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V7, V10, V1215" },
              { start: new Date(2018, 06, 03, 00, 00, 00), end: new Date(2018, 06, 03, 23, 59, 59), group: "V7, V10, V12", className: "scheduled-event", title: "V7, V10, V12: at the start day of the Study + 12 weeks", content: "&nbsp;", id: "V7, V10, V1216" },
              { start: new Date(2018, 06, 04, 00, 00, 00), end: new Date(2018, 06, 08, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V7, V10, V1217" },
              { start: new Date(2018, 06, 26, 00, 00, 00), end: new Date(2018, 06, 30, 23, 59, 59), group: "V8", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V818" },
              { start: new Date(2018, 06, 31, 00, 00, 00), end: new Date(2018, 06, 31, 23, 59, 59), group: "V8", className: "scheduled-event", title: "V8: at the start day of the Study + 16 weeks", content: "&nbsp;", id: "V819" },
              { start: new Date(2018, 07, 01, 00, 00, 00), end: new Date(2018, 07, 05, 23, 59, 59), group: "V8", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V820" },
              { start: new Date(2018, 07, 23, 00, 00, 00), end: new Date(2018, 07, 27, 23, 59, 59), group: "V9", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V921" },
              { start: new Date(2018, 07, 28, 00, 00, 00), end: new Date(2018, 07, 28, 23, 59, 59), group: "V9", className: "scheduled-event", title: "V9: at the start day of the Study + 20 weeks", content: "&nbsp;", id: "V922" },
              { start: new Date(2018, 07, 29, 00, 00, 00), end: new Date(2018, 08, 02, 23, 59, 59), group: "V9", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V923" },
              { start: new Date(2018, 08, 20, 00, 00, 00), end: new Date(2018, 08, 24, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V7, V10, V1224" },
              { start: new Date(2018, 08, 25, 00, 00, 00), end: new Date(2018, 08, 25, 23, 59, 59), group: "V7, V10, V12", className: "scheduled-event", title: "V7, V10, V12: at the start day of the Study + 12 weeks", content: "&nbsp;", id: "V7, V10, V1225" },
              { start: new Date(2018, 08, 26, 00, 00, 00), end: new Date(2018, 08, 30, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V7, V10, V1226" },
              { start: new Date(2018, 09, 18, 00, 00, 00), end: new Date(2018, 09, 22, 23, 59, 59), group: "V11", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1127" },
              { start: new Date(2018, 09, 23, 00, 00, 00), end: new Date(2018, 09, 23, 23, 59, 59), group: "V11", className: "scheduled-event", title: "V11: at the start day of the Study + 28 weeks", content: "&nbsp;", id: "V1128" },
              { start: new Date(2018, 09, 24, 00, 00, 00), end: new Date(2018, 09, 28, 23, 59, 59), group: "V11", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1129" },
              { start: new Date(2018, 11, 13, 00, 00, 00), end: new Date(2018, 11, 17, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V7, V10, V1230" },
              { start: new Date(2018, 11, 18, 00, 00, 00), end: new Date(2018, 11, 18, 23, 59, 59), group: "V7, V10, V12", className: "scheduled-event", title: "V7, V10, V12: at the start day of the Study + 12 weeks", content: "&nbsp;", id: "V7, V10, V1231" },
              { start: new Date(2018, 11, 19, 00, 00, 00), end: new Date(2018, 11, 23, 23, 59, 59), group: "V7, V10, V12", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V7, V10, V1232" },
              { start: new Date(2019, 01, 07, 00, 00, 00), end: new Date(2019, 01, 11, 23, 59, 59), group: "V13", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1333" },
              { start: new Date(2019, 01, 12, 00, 00, 00), end: new Date(2019, 01, 12, 23, 59, 59), group: "V13", className: "scheduled-event", title: "V13: at the start day of the Study + 44 weeks", content: "&nbsp;", id: "V1334" },
              { start: new Date(2019, 01, 13, 00, 00, 00), end: new Date(2019, 01, 17, 23, 59, 59), group: "V13", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1335" },
              { start: new Date(2019, 03, 04, 00, 00, 00), end: new Date(2019, 03, 08, 23, 59, 59), group: "V14", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1436" },
              { start: new Date(2019, 03, 09, 00, 00, 00), end: new Date(2019, 03, 09, 23, 59, 59), group: "V14", className: "scheduled-event", title: "V14: at the start day of the Study + 52 weeks", content: "&nbsp;", id: "V1437" },
              { start: new Date(2019, 03, 10, 00, 00, 00), end: new Date(2019, 03, 14, 23, 59, 59), group: "V14", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1438" },
              { start: new Date(2019, 03, 23, 00, 00, 00), end: new Date(2019, 03, 23, 23, 59, 59), group: "FU", className: "scheduled-event", title: "FU: at the start day of the Study + 54 weeks", content: "&nbsp;", id: "FU39" },
              ])
        `;
            testStudyInFile("ScheduleExample1a", studyConfigurationModel, expectedTimelineDataAsScript, new Date(2018, 2, 13));
        });

        it("generate a chart for the example study 2", () => {
            let expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "V1 Randomization", "id": "V1 Randomization" },
    { "content": "V1  Run In", "id": "V1  Run In" },
    { "content": "V2 Randomization", "id": "V2 Randomization" },
    { "content": "V2  Run In", "id": "V2  Run In" },
    { "content": "V3 Randomization", "id": "V3 Randomization" },
    { "content": "V4-V7 Randomization", "id": "V4-V7 Randomization" },
    { "content": "V4-V7  Run In", "id": "V4-V7  Run In" },
    { "content": "V8-V13 Randomization", "id": "V8-V13 Randomization" },
    { "content": "V8-V13  Run In", "id": "V8-V13  Run In" },
    { "content": "V14-V18 Randomization", "id": "V14-V18 Randomization" },
    { "content": "V14-V18  Run In", "id": "V14-V18  Run In" },
    { "content": "V19 Randomization", "id": "V19 Randomization" },
    { "content": "V19 Run In", "id": "V19 Run In" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
    
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1 Randomization", className: "scheduled-event", title: "V1 Randomization: at the start day of the Study  - 4 weeks", content: "&nbsp;", id: "V1 Randomization2" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1  Run In3" },
    { start: new Date(2024, 00, 04, 00, 00, 00), end: new Date(2024, 00, 04, 23, 59, 59), group: "V1  Run In", className: "scheduled-event", title: "V1  Run In: when V1 Randomization completed + 3 days", content: "&nbsp;", id: "V1  Run In4" },
    { start: new Date(2024, 00, 05, 00, 00, 00), end: new Date(2024, 00, 06, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1  Run In5" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "V2 Randomization", className: "scheduled-event", title: "V2 Randomization: at the start day of the Study  - 2 weeks", content: "&nbsp;", id: "V2 Randomization6" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V2  Run In7" },
    { start: new Date(2024, 00, 18, 00, 00, 00), end: new Date(2024, 00, 18, 23, 59, 59), group: "V2  Run In", className: "scheduled-event", title: "V2  Run In: when V2 Randomization completed + 3 days", content: "&nbsp;", id: "V2  Run In8" },
    { start: new Date(2024, 00, 19, 00, 00, 00), end: new Date(2024, 00, 20, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V2  Run In9" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V3 Randomization", className: "scheduled-event", title: "V3 Randomization: at the start day of the Study ", content: "&nbsp;", id: "V3 Randomization10" },
    { start: new Date(2024, 01, 03, 00, 00, 00), end: new Date(2024, 01, 04, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization11" },
    { start: new Date(2024, 01, 05, 00, 00, 00), end: new Date(2024, 01, 05, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization12" },
    { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization13" },{ start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In14" },
    { start: new Date(2024, 01, 08, 00, 00, 00), end: new Date(2024, 01, 08, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In15" },
    { start: new Date(2024, 01, 09, 00, 00, 00), end: new Date(2024, 01, 10, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In16" },{ start: new Date(2024, 01, 10, 00, 00, 00), end: new Date(2024, 01, 11, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization17" },
    { start: new Date(2024, 01, 12, 00, 00, 00), end: new Date(2024, 01, 12, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization18" },
    { start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization19" },{ start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In20" },
    { start: new Date(2024, 01, 15, 00, 00, 00), end: new Date(2024, 01, 15, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In21" },
    { start: new Date(2024, 01, 16, 00, 00, 00), end: new Date(2024, 01, 17, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In22" },{ start: new Date(2024, 01, 17, 00, 00, 00), end: new Date(2024, 01, 18, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization23" },
    { start: new Date(2024, 01, 19, 00, 00, 00), end: new Date(2024, 01, 19, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization24" },
    { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization25" },{ start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In26" },
    { start: new Date(2024, 01, 22, 00, 00, 00), end: new Date(2024, 01, 22, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In27" },
    { start: new Date(2024, 01, 23, 00, 00, 00), end: new Date(2024, 01, 24, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In28" },{ start: new Date(2024, 01, 24, 00, 00, 00), end: new Date(2024, 01, 25, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization29" },
    { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization30" },
    { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization31" },{ start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In32" },
    { start: new Date(2024, 01, 29, 00, 00, 00), end: new Date(2024, 01, 29, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In33" },
    { start: new Date(2024, 02, 01, 00, 00, 00), end: new Date(2024, 02, 02, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In34" },{ start: new Date(2024, 02, 09, 00, 00, 00), end: new Date(2024, 02, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization35" },
    { start: new Date(2024, 02, 11, 00, 00, 00), end: new Date(2024, 02, 11, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization36" },
    { start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization37" },{ start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In38" },
    { start: new Date(2024, 02, 14, 00, 00, 00), end: new Date(2024, 02, 14, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In39" },
    { start: new Date(2024, 02, 15, 00, 00, 00), end: new Date(2024, 02, 16, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In40" },{ start: new Date(2024, 02, 23, 00, 00, 00), end: new Date(2024, 02, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization41" },
    { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization42" },
    { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization43" },{ start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In44" },
    { start: new Date(2024, 02, 28, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In45" },
    { start: new Date(2024, 02, 29, 00, 00, 00), end: new Date(2024, 02, 30, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In46" },{ start: new Date(2024, 03, 06, 00, 00, 00), end: new Date(2024, 03, 07, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization47" },
    { start: new Date(2024, 03, 08, 00, 00, 00), end: new Date(2024, 03, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization48" },
    { start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization49" },{ start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In50" },
    { start: new Date(2024, 03, 11, 00, 00, 00), end: new Date(2024, 03, 11, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In51" },
    { start: new Date(2024, 03, 12, 00, 00, 00), end: new Date(2024, 03, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In52" },{ start: new Date(2024, 03, 20, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization53" },
    { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization54" },
    { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization55" },{ start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In56" },
    { start: new Date(2024, 03, 25, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In57" },
    { start: new Date(2024, 03, 26, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In58" },{ start: new Date(2024, 04, 04, 00, 00, 00), end: new Date(2024, 04, 05, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization59" },
    { start: new Date(2024, 04, 06, 00, 00, 00), end: new Date(2024, 04, 06, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization60" },
    { start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization61" },{ start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In62" },
    { start: new Date(2024, 04, 09, 00, 00, 00), end: new Date(2024, 04, 09, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In63" },
    { start: new Date(2024, 04, 10, 00, 00, 00), end: new Date(2024, 04, 11, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In64" },{ start: new Date(2024, 04, 18, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization65" },
    { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization66" },
    { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization67" },{ start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In68" },
    { start: new Date(2024, 04, 23, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In69" },
    { start: new Date(2024, 04, 24, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In70" },{ start: new Date(2024, 05, 15, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization71" },
    { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization72" },
    { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization73" },{ start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In74" },
    { start: new Date(2024, 05, 20, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In75" },
    { start: new Date(2024, 05, 21, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In76" },{ start: new Date(2024, 06, 13, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization77" },
    { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization78" },
    { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization79" },{ start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In80" },
    { start: new Date(2024, 06, 18, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In81" },
    { start: new Date(2024, 06, 19, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In82" },{ start: new Date(2024, 07, 10, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization83" },
    { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization84" },
    { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization85" },{ start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In86" },
    { start: new Date(2024, 07, 15, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In87" },
    { start: new Date(2024, 07, 16, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In88" },{ start: new Date(2024, 08, 07, 00, 00, 00), end: new Date(2024, 08, 08, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization89" },
    { start: new Date(2024, 08, 09, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization90" },
    { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization91" },{ start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In92" },
    { start: new Date(2024, 08, 12, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In93" },
    { start: new Date(2024, 08, 13, 00, 00, 00), end: new Date(2024, 08, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In94" },{ start: new Date(2024, 09, 05, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization95" },
    { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization96" },
    { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization97" },{ start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In98" },
    { start: new Date(2024, 09, 10, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In99" },
    { start: new Date(2024, 09, 11, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In100" },{ start: new Date(2024, 09, 12, 00, 00, 00), end: new Date(2024, 09, 13, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Randomization101" },
    { start: new Date(2024, 09, 14, 00, 00, 00), end: new Date(2024, 09, 14, 23, 59, 59), group: "V19 Randomization", className: "scheduled-event", title: "V19 Randomization: when V14-V18 Randomization completed + 7 days", content: "&nbsp;", id: "V19 Randomization102" },
    { start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Randomization103" },{ start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Run In104" },
    { start: new Date(2024, 09, 17, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "V19 Run In", className: "scheduled-event", title: "V19 Run In: when V19 Randomization completed + 3 days", content: "&nbsp;", id: "V19 Run In105" },
    { start: new Date(2024, 09, 18, 00, 00, 00), end: new Date(2024, 09, 19, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Run In106" },
  ])`;
            testStudyInFile("ScheduleExample2a", studyConfigurationModel, expectedTimelineDataAsScript, new Date(2011, 2, 25));
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
                  
                  { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "ICF (1A)", className: "scheduled-event", title: "ICF (1A): at the start day of the Study  - 57", content: "&nbsp;", id: "ICF (1A)2" },
                  { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Screening (1B/1C)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Screening (1B/1C)3" },
                  { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Screening (1B/1C)", className: "scheduled-event", title: "Screening (1B/1C): at the start day of the Study  - 56", content: "&nbsp;", id: "Screening (1B/1C)4" },
                  { start: new Date(2024, 00, 03, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "Screening (1B/1C)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Screening (1B/1C)5" },
                  { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 06, 23, 59, 59), group: "BAE (2A)", className: "scheduled-event", title: "BAE (2A): at the start day of the Study  - 21 days", content: "&nbsp;", id: "BAE (2A)6" },
                  
                  { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 20, 23, 59, 59), group: "BAE (2B)", className: "scheduled-event", title: "BAE (2B): at the start day of the Study  - 7 days", content: "&nbsp;", id: "BAE (2B)7" },
                  { start: new Date(2024, 01, 21, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "BAE (2B)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-BAE (2B)8" },
                  { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 27, 23, 59, 59), group: "Randomization (3A)", className: "scheduled-event", title: "Randomization (3A): at the start day of the Study ", content: "&nbsp;", id: "Randomization (3A)9" },
                  { start: new Date(2024, 02, 24, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "Dose Admin (3A)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3A)10" },
                  { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 26, 23, 59, 59), group: "Dose Admin (3A)", className: "scheduled-event", title: "Dose Admin (3A): when Randomization (3A) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3A)11" },
                  { start: new Date(2024, 02, 27, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "Dose Admin (3A)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3A)12" },{ start: new Date(2024, 03, 21, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "Dose Admin (3B)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3B)13" },
                  { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 23, 23, 59, 59), group: "Dose Admin (3B)", className: "scheduled-event", title: "Dose Admin (3B): when Dose Admin (3A) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3B)14" },
                  { start: new Date(2024, 03, 24, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "Dose Admin (3B)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3B)15" },{ start: new Date(2024, 04, 19, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "Dose Admin (3C)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3C)16" },
                  { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 21, 23, 59, 59), group: "Dose Admin (3C)", className: "scheduled-event", title: "Dose Admin (3C): when Dose Admin (3B) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3C)17" },
                  { start: new Date(2024, 04, 22, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "Dose Admin (3C)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3C)18" },{ start: new Date(2024, 05, 16, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "Dose Admin (3D)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3D)19" },
                  { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 18, 23, 59, 59), group: "Dose Admin (3D)", className: "scheduled-event", title: "Dose Admin (3D): when Dose Admin (3C) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3D)20" },
                  { start: new Date(2024, 05, 19, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "Dose Admin (3D)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3D)21" },{ start: new Date(2024, 06, 14, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "Dose Admin (3E)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3E)22" },
                  { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 16, 23, 59, 59), group: "Dose Admin (3E)", className: "scheduled-event", title: "Dose Admin (3E): when Dose Admin (3D) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3E)23" },
                  { start: new Date(2024, 06, 17, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "Dose Admin (3E)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3E)24" },{ start: new Date(2024, 07, 11, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "PAC1 (4A)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC1 (4A)25" },
                  { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 13, 23, 59, 59), group: "PAC1 (4A)", className: "scheduled-event", title: "PAC1 (4A): when Dose Admin (3E) completed + 4 weeks", content: "&nbsp;", id: "PAC1 (4A)26" },
                  { start: new Date(2024, 07, 14, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "PAC1 (4A)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC1 (4A)27" },{ start: new Date(2024, 08, 08, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "Dose admin/PAC1 (3F/4B)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose admin/PAC1 (3F/4B)28" },
                  { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 10, 23, 59, 59), group: "Dose admin/PAC1 (3F/4B)", className: "scheduled-event", title: "Dose admin/PAC1 (3F/4B): when PAC1 (4A) completed + 4 weeks", content: "&nbsp;", id: "Dose admin/PAC1 (3F/4B)29" },
                  { start: new Date(2024, 08, 11, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "Dose admin/PAC1 (3F/4B)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose admin/PAC1 (3F/4B)30" },{ start: new Date(2024, 09, 06, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "Dose Admin (3G)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3G)31" },
                  { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 08, 23, 59, 59), group: "Dose Admin (3G)", className: "scheduled-event", title: "Dose Admin (3G): when Dose admin/PAC1 (3F/4B) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3G)32" },
                  { start: new Date(2024, 09, 09, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "Dose Admin (3G)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3G)33" },{ start: new Date(2024, 10, 03, 00, 00, 00), end: new Date(2024, 10, 04, 23, 59, 59), group: "Dose Admin (3H)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Dose Admin (3H)34" },
                  { start: new Date(2024, 10, 05, 00, 00, 00), end: new Date(2024, 10, 05, 23, 59, 59), group: "Dose Admin (3H)", className: "scheduled-event", title: "Dose Admin (3H): when Dose Admin (3G) completed + 4 weeks", content: "&nbsp;", id: "Dose Admin (3H)35" },
                  { start: new Date(2024, 10, 06, 00, 00, 00), end: new Date(2024, 10, 07, 23, 59, 59), group: "Dose Admin (3H)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Dose Admin (3H)36" },{ start: new Date(2024, 11, 01, 00, 00, 00), end: new Date(2024, 11, 02, 23, 59, 59), group: "End of dose (3I)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-End of dose (3I)37" },
                  { start: new Date(2024, 11, 03, 00, 00, 00), end: new Date(2024, 11, 03, 23, 59, 59), group: "End of dose (3I)", className: "scheduled-event", title: "End of dose (3I): when Dose Admin (3H) completed + 4 weeks", content: "&nbsp;", id: "End of dose (3I)38" },
                  { start: new Date(2024, 11, 04, 00, 00, 00), end: new Date(2024, 11, 05, 23, 59, 59), group: "End of dose (3I)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-End of dose (3I)39" },{ start: new Date(2025, 00, 05, 00, 00, 00), end: new Date(2025, 00, 06, 23, 59, 59), group: "PAC2 (4C)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC2 (4C)40" },
                  { start: new Date(2025, 00, 07, 00, 00, 00), end: new Date(2025, 00, 07, 23, 59, 59), group: "PAC2 (4C)", className: "scheduled-event", title: "PAC2 (4C): when End of dose (3I) completed + 5 weeks", content: "&nbsp;", id: "PAC2 (4C)41" },
                  { start: new Date(2025, 00, 08, 00, 00, 00), end: new Date(2025, 00, 09, 23, 59, 59), group: "PAC2 (4C)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC2 (4C)42" },
                  { start: new Date(2025, 00, 05, 00, 00, 00), end: new Date(2025, 00, 06, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC2 (4D)43" },
                  { start: new Date(2025, 00, 07, 00, 00, 00), end: new Date(2025, 00, 07, 23, 59, 59), group: "PAC2 (4D)", className: "scheduled-event", title: "PAC2 (4D): when End of dose (3I) completed + 5 weeks", content: "&nbsp;", id: "PAC2 (4D)44" },
                  { start: new Date(2025, 00, 08, 00, 00, 00), end: new Date(2025, 00, 09, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC2 (4D)45" },{ start: new Date(2025, 00, 19, 00, 00, 00), end: new Date(2025, 00, 20, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC2 (4D)46" },
                  { start: new Date(2025, 00, 21, 00, 00, 00), end: new Date(2025, 00, 21, 23, 59, 59), group: "PAC2 (4D)", className: "scheduled-event", title: "PAC2 (4D): when PAC2 (4C) completed + 2 weeks", content: "&nbsp;", id: "PAC2 (4D)47" },
                  { start: new Date(2025, 00, 22, 00, 00, 00), end: new Date(2025, 00, 23, 23, 59, 59), group: "PAC2 (4D)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC2 (4D)48" },{ start: new Date(2025, 02, 23, 00, 00, 00), end: new Date(2025, 02, 24, 23, 59, 59), group: "PAC3 (4E)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC3 (4E)49" },
                  { start: new Date(2025, 02, 25, 00, 00, 00), end: new Date(2025, 02, 25, 23, 59, 59), group: "PAC3 (4E)", className: "scheduled-event", title: "PAC3 (4E): when PAC2 (4D) completed + 11 weeks", content: "&nbsp;", id: "PAC3 (4E)50" },
                  { start: new Date(2025, 02, 26, 00, 00, 00), end: new Date(2025, 02, 27, 23, 59, 59), group: "PAC3 (4E)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC3 (4E)51" },{ start: new Date(2025, 03, 06, 00, 00, 00), end: new Date(2025, 03, 07, 23, 59, 59), group: "PAC3 (4F)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-PAC3 (4F)52" },
                  { start: new Date(2025, 03, 08, 00, 00, 00), end: new Date(2025, 03, 08, 23, 59, 59), group: "PAC3 (4F)", className: "scheduled-event", title: "PAC3 (4F): when PAC3 (4E) completed + 2 weeks", content: "&nbsp;", id: "PAC3 (4F)53" },
                  { start: new Date(2025, 03, 09, 00, 00, 00), end: new Date(2025, 03, 10, 23, 59, 59), group: "PAC3 (4F)", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-PAC3 (4F)54" },
                  { start: new Date(2025, 03, 03, 00, 00, 00), end: new Date(2025, 03, 07, 23, 59, 59), group: "Follow up (5)", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Follow up (5)55" },
                  { start: new Date(2025, 03, 08, 00, 00, 00), end: new Date(2025, 03, 08, 23, 59, 59), group: "Follow up (5)", className: "scheduled-event", title: "Follow up (5): when PAC3 (4F) completed + 0 days", content: "&nbsp;", id: "Follow up (5)56" },
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
                { "content": "<b>Patient Visits /<br><span class='not-available-row-label'>Not Available</span></b>", "id": "Patient", className: 'patient' },               
                ]);
                var items = new vis.DataSet([
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Phase", className: "period-phase", title: "Day: 0", content: "<b>Period</b>", id: "Period0" },
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 11" },
                { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 12" },                
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Patient", className: "on-scheduled-date", title: "Patient visit:Visit 1'", content: "&nbsp;", id: "Visit 13" },

                ])`;
            const expectedTimelineVisualizationHTML = `// create visualization
                var container = document.getElementById('visualization');
                var options = {
                    showCurrentTime: false,
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
                    majorLabels: {
                            millisecond:'',
                            second:     '',
                            minute:     '',
                            hour:       '',
                            weekday:    '',
                            day:        'w',
                            week:       '',
                            month:      '',
                            year:       ''
                        }
                    },
                    timeAxis: {scale: 'day', step: 1},
                    showMajorLabels: true,
                    orientation: 'both',
                    start: new Date(2024,0,1),
                    end: new Date(2024, 0, 2),
                    min: new Date(2024, 0, 1),
                    max: new Date(2024, 0, 2),
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
    { "content": "V1 Randomization", "id": "V1 Randomization" },
    { "content": "V1  Run In", "id": "V1  Run In" },
    { "content": "V2 Randomization", "id": "V2 Randomization" },
    { "content": "V2  Run In", "id": "V2  Run In" },
    { "content": "V3 Randomization", "id": "V3 Randomization" },
    { "content": "V4-V7 Randomization", "id": "V4-V7 Randomization" },
    { "content": "V4-V7  Run In", "id": "V4-V7  Run In" },
    { "content": "V8-V13 Randomization", "id": "V8-V13 Randomization" },
    { "content": "V8-V13  Run In", "id": "V8-V13  Run In" },
    { "content": "V14-V18 Randomization", "id": "V14-V18 Randomization" },
    { "content": "V14-V18  Run In", "id": "V14-V18  Run In" },
    { "content": "V19 Randomization", "id": "V19 Randomization" },
    { "content": "V19 Run In", "id": "V19 Run In" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
    
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1 Randomization", className: "scheduled-event", title: "V1 Randomization: at the start day of the Study  - 4 weeks", content: "&nbsp;", id: "V1 Randomization2" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1  Run In3" },
    { start: new Date(2024, 00, 04, 00, 00, 00), end: new Date(2024, 00, 04, 23, 59, 59), group: "V1  Run In", className: "scheduled-event", title: "V1  Run In: when V1 Randomization completed + 3 days", content: "&nbsp;", id: "V1  Run In4" },
    { start: new Date(2024, 00, 05, 00, 00, 00), end: new Date(2024, 00, 06, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1  Run In5" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "V2 Randomization", className: "scheduled-event", title: "V2 Randomization: at the start day of the Study  - 2 weeks", content: "&nbsp;", id: "V2 Randomization6" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V2  Run In7" },
    { start: new Date(2024, 00, 18, 00, 00, 00), end: new Date(2024, 00, 18, 23, 59, 59), group: "V2  Run In", className: "scheduled-event", title: "V2  Run In: when V2 Randomization completed + 3 days", content: "&nbsp;", id: "V2  Run In8" },
    { start: new Date(2024, 00, 19, 00, 00, 00), end: new Date(2024, 00, 20, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V2  Run In9" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V3 Randomization", className: "scheduled-event", title: "V3 Randomization: at the start day of the Study ", content: "&nbsp;", id: "V3 Randomization10" },
    { start: new Date(2024, 01, 03, 00, 00, 00), end: new Date(2024, 01, 04, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization11" },
    { start: new Date(2024, 01, 05, 00, 00, 00), end: new Date(2024, 01, 05, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization12" },
    { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization13" },{ start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In14" },
    { start: new Date(2024, 01, 08, 00, 00, 00), end: new Date(2024, 01, 08, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In15" },
    { start: new Date(2024, 01, 09, 00, 00, 00), end: new Date(2024, 01, 10, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In16" },{ start: new Date(2024, 01, 10, 00, 00, 00), end: new Date(2024, 01, 11, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization17" },
    { start: new Date(2024, 01, 12, 00, 00, 00), end: new Date(2024, 01, 12, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization18" },
    { start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization19" },{ start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In20" },
    { start: new Date(2024, 01, 15, 00, 00, 00), end: new Date(2024, 01, 15, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In21" },
    { start: new Date(2024, 01, 16, 00, 00, 00), end: new Date(2024, 01, 17, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In22" },{ start: new Date(2024, 01, 17, 00, 00, 00), end: new Date(2024, 01, 18, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization23" },
    { start: new Date(2024, 01, 19, 00, 00, 00), end: new Date(2024, 01, 19, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization24" },
    { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization25" },{ start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In26" },
    { start: new Date(2024, 01, 22, 00, 00, 00), end: new Date(2024, 01, 22, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In27" },
    { start: new Date(2024, 01, 23, 00, 00, 00), end: new Date(2024, 01, 24, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In28" },{ start: new Date(2024, 01, 24, 00, 00, 00), end: new Date(2024, 01, 25, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization29" },
    { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization30" },
    { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization31" },{ start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In32" },
    { start: new Date(2024, 01, 29, 00, 00, 00), end: new Date(2024, 01, 29, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In33" },
    { start: new Date(2024, 02, 01, 00, 00, 00), end: new Date(2024, 02, 02, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In34" },{ start: new Date(2024, 02, 09, 00, 00, 00), end: new Date(2024, 02, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization35" },
    { start: new Date(2024, 02, 11, 00, 00, 00), end: new Date(2024, 02, 11, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization36" },
    { start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization37" },{ start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In38" },
    { start: new Date(2024, 02, 14, 00, 00, 00), end: new Date(2024, 02, 14, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In39" },
    { start: new Date(2024, 02, 15, 00, 00, 00), end: new Date(2024, 02, 16, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In40" },{ start: new Date(2024, 02, 23, 00, 00, 00), end: new Date(2024, 02, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization41" },
    { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization42" },
    { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization43" },{ start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In44" },
    { start: new Date(2024, 02, 28, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In45" },
    { start: new Date(2024, 02, 29, 00, 00, 00), end: new Date(2024, 02, 30, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In46" },{ start: new Date(2024, 03, 06, 00, 00, 00), end: new Date(2024, 03, 07, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization47" },
    { start: new Date(2024, 03, 08, 00, 00, 00), end: new Date(2024, 03, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization48" },
    { start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization49" },{ start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In50" },
    { start: new Date(2024, 03, 11, 00, 00, 00), end: new Date(2024, 03, 11, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In51" },
    { start: new Date(2024, 03, 12, 00, 00, 00), end: new Date(2024, 03, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In52" },{ start: new Date(2024, 03, 20, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization53" },
    { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization54" },
    { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization55" },{ start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In56" },
    { start: new Date(2024, 03, 25, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In57" },
    { start: new Date(2024, 03, 26, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In58" },{ start: new Date(2024, 04, 04, 00, 00, 00), end: new Date(2024, 04, 05, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization59" },
    { start: new Date(2024, 04, 06, 00, 00, 00), end: new Date(2024, 04, 06, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization60" },
    { start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization61" },{ start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In62" },
    { start: new Date(2024, 04, 09, 00, 00, 00), end: new Date(2024, 04, 09, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In63" },
    { start: new Date(2024, 04, 10, 00, 00, 00), end: new Date(2024, 04, 11, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In64" },{ start: new Date(2024, 04, 18, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization65" },
    { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization66" },
    { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization67" },{ start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In68" },
    { start: new Date(2024, 04, 23, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In69" },
    { start: new Date(2024, 04, 24, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In70" },{ start: new Date(2024, 05, 15, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization71" },
    { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization72" },
    { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization73" },{ start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In74" },
    { start: new Date(2024, 05, 20, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In75" },
    { start: new Date(2024, 05, 21, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In76" },{ start: new Date(2024, 06, 13, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization77" },
    { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization78" },
    { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization79" },{ start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In80" },
    { start: new Date(2024, 06, 18, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In81" },
    { start: new Date(2024, 06, 19, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In82" },{ start: new Date(2024, 07, 10, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization83" },
    { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization84" },
    { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization85" },{ start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In86" },
    { start: new Date(2024, 07, 15, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In87" },
    { start: new Date(2024, 07, 16, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In88" },{ start: new Date(2024, 08, 07, 00, 00, 00), end: new Date(2024, 08, 08, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization89" },
    { start: new Date(2024, 08, 09, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization90" },
    { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization91" },{ start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In92" },
    { start: new Date(2024, 08, 12, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In93" },
    { start: new Date(2024, 08, 13, 00, 00, 00), end: new Date(2024, 08, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In94" },{ start: new Date(2024, 09, 05, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization95" },
    { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization96" },
    { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization97" },{ start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In98" },
    { start: new Date(2024, 09, 10, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In99" },
    { start: new Date(2024, 09, 11, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In100" },{ start: new Date(2024, 09, 12, 00, 00, 00), end: new Date(2024, 09, 13, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Randomization101" },
    { start: new Date(2024, 09, 14, 00, 00, 00), end: new Date(2024, 09, 14, 23, 59, 59), group: "V19 Randomization", className: "scheduled-event", title: "V19 Randomization: when V14-V18 Randomization completed + 7 days", content: "&nbsp;", id: "V19 Randomization102" },
    { start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Randomization103" },{ start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Run In104" },
    { start: new Date(2024, 09, 17, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "V19 Run In", className: "scheduled-event", title: "V19 Run In: when V19 Randomization completed + 3 days", content: "&nbsp;", id: "V19 Run In105" },
    { start: new Date(2024, 09, 18, 00, 00, 00), end: new Date(2024, 09, 19, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Run In106" },
  ])`;
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);
            // const patientInfoUnit = utils.loadModelUnit("ScheduleExample2", "PatientInfo") as PatientInfo;
            // studyConfigurationModel.addUnit(patientInfoUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Adding after simulation because the timeline is used to find the visits to complete.
            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
                { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
            let patientNotAvailable = PatientNotAvailable.create({ dates: [] });
            let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });
            timeline.setPatientHistory(patientHistory);

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("generate a chart for the example study ScheduleExample2 with patient unavailable times", () => {
            let expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "V1 Randomization", "id": "V1 Randomization" },
    { "content": "V1  Run In", "id": "V1  Run In" },
    { "content": "V2 Randomization", "id": "V2 Randomization" },
    { "content": "V2  Run In", "id": "V2  Run In" },
    { "content": "V3 Randomization", "id": "V3 Randomization" },
    { "content": "V4-V7 Randomization", "id": "V4-V7 Randomization" },
    { "content": "V4-V7  Run In", "id": "V4-V7  Run In" },
    { "content": "V8-V13 Randomization", "id": "V8-V13 Randomization" },
    { "content": "V8-V13  Run In", "id": "V8-V13  Run In" },
    { "content": "V14-V18 Randomization", "id": "V14-V18 Randomization" },
    { "content": "V14-V18  Run In", "id": "V14-V18  Run In" },
    { "content": "V19 Randomization", "id": "V19 Randomization" },
    { "content": "V19 Run In", "id": "V19 Run In" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
    
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1 Randomization", className: "scheduled-event", title: "V1 Randomization: at the start day of the Study  - 4 weeks", content: "&nbsp;", id: "V1 Randomization2" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1  Run In3" },
    { start: new Date(2024, 00, 04, 00, 00, 00), end: new Date(2024, 00, 04, 23, 59, 59), group: "V1  Run In", className: "scheduled-event", title: "V1  Run In: when V1 Randomization completed + 3 days", content: "&nbsp;", id: "V1  Run In4" },
    { start: new Date(2024, 00, 05, 00, 00, 00), end: new Date(2024, 00, 06, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1  Run In5" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "V2 Randomization", className: "scheduled-event", title: "V2 Randomization: at the start day of the Study  - 2 weeks", content: "&nbsp;", id: "V2 Randomization6" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V2  Run In7" },
    { start: new Date(2024, 00, 18, 00, 00, 00), end: new Date(2024, 00, 18, 23, 59, 59), group: "V2  Run In", className: "scheduled-event", title: "V2  Run In: when V2 Randomization completed + 3 days", content: "&nbsp;", id: "V2  Run In8" },
    { start: new Date(2024, 00, 19, 00, 00, 00), end: new Date(2024, 00, 20, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V2  Run In9" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V3 Randomization", className: "scheduled-event", title: "V3 Randomization: at the start day of the Study ", content: "&nbsp;", id: "V3 Randomization10" },
    { start: new Date(2024, 01, 03, 00, 00, 00), end: new Date(2024, 01, 04, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization11" },
    { start: new Date(2024, 01, 05, 00, 00, 00), end: new Date(2024, 01, 05, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization12" },
    { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization13" },{ start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In14" },
    { start: new Date(2024, 01, 08, 00, 00, 00), end: new Date(2024, 01, 08, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In15" },
    { start: new Date(2024, 01, 09, 00, 00, 00), end: new Date(2024, 01, 10, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In16" },{ start: new Date(2024, 01, 10, 00, 00, 00), end: new Date(2024, 01, 11, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization17" },
    { start: new Date(2024, 01, 12, 00, 00, 00), end: new Date(2024, 01, 12, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization18" },
    { start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization19" },{ start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In20" },
    { start: new Date(2024, 01, 15, 00, 00, 00), end: new Date(2024, 01, 15, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In21" },
    { start: new Date(2024, 01, 16, 00, 00, 00), end: new Date(2024, 01, 17, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In22" },{ start: new Date(2024, 01, 17, 00, 00, 00), end: new Date(2024, 01, 18, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization23" },
    { start: new Date(2024, 01, 19, 00, 00, 00), end: new Date(2024, 01, 19, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization24" },
    { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization25" },{ start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In26" },
    { start: new Date(2024, 01, 22, 00, 00, 00), end: new Date(2024, 01, 22, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In27" },
    { start: new Date(2024, 01, 23, 00, 00, 00), end: new Date(2024, 01, 24, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In28" },{ start: new Date(2024, 01, 24, 00, 00, 00), end: new Date(2024, 01, 25, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization29" },
    { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization30" },
    { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization31" },{ start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In32" },
    { start: new Date(2024, 01, 29, 00, 00, 00), end: new Date(2024, 01, 29, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In33" },
    { start: new Date(2024, 02, 01, 00, 00, 00), end: new Date(2024, 02, 02, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In34" },{ start: new Date(2024, 02, 09, 00, 00, 00), end: new Date(2024, 02, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization35" },
    { start: new Date(2024, 02, 11, 00, 00, 00), end: new Date(2024, 02, 11, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization36" },
    { start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization37" },{ start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In38" },
    { start: new Date(2024, 02, 14, 00, 00, 00), end: new Date(2024, 02, 14, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In39" },
    { start: new Date(2024, 02, 15, 00, 00, 00), end: new Date(2024, 02, 16, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In40" },{ start: new Date(2024, 02, 23, 00, 00, 00), end: new Date(2024, 02, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization41" },
    { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization42" },
    { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization43" },{ start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In44" },
    { start: new Date(2024, 02, 28, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In45" },
    { start: new Date(2024, 02, 29, 00, 00, 00), end: new Date(2024, 02, 30, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In46" },{ start: new Date(2024, 03, 06, 00, 00, 00), end: new Date(2024, 03, 07, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization47" },
    { start: new Date(2024, 03, 08, 00, 00, 00), end: new Date(2024, 03, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization48" },
    { start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization49" },{ start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In50" },
    { start: new Date(2024, 03, 11, 00, 00, 00), end: new Date(2024, 03, 11, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In51" },
    { start: new Date(2024, 03, 12, 00, 00, 00), end: new Date(2024, 03, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In52" },{ start: new Date(2024, 03, 20, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization53" },
    { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization54" },
    { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization55" },{ start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In56" },
    { start: new Date(2024, 03, 25, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In57" },
    { start: new Date(2024, 03, 26, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In58" },{ start: new Date(2024, 04, 04, 00, 00, 00), end: new Date(2024, 04, 05, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization59" },
    { start: new Date(2024, 04, 06, 00, 00, 00), end: new Date(2024, 04, 06, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization60" },
    { start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization61" },{ start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In62" },
    { start: new Date(2024, 04, 09, 00, 00, 00), end: new Date(2024, 04, 09, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In63" },
    { start: new Date(2024, 04, 10, 00, 00, 00), end: new Date(2024, 04, 11, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In64" },{ start: new Date(2024, 04, 18, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization65" },
    { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization66" },
    { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization67" },{ start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In68" },
    { start: new Date(2024, 04, 23, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In69" },
    { start: new Date(2024, 04, 24, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In70" },{ start: new Date(2024, 05, 15, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization71" },
    { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization72" },
    { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization73" },{ start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In74" },
    { start: new Date(2024, 05, 20, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In75" },
    { start: new Date(2024, 05, 21, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In76" },{ start: new Date(2024, 06, 13, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization77" },
    { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization78" },
    { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization79" },{ start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In80" },
    { start: new Date(2024, 06, 18, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In81" },
    { start: new Date(2024, 06, 19, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In82" },{ start: new Date(2024, 07, 10, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization83" },
    { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization84" },
    { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization85" },{ start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In86" },
    { start: new Date(2024, 07, 15, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In87" },
    { start: new Date(2024, 07, 16, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In88" },{ start: new Date(2024, 08, 07, 00, 00, 00), end: new Date(2024, 08, 08, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization89" },
    { start: new Date(2024, 08, 09, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization90" },
    { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization91" },{ start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In92" },
    { start: new Date(2024, 08, 12, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In93" },
    { start: new Date(2024, 08, 13, 00, 00, 00), end: new Date(2024, 08, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In94" },{ start: new Date(2024, 09, 05, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization95" },
    { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization96" },
    { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization97" },{ start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In98" },
    { start: new Date(2024, 09, 10, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In99" },
    { start: new Date(2024, 09, 11, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In100" },{ start: new Date(2024, 09, 12, 00, 00, 00), end: new Date(2024, 09, 13, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Randomization101" },
    { start: new Date(2024, 09, 14, 00, 00, 00), end: new Date(2024, 09, 14, 23, 59, 59), group: "V19 Randomization", className: "scheduled-event", title: "V19 Randomization: when V14-V18 Randomization completed + 7 days", content: "&nbsp;", id: "V19 Randomization102" },
    { start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Randomization103" },{ start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Run In104" },
    { start: new Date(2024, 09, 17, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "V19 Run In", className: "scheduled-event", title: "V19 Run In: when V19 Randomization completed + 3 days", content: "&nbsp;", id: "V19 Run In105" },
    { start: new Date(2024, 09, 18, 00, 00, 00), end: new Date(2024, 09, 19, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Run In106" },
  ])`;
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.setReferenceDate(new Date(2024, 8, 30));
            simulator.organizedByReferenceDate();
            simulator.run();
            let timeline = simulator.timeline;

            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
                { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 1, shift: -3, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
            let dateRangeList: DateRange[] = [];
            let dateRange = utils.createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024");
            dateRangeList.push(dateRange);
            dateRange = utils.createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024");
            dateRangeList.push(dateRange);
            let patientNotAvailable = PatientNotAvailable.create({ dates: dateRangeList });
            let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });

            timeline.setPatientHistory(patientHistory);
            timeline.addPatientEvents(patientHistory);

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
            const expectedTimelineDataAsScript = `                  var groups = new vis.DataSet([
                { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
                { "content": "Visit 1", "id": "Visit 1" },
                
                { "content": "<b>Staff(4)</b>", "id": "Staff", className: 'staff' },
                ]);
                
                var items = new vis.DataSet([
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Phase", className: "period-phase", title: "Day: 0", content: "<b>Period</b>", id: "Period0" },
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 11" },
                { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 12" },
                
                
                
                { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Staff", className: "staff", title: "3", content: "3", id: "33" },
                
                ]) `;
            const expectedTimelineVisualizationHTML = `// create visualization
                var container = document.getElementById('visualization');
                    var options = {
                                showCurrentTime: false,
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
                                majorLabels: {
                                        millisecond:'',
                                        second:     '',
                                        minute:     '',
                                        hour:       '',
                                        weekday:    '',
                                        day:        'w',
                                        week:       '',
                                        month:      '',
                                        year:       ''
                                    }
                                },
                                timeAxis: {scale: 'day', step: 1},
                                showMajorLabels: true,
                                orientation: 'both',
                                start: new Date(2024, 0, 1),
                                end: new Date(2024, 0, 2),
                                min: new Date(2024, 0, 1),
                                max: new Date(2024, 0, 2),
                                margin: {
                                    item: {
                                        horizontal: 0,
                                    },
                                },
                            };
            `;
            // GIVEN a study configuration with one period and one event and a patient that completed the event
            const eventName = "Visit 1";
            let eventSchedule = utils.createEventScheduleStartingOnADay(eventName, 0, 0);
            let period = new Period("Screening");
            utils.createEventAndAddToPeriod(period, eventName, eventSchedule);
            studyConfigurationUnit.periods.push(period);
            const visitToComplete = studyConfigurationUnit.periods[0].events[0];
            const availability = utils.createOneDayAvailability("1", "January", "2024");

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit, availability);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has one event on the expected event day and the corresponding staff level
            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });

        it("generate a chart for the example study ScheduleExample2 with changing staff levels", () => {
            let expectedTimelineDataAsScript = `  var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "V1 Randomization", "id": "V1 Randomization" },
    { "content": "V1  Run In", "id": "V1  Run In" },
    { "content": "V2 Randomization", "id": "V2 Randomization" },
    { "content": "V2  Run In", "id": "V2  Run In" },
    { "content": "V3 Randomization", "id": "V3 Randomization" },
    { "content": "V4-V7 Randomization", "id": "V4-V7 Randomization" },
    { "content": "V4-V7  Run In", "id": "V4-V7  Run In" },
    { "content": "V8-V13 Randomization", "id": "V8-V13 Randomization" },
    { "content": "V8-V13  Run In", "id": "V8-V13  Run In" },
    { "content": "V14-V18 Randomization", "id": "V14-V18 Randomization" },
    { "content": "V14-V18  Run In", "id": "V14-V18  Run In" },
    { "content": "V19 Randomization", "id": "V19 Randomization" },
    { "content": "V19 Run In", "id": "V19 Run In" },
  ]);

var items = new vis.DataSet([
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 28, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: -28", content: "<b>Screening</b>", id: "Screening0" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 0", content: "<b>Treatment</b>", id: "Treatment1" },
    
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "V1 Randomization", className: "scheduled-event", title: "V1 Randomization: at the start day of the Study  - 4 weeks", content: "&nbsp;", id: "V1 Randomization2" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 03, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V1  Run In3" },
    { start: new Date(2024, 00, 04, 00, 00, 00), end: new Date(2024, 00, 04, 23, 59, 59), group: "V1  Run In", className: "scheduled-event", title: "V1  Run In: when V1 Randomization completed + 3 days", content: "&nbsp;", id: "V1  Run In4" },
    { start: new Date(2024, 00, 05, 00, 00, 00), end: new Date(2024, 00, 06, 23, 59, 59), group: "V1  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V1  Run In5" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "V2 Randomization", className: "scheduled-event", title: "V2 Randomization: at the start day of the Study  - 2 weeks", content: "&nbsp;", id: "V2 Randomization6" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 17, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V2  Run In7" },
    { start: new Date(2024, 00, 18, 00, 00, 00), end: new Date(2024, 00, 18, 23, 59, 59), group: "V2  Run In", className: "scheduled-event", title: "V2  Run In: when V2 Randomization completed + 3 days", content: "&nbsp;", id: "V2  Run In8" },
    { start: new Date(2024, 00, 19, 00, 00, 00), end: new Date(2024, 00, 20, 23, 59, 59), group: "V2  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V2  Run In9" },
    { start: new Date(2024, 00, 29, 00, 00, 00), end: new Date(2024, 00, 29, 23, 59, 59), group: "V3 Randomization", className: "scheduled-event", title: "V3 Randomization: at the start day of the Study ", content: "&nbsp;", id: "V3 Randomization10" },
    { start: new Date(2024, 01, 03, 00, 00, 00), end: new Date(2024, 01, 04, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization11" },
    { start: new Date(2024, 01, 05, 00, 00, 00), end: new Date(2024, 01, 05, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization12" },
    { start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization13" },{ start: new Date(2024, 01, 06, 00, 00, 00), end: new Date(2024, 01, 07, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In14" },
    { start: new Date(2024, 01, 08, 00, 00, 00), end: new Date(2024, 01, 08, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In15" },
    { start: new Date(2024, 01, 09, 00, 00, 00), end: new Date(2024, 01, 10, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In16" },{ start: new Date(2024, 01, 10, 00, 00, 00), end: new Date(2024, 01, 11, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization17" },
    { start: new Date(2024, 01, 12, 00, 00, 00), end: new Date(2024, 01, 12, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization18" },
    { start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization19" },{ start: new Date(2024, 01, 13, 00, 00, 00), end: new Date(2024, 01, 14, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In20" },
    { start: new Date(2024, 01, 15, 00, 00, 00), end: new Date(2024, 01, 15, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In21" },
    { start: new Date(2024, 01, 16, 00, 00, 00), end: new Date(2024, 01, 17, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In22" },{ start: new Date(2024, 01, 17, 00, 00, 00), end: new Date(2024, 01, 18, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization23" },
    { start: new Date(2024, 01, 19, 00, 00, 00), end: new Date(2024, 01, 19, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization24" },
    { start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization25" },{ start: new Date(2024, 01, 20, 00, 00, 00), end: new Date(2024, 01, 21, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In26" },
    { start: new Date(2024, 01, 22, 00, 00, 00), end: new Date(2024, 01, 22, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In27" },
    { start: new Date(2024, 01, 23, 00, 00, 00), end: new Date(2024, 01, 24, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In28" },{ start: new Date(2024, 01, 24, 00, 00, 00), end: new Date(2024, 01, 25, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7 Randomization29" },
    { start: new Date(2024, 01, 26, 00, 00, 00), end: new Date(2024, 01, 26, 23, 59, 59), group: "V4-V7 Randomization", className: "scheduled-event", title: "V4-V7 Randomization: when V3 Randomization completed + 1 weeks", content: "&nbsp;", id: "V4-V7 Randomization30" },
    { start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7 Randomization31" },{ start: new Date(2024, 01, 27, 00, 00, 00), end: new Date(2024, 01, 28, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V4-V7  Run In32" },
    { start: new Date(2024, 01, 29, 00, 00, 00), end: new Date(2024, 01, 29, 23, 59, 59), group: "V4-V7  Run In", className: "scheduled-event", title: "V4-V7  Run In: when V4-V7 Randomization each completed + 3 days", content: "&nbsp;", id: "V4-V7  Run In33" },
    { start: new Date(2024, 02, 01, 00, 00, 00), end: new Date(2024, 02, 02, 23, 59, 59), group: "V4-V7  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V4-V7  Run In34" },{ start: new Date(2024, 02, 09, 00, 00, 00), end: new Date(2024, 02, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization35" },
    { start: new Date(2024, 02, 11, 00, 00, 00), end: new Date(2024, 02, 11, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization36" },
    { start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization37" },{ start: new Date(2024, 02, 12, 00, 00, 00), end: new Date(2024, 02, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In38" },
    { start: new Date(2024, 02, 14, 00, 00, 00), end: new Date(2024, 02, 14, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In39" },
    { start: new Date(2024, 02, 15, 00, 00, 00), end: new Date(2024, 02, 16, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In40" },{ start: new Date(2024, 02, 23, 00, 00, 00), end: new Date(2024, 02, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization41" },
    { start: new Date(2024, 02, 25, 00, 00, 00), end: new Date(2024, 02, 25, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization42" },
    { start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization43" },{ start: new Date(2024, 02, 26, 00, 00, 00), end: new Date(2024, 02, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In44" },
    { start: new Date(2024, 02, 28, 00, 00, 00), end: new Date(2024, 02, 28, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In45" },
    { start: new Date(2024, 02, 29, 00, 00, 00), end: new Date(2024, 02, 30, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In46" },{ start: new Date(2024, 03, 06, 00, 00, 00), end: new Date(2024, 03, 07, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization47" },
    { start: new Date(2024, 03, 08, 00, 00, 00), end: new Date(2024, 03, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization48" },
    { start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization49" },{ start: new Date(2024, 03, 09, 00, 00, 00), end: new Date(2024, 03, 10, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In50" },
    { start: new Date(2024, 03, 11, 00, 00, 00), end: new Date(2024, 03, 11, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In51" },
    { start: new Date(2024, 03, 12, 00, 00, 00), end: new Date(2024, 03, 13, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In52" },{ start: new Date(2024, 03, 20, 00, 00, 00), end: new Date(2024, 03, 21, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization53" },
    { start: new Date(2024, 03, 22, 00, 00, 00), end: new Date(2024, 03, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization54" },
    { start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization55" },{ start: new Date(2024, 03, 23, 00, 00, 00), end: new Date(2024, 03, 24, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In56" },
    { start: new Date(2024, 03, 25, 00, 00, 00), end: new Date(2024, 03, 25, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In57" },
    { start: new Date(2024, 03, 26, 00, 00, 00), end: new Date(2024, 03, 27, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In58" },{ start: new Date(2024, 04, 04, 00, 00, 00), end: new Date(2024, 04, 05, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization59" },
    { start: new Date(2024, 04, 06, 00, 00, 00), end: new Date(2024, 04, 06, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization60" },
    { start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization61" },{ start: new Date(2024, 04, 07, 00, 00, 00), end: new Date(2024, 04, 08, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In62" },
    { start: new Date(2024, 04, 09, 00, 00, 00), end: new Date(2024, 04, 09, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In63" },
    { start: new Date(2024, 04, 10, 00, 00, 00), end: new Date(2024, 04, 11, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In64" },{ start: new Date(2024, 04, 18, 00, 00, 00), end: new Date(2024, 04, 19, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13 Randomization65" },
    { start: new Date(2024, 04, 20, 00, 00, 00), end: new Date(2024, 04, 20, 23, 59, 59), group: "V8-V13 Randomization", className: "scheduled-event", title: "V8-V13 Randomization: when V4-V7 Randomization completed + 2 weeks", content: "&nbsp;", id: "V8-V13 Randomization66" },
    { start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13 Randomization67" },{ start: new Date(2024, 04, 21, 00, 00, 00), end: new Date(2024, 04, 22, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V8-V13  Run In68" },
    { start: new Date(2024, 04, 23, 00, 00, 00), end: new Date(2024, 04, 23, 23, 59, 59), group: "V8-V13  Run In", className: "scheduled-event", title: "V8-V13  Run In: when V8-V13 Randomization each completed + 3 days", content: "&nbsp;", id: "V8-V13  Run In69" },
    { start: new Date(2024, 04, 24, 00, 00, 00), end: new Date(2024, 04, 25, 23, 59, 59), group: "V8-V13  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V8-V13  Run In70" },{ start: new Date(2024, 05, 15, 00, 00, 00), end: new Date(2024, 05, 16, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization71" },
    { start: new Date(2024, 05, 17, 00, 00, 00), end: new Date(2024, 05, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization72" },
    { start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization73" },{ start: new Date(2024, 05, 18, 00, 00, 00), end: new Date(2024, 05, 19, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In74" },
    { start: new Date(2024, 05, 20, 00, 00, 00), end: new Date(2024, 05, 20, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In75" },
    { start: new Date(2024, 05, 21, 00, 00, 00), end: new Date(2024, 05, 22, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In76" },{ start: new Date(2024, 06, 13, 00, 00, 00), end: new Date(2024, 06, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization77" },
    { start: new Date(2024, 06, 15, 00, 00, 00), end: new Date(2024, 06, 15, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization78" },
    { start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization79" },{ start: new Date(2024, 06, 16, 00, 00, 00), end: new Date(2024, 06, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In80" },
    { start: new Date(2024, 06, 18, 00, 00, 00), end: new Date(2024, 06, 18, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In81" },
    { start: new Date(2024, 06, 19, 00, 00, 00), end: new Date(2024, 06, 20, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In82" },{ start: new Date(2024, 07, 10, 00, 00, 00), end: new Date(2024, 07, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization83" },
    { start: new Date(2024, 07, 12, 00, 00, 00), end: new Date(2024, 07, 12, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization84" },
    { start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization85" },{ start: new Date(2024, 07, 13, 00, 00, 00), end: new Date(2024, 07, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In86" },
    { start: new Date(2024, 07, 15, 00, 00, 00), end: new Date(2024, 07, 15, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In87" },
    { start: new Date(2024, 07, 16, 00, 00, 00), end: new Date(2024, 07, 17, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In88" },{ start: new Date(2024, 08, 07, 00, 00, 00), end: new Date(2024, 08, 08, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization89" },
    { start: new Date(2024, 08, 09, 00, 00, 00), end: new Date(2024, 08, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization90" },
    { start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization91" },{ start: new Date(2024, 08, 10, 00, 00, 00), end: new Date(2024, 08, 11, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In92" },
    { start: new Date(2024, 08, 12, 00, 00, 00), end: new Date(2024, 08, 12, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In93" },
    { start: new Date(2024, 08, 13, 00, 00, 00), end: new Date(2024, 08, 14, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In94" },{ start: new Date(2024, 09, 05, 00, 00, 00), end: new Date(2024, 09, 06, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18 Randomization95" },
    { start: new Date(2024, 09, 07, 00, 00, 00), end: new Date(2024, 09, 07, 23, 59, 59), group: "V14-V18 Randomization", className: "scheduled-event", title: "V14-V18 Randomization: when V8-V13 Randomization completed + 4 weeks", content: "&nbsp;", id: "V14-V18 Randomization96" },
    { start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18 Randomization97" },{ start: new Date(2024, 09, 08, 00, 00, 00), end: new Date(2024, 09, 09, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V14-V18  Run In98" },
    { start: new Date(2024, 09, 10, 00, 00, 00), end: new Date(2024, 09, 10, 23, 59, 59), group: "V14-V18  Run In", className: "scheduled-event", title: "V14-V18  Run In: when V14-V18 Randomization each completed + 3 days", content: "&nbsp;", id: "V14-V18  Run In99" },
    { start: new Date(2024, 09, 11, 00, 00, 00), end: new Date(2024, 09, 12, 23, 59, 59), group: "V14-V18  Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V14-V18  Run In100" },{ start: new Date(2024, 09, 12, 00, 00, 00), end: new Date(2024, 09, 13, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Randomization101" },
    { start: new Date(2024, 09, 14, 00, 00, 00), end: new Date(2024, 09, 14, 23, 59, 59), group: "V19 Randomization", className: "scheduled-event", title: "V19 Randomization: when V14-V18 Randomization completed + 7 days", content: "&nbsp;", id: "V19 Randomization102" },
    { start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Randomization", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Randomization103" },{ start: new Date(2024, 09, 15, 00, 00, 00), end: new Date(2024, 09, 16, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-V19 Run In104" },
    { start: new Date(2024, 09, 17, 00, 00, 00), end: new Date(2024, 09, 17, 23, 59, 59), group: "V19 Run In", className: "scheduled-event", title: "V19 Run In: when V19 Randomization completed + 3 days", content: "&nbsp;", id: "V19 Run In105" },
    { start: new Date(2024, 09, 18, 00, 00, 00), end: new Date(2024, 09, 19, 23, 59, 59), group: "V19 Run In", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-V19 Run In106" },
  ])`;
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);
            // const patientInfoUnit = utils.loadModelUnit("ScheduleExample2", "PatientInfo") as PatientInfo;
            // studyConfigurationModel.addUnit(patientInfoUnit);
            let availability: Availability = utils.createAvailability();

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit, availability);
            simulator.run();
            let timeline = simulator.timeline;

            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
                { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
            let patientNotAvailable = PatientNotAvailable.create({ dates: [] });
            let patientHistory = PatientHistory.create({
                id: "MV",
                patientVisits: completedPatientVisits,
                patientNotAvailableDates: patientNotAvailable,
            });
            timeline.setPatientHistory(patientHistory);
            timeline.setReferenceDate(new Date(2024, 8, 30));
            timeline.organizedByReferenceDate();

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
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
                First scheduled: at the start day of the Study  - 28
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
                First scheduled: at the start day of the Study  - 16
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
                First scheduled: at the start day of the Study  - 15
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
                First scheduled: at the start day of the Study 
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
                First scheduled: at the start day of the Study  + "8" weeks
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
                First scheduled: at the start day of the Study  + "12" weeks
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
                First scheduled: at the start day of the Study  + "16" weeks
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
                First scheduled: at the start day of the Study  + "20" weeks
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
                First scheduled: at the start day of the Study  + "28" weeks
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
                First scheduled: at the start day of the Study  + "44" weeks
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
                First scheduled: at the start day of the Study  + "52" weeks
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
                First scheduled: at the start day of the Study  + "54" weeks
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
    { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 12" },
    { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 13" },{ start: new Date(2024, 00, 07, 00, 00, 00), end: new Date(2024, 00, 07, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 14" },
    { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 15" },
    { start: new Date(2024, 00, 09, 00, 00, 00), end: new Date(2024, 00, 09, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 16" },{ start: new Date(2024, 00, 14, 00, 00, 00), end: new Date(2024, 00, 14, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 17" },
    { start: new Date(2024, 00, 15, 00, 00, 00), end: new Date(2024, 00, 15, 23, 59, 59), group: "Visit 1", className: "scheduled-event", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 18" },
    { start: new Date(2024, 00, 16, 00, 00, 00), end: new Date(2024, 00, 16, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 19" },
  ])`;
            // GIVEN
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 0, repeat: 2, period: "Screening" }];
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
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd, "V#");

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const expectedTimelineTableAsHTML = `
                <div class="table_component" role="region" tabindex="0">
                    <table>
                    <thead>
                        <tr>
                        <th class="stretch">Visit Name</th>
                        <th class="stretch">Alternative Name</th>
                        <th class="stretch">Phase</th>
                        <th class="fit">Window (-)</th>
                        <th class="fit">Day/Date</th>
                        <th class="fit">Window (+)</th>
                        <th></th>
                        </tr>
                        </thead>
                        <tbody>

                    <tr>
                            <td>Visit 1</td>
                            <td>V1</td>
                            <td>Screening</td>
                            <td class="text-center">1</td>
                            <td class="text-center">2</td>
                            <td class="text-center">1</td>
                            <td>&nbsp;</td>
                            </tr><tr>
                            <td>Visit 1</td>
                            <td>V2</td>
                            <td>Screening</td>
                            <td class="text-center">1</td>
                            <td class="text-center">9</td>
                            <td class="text-center">1</td>
                            <td>&nbsp;</td>
                            </tr><tr>
                            <td>Visit 1</td>
                            <td>V3</td>
                            <td>Screening</td>
                            <td class="text-center">1</td>
                            <td class="text-center">16</td>
                            <td class="text-center">1</td>
                            <td>&nbsp;</td>
                            </tr>
                        </tr>
                        </tbody>
                    </table>
                </div>`;
            const timelineTableAsHTML = TimelineTableTemplate.getTimelineTableHTML(timeline);
            // Save full HTML of table for viewing / debugging
            utils.saveTimelineTable(timelineTableAsHTML);

            const normalizedTimelineDataAsScript = timelineTableAsHTML.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineTableAsHTML.replace(/\s+/g, "");
            // Then the generated timeline table has the expected data in it
            expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it(" generates a TABLE that has a special alternative name for a three visit timeline for a visit that repeats twice", () => {
            // GIVEN
            let listOfEventsToAdd: EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd, "Special Alt Name");

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const expectedTimelineTableAsHTML = `
                <div class="table_component" role="region" tabindex="0">
                    <table>
                    <thead>
                        <tr>
                        <th class="stretch">Visit Name</th>
                        <th class="stretch">Alternative Name</th>
                        <th class="stretch">Phase</th>
                        <th class="fit">Window (-)</th>
                        <th class="fit">Day/Date</th>
                        <th class="fit">Window (+)</th>
                        <th></th>
                        </tr>
                        </thead>
                        <tbody>

                    <tr>
                            <td>Visit 1</td>
                            <td>Special Alt Name</td>
                            <td>Screening</td>
                            <td class="text-center">1</td>
                            <td class="text-center">2</td>
                            <td class="text-center">1</td>
                            <td>&nbsp;</td>
                            </tr><tr>
                            <td>Visit 1</td>
                            <td>Special Alt Name (2)</td>
                            <td>Screening</td>
                            <td class="text-center">1</td>
                            <td class="text-center">9</td>
                            <td class="text-center">1</td>
                            <td>&nbsp;</td>
                            </tr><tr>
                            <td>Visit 1</td>
                            <td>Special Alt Name (3)</td>
                            <td>Screening</td>
                            <td class="text-center">1</td>
                            <td class="text-center">16</td>
                            <td class="text-center">1</td>
                            <td>&nbsp;</td>
                            </tr>
                        </tr>
                        </tbody>
                    </table>
                </div>
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

function testStudyInFile(studyName: string, studyConfigurationModel: StudyConfigurationModel, expectedTimelineDataAsScript: string, referenceDate?: Date) {
    // GIVEN a study configuration loaded from a file
    // const studyConfigurationUnit = utils.loadModel("Example1", 'StudyConfiguration');
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
    // Then the generated timeline picture has two events on the expected event days
    expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
}
