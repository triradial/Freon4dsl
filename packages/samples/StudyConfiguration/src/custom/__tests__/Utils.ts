import { StudyConfigurationModelEnvironment } from "../../config/gen/StudyConfigurationModelEnvironment";
import {
    StudyConfiguration,
    Period,
    Event,
    EventSchedule,
    Day,
    PlusExpression,
    When,
    NumberLiteralExpression,
    EventReference,
    RepeatCondition,
    RepeatUnit,
    Days,
    EventWindow,
    EventState,
    SimpleOperators,
    TimeAmount,
    StudyStart,
    TimeUnit,
    Weekly,
    PatientVisit,
    PatientHistory,
    PatientInfo,
    VisitDate,
    Month,
    PatientVisitStatus,
    Availability,
    StaffLevel,
    DateRange,
    StartRangeDate,
} from "../../language/gen/index";
import { FreLionwebSerializer, FreLogger, FreModelUnit, FreNodeReference } from "@freon4dsl/core";
import { Timeline } from "../timeline/Timeline";
import { ScheduledEventInstance } from "../timeline/ScheduledEventInstance";
import { TimelineInstanceState } from "../timeline/TimelineEventInstance";
import { PeriodEventInstance } from "../timeline/PeriodEventInstance";
import { ScheduledEvent, ScheduledEventState } from "../timeline/ScheduledEvent";
import { ScheduledPeriod } from "../timeline/ScheduledPeriod";
import * as path from "path";
import * as fs from "fs";
import { resetTimelineScriptTemplate, TimelineChartTemplate } from "../templates/TimelineChartTemplate";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate";

// Create a EventSchedule DSL element and set its 'eventStart' to a 'When' DSL element.
// The When is populated using the parameters. These parameters match the fields of the When.startWhen EventReference.
// The EventSchedule's EventWindow, RepeatExpression, and EventTimeOfDay are empty.
export function createWhenEventSchedule(eventName: string, eventState: EventState, operator: SimpleOperators, timeAmount: TimeAmount) {
    let referenceToOperator = FreNodeReference.create(operator, "SimpleOperators");
    // console.log("createWhenEventSchedule eventName: " + eventName + " eventState: " + eventState + " operator: " + operator + " timeAmount: " + timeAmount.value + " " + timeAmount.unit.name);
    let referenceToEventState = FreNodeReference.create(eventState, "EventState");
    const referencedEvent = FreNodeReference.create<Event>(eventName, "Event");
    const startWhenEventReference = EventReference.create({
        operator: referenceToOperator,
        timeAmount: timeAmount,
        eventState: referenceToEventState,
        event: referencedEvent,
    });

    const whenExpression = When.create({ startWhen: startWhenEventReference });
    const eventSchedule = EventSchedule.create({ eventStart: whenExpression });
    return eventSchedule;
}

// Create a EventSchedule DSL element and set its 'eventStart' to a 'When' DSL element defined by a binary expression.
// export function createStudyStartExpression(eventName: string, binaryExpression: BinaryExpression) {
//   let eventSchedule = new EventSchedule(eventName + binaryExpression.toString());
//   eventSchedule.eventStart = binaryExpression;
//   return eventSchedule;
// }

export function createEventWindow(uniquePrefix: string, daysBefore: number, daysAfter: number) {
    //TODO: change new to create
    let eventWindow = new EventWindow("EventWindow");
    let daysBeforeDay = new Days(uniquePrefix + "DaysBefore");
    daysBeforeDay.count = daysBefore;
    let daysAfterDay = new Days(uniquePrefix + "DaysAfter");
    daysAfterDay.count = daysAfter;
    eventWindow.daysBefore = daysBeforeDay;
    eventWindow.daysAfter = daysAfterDay;
    return eventWindow;
}

// Create a EventSchedule DSL element and set its 'eventStart' to a 'Day' DSL element starting 'startDay'.
export function createEventScheduleStartingOnADay(uniquePrefix: string, startDay: number, daysBefore: number = 1, daysAfter: number = 1) {
    let day = Day.create({ startDay: startDay });
    let eventWindow = createEventWindow(uniquePrefix, daysBefore, daysAfter);
    let eventSchedule = EventSchedule.create({ eventStart: day, eventWindow: eventWindow });
    return eventSchedule;
}

