// import { FreNodeReference, RtString } from "@freon4dsl/core";
// import {
//     Event,
//     Availability,
//     DateRange,
//     Month,
//     PatientHistory,
//     PatientNotAvailable,
//     PatientVisit,
//     PatientVisitStatus,
//     StaffLevel,
//     StartRangeDate,
//     StudyConfigurationModel,
//     VisitDate,
// } from "@freon4dsl/study-configuration";
// import { ModelManager } from "./dsl/model-manager.js";
// import type { Timeline } from "@freon4dsl/study-configuration";
// import { getTimeline, getTimelineChartHtml } from "./app/patient-timeline.js";
// import type { TimelineEventInstance } from "@freon4dsl/study-configuration";
// import type { ScheduledEventInstance } from "@freon4dsl/study-configuration";

export function getStatusColor(status: string | null | undefined): string {
    if (!status) {
        return "default";
    }
    switch (status.toLowerCase()) {
        case "active":
            return "blue";
        case "complete":
            return "green";
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
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
            break;
        case "delete":
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
            break;
        case "edit":
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
            break;
        default:
            svg = "";
    }
    return svg;
}

// function getMonthFromString(month: string): Month {
//     switch (month.toLowerCase()) {
//         case "january":
//             return Month.January;
//         case "february":
//             return Month.February;
//         case "march":
//             return Month.March;
//         case "april":
//             return Month.April;
//         case "may":
//             return Month.May;
//         case "june":
//             return Month.June;
//         case "july":
//             return Month.July;
//         case "august":
//             return Month.August;
//         case "september":
//             return Month.September;
//         case "october":
//             return Month.October;
//         case "november":
//             return Month.November;
//         case "december":
//             return Month.December;
//         default:
//             throw new Error(`Invalid month: ${month}`);
//     }
// }

// function createOneDayAvailability(day: string, month: string, year: string): Availability {
//     const staffLevel = createStaffLevel("3", day, month, year);
//     const availability = Availability.create({ baselineStaff: "4", staffLevels: [staffLevel] });
//     return availability;
// }

// function createStaffLevel(
//     staffAvailable: string,
//     startDay: string,
//     startMonth: string,
//     startYear: string,
//     endDay?: string,
//     endMonth?: string,
//     endYear?: string,
// ) {
//     const startDateInRange = StartRangeDate.create({
//         day: startDay,
//         month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
//         year: startYear,
//     });
//     let endMonthString = "";

//     if (endMonth !== undefined) {
//         endMonthString = endMonth;
//     } else {
//         endMonthString = startMonth;
//     }
//     if (!endDay) {
//         endDay = startDay;
//         endMonthString = startMonth;
//         endYear = startYear;
//     }
//     const endDateInRange = StartRangeDate.create({
//         day: endDay,
//         month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
//         year: endYear,
//     });
//     const staffDateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
//     const staffLevel = StaffLevel.create({ staffAvailable: staffAvailable, dateOrRange: staffDateOrRange });
//     return staffLevel;
// }

// function createAvailability(): Availability {
//     let month = "January";
//     const year = "2024";
//     let staffLevels = [];
//     staffLevels.push(createStaffLevel("3", "-27", month, year, "-25", month, year));
//     staffLevels.push(createStaffLevel("2", "11", month, year));
//     staffLevels.push(createStaffLevel("2", "19", month, year));
//     const availability = Availability.create({ baselineStaff: "4", staffLevels: staffLevels });
//     return availability;
// }

// function addDays(date: Date, days: number): Date {
//     const result = new Date(date);
//     result.setDate(result.getDate() + days);
//     return result;
// }

// function createACompletedPatientVisit(visitName: string, day: string, month: string, year: string, visitInstanceNumber: number): PatientVisit {
//     // console.log("createACompletedPatientVisit visitName: " + visitName + " day: " + day + " month: " + month + " year: " + year);
//     const referencedEvent = FreNodeReference.create<Event>(visitName, "Event");
//     const visitDate = VisitDate.create({ day: day, month: FreNodeReference.create<Month>(getMonthFromString(month), "Month"), year: year });
//     const completedVisitStatus = FreNodeReference.create<PatientVisitStatus>(PatientVisitStatus.completed, "completed");
//     let patientVisit = PatientVisit.create({
//         visit: referencedEvent,
//         actualVisitDate: visitDate,
//         status: completedVisitStatus,
//         visitInstanceNumber: visitInstanceNumber,
//     });
//     return patientVisit;
// }

