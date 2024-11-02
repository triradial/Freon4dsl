import { FreNodeReference, RtString } from "@freon4dsl/core";
import {
    Event,
    Availability,
    DateRange,
    Month,
    PatientHistory,
    PatientNotAvailable,
    PatientVisit,
    PatientVisitStatus,
    StaffLevel,
    StartRangeDate,
    StudyConfigurationModel,
    VisitDate,
} from "@freon4dsl/samples-study-configuration/dist/language/gen";
import { EditorState } from "@freon4dsl/webapp-lib";
import type { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";
import { getTimeline, getTimelineChartHtml } from "./app/PatientTimeline.js";

export function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case "active":
            return "green";
        case "complete":
            return "dark";
        case "suspended":
            return "pink";
        case "terminated":
            return "red";
        case "planning":
            return "indigo";
        default:
            return "default";
    }
}

export function getSVGIcon(iconName: string): string {
    let svg = "";
    switch (iconName) {
        case "add":
            svg =
                '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="plus" class="svg-inline--fa fa-plus w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"></path></svg>';
            break;
        case "delete":
            svg =
                '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" class="svg-inline--fa fa-xmark w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"></path></svg>';
            break;
        case "edit":
            svg =
                '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="pencil" class="svg-inline--fa fa-pencil w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32 0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path></svg>';
            break;
        default:
            svg = "";
    }
    return svg;
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

function createOneDayAvailability(day: string, month: string, year: string): Availability {
    const staffLevel = createStaffLevel("3", day, month, year);
    const availability = Availability.create({ baselineStaff: "4", staffLevels: [staffLevel] });
    return availability;
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
    let endMonthString = "";

    if (endMonth !== undefined) {
        endMonthString = endMonth;
    } else {
        endMonthString = startMonth;
    }
    if (!endDay) {
        endDay = startDay;
        endMonthString = startMonth;
        endYear = startYear;
    }
    const endDateInRange = StartRangeDate.create({
        day: endDay,
        month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
        year: endYear,
    });
    const staffDateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
    const staffLevel = StaffLevel.create({ staffAvailable: staffAvailable, dateOrRange: staffDateOrRange });
    return staffLevel;
}

function createAvailability(): Availability {
    let month = "January";
    const year = "2024";
    let staffLevels = [];
    staffLevels.push(createStaffLevel("3", "-27", month, year, "-25", month, year));
    staffLevels.push(createStaffLevel("2", "11", month, year));
    staffLevels.push(createStaffLevel("2", "19", month, year));
    const availability = Availability.create({ baselineStaff: "4", staffLevels: staffLevels });
    return availability;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function createACompletedPatientVisit(visitName: string, day: string, month: string, year: string, visitInstanceNumber: number): PatientVisit {
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

function createPatientNotAvailableDateRange(startDay: string, startMonth: string, startYear: string, endDay?: string, endMonth?: string, endYear?: string) {
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
    let endMonthString = "";

    if (endMonth !== undefined) {
        endMonthString = endMonth;
    } else {
        endMonthString = startMonth;
    }

    const endDateInRange = StartRangeDate.create({
        day: endDay,
        month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
        year: endYear,
    });
    const dateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
    return dateOrRange;
}

function createCompletedPatientVisits(numberToCreate: number, timeline: Timeline, shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = []): PatientVisit[] {
    let completedPatientVisits: PatientVisit[] = [];
    let i = 0;
    let stopAddingVisits = false;
    const referenceDate = timeline.getReferenceDate();
    timeline.printTimelineOfScheduledEventInstances();
    timeline
        .getScheduleEventInstancesOrderByDay()
        .forEach((scheduledEventInstance: { getStartDay: () => any; getName: () => string; getInstanceNumber: () => string | number }) => {
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
                    scheduledEventInstance.getInstanceNumber() as number,
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

type ShiftsFromScheduledVisit = { name: string; instance: number; shift: number; numberFound: number; foundThisInstance: boolean };

export async function getChartWithPatientHistory(id: string) {
    console.log("getChartWithPatientHistory");
    const studyConfigurationModel = EditorState.getInstance().modelStore.model as StudyConfigurationModel;
    const studyConfigurationUnit = studyConfigurationModel.configuration;
    // createAvailability();

    // Adding after simulation because the timeline is used to find the visits to complete.
    let timeline = getTimeline(studyConfigurationUnit) as Timeline;
    let shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [
        { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
        { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
        { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
    ];
    let completedPatientVisits: PatientVisit[] = createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
    let dateRangeList: DateRange[] = [];
    let dateRange = createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024");
    dateRangeList.push(dateRange);
    dateRange = createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024");
    dateRangeList.push(dateRange);
    let patientNotAvailable = PatientNotAvailable.create({ dates: dateRangeList });
    let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });
    timeline.setPatientHistory(patientHistory);
    timeline.addPatientEvents(patientHistory);

    const rtObject = getTimelineChartHtml(timeline) as RtString;
    return rtObject.asString();
}