export function createDay1EventScheduleThatRepeatsWeekly(eventName: string, numberOfRepeats: number, eventDay: number) {
    let eventSchedule = createEventScheduleStartingOnADay(eventName, eventDay);
    let repeatCondition = new RepeatCondition("RepeatCount-" + eventName);
    repeatCondition.maxRepeats = numberOfRepeats;
    repeatCondition.repeatUnit = new Weekly();
    eventSchedule.eventRepeat = repeatCondition;
    return eventSchedule;
}

// Add a Event DSL element to a Period DSL element.
export function createEventAndAddToPeriod(period: Period, eventName: string, eventSchedule: EventSchedule): Event {
    let event = new Event(eventName);
    event.name = eventName;
    event.schedule = eventSchedule;
    period.events.push(event);
    return event;
}

/* Add a Period DSL element containing two Events to the Study Configuration:
 * - First event named 'event1Name' is First Scheduled on 'event1Day'
 * - Second event named 'event2Name' is First Scheduled at 'StudyStart + event2Day' .
 * Return the updated Study Configuration.
 */
export function addAPeriodWithEventOnDayAndEventUsingStudyStart(
    studyConfiguration: StudyConfiguration,
    periodName: string,
    event1Name: string,
    event1Day: number,
    event2Name: string,
    event2DaysAfterStudyStart,
): StudyConfiguration {
    let period = new Period(periodName);
    period.name = periodName;

    let dayEventSchedule = createEventScheduleStartingOnADay(event1Name, event1Day);
    createEventAndAddToPeriod(period, event1Name, dayEventSchedule);

    const studyStartPlusDays = PlusExpression.create({
        left: StudyStart.create({}),
        right: NumberLiteralExpression.create({ value: event2DaysAfterStudyStart }),
    });
    let eventSchedule = EventSchedule.create({ eventStart: studyStartPlusDays });
    createEventAndAddToPeriod(period, event2Name, eventSchedule);

    studyConfiguration.periods.push(period);
    return studyConfiguration;
}

// Event 1 is First Scheduled on event1Day and Event 2 is First Scheduled When event1 completes + event2DaysAfterEvent1
//
export function addEventScheduledOffCompletedEvent(
    studyConfiguration: StudyConfiguration,
    periodName: string,
    event1Name: string,
    event1Day: number,
    event2Name: string,
    event2DaysAfterEvent1: number,
): StudyConfiguration {
    let period = new Period(periodName);
    period.name = periodName;

    let dayEventSchedule = createEventScheduleStartingOnADay(event1Name, event1Day);
    let firstEvent = createEventAndAddToPeriod(period, event1Name, dayEventSchedule);

    const timeUnit = FreNodeReference.create(TimeUnit.days, "TimeUnit");
    console.log("addEventScheduledOffCompletedEvent timeUnit: " + timeUnit.name);
    const timeAmount = TimeAmount.create({ value: event2DaysAfterEvent1, unit: timeUnit });
    let when = createWhenEventSchedule(event2Name, EventState.completed, SimpleOperators.plus, timeAmount);
    createEventAndAddToPeriod(period, event2Name, when);

    studyConfiguration.periods.push(period);
    return studyConfiguration;
}

export interface EventsToAdd {
    eventName: string;
    eventDay: number;
    repeat: number;
    period: string;
}

/*
 * eventsToAdd: An array of EventsToAdd objects. Each object contains the following fields:
 * - eventName: The name of the event to add.
 * - eventDay: The number of days the event is scheduled off the previous event. Note this is a confusing name!
 * - period: The name of the period the event belongs to.
 *
 * For each period in eventsToAdd, add a Period DSL element containing Events:
 * - The first event of first period is First Scheduled on its eventDay.
 * - Subsequent events are scheduled off the previous event.
 *
 * Return the updated Study Configuration.
 */
