import * as Sim from "@freon4dsl/study-configuration";
import {
    Day,
    Days,
    Event,
    EventSchedule,
    EventWindow,
    getVisitChecklistAsMarkdown,
    Period,
    StudyConfiguration,
    LanguageEnvironment as StudyConfigurationModelEnvironment
} from "@freon4dsl/study-configuration";
import { beforeEach, describe, expect, it } from "vitest";


// Helper function to create an event schedule starting on a specific day
function createEventScheduleStartingOnADay(uniquePrefix: string, startDay: number, daysBefore: number = 1, daysAfter: number = 1): EventSchedule {
    const day = Day.create({ startDay: startDay });
    const daysBeforeDay = Days.create({ count: daysBefore });
    const daysAfterDay = Days.create({ count: daysAfter });
    const eventWindow = EventWindow.create({ 
        daysBefore: daysBeforeDay, 
        daysAfter: daysAfterDay 
    });
    return EventSchedule.create({ eventStart: day, eventWindow: eventWindow });
}

// Helper function to create an event and add it to a period
function createEventAndAddToPeriod(period: Period, eventName: string, eventSchedule: EventSchedule, alternativeName: string = "V#"): Event {
    const event = Event.create({ 
        name: eventName, 
        alternativeName: alternativeName, 
        schedule: eventSchedule 
    });
    period.events.push(event);
    return event;
}

describe("getVisitChecklistAsMarkdown", () => {
    let studyConfigurationUnit: StudyConfiguration;

    beforeEach(() => {
        new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded
        const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
        const studyConfigurationModel = studyConfigurationModelEnvironment.newModel("TestStudyModel");
        studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
    });

    describe("when there are two instances on the same day", () => {
        it("should include both instances in the markdown output", () => {
            // GIVEN a study configuration with two events scheduled on day 0 (same day)
            const period = Period.create({ name: "Screening" });
            studyConfigurationUnit.periods.push(period);
            
            // Create first event scheduled on day 0
            const eventSchedule1 = createEventScheduleStartingOnADay("Visit 1", 0, 0, 1);
            createEventAndAddToPeriod(period, "Visit 1", eventSchedule1);
            
            // Create second event also scheduled on day 0
            const eventSchedule2 = createEventScheduleStartingOnADay("Visit 2", 0, 0, 1);
            createEventAndAddToPeriod(period, "Visit 2", eventSchedule2);

            // Set up reference date (day 0 will be this date)
            const referenceDate = new Date(2024, 8, 30); // September 30, 2024
            const targetDate = new Date(2024, 8, 30); // Same date - day 0

            // WHEN getting the visit checklist markdown for that date
            const markdown = getVisitChecklistAsMarkdown(studyConfigurationUnit, targetDate, referenceDate);

            // THEN both visits should be included in the markdown
            expect(markdown).toContain("Visit 1");
            expect(markdown).toContain("Visit 2");

            // Verify the checklist heading is present with heading number
            expect(markdown).toContain("1: Checklist for");

            // Verify both events have their markdown sections with heading numbers (h2 level = 1.x)
            expect(markdown).toContain("1.1: Visit 1");
            expect(markdown).toContain("1.2: Visit 2");

            // Verify there's a separator between the two events (the method adds section breaks between events)
            const visit1Index = markdown.indexOf("1.1: Visit 1");
            const visit2Index = markdown.indexOf("1.2: Visit 2");
            expect(visit1Index).toBeGreaterThanOrEqual(0);
            expect(visit2Index).toBeGreaterThan(visit1Index);
        });

        it("should handle multiple instances when they have different names", () => {
            // GIVEN a study configuration with three events scheduled on the same day
            const period = Period.create({ name: "Treatment" });
            studyConfigurationUnit.periods.push(period);
            
            const eventSchedule1 = createEventScheduleStartingOnADay("Baseline Assessment", 0, 0, 1);
            createEventAndAddToPeriod(period, "Baseline Assessment", eventSchedule1);
            
            const eventSchedule2 = createEventScheduleStartingOnADay("Blood Draw", 0, 0, 1);
            createEventAndAddToPeriod(period, "Blood Draw", eventSchedule2);
            
            const eventSchedule3 = createEventScheduleStartingOnADay("Questionnaire", 0, 0, 1);
            createEventAndAddToPeriod(period, "Questionnaire", eventSchedule3);

            const referenceDate = new Date(2024, 8, 30);
            const targetDate = new Date(2024, 8, 30);

            // WHEN getting the visit checklist markdown
            const markdown = getVisitChecklistAsMarkdown(studyConfigurationUnit, targetDate, referenceDate);

            // THEN all three events should be included
            expect(markdown).toContain("Baseline Assessment");
            expect(markdown).toContain("Blood Draw");
            expect(markdown).toContain("Questionnaire");
            
            // Verify order is preserved (as they appear in the timeline)
            const baselineIndex = markdown.indexOf("Baseline Assessment");
            const bloodDrawIndex = markdown.indexOf("Blood Draw");
            const questionnaireIndex = markdown.indexOf("Questionnaire");
            
            expect(baselineIndex).toBeGreaterThanOrEqual(0);
            expect(bloodDrawIndex).toBeGreaterThan(baselineIndex);
            expect(questionnaireIndex).toBeGreaterThan(bloodDrawIndex);
        });

        it("should return appropriate message when no visits are scheduled for the date", () => {
            // GIVEN a study configuration with events scheduled on different days
            const period = Period.create({ name: "Screening" });
            studyConfigurationUnit.periods.push(period);
            
            const eventSchedule = createEventScheduleStartingOnADay("Visit 1", 7, 0, 1);
            createEventAndAddToPeriod(period, "Visit 1", eventSchedule);

            const referenceDate = new Date(2024, 8, 30);
            const targetDate = new Date(2024, 8, 30); // Day 0, but event is on day 7

            // WHEN getting the visit checklist markdown for day 0
            const markdown = getVisitChecklistAsMarkdown(studyConfigurationUnit, targetDate, referenceDate);

            // THEN it should indicate no visits are scheduled
            expect(markdown).toContain("No visits scheduled for");
        });
    });
});