// function createPatientNotAvailableDateRange(startDay: string, startMonth: string, startYear: string, endDay?: string, endMonth?: string, endYear?: string) {
//     const startDateInRange = StartRangeDate.create({
//         day: startDay,
//         month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
//         year: startYear,
//     });
//     if (!endDay) {
//         endDay = startDay;
//         endMonth = startMonth;
//         endYear = startYear;
//     }
//     let endMonthString = "";

//     if (endMonth !== undefined) {
//         endMonthString = endMonth;
//     } else {
//         endMonthString = startMonth;
//     }

//     const endDateInRange = StartRangeDate.create({
//         day: endDay,
//         month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
//         year: endYear,
//     });
//     const dateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
//     return dateOrRange;
// }

// function createCompletedPatientVisits(numberToCreate: number, timeline: Timeline, shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = []): PatientVisit[] {
//     let completedPatientVisits: PatientVisit[] = [];
//     let i = 0;
//     let stopAddingVisits = false;
//     const referenceDate = timeline.getReferenceDate();
//     timeline.printTimelineOfScheduledEventInstances();
//     timeline.getScheduleEventInstancesOrderByDay().forEach((scheduledEventInstance: ScheduledEventInstance) => {
//         if (i++ < numberToCreate) {
//             let dateOfVisit: Date = new Date();
//             const startDay = scheduledEventInstance.getStartDay();
//             let foundAMatch = false;
//             // There can be multiple shifts for the same ScheduledEventInstance (a visit), each with a different instance number to shift. Need to search to find the shift for the instance number, if any.
//             let shiftsForVisitInstance = shiftsFromScheduledVisit.filter((record) => record.name === scheduledEventInstance.getName());
//             if (shiftsForVisitInstance.length > 0) {
//                 shiftsForVisitInstance.forEach((shiftFromScheduledVisit) => {
//                     shiftFromScheduledVisit.numberFound++; // This is the hack where the number of times a visit is matched is tracked for each shift of the same visit rather than just one counter.
//                     if (shiftFromScheduledVisit.numberFound === shiftFromScheduledVisit.instance && shiftFromScheduledVisit.foundThisInstance === false) {
//                         // if this matches then this is the instance to shift
//                         dateOfVisit = addDays(referenceDate, startDay + shiftFromScheduledVisit.shift); // Shift the visit
//                         shiftFromScheduledVisit.foundThisInstance = true; // Remember that this shift has been done
//                         foundAMatch = true; // Done looking for shifts for this visit
//                     }
//                 });
//             }
//             if (!foundAMatch) {
//                 dateOfVisit = addDays(referenceDate, startDay); // No shifts for this Visit
//             }
//             const patientVisit = createACompletedPatientVisit(
//                 scheduledEventInstance.getName(),
//                 dateOfVisit.getDate().toString(),
//                 timeline.getMonthName(dateOfVisit.getMonth()),
//                 dateOfVisit.getFullYear().toString(),
//                 scheduledEventInstance.getInstanceNumber() as number,
//             );
//             console.log(
//                 "Adding completed visit: " +
//                     scheduledEventInstance.getName() +
//                     " instance: " +
//                     scheduledEventInstance.getInstanceNumber() +
//                     " on " +
//                     dateOfVisit.toDateString(),
//             );
//             completedPatientVisits.push(patientVisit);
//         }
//     });
//     return completedPatientVisits;
// }

// type ShiftsFromScheduledVisit = { name: string; instance: number; shift: number; numberFound: number; foundThisInstance: boolean };

// export async function getChartWithPatientHistory(id: string) {
//     console.log("getChartWithPatientHistory");
//     const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
//     const unit = model.configuration;
//     // createAvailability();

//     // Adding after simulation because the timeline is used to find the visits to complete.
//     let timeline = getTimeline(unit) as Timeline;
//     let shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [
//         { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
//         { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
//         { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
//     ];
//     let completedPatientVisits: PatientVisit[] = createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
//     let dateRangeList: DateRange[] = [];
//     let dateRange = createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024");
//     dateRangeList.push(dateRange);
//     dateRange = createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024");
//     dateRangeList.push(dateRange);
//     let patientNotAvailable = PatientNotAvailable.create({ dates: dateRangeList });
//     let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });
//     timeline.setPatientHistory(patientHistory);
//     timeline.addPatientEvents(patientHistory);

//     const rtObject = getTimelineChartHtml(timeline) as RtString;
//     return rtObject.asString();
// }
