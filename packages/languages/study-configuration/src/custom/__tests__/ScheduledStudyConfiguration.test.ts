import { StudyConfiguration, StudyConfigurationModel } from "../../freon/language/index.js";
import { ScheduledStudyConfiguration } from "../timeline/ScheduledStudyConfiguration.js";
import { Simulator } from "../timeline/Simulator.js";
import { TimelineInstanceState } from "../timeline/TimelineEventInstance.js";

import { Timeline } from "../timeline/Timeline.js";
import * as utils from "./Utils";
import { ScheduledEvent } from "../timeline/ScheduledEvent.js";
import { StudyConfigurationModelEnvironment } from "../../freon/config/StudyConfigurationModelEnvironment.js";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance.js";

// #TODO: These tests may or may not be working. They are not currently being run. They were just updated to remove compliler errors m.v. 8/30

describe("Access to simulation data", () => {
    var studyConfiguration: StudyConfiguration = StudyConfiguration.create({});
    var scheduledStudyConfiguration: ScheduledStudyConfiguration;
    const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    var studyConfigurationUnit: StudyConfiguration;
    var studyConfigurationModel: StudyConfigurationModel;
    const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.

    beforeEach(() => {
        beforeEach(() => {
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

    });

});