export function addEventsScheduledOffCompletedEvents(studyConfiguration: StudyConfiguration, eventsToAdd: EventsToAdd[]): StudyConfiguration {
    let periodName = eventsToAdd[0].period;
    let period = new Period(periodName);
    period.name = periodName;
    // Setup the study start event
    console.log("Adding the first event: " + eventsToAdd[0].eventName + " day: " + eventsToAdd[0].eventDay + " to period: " + periodName);
    let dayEventSchedule = createEventScheduleStartingOnADay(eventsToAdd[0].eventName, eventsToAdd[0].eventDay);
    let previousEvent = createEventAndAddToPeriod(period, eventsToAdd[0].eventName, dayEventSchedule);
    studyConfiguration.periods.push(period);

    // Add subsequent events scheduled off the previous event
    let timeAmount = null;
    let isFirstEvent = true;
    eventsToAdd.forEach((eventToAdd) => {
        console.log(
            "current period: " + periodName + " eventToAdd: " + eventToAdd.eventName + " day: " + eventToAdd.eventDay + " to period: " + eventToAdd.period,
        );
        if (isFirstEvent) {
            // Skip the first event as it is already added
            isFirstEvent = false;
            return; // return here is to break out of the forEach loop
        }
        let newPeriod = false;
        let eventReference = new EventReference(eventToAdd.eventName);
        if (periodName !== eventToAdd.period) {
            console.log("Creating new period: " + eventToAdd.period);
            periodName = eventToAdd.period;
            period = new Period(periodName);
            period.name = periodName;
            newPeriod = true;
        }
        let freNodeReference = FreNodeReference.create(previousEvent, "Event");
        eventReference.event = freNodeReference;
        let timeUnit = FreNodeReference.create(TimeUnit.days, "TimeUnit");
        timeAmount = TimeAmount.create({ value: eventToAdd.eventDay, unit: timeUnit });
        console.log(
            "addEventsScheduledOffCompletedEvents  eventToAdd: " +
                eventToAdd.eventName +
                " at " +
                timeAmount.value +
                " " +
                timeUnit.name +
                " after: " +
                previousEvent.name,
        );
        let when = createWhenEventSchedule(previousEvent.name, EventState.completed, SimpleOperators.plus, timeAmount);
        previousEvent = createEventAndAddToPeriod(period, eventToAdd.eventName, when);
        if (newPeriod) {
            // console.log("Adding the new period: " + periodName);
            studyConfiguration.periods.push(period);
        }
    });
    // logPeriodsAndEvents("addEventsScheduledOffCompletedEvents",studyConfiguration);
    return studyConfiguration;
}

export function logPeriodsAndEvents(prefix: string, studyConfiguration: StudyConfiguration) {
    let output = prefix + " # periods: " + studyConfiguration.periods.length + "\n";
    studyConfiguration.periods.forEach((period) => {
        output += "Period: " + period.name + " # events: " + period.events.length + "\n";
        period.events.forEach((event) => {
            output += "  Event: " + event.name + "\n";
        });
    });
    console.log(output);
}

export function addRepeatingEvents(studyConfiguration: StudyConfiguration, periodName: string, eventsToAdd: EventsToAdd[]): StudyConfiguration {
    let period = new Period(periodName);
    period.name = periodName;
    // Setup the study start event
    let dayEventSchedule = createDay1EventScheduleThatRepeatsWeekly(eventsToAdd[0].eventName, eventsToAdd[0].repeat, eventsToAdd[0].eventDay);
    let event = createEventAndAddToPeriod(period, eventsToAdd[0].eventName, dayEventSchedule);
    studyConfiguration.periods.push(period);
    return studyConfiguration;
}

/*
 * Add to the timeline an Event and if not already there add the Period it belongs to.
 * - studyConfiguration: The StudyConfiguration containing the DSL defined Period and Event for which the scheduled Event and Period are added.
 * - periodNumber: The index of the Period in the StudyConfiguration.periods array. TODO: Change to searching by period name
 *
 */
