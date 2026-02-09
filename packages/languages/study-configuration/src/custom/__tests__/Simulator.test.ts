import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { beforeEach, describe, expect, it } from "vitest";
import { StudyConfigurationModelEnvironment } from "../../freon/config/StudyConfigurationModelEnvironment.js";
import { Availability, DateRange, PatientHistory, PatientInfo, PatientVisit, Period, StudyConfiguration, StudyConfigurationModel } from "../../freon/language/index.js";
import { StudyConfigurationModelModelUnitWriter } from "../../freon/writer/StudyConfigurationModelModelUnitWriter.js";
import { Sim } from "../simjs/sim.js";
import { resetTimelineScriptTemplate, TimelineChartTemplate } from "../templates/TimelineChartTemplate.js";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate.js";
import { PeriodEventInstance } from "../timeline/PeriodEventInstance.js";
import { ScheduledEventState } from "../timeline/ScheduledEvent.js";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance.js";
import { Simulator } from "../timeline/Simulator.js";
import { Timeline } from "../timeline/Timeline.js";
import { TimelineEventInstance, TimelineInstanceState } from "../timeline/TimelineEventInstance.js";
import { getTimelineAsOfADate } from "../timeline/TimelineUtils.js";
import * as utils from "./Utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads expected timeline data from a test data file
 * @param studyName - Name of the study (used to find the corresponding test data file)
 * @returns The expected timeline data as a string
 */
function loadExpectedTimelineData(studyName: string): string {
    const testDataPath = path.join(__dirname, "data", `expected-timeline-${studyName}.txt`);
    if (!fs.existsSync(testDataPath)) {
        throw new Error(`Expected timeline data file not found: ${testDataPath}`);
    }
    return fs.readFileSync(testDataPath, "utf-8").trim();
}

