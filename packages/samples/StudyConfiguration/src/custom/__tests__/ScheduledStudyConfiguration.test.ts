import { StudyConfiguration, StudyConfigurationModel } from "../../language/gen";
import { ScheduledStudyConfiguration } from "../timeline/ScheduledStudyConfiguration.js";
import { Simulator } from "../timeline/Simulator.js";
import { TimelineInstanceState } from "../timeline/TimelineEventInstance.js";

import { Timeline } from "../timeline/Timeline.js";
import * as utils from "./Utils";
import { ScheduledEvent } from "../timeline/ScheduledEvent.js";
import { StudyConfigurationModelEnvironment } from "../../config/gen/StudyConfigurationModelEnvironment.js";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance.js";

// #TODO: These tests may or may not be working. They are not currently being run. They were just updated to remove compliler errors m.v. 8/30

describe("Access to simulation data", () => {
    // var simulator;
    var studyConfiguration: StudyConfiguration;
    var scheduledStudyConfiguration: ScheduledStudyConfiguration;
    const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    var studyConfigurationUnit: StudyConfiguration;
    var studyConfigurationModel: StudyConfigurationModel;
    const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.

    beforeEach(() => {
        beforeEach(() => {
            // const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
            studyConfigurationModel = studyConfigurationModelEnvironment.newModel(modelName) as StudyConfigurationModel;
            studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
        });
    });

    describe("Check for the correct Events scheduled just using 'StartDay + #'", () => {
        beforeEach(() => {
            studyConfiguration = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfiguration, "Screening", "Visit 1", 1, "Visit 2", 7);
            scheduledStudyConfiguration = new ScheduledStudyConfiguration(studyConfiguration);
        });

        it("can access to the first period of the trial", () => {
            // GIVEN a scheduled study configuration with one period and two events
            // See beforeAll()

            // WHEN the Scheduled Study Configuration is asked for the first scheduled period
            let scheduledPeriod = scheduledStudyConfiguration.getFirstScheduledPeriod();

            // Then the first scheduled Period is Screening
            expect(scheduledPeriod.configuredPeriod.name).toEqual("Screening");
        });

        it("can access to the first event of the first period of the trial", () => {
            // GIVEN a scheduled study configuration with one period and two events
            // See beforeAll()

            // WHEN the Scheduled Study Configuration is asked for the first scheduled period
            let scheduledEvent = scheduledStudyConfiguration.getFirstStudyStartEvent();

            // Then the first scheduled Period is Screening
            if (scheduledEvent) {
                expect(scheduledEvent.configuredEvent.name).toEqual("Visit 1");
            } else {
                throw new Error("No scheduled event found");
            }
        });

        it("can access all the events in a period of the trial", () => {
            // GIVEN a scheduled study configuration with one period and two events
            // See beforeAll()

            // WHEN the Scheduled Study Configuration is asked for the first scheduled period
            let scheduledPeriod = scheduledStudyConfiguration.getFirstScheduledPeriod();
            let scheduledEvents = scheduledStudyConfiguration.getAllEventsInAScheduledPeriod(scheduledPeriod);

            // Then the first scheduled Period is Screening
            if (scheduledEvents) {
                expect(scheduledEvents.length).toEqual(2);
                expect(scheduledEvents[0].configuredEvent.name).toEqual("Visit 1");
                expect(scheduledEvents[1].configuredEvent.name).toEqual("Visit 2");
            } else {
                throw new Error("No scheduled events found");
            }
        });

        it("can get the next event based on days from StartDay", () => {
            // GIVEN a timeline with the Visit 1 event completed
            // AND a scheduled study configuration with a Visit 2 event starting 7 days after the Visit 1 event
            // AND it's day 8
            let scheduledEvent = scheduledStudyConfiguration.getFirstStudyStartEvent();
            if (!scheduledEvent) {
                throw new Error("No scheduled event found");
            } else {
                let timeline = new Timeline();
                let eventInstance = new ScheduledEventInstance(scheduledEvent, 1);
                eventInstance.state = TimelineInstanceState.Completed;
                timeline.addEvent(eventInstance);
                timeline.setCurrentDay(8);

                // WHEN the schedule is checked
                let readyEvents = scheduledStudyConfiguration.getEventsReadyToBeScheduled(eventInstance, 8, timeline);

                // THEN the next event is Visit 2
                console.log("readyEvents #: " + readyEvents.length);
                console.log("readyEvents: " + readyEvents[0].scheduledEvent.configuredEvent.name);
                expect(readyEvents.length).toEqual(1);
            }
        });
    });

    describe("Check for the correct Events scheduled just using 'Completed-Event + #'", () => {
        it("can get next event based on reference to completed event", () => {
            // GIVEN a scheduled study configuration with an event + 7 days from the first event
            studyConfiguration = utils.addEventScheduledOffCompletedEvent(studyConfiguration, "Screening", "Visit 1", 1, "Visit 2", 7);
            scheduledStudyConfiguration = new ScheduledStudyConfiguration(studyConfiguration);

            // WHEN the Scheduled Study Configuration is asked for the first scheduled period
            let scheduledEvent = scheduledStudyConfiguration.getFirstStudyStartEvent();
            if (!scheduledEvent) {
                throw new Error("No scheduled event found");
            } else {
                let timeline = new Timeline();
                let eventInstance = new ScheduledEventInstance(scheduledEvent, 1);
                eventInstance.state = TimelineInstanceState.Completed;
                timeline.addEvent(eventInstance);
                timeline.setCurrentDay(8);

                // WHEN the schedule is checked
                let readyEvents = scheduledStudyConfiguration.getEventsReadyToBeScheduled(eventInstance, 8, timeline);

                // THEN the next and only event is Visit 2
                expect(readyEvents.length).toEqual(1);
                expect(readyEvents[0].scheduledEvent.configuredEvent.name).toEqual("Visit 2");
            }
        });

        it("finds no ready events if depend on an unscheduled event", () => {
            // GIVEN a scheduled study configuration with an event + 7 days from the first event
            studyConfiguration = utils.addEventScheduledOffCompletedEvent(studyConfiguration, "Screening", "Visit 1", 1, "Visit 2", 7);
            scheduledStudyConfiguration = new ScheduledStudyConfiguration(studyConfiguration);
            // And there is nothing completed on the timeline
            let timeline = new Timeline();
            timeline.setCurrentDay(1);
            let firstEvent = scheduledStudyConfiguration.getFirstStudyStartEvent() as ScheduledEvent;
            let completedEvent = new ScheduledEventInstance(firstEvent, 1);
            completedEvent.state = TimelineInstanceState.Completed;
            timeline.addEvent(completedEvent);

            // WHEN the schedule is checked for ready events
            let readyEvents = scheduledStudyConfiguration.getEventsReadyToBeScheduled(completedEvent, 8, timeline);
            let scheduledOnADay = scheduledStudyConfiguration.getEventsScheduledOnASpecificDay();

            // THEN the next and only event is Visit 1 (because Visit 2 isn't ready till Visit 1 is completed)
            expect(readyEvents.length).toEqual(0);
            expect(scheduledOnADay[0].configuredEvent.name).toEqual("Visit 1");
        });
    });
});