export function addEventAndInstanceToTimeline(
    studyConfiguration: StudyConfiguration,
    periodNumber: number,
    eventName: string,
    dayEventCompleted: number,
    timeline: Timeline,
    eventState: ScheduledEventState,
    periodState: TimelineInstanceState,
    nameOfPeriodToAddEventTo: string,
    dayPeriodStarted?: number,
    dayPeriodEnded?: number,
): ScheduledEventInstance {
    let scheduledPeriodToAddEventTo = null;
    let currentPeriodInstance = timeline.getPeriodInstanceFor(nameOfPeriodToAddEventTo);
    if (currentPeriodInstance === undefined) {
        // The period is not already on the timeline, so add it
        let configuredPeriod = studyConfiguration.periods[periodNumber];
        scheduledPeriodToAddEventTo = new ScheduledPeriod(configuredPeriod);
        let periodInstance = new PeriodEventInstance(scheduledPeriodToAddEventTo, dayPeriodStarted, dayPeriodEnded);
        periodInstance.setState(periodState);
        timeline.addEvent(periodInstance);
    } else {
        scheduledPeriodToAddEventTo = currentPeriodInstance.scheduledPeriod; // Add the new event to the period that was previously added to the timeline
        if (periodState === TimelineInstanceState.Completed) {
            currentPeriodInstance.setCompleted(dayPeriodEnded);
        }
    }
    let scheduledEvent = scheduledPeriodToAddEventTo.getScheduledEvent(eventName);
    scheduledEvent.state = eventState;
    let eventInstance = new ScheduledEventInstance(scheduledEvent, dayEventCompleted);
    eventInstance.state = TimelineInstanceState.Completed;
    timeline.addEvent(eventInstance);
    return eventInstance;
}

export function loadModelUnit(modelFolderName: string, modelUnitName: string): FreModelUnit {
    FreLogger.muteAllLogs();
    // const studyFolderPath: string = path.resolve(__dirname, '..','__tests__', 'modelstore', modelFolderName);
    console.log("__dirname:" + __dirname);
    let studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    const studyFolderPath: string = path.resolve(__dirname, "..", "..", "..", "..", "..", "server", "modelstore", modelFolderName);
    console.log("studyFolderPath (TODO: move from tests folder):" + studyFolderPath);
    const serializer = new FreLionwebSerializer();
    let metaModel = JSON.parse(fs.readFileSync(`${studyFolderPath}/${modelUnitName}.json`).toString());
    const ts = serializer.toTypeScriptInstance(metaModel);
    let modelUnit: StudyConfiguration = ts as StudyConfiguration;
    if (modelUnit instanceof StudyConfiguration) {
        logPeriodsAndEvents("loadModel", modelUnit);
    }
    const validator = studyConfigurationModelEnvironment.validator;
    const errors = validator.validate(modelUnit);
    return modelUnit;
}

export function saveTimelineTable(timelineTableAsScript: string) {
    let filename = "timeline-table.html";
    let timelineTableAsHTML = TimelineTableTemplate.getTimelineTableHTMLPage(timelineTableAsScript);

    this.saveToFile(timelineTableAsHTML, filename);
}

export function saveToFile(stringToSave: string, filename: string) {
    try {
        fs.writeFileSync(filename, stringToSave);
        console.log("File written successfully");
    } catch (err) {
        console.error("Error writing file:", err);
    }
}

export function saveTimeline(timelineDataAsScript: string) {
    let filename = "tmp/timeline.html";
    let timelineDataAsHTML = TimelineChartTemplate.getTimelineAsHTMLPage(timelineDataAsScript);

    saveToFile(timelineDataAsHTML, filename);
}

export function readTextFile(filePath: string): string {
    try {
        const absolutePath = path.resolve(filePath);
        const fileContent = fs.readFileSync(absolutePath, "utf-8");
        return fileContent;
    } catch (error) {
        console.error(`Error reading file from path ${filePath}:`, error);
        throw error;
    }
}

export function readTestDataFile(fileName: string): string {
    return readTextFile(path.resolve(__dirname, "data", fileName));
}

export function generateChart(timeline: Timeline, save: boolean = true): { timelineDataAsScript: string; timelineVisualizationHTML: string } {
    resetTimelineScriptTemplate();
    let timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    let timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    // Save full HTML of chart for viewing / debugging
    const html = timelineDataAsScript + timelineVisualizationHTML;
    if (save) saveTimeline(html);
    return { timelineDataAsScript, timelineVisualizationHTML };
}