describe("Study Simulation", () => {
    let simulator;
    const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    var studyConfigurationUnit: StudyConfiguration;
    var studyConfigurationModel: StudyConfigurationModel;
    const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.

    beforeEach(() => {
        new Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
        // const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
        studyConfigurationModel = studyConfigurationModelEnvironment.newModel(modelName) as StudyConfigurationModel;
        studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
        simulator = new Simulator(studyConfigurationUnit);
        resetTimelineScriptTemplate();
    });

    describe("Simulate Trial Events to Generate the Timeline in the same period", () => {
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
            utils.addEventAndInstanceToTimeline(
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
            utils.addEventAndInstanceToTimeline(
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
            utils.addEventAndInstanceToTimeline(
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

        it("generates STARTING ON DAY 0 a two visit timeline for a visit 7 days after the study start day in the same period", () => {
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days
            let expectedTimeline = new Timeline();
            utils.addEventAndInstanceToTimeline(
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
            utils.addEventAndInstanceToTimeline(
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

        it("generates STARTING ON DAY 1 a two visit timeline for a visit 7 days after the study start day", () => {
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit.studyStartDayNumber = 1;
            studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has two events on the expected event days reflecting a study start day of 1
            let expectedTimeline = new Timeline();
            utils.addEventAndInstanceToTimeline(
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
            utils.addEventAndInstanceToTimeline(
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
            expectedTimeline.setStudyStartDayNumber(1);
            expect(timeline).toEqual(expectedTimeline);
        });

        it("generates a three visit timeline for visits 7 days after the end of the second visit", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ThreeVisitTimeline");
            testStudyInFile("TwoP3V", studyConfigurationModel, expectedTimelineDataAsScript);
        });

        it("generates a three visit timeline for a visit that repeats twice", () => {
            // GIVEN a study configuration with one period and two events
            let listOfEventsToAdd: utils.EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Then the generated timeline has three instances of the repeating event on the expected days
            let expectedTimeline = new Timeline();
            let eventInstance1 = utils.addEventAndInstanceToTimeline(
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
            let listOfEventsToAdd: utils.EventsToAdd[] = [
                { eventName: "Visit 1", daysToAdd: 0, repeat: 0, period: "Screening" },
                { eventName: "Visit 2", daysToAdd: 7, repeat: 0, period: "Treatment" },
            ];
            studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

            // WHEN the study is simulated with no period is active yet and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();

            // Then the generated timeline has two periods on the expected day
            let timeline = simulator.timeline;

            utils.generateChart(timeline, true); // Save full HTML of chart for viewing / debugging

            let periodsOnTimeline = timeline.getPeriods();
            expect(periodsOnTimeline.length).toEqual(2);
            expect(periodsOnTimeline[0].getName()).toEqual("Screening");
            expect(periodsOnTimeline[1].getName()).toEqual("Treatment");
            expect(periodsOnTimeline[0].startDay).toEqual(0);
            expect(periodsOnTimeline[1].startDay).toEqual(7); // TODO: why isn't this 8? Some bug in setup code is probably cause.
            let currentPeriod = timeline.getPeriods()[1] as PeriodEventInstance;
            expect(currentPeriod.scheduledPeriod.getName()).toEqual("Treatment");
            expect(currentPeriod.startDay).toEqual(7);
        });
    });

    describe("Generate Study Timeline Chart", () => {
        it("generate a chart for a two visit and one period timeline for a visit 7 days after the end of the first visit", () => {
            // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
            const expectedTimelineDataAsScript = loadExpectedTimelineData("TwoVisitOnePeriod");

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
            zoomFriction:30,
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
            const expectedTimelineDataAsScript = loadExpectedTimelineData("TwoPeriods");
            // GIVEN a study configuration with one period and two events
            // where second visit has no window before or after
            let listOfEventsToAdd: utils.EventsToAdd[] = [
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

        it("generates chart for study with screen event starting 7 days before the study start", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("StartMinusDays");
            testStudyInFile("StartMinusDays", studyConfigurationModel, expectedTimelineDataAsScript);
        });

        it("generates chart for example study 1", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample1");
            testStudyInFile("ScheduleExample1", studyConfigurationModel, expectedTimelineDataAsScript, new Date(2018, 2, 13));
        });

        // it("generates chart for example study 2", () => {
        //     // Load from DSL text file exported from the database instead of JSON files
        //     // This avoids the corruption issue in the JSON files where the first visit has a ghost daysBefore
        //     const dslFilePath = path.resolve(__dirname, "..", "..", "..", "..", "..", "server-crchub", "tmp", "ScheduleExample2.dsl.txt");
        //     const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample2");
        //     testStudyFromDSLFile(dslFilePath, studyConfigurationModel, expectedTimelineDataAsScript, new Date(2011, 2, 25));
        // });

        it("generates chart for example study 2", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample2");
            testStudyInFile("ScheduleExample2", studyConfigurationModel, expectedTimelineDataAsScript, new Date(2011, 2, 25));
        });

        it("generates chart for example study 3", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample3");
            // Then the generated timeline picture has two events on the expected event days
            testStudyInFile("ScheduleExample3", studyConfigurationModel, expectedTimelineDataAsScript, new Date(2011, 2, 25));
        });

        it.skip("generates chart for example study 3 loaded from DSL text", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample3-DSL");
            // GIVEN a study configuration loaded from the DSL text file written by the previous test
            const studyFolderPath: string = path.resolve(__dirname, "..", "__tests__", "modelstore", "ScheduleExample3");
            const dslTextPath = path.resolve(studyFolderPath, "StudyConfiguration.dsl.txt");
            
            // Read the DSL text file
            const dslText = fs.readFileSync(dslTextPath, "utf-8");
            expect(dslText).toBeTruthy();
            expect(dslText.length).toBeGreaterThan(0);

            // Create a new model for this test to avoid conflicts with the unit created in beforeEach
            const testModel = studyConfigurationModelEnvironment.newModel("TestStudyModelForDSL") as StudyConfigurationModel;

            // Parse the DSL text into a StudyConfiguration model unit
            const studyConfigurationUnit = studyConfigurationModelEnvironment.reader.readFromString(
                dslText,
                "StudyConfiguration",
                testModel,
                "StudyConfiguration.dsl.txt"
            ) as StudyConfiguration;
            
            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.setReferenceDate(new Date(2011, 2, 25));
            simulator.organizedByReferenceDate();
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
        });

    });

    describe("Generate Patient Timeline Chart", () => {
        it("generate a chart for a two visits, one 7 days after with the patient completing them on the scheduled day", () => {
            // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
            const expectedTimelineDataAsScript = loadExpectedTimelineData("TwoVisitsPatientCompleted");

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
                                zoomFriction:30,
                                margin: {
                                    item: {
                                        horizontal: 0,
                                    },
                                },
                            };
        `;
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "Visit 1", 0, "Visit 2", 7);
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(2, timeline, [], new Date(2024, 0, 1));
            let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: [] });
            timeline.addPatientEvents(patientHistory, "MV");


            // WHEN the study is simulated and a timeline picture is generated

            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });

        it("generate a chart for a three visits, one 3 days before, one 2 days after with the patient completing it on the scheduled day", () => {
            // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ThreeVisitsPatientCompleted");

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
                                end: new Date(2024, 0, 7),
                                min: new Date(2024, 0, 1),
                                max: new Date(2024, 0, 7),
                                zoomFriction:30,
                                margin: {
                                    item: {
                                        horizontal: 0,
                                    },
                                },
                            };
        `;
            // GIVEN a study configuration with one period and two events
            studyConfigurationUnit = utils.addAPeriodWithEventBeforeStudyStart(studyConfigurationUnit, "Screening", "Visit 2", "Visit 1", 3);
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(3, timeline, [], new Date(2024, 0, 1));
            let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: [] });
            timeline.addPatientEvents(patientHistory, "MV");

            // WHEN the study is simulated and a timeline picture is generated
            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });

        it("generates a chart for a visit on day 1 that patient completed", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("VisitDay1PatientCompleted");
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
                    zoomFriction:30,
                    margin: {
                        item: {
                            horizontal: 0,
                        },
                    },
                };`;
            // GIVEN a study configuration with one period and one event and a patient that completed the event
            const eventName = "Visit 1";
            let eventSchedule = utils.createEventScheduleStartingOnADay(eventName, 0, 0);
            let period = Period.create({ name: "Screening" });
            utils.createEventAndAddToPeriod(period, eventName, eventSchedule);
            studyConfigurationUnit.periods.push(period);

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(1, timeline, [], new Date(2024, 0, 1));
            let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: [] });
            timeline.addPatientEvents(patientHistory, "MV");

            // Then the generated timeline has one event on the expected event day and the corresponding patient visit completion
            utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
        });

        it("generates chart for example study ScheduleExample2 with the first 10 visits completed", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample2-10visits");
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            const referenceDate = new Date(2024, 0, 1);
            const patientIdentifier = "MV";
            
            // First, get the timeline without patient history to create patient visits
            // This is different than what will be done in production where the visits are added at actual dates.
            let timelineWithoutPatient = getTimelineAsOfADate(studyConfigurationUnit, referenceDate);
            
            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
              {
                name: "V2 Randomization",
                instance: 1,
                shift: -1,
                numberFound: 0,
                foundThisInstance: false,
              },
              {
                name: "V4-V7 Randomization",
                instance: 1,
                shift: -4,
                numberFound: 0,
                foundThisInstance: false,
              },
              {
                name: "V4-V7 Randomization",
                instance: 2,
                shift: 2,
                numberFound: 0,
                foundThisInstance: false,
              },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timelineWithoutPatient, shiftsFromScheduledVisit, referenceDate);
            let patientHistory = PatientHistory.create({ id: patientIdentifier, patientVisits: completedPatientVisits, patientNotAvailableDates: [] });
            
            // Now get the timeline with patient history using the reference date and patient identifier
            let timeline = getTimelineAsOfADate(studyConfigurationUnit, referenceDate, patientHistory, patientIdentifier);

            // Original visit-based grouping (for comparison)
            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            // New patient-based grouping (Phase 3 - grouped by patient, not visit)
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging (using patient-based grouping)
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("all patients in one row - generates chart for example study ScheduleExample2 with patient-based grouping", () => {
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            const referenceDate = new Date(2024, 0, 1);
            const patientIdentifier = "MV";
            
            // First, get the timeline without patient history to create patient visits
            // This is different than what will be done in production where the visits are added at actual dates.
            let timelineWithoutPatient = getTimelineAsOfADate(studyConfigurationUnit, referenceDate);
            
            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
              {
                name: "V2 Randomization",
                instance: 1,
                shift: -1,
                numberFound: 0,
                foundThisInstance: false,
              },
              {
                name: "V4-V7 Randomization",
                instance: 1,
                shift: -4,
                numberFound: 0,
                foundThisInstance: false,
              },
              {
                name: "V4-V7 Randomization",
                instance: 2,
                shift: 2,
                numberFound: 0,
                foundThisInstance: false,
              },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timelineWithoutPatient, shiftsFromScheduledVisit, referenceDate);
            let patientHistory = PatientHistory.create({ id: patientIdentifier, patientVisits: completedPatientVisits, patientNotAvailableDates: [] });
            
            // Now get the timeline with patient history using the reference date and patient identifier
            let timeline = getTimelineAsOfADate(studyConfigurationUnit, referenceDate, patientHistory, patientIdentifier);

            // Use new patient-based grouping (Phase 3 - grouped by patient, not visit)
            const timelineDataAsScriptPatients = TimelineChartTemplate.getPatientsTimelineHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScriptPatients + timelineVisualizationHTML);

            // Try to load expected data file - skip comparison if file doesn't exist yet (for test-driven iteration)
            try {
                const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample2-10visits-allpatients");
                const normalizedTimelineDataAsScript = timelineDataAsScriptPatients.replace(/\s+/g, "");
                const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
                // Then the generated timeline picture matches expected patient-based grouping
                expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
            } catch (error) {
                // Expected data file doesn't exist yet - this is fine for test-driven iteration
                // View the generated chart at tmp/timeline.html and adjust template/loops as needed
                // Once output matches, save it as expected-timeline-ScheduleExample2-10visits-allpatients.txt
                console.log("Expected data file not found - chart saved to tmp/timeline.html for review");
                console.log("Once the output is correct, save it to expected-timeline-ScheduleExample2-10visits-allpatients.txt");
            }
        });

        it("generates chart for example study ScheduleExample2 with patient unavailable times", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample2-PatientUnavailable");
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.setReferenceDate(new Date(2024, 0, 1));
            simulator.organizedByReferenceDate();
            simulator.run();
            let timeline = simulator.timeline;

            // TODO: investigate whether patient availability should be added before the simulator is run.
            // This is how it's done for Staff Availability. Maybe it should be done that way via UI but for tests
            // where we shift from the planned visits this is necessary. 
            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
                { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 1, shift: -3, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit, new Date(2024,0,1));
            let dateRangeList: DateRange[] = [];
            const dayOffsetOfFirstEventInstance = timeline.getOffsetOfFirstEventInstance();

            let dateRange = utils.createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024", dayOffsetOfFirstEventInstance);
            dateRangeList.push(dateRange);
            dateRange = utils.createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024", dayOffsetOfFirstEventInstance);
            dateRangeList.push(dateRange);
            let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: dateRangeList });

            timeline.addPatientEvents(patientHistory, "MV");

            const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
            // Save full HTML of chart for viewing / debugging
            utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

            const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
            const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
            // Then the generated timeline picture has two events on the expected event days
            expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
        });

        it("generates a chart for a visit on day 1 showing staff level", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("VisitDay1StaffLevel");
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
                                zoomFriction:30,
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
            let period = Period.create({ name: "Screening" });
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

        it("generates chart for example study ScheduleExample2 with changing staff levels", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ScheduleExample2-ChangingStaff");
            // GIVEN a study configuration loaded from a file but patientInfo and availability are not loaded
            const studyConfigurationUnit = utils.loadModelUnit("ScheduleExample2", "StudyConfiguration") as StudyConfiguration;
            studyConfigurationModel.addUnit(studyConfigurationUnit);

            // Note: Staff Level dates must be relative to the simulator reference date
            let staffLevels = [];
            staffLevels.push(utils.createStaffLevel("3", "2", "January", "2024", "5", "January", "2024"));
            staffLevels.push(utils.createStaffLevel("2", "15", "January", "2024"));
            staffLevels.push(utils.createStaffLevel("2", "30", "January", "2024"));
            const availability = Availability.create({ baselineStaff: "4", staffLevels: staffLevels });

            // WHEN the study is simulated and a timeline picture is generated
            let simulator = new Simulator(studyConfigurationUnit, availability);
            simulator.organizedByReferenceDate();
            simulator.run();
            let timeline = simulator.timeline;

            let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
                { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
                { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
            ];
            let completedPatientVisits: PatientVisit[] = utils.createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit, new Date(2024, 0, 1));
            let patientHistory = PatientHistory.create({
                id: "MV",
                patientVisits: completedPatientVisits,
                patientNotAvailableDates: [],
            });
            timeline.addPatientEvents(patientHistory, "MV");

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
            // Test is skipped because this is only possible when parsing works. Kept for example of how to read text version from file.

            // GIVEN a study configuration loaded from a string
            const configAsText = `
            Periods:
                Period: \`Screening\`

                Description: " "
                Events:
                    Event: \`Screen\`
                    This is a \`site visit\` that is also referred to as ""

                    Description: " "
                    Schedule:
                    First scheduled "" as the start day of the study
                    with a window of 0 day(s) before and 0 day(s) after
                    and no compliance window
                    and then repeats
                    limited to
                    Tasks:
                    Task: \`Task 1\`

                    Description: " "
                    Steps:

                    Event: \`Visit 1\`
                    This is a \`site visit\` that is also referred to as ""

                    Description: " "
                    Schedule:
                    First scheduled when \`Screen\` \`completed\` \`+\` 3 \`weeks\`
                    with a window of 0 day(s) before and 0 day(s) after
                    and no compliance window
                    and then repeats
                    limited to
                    Tasks:

                    Event: \`Visit 2\`
                    This is a \`site visit\` that is also referred to as ""

                    Description: " "
                    Schedule:
                    First scheduled when \`Visit 1\` \`completed\` \`+\` 3 \`months\`
                    with a window of 0 day(s) before and 0 day(s) after

                    and then repeats
                    limited to
                    Tasks:

                Tasks:

                System Accesses:

                Staffing:

                Roles:`;
            // Create a new model for this test to avoid conflicts with the unit created in beforeEach
            const testModel = studyConfigurationModelEnvironment.newModel("TestStudyModelForText") as StudyConfigurationModel;
            
            const studyConfigurationUnit = studyConfigurationModelEnvironment.reader.readFromString(
                configAsText,
                "StudyConfiguration",
                testModel,
                "StudyConfiguration.dsl.txt"
            ) as StudyConfiguration;
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

        it("writes StudyConfiguration to DSL text format", () => {
          // GIVEN a study configuration
          // const studyName = "ScheduleExample3";
          const studyName = "MultiMonthStudy";
          const studyFolderPath: string = path.resolve(
            __dirname,
            "..",
            "__tests__",
            "modelstore",
            studyName
          );
          const studyConfigurationUnit = utils.loadModelUnit(
            studyName,
            "StudyConfiguration",
            studyFolderPath
          ) as StudyConfiguration;
          studyConfigurationModel.addUnit(studyConfigurationUnit);

          const patientInfoUnit = utils.loadModelUnit(
            studyName,
            "PatientInfo",
            studyFolderPath
          ) as PatientInfo;
          studyConfigurationModel.addUnit(patientInfoUnit);

          // WHEN the study is written to DSL text format
          const writer = new StudyConfigurationModelModelUnitWriter();
          const dslText = writer.writeToString(studyConfigurationUnit);

          // THEN Verify the DSL text is not empty
          expect(dslText).toBeTruthy();
          expect(dslText.length).toBeGreaterThan(0);

          // Save the DSL text to a file for inspection
          const outputPath = path.resolve(
            __dirname,
            "..",
            "__tests__",
            "modelstore",
            studyName,
            "StudyConfiguration.dsl.txt"
          );
          fs.writeFileSync(outputPath, dslText, "utf-8");
        });

        it("generates a CHART for a three visit timeline for a visit that repeats twice", () => {
            const expectedTimelineDataAsScript = loadExpectedTimelineData("ThreeVisitRepeatsTwice");
            // GIVEN
            let listOfEventsToAdd: utils.EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 0, repeat: 2, period: "Screening" }];
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
            let listOfEventsToAdd: utils.EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd, "V#");

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const expectedTimelineTableAsHTML = `
                <div class="table_component" role="region" tabindex="0">
                    <table>
                    <caption>Study Timeline</caption>
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
            let listOfEventsToAdd: utils.EventsToAdd[] = [{ eventName: "Visit 1", daysToAdd: 1, repeat: 2, period: "Screening" }];
            studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd, "Special Alt Name");

            // WHEN the study is simulated and a timeline is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            const expectedTimelineTableAsHTML = `
                <div class="table_component" role="region" tabindex="0">
                    <table>
                    <caption>Study Timeline</caption>
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

        it("includes events scheduled 3 years (1095 days) in the future in timeline table", () => {
            // GIVEN a study configuration with events spanning 3 years
            // Event 1 on day 1, Event 2 on day 1095 (approximately 3 years)
            const threeYearsInDays = 1095;

            let period = Period.create({ name: "Long Term Follow Up" });

            // First event on day 1
            let eventSchedule1 = utils.createEventScheduleStartingOnADay("Visit 1", 1, 0, 0);
            utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule1, "V1");

            // Second event on day 1095 (3 years out)
            let eventSchedule2 = utils.createEventScheduleStartingOnADay("Visit 2", threeYearsInDays, 0, 0);
            utils.createEventAndAddToPeriod(period, "Visit 2", eventSchedule2, "V2");

            studyConfigurationUnit.periods.push(period);

            // WHEN the study is simulated and a timeline table is generated
            let simulator = new Simulator(studyConfigurationUnit);
            simulator.run();
            let timeline = simulator.timeline;

            // Generate the table HTML
            const timelineTableAsHTML = TimelineTableTemplate.getTimelineTableHTML(timeline);

            // Save for debugging
            utils.saveTimelineTable(timelineTableAsHTML);

            // THEN the timeline table should include both visits
            expect(timelineTableAsHTML).toContain("Visit 1");
            expect(timelineTableAsHTML).toContain("Visit 2");

            // Verify the timeline has the correct max day (at least 3 years out)
            expect(timeline.getMaxDayOnTimeline()).toBeGreaterThanOrEqual(threeYearsInDays);

            // Verify both events are on the timeline
            const scheduledEvents = timeline.getScheduleEventInstancesOrderByDay();
            expect(scheduledEvents.length).toBe(2);
            expect(scheduledEvents[0].getName()).toBe("Visit 1");
            expect(scheduledEvents[1].getName()).toBe("Visit 2");
            // The startDay should be at least 1095 (may be 1095 or 1096 depending on study start day offset)
            expect(scheduledEvents[1].startDay).toBeGreaterThanOrEqual(threeYearsInDays);
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

    for (let i = 0; i < Math.max(normalizedTimelineDataAsScript.length, normalizedExpectedTimelineDataAsScript.length); i++) {
        if (normalizedTimelineDataAsScript[i] !== normalizedExpectedTimelineDataAsScript[i]) {
            console.log(`Difference at position ${i}:`);
            console.log(`length: ${normalizedTimelineDataAsScript.length} ${normalizedExpectedTimelineDataAsScript.length}`);
            console.log(`Actual:   "${normalizedTimelineDataAsScript[i]}" (char code: ${normalizedTimelineDataAsScript.charCodeAt(i)})`);
            console.log(`Expected: "${normalizedExpectedTimelineDataAsScript[i]}" (char code: ${normalizedExpectedTimelineDataAsScript.charCodeAt(i)})`);
            // Show some context around the difference
            console.log(`Context (actual):   ...${normalizedTimelineDataAsScript.substring(i - 20, i + 20)}...`);
            console.log(`Context (expected): ...${normalizedExpectedTimelineDataAsScript.substring(i - 20, i + 20)}...`);
            break;
        }
    }
    // Then the generated timeline picture has the expected events on the expected event days
    expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
}

function testStudyFromDSLFile(dslFilePath: string, studyConfigurationModel: StudyConfigurationModel, expectedTimelineDataAsScript: string, referenceDate?: Date) {
    // GIVEN a study configuration loaded from a DSL text file
    const fullDslText = fs.readFileSync(dslFilePath, "utf-8");
    
    // Extract only the StudyConfiguration part (before PatientInfo section if present)
    let dslText = fullDslText;
    const patientInfoIndex = fullDslText.indexOf("// PatientInfo for:");
    if (patientInfoIndex !== -1) {
        dslText = fullDslText.substring(0, patientInfoIndex).trim();
    }
    
    // Remove comment lines at the start if present
    dslText = dslText.replace(/^\/\/.*$/gm, "").trim();
    
    expect(dslText).toBeTruthy();
    expect(dslText.length).toBeGreaterThan(0);

    // Get the environment instance
    const env = StudyConfigurationModelEnvironment.getInstance();
    
    // Create a new model for this test to avoid conflicts with the unit created in beforeEach
    const testModel = env.newModel("TestStudyModelForDSL") as StudyConfigurationModel;

    // Parse the DSL text into a StudyConfiguration model unit
    const studyConfigurationUnit = env.reader.readFromString(
        dslText,
        "StudyConfiguration",
        testModel,
        path.basename(dslFilePath)
    ) as StudyConfiguration;
    
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

    for (let i = 0; i < Math.max(normalizedTimelineDataAsScript.length, normalizedExpectedTimelineDataAsScript.length); i++) {
        if (normalizedTimelineDataAsScript[i] !== normalizedExpectedTimelineDataAsScript[i]) {
            console.log(`Difference at position ${i}:`);
            console.log(`length: ${normalizedTimelineDataAsScript.length} ${normalizedExpectedTimelineDataAsScript.length}`);
            console.log(`Actual:   "${normalizedTimelineDataAsScript[i]}" (char code: ${normalizedTimelineDataAsScript.charCodeAt(i)})`);
            console.log(`Expected: "${normalizedExpectedTimelineDataAsScript[i]}" (char code: ${normalizedExpectedTimelineDataAsScript.charCodeAt(i)})`);
            // Show some context around the difference
            console.log(`Context (actual):   ...${normalizedTimelineDataAsScript.substring(i - 20, i + 20)}...`);
            console.log(`Context (expected): ...${normalizedExpectedTimelineDataAsScript.substring(i - 20, i + 20)}...`);
            break;
        }
    }
    // Then the generated timeline picture has the expected events on the expected event days
    expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
}