/*
 * Check the timeline chart against the expected timeline data and visualization.
 * - timeline: The Timeline to generate the chart for.
 * - expectedTimelineDataAsScript: The expected timeline data part of the chart as JSON-HTML. If empty, the timeline data part is not checked.
 * - expectedTimelineVisualizationHTML: The expected visualization part of the chart JSON-HTML. If empty, the visualization part is not checked.
 * - save: If true save the generated timeline visualization HTML to a file.
 */
export function checkTimelineChart(
    timeline: Timeline,
    expectedTimelineDataAsScript: string,
    expectedTimelineVisualizationHTML: string = "",
    save: boolean = false,
) {
    const chartData = generateChart(timeline, save);
    let timelineDataAsScript = chartData.timelineDataAsScript;
    let timelineVisualizationHTML = chartData.timelineVisualizationHTML;

    if (expectedTimelineDataAsScript.length > 0) {
        const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, "");
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, "");
        expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }
    if (expectedTimelineVisualizationHTML.length > 0) {
        const normalizedTimelineVisualizationHTML = timelineVisualizationHTML.replace(/\s+/g, "");
        const normalizedExpectedTimelineVisualizationHTML = expectedTimelineVisualizationHTML.replace(/\s+/g, "");
        expect(normalizedTimelineVisualizationHTML).toEqual(normalizedExpectedTimelineVisualizationHTML);
    }
}

function getMonthFromString(month: string): Month {
    switch (month.toLowerCase()) {
        case "january":
            return Month.January;
        case "february":
            return Month.February;
        case "march":
            return Month.March;
        case "april":
            return Month.April;
        case "may":
            return Month.May;
        case "june":
            return Month.June;
        case "july":
            return Month.July;
        case "august":
            return Month.August;
        case "september":
            return Month.September;
        case "october":
            return Month.October;
        case "november":
            return Month.November;
        case "december":
            return Month.December;
        default:
            throw new Error(`Invalid month: ${month}`);
    }
}

export function createACompletedPatientVisit(visitName: string, day: string, month: string, year: string, visitInstanceNumber: number): PatientVisit {
    // console.log("createACompletedPatientVisit visitName: " + visitName + " day: " + day + " month: " + month + " year: " + year);
    const referencedEvent = FreNodeReference.create<Event>(visitName, "Event");
    const visitDate = VisitDate.create({ day: day, month: FreNodeReference.create<Month>(getMonthFromString(month), "Month"), year: year });
    const completedVisitStatus = FreNodeReference.create<PatientVisitStatus>(PatientVisitStatus.completed, "completed");
    let patientVisit = PatientVisit.create({
        visit: referencedEvent,
        actualVisitDate: visitDate,
        status: completedVisitStatus,
        visitInstanceNumber: visitInstanceNumber,
    });
    return patientVisit;
}

export function createPatientInfoWithACompletedVisit(visitName: string, day: string, month: string, year: string, visitInstanceNumber: number): PatientInfo {
    const patientVisit = createACompletedPatientVisit(visitName, day, month, year, visitInstanceNumber);
    let patient = PatientHistory.create({ id: "MV", patientVisits: [patientVisit] });
    let patientInfoUnit = PatientInfo.create({ patientHistories: [patient] });
    return patientInfoUnit;
}

export type ShiftsFromScheduledVisit = { name: string; instance: number; shift: number; numberFound: number; foundThisInstance: boolean };

/*
    * In this example  there are shifts for different instances of V4-V7-rando.
    let shiftsFromScheduledVisit: utils.ShiftsFromScheduledVisit[] = [
        { name: "V2 rando", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
        { name: "V4-V7-rando", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
        { name: "V4-V7-rando", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
    ];

    When each of "V4-V7-rando" is matched the numberFound is incremented. When the numberFound matches the instance number the shift is applied and foundThisInstance set to true.
    Having numberFound and foundThisInstance in the list of shifts passed in is a hack to have a place to track the number of times a visit is matched. 
    There should be only one numberFound counter for each named visit to be shifted. The logic below increments the numberFound for each matching shift for the same visit
*/

export function createCompletedPatientVisits(
    numberToCreate: number,
    timeline: Timeline,
    shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [],
): PatientVisit[] {
    let completedPatientVisits: PatientVisit[] = [];
    let i = 0;
    let stopAddingVisits = false;
    const referenceDate = timeline.getReferenceDate();
    timeline.printTimelineOfScheduledEventInstances();
    timeline.getScheduleEventInstancesOrderByDay().forEach((scheduledEventInstance) => {
        if (i++ < numberToCreate) {
            let dateOfVisit: Date = new Date();
            const startDay = scheduledEventInstance.getStartDay();
            let foundAMatch = false;
            // There can be multiple shifts for the same ScheduledEventInstance (a visit), each with a different instance number to shift. Need to search to find the shift for the instance number, if any.
            let shiftsForVisitInstance = shiftsFromScheduledVisit.filter((record) => record.name === scheduledEventInstance.getName());
            if (shiftsForVisitInstance.length > 0) {
                shiftsForVisitInstance.forEach((shiftFromScheduledVisit) => {
                    shiftFromScheduledVisit.numberFound++; // This is the hack where the number of times a visit is matched is tracked for each shift of the same visit rather than just one counter.
                    if (shiftFromScheduledVisit.numberFound === shiftFromScheduledVisit.instance && shiftFromScheduledVisit.foundThisInstance === false) {
                        // if this matches then this is the instance to shift
                        dateOfVisit = addDays(referenceDate, startDay + shiftFromScheduledVisit.shift); // Shift the visit
                        shiftFromScheduledVisit.foundThisInstance = true; // Remember that this shift has been done
                        foundAMatch = true; // Done looking for shifts for this visit
                    }
                });
            }
            if (!foundAMatch) {
                dateOfVisit = addDays(referenceDate, startDay); // No shifts for this Visit
            }
            const patientVisit = createACompletedPatientVisit(
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
        }
    });
    return completedPatientVisits;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function createStaffLevel(
    staffAvailable: string,
    startDay: string,
    startMonth: string,
    startYear: string,
    endDay?: string,
    endMonth?: string,
    endYear?: string,
) {
    const startDateInRange = StartRangeDate.create({
        day: startDay,
        month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
        year: startYear,
    });
    if (!endDay) {
        endDay = startDay;
        endMonth = startMonth;
        endYear = startYear;
    }
    const endDateInRange = StartRangeDate.create({
        day: endDay,
        month: FreNodeReference.create<Month>(getMonthFromString(endMonth), "Month"),
        year: endYear,
    });
    const staffDateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
    const staffLevel = StaffLevel.create({ staffAvailable: staffAvailable, dateOrRange: staffDateOrRange });
    return staffLevel;
}

export function createPatientNotAvailableDateRange(
    startDay: string,
    startMonth: string,
    startYear: string,
    endDay?: string,
    endMonth?: string,
    endYear?: string,
) {
    const startDateInRange = StartRangeDate.create({
        day: startDay,
        month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
        year: startYear,
    });
    if (!endDay) {
        endDay = startDay;
        endMonth = startMonth;
        endYear = startYear;
    }
    const endDateInRange = StartRangeDate.create({
        day: endDay,
        month: FreNodeReference.create<Month>(getMonthFromString(endMonth), "Month"),
        year: endYear,
    });
    const dateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
    return dateOrRange;
}

export function createOneDayAvailability(day: string, month: string, year: string): Availability {
    const staffLevel = createStaffLevel("3", day, month, year);
    const availability = Availability.create({ baselineStaff: "4", staffLevels: [staffLevel] });
    return availability;
}

export function createAvailability(): Availability {
    let month = "January";
    const year = "2024";
    let staffLevels = [];
    staffLevels.push(createStaffLevel("3", "-27", month, year, "-25", month, year));
    staffLevels.push(createStaffLevel("2", "11", month, year));
    staffLevels.push(createStaffLevel("2", "19", month, year));
    const availability = Availability.create({ baselineStaff: "4", staffLevels: staffLevels });
    return availability;
}
