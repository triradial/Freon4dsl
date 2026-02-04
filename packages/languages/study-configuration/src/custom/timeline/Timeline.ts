import { FreNodeReference, RtBoolean, RtObject, RtString } from "@freon4dsl/core";
import { Availability, DateConcept, Event, Month, PatientHistory } from "../../freon/language/index.js";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate.js";
import { PatientEventInstance, PatientUnAvailableEventInstance, PatientVisitEventInstance } from "./PatientEventInstance.js";
import { PeriodEventInstance } from "./PeriodEventInstance.js";
import { ScheduledEvent } from "./ScheduledEvent.js";
import { ScheduledEventInstance } from "./ScheduledEventInstance.js";
import { StaffAvailabilityEventInstance } from "./StaffAvailabilityEventInstance.js";
import { TimelineEventInstance, TimelineInstanceState } from "./TimelineEventInstance.js";
import TimelineLogger from "./TimelineLogger.js";

/*
 * A Timeline records the events and the days they occur on.
 */
export class Timeline extends RtObject {
    // Flags to control the types of logging that will be done
    scheduledLogging = false;
    periodLogging = false;

    // timeline options
    organizeByStudyDay = true; // Organize the timeline by study day vs a specific reference date
    referenceDate = new Date(2024, 0, 1); // The reference date for the timeline. Used when organizeByStudyDay is true
    completedEventLogging = false;

    // timeline data
    days: TimelineDay[] = [];
    currentDay: number = 0;
    studyStartDayNumber: number = 0;
    availability: Availability;
    patientHistory: PatientHistory;

    constructor() {
        super();
    }

    public setStudyStartDayNumber(studyStartDayNumber: number) {
        this.studyStartDayNumber = studyStartDayNumber;
    }

    getStudyStartDayNumber() {
        return this.studyStartDayNumber;
    }
    setReferenceDate(referenceDate: Date) {
        this.referenceDate = referenceDate;
    }

    getReferenceDate(): Date {
        return this.referenceDate;
    }

    organizedByStudyDay() {
        this.organizeByStudyDay = true;
    }

    organizedByReferenceDate() {
        this.organizeByStudyDay = false;
    }

    getReferenceDateAsDateString(): string {
        const referenceDate = this.getReferenceDate();
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const day = referenceDate.getDate();

        return `new Date(${year}, ${month}, ${day})`;
    }

    setPatientHistory(patientHistory: PatientHistory) {
        this.patientHistory = patientHistory;
    }

    getPatientHistory() {
        return this.patientHistory;
    }

    getEndOfTimeline(): string {
        const referenceDate = this.getReferenceDate();
        // Create a new date to avoid mutating the reference date
        const endDate = new Date(referenceDate);
        // Add the max day on timeline (plus 1 to include that day)
        endDate.setDate(endDate.getDate() + this.getMaxDayOnTimeline() + 1);
        
        const year = endDate.getFullYear();
        const month = endDate.getMonth();
        const day = endDate.getDate();

        return `new Date(${year}, ${month}, ${day})`;
    }

    equals(other: RtObject): RtBoolean {
        throw new Error("Timelines are not comparable. Method not implemented.");
    }

    newScheduledEventInstance(scheduledEvent: ScheduledEvent, dayEventWillOccurOn: number) {
        return new ScheduledEventInstance(scheduledEvent, dayEventWillOccurOn);
    }

    getScheduledEventInstancessForDay(day: number): ScheduledEventInstance[] {
        const dayObj = this.days.find((d) => d.day === day);
        if (!dayObj) {
            return [];
        }
        return dayObj.events.filter((event) => event instanceof ScheduledEventInstance).map((event) => event as ScheduledEventInstance);
    }

    getScheduledEventInstance(name: string, instanceNumber: number): ScheduledEventInstance {
        var result: ScheduledEventInstance;
        result = this.days
            .flatMap((day) => day.events.filter((event) => event instanceof ScheduledEventInstance))
            .find((event: ScheduledEventInstance) => {
                return event.getName() === name && event.getInstanceNumber() === instanceNumber;
            }) as ScheduledEventInstance;
        return result;
    }

    getDays() {
        return this.days;
    }

    moveToNextDay() {
        this.currentDay++;
    }

    setCurrentDay(day: number) {
        if (isNaN(day)) {
            throw new Error("Day cannot be NaN");
        }
        this.currentDay = day;
    }

    // wrapper so Scheduler can set event statuses
    setCompleted(event) {
        event.completed();
    }

    setScheduled(eventInstance) {
        eventInstance.scheduled();
    }

    // Only add if the event is not already on the timeline
    addEvent(event: TimelineEventInstance) {
        let day = this.days.find((d) => d != null && d.day === event.startDay) as TimelineDay | undefined;
        if (!day) {
            day = new TimelineDay(event.startDay);
            this.days.push(day);
        }

        if (!day.events) day.events = [];
        const eventExists = day.events.find((e) => e === event);
        if (!eventExists) {
            day.events.push(event);
        }
    }

    getEvents(day: number) {
        const timelineDay = this.days.find((d) => d != null && d.day === day);
        return timelineDay ? (timelineDay.events ?? []) : [];
    }

    getLastScheduledEventInstanceForThisEventsName(eventToMatch: Event): ScheduledEventInstance {
        if (!eventToMatch) return null;
        const rawMatchName = (eventToMatch as { name?: string; referred?: { name?: string } })?.name ?? (eventToMatch as { referred?: { name?: string } })?.referred?.name;
        if (rawMatchName == null) return null;
        
        // Trim whitespace from the name to handle data inconsistencies
        const matchName = rawMatchName.trim();
        
        const allInstances = this.getAllScheduledEventInstancesWithDays();
        
        // Filter the events to match the given event name (with trimming for consistency)
        let eventInstances = allInstances
            .filter(({ event }) => matchName === event.getName()?.trim());

        // Sort the events by the day value
        eventInstances.sort((a, b) => (a?.day ?? 0) - (b?.day ?? 0));

        // Get the last instance from the sorted list
        const lastInstance = eventInstances.length > 0 ? (eventInstances[eventInstances.length - 1].event as ScheduledEventInstance) : null;

        if (!lastInstance) {
            // console.log("No instance of: '" + eventToMatch.name + "' on timeline");
            return null;
        } else {
            return lastInstance;
        }
    }

    printTimeline() {
        TimelineLogger.log("Timeline:");
        const validDays = (this.days ?? []).filter((d): d is TimelineDay => d != null);
        validDays.forEach((day) => {
            TimelineLogger.log("Day: " + day.day);
            (day.events ?? []).forEach((event) => {
                TimelineLogger.log("Event: " + event.getName() + " day: " + event.startDay + " status: " + event.getState());
            });
        });
    }

    printTimelineOfScheduledEventInstances() {
        let output = "Scheduled Event Instances on Timeline:\n";
        const validDays = (this.days ?? []).filter((d): d is TimelineDay => d != null);
        validDays.forEach((day) => {
            (day.events ?? []).forEach((event) => {
                if (event instanceof ScheduledEventInstance) {
                    let scheduledEventInstance = event as ScheduledEventInstance;
                    output +=
                        "Event: " +
                        scheduledEventInstance.getName() +
                        " instance: " +
                        scheduledEventInstance.getInstanceNumber() +
                        " day: " +
                        scheduledEventInstance.startDay +
                        " status: " +
                        scheduledEventInstance.getState() +
                        "\n";
                }
            });
        });
        TimelineLogger.log(output);
    }

    // Return true if the event has already been completed on a previous day at least once
    hasCompletedInstanceOf(scheduledEvent: ScheduledEvent) {
        const validDays = (this.days ?? []).filter((d): d is TimelineDay => d != null);
        for (const day of validDays) {
            for (const event of day.events ?? []) {
                if (event instanceof ScheduledEventInstance) {
                    let eventInstance = event as ScheduledEventInstance;
                    // console.log("hasCompletedInstanceOf checking if completed instance of: " + scheduledEvent.getName() + " matches event: " + eventInstance.getName() + " in state: " + eventInstance.state + " one day: " + day.day);
                    if (eventInstance.getScheduledEvent().getName() === scheduledEvent.getName() && event.state === TimelineInstanceState.Completed) {
                        TimelineLogger.log("There is a completed instance of: '" + scheduledEvent.getName() + "'" + " on day: " + day.day);
                        return true; // Exit nested loops early if we find a completed instance
                    }
                }
            }
        }
        // console.log("There is not already a completed instance of: '" + scheduledEvent.getName() + "'");
        return false;
    }

    numberCompletedInstancesOf(scheduledEvent: ScheduledEvent) {
        let count = 0;
        const validDays = (this.days ?? []).filter((d): d is TimelineDay => d != null);
        for (const day of validDays) {
            for (const event of day.events ?? []) {
                if (
                    event instanceof ScheduledEventInstance &&
                    event.getScheduledEvent().getName() === scheduledEvent.getName() &&
                    event.state === TimelineInstanceState.Completed
                ) {
                    count++;
                }
            }
        }
        if (this.completedEventLogging) TimelineLogger.log("numberCompletedInstancesOf scheduledEvent: " + scheduledEvent.getName() + " is: " + count);
        return count;
    }

    noCompletedInstanceOf(scheduledEvent: ScheduledEvent) {
        return !this.hasCompletedInstanceOf(scheduledEvent);
    }

    /**
     * Helper method to flatten all ScheduledEventInstances across all days
     * Returns an array of objects containing the event and its day number
     */
    private getAllScheduledEventInstancesWithDays(): Array<{ event: ScheduledEventInstance; day: number }> {
        const validDays = this.days.filter((d): d is TimelineDay => d != null && typeof (d as TimelineDay).day === "number");
        return validDays.flatMap((day) =>
            (day.events ?? [])
                .filter((event) => event instanceof ScheduledEventInstance)
                .map((event) => ({ event: event as ScheduledEventInstance, day: day.day }))
        );
    }

    getLastCompletedScheduledEventInstance(): ScheduledEventInstance | null {
        // Filter for completed ScheduledEventInstances
        let completedEvents = this.getAllScheduledEventInstancesWithDays()
            .filter(({ event }) => event.state === TimelineInstanceState.Completed);

        if (completedEvents.length === 0) {
            return null;
        }

        completedEvents.sort((a, b) => (b?.day ?? 0) - (a?.day ?? 0));

        return completedEvents[0].event;
    }

    getPeriods() {
        const validDays = this.days.filter((d): d is TimelineDay => d != null && typeof (d as TimelineDay).day === "number");
        return validDays.flatMap((day) => (day.events ?? []).filter((event) => event instanceof PeriodEventInstance));
    }

    getScheduleEventInstancesOrderByDay(): ScheduledEventInstance[] {
        const result = this.getAllScheduledEventInstancesWithDays()
            .sort((a, b) => (a?.day ?? 0) - (b?.day ?? 0))
            .map(({ event }) => event);
        // console.log("Ordered events: " + result.map((event) => event.getName()));
        return result;
    }

    getPeriodInstanceFor(scheduledPeriodName: string) {
        return this.getPeriods().find((period) => (period as PeriodEventInstance).scheduledPeriod.getName() === scheduledPeriodName) as PeriodEventInstance;
    }

    // Return the first period that is active. There should be only one.
    getActivePeriod(): PeriodEventInstance {
        let firstActivePeriodOnTimeline = this.getPeriods().find(
            (period) => (period as PeriodEventInstance).getState() === TimelineInstanceState.Active,
        ) as PeriodEventInstance;
        if (this.periodLogging) {
            if (firstActivePeriodOnTimeline) {
                TimelineLogger.log("The first Active Period On the timeline is: " + firstActivePeriodOnTimeline.getName());
            } else {
                TimelineLogger.log("No active period found on the timeline");
            }
        }
        return firstActivePeriodOnTimeline;
    }

    // getUniqueEventInstanceNames() : string[] {
    //   let eventNames = this.days.flatMap(day => day.events.filter(event => event instanceof EventInstance).map(event => event.getName()));
    //   return [...new Set(eventNames)];
    // }

    getUniqueEventInstanceNames(): string[] {
        const validDays = this.days.filter((d): d is TimelineDay => d != null && typeof (d as TimelineDay).day === "number");
        let sortedDays = [...validDays].sort((a, b) => a.day - b.day);
        let eventNames = sortedDays.flatMap((day) => (day.events ?? []).filter((event) => event instanceof ScheduledEventInstance).map((event) => event.getName()));
        let uniqueEventNames = [];
        let seen = new Set();

        for (let name of eventNames) {
            if (!seen.has(name)) {
                seen.add(name);
                uniqueEventNames.push(name);
            }
        }

        return uniqueEventNames;
    }

    getUniquePatientIdentifiers(): string[] {
        const validDays = this.days.filter((d): d is TimelineDay => d != null && typeof (d as TimelineDay).day === "number");
        let sortedDays = [...validDays].sort((a, b) => a.day - b.day);
        let patientIdentifiers = sortedDays.flatMap((day) => 
            (day.events ?? [])
                .filter((event) => event instanceof PatientEventInstance)
                .map((event) => (event as PatientEventInstance).getPatientIdentifier())
                .filter((id): id is string => id !== undefined && id !== null)
        );
        return [...new Set(patientIdentifiers)];
    }

    getOffsetOfFirstEventInstance() {
        // Handle empty days array - return 0 offset when no events exist
        const validDays = this.days.filter((d): d is TimelineDay => d != null && typeof (d as TimelineDay).day === "number");
        if (validDays.length === 0) {
            console.warn('[Timeline] getOffsetOfFirstEventInstance called with empty days array - no scheduled events exist');
            return 0;
        }
        const lowestDayItem = validDays.reduce((minItem, currentItem) => {
            return currentItem.day < minItem.day ? currentItem : minItem;
        }, this.days[0]);
        if (lowestDayItem.day >= 0) {
            return 0;
        }
        return Math.abs(lowestDayItem.day);
    }

    getOffsetOfLastEventInstance() {
        // Handle empty days array - return 0 when no events exist
        const validDays = this.days.filter((d): d is TimelineDay => d != null && typeof (d as TimelineDay).day === "number");
        if (validDays.length === 0) {
            console.warn('[Timeline] getOffsetOfLastEventInstance called with empty days array - no scheduled events exist');
            return 0;
        }
        const highestDayItem = validDays.reduce((maxItem, currentItem) => {
            return currentItem.day > maxItem.day ? currentItem : maxItem;
        }, this.days[0]);
        return highestDayItem.day;
    }

    getMaxDayOnTimeline() {
        const dayOffsetOfFirstEventInstance = this.getOffsetOfFirstEventInstance();
        return this.currentDay + dayOffsetOfFirstEventInstance;
    }

    getMonthName(monthNumber: number): string {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return monthNames[monthNumber];
    }

    monthMap: { [key: string]: number } = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
    };

    dateStringsToDate(day: string, month: string, year: string) {
        const monthNumber = this.monthMap[month];
        return new Date(parseInt(year), monthNumber, parseInt(day));
    }

    // Add the patient visits that happened on specific dates to the timeline
    addPatientEvents(patientHistory: PatientHistory, patientIdentifier?: string) {
        this.setPatientHistory(patientHistory!);

        const safeMonthName = (m: { name?: string; referred?: { name?: string } } | null | undefined) =>
            m?.name ?? m?.referred?.name ?? null;

        patientHistory.patientVisits.forEach((patientVisit) => {
            const avd = patientVisit.actualVisitDate;
            const monthName = safeMonthName(avd?.month as { name?: string; referred?: { name?: string } });
            if (!avd?.day || !monthName || !avd?.year) return;
            const visit = patientVisit.visit?.referred ?? patientVisit.visit;
            const visitName = (visit as { name?: string })?.name ?? (patientVisit.visit as { name?: string })?.name;
            if (!visitName) return;
            const actualVisitDateAsDate = this.dateStringsToDate(avd.day, monthName, avd.year);
            const dayOnTimeline = this.getDayOnTimeline(actualVisitDateAsDate);
            this.addEvent(new PatientVisitEventInstance(visitName, patientVisit.visitInstanceNumber, dayOnTimeline, undefined, patientIdentifier || patientHistory.patient_id, patientVisit.status));
        });
        patientHistory.patientNotAvailableDates.forEach((patientNotAvailableDate) => {
            const startDate = patientNotAvailableDate.startDate;
            const startMonthName = safeMonthName(startDate?.month as { name?: string; referred?: { name?: string } });
            if (!startDate?.day || !startMonthName || !startDate?.year) return;
            const startDateAsDate = this.dateStringsToDate(startDate.day, startMonthName, startDate.year);
            let endDateAsDate: Date;
            const endDate = patientNotAvailableDate.endDate;
            if (endDate == null) {
                endDateAsDate = new Date(startDateAsDate);
            } else {
                const endMonthName = safeMonthName(endDate?.month as { name?: string; referred?: { name?: string } });
                if (!endDate?.day || !endMonthName || !endDate?.year) {
                    endDateAsDate = new Date(startDateAsDate);
                } else {
                    endDateAsDate = this.dateStringsToDate(endDate.day, endMonthName, endDate.year);
                }
            }
            this.addEvent(
                new PatientUnAvailableEventInstance("Patient Not Available", this.getDayOnTimeline(startDateAsDate), this.getDayOnTimeline(endDateAsDate), patientIdentifier || patientHistory.patient_id),
            );
        });
    }

    getDayOnTimeline(date: Date): number {
        const time1 = this.getReferenceDate().getTime(); // Get the time in milliseconds
        const time2 = date.getTime();
        const diffInMilliseconds = time2 - time1;
        const dayOnTimeline = Math.round(diffInMilliseconds / (1000 * 60 * 60 * 24)); // Convert the milliseconds from the reference date to days
        return dayOnTimeline;
    }
    // getDayOnTimeline(date: Date): number {
    //     var datePlusOneDay = new Date(date); // Need to add one day to the date to get the correct day on the timeline
    //     datePlusOneDay.setDate(datePlusOneDay.getDate() + 1);
    //     const time1 = this.getReferenceDate().getTime(); // Get the time in milliseconds
    //     const time2 = datePlusOneDay.getTime();
    //     const diffInMilliseconds = time2 - time1;
    //     const dayOnTimeline = Math.round(diffInMilliseconds / (1000 * 60 * 60 * 24)); // Convert the milliseconds from the reference date to days
    //     return dayOnTimeline;
    // }

    addStaffAvailability(availability: Availability) {
        TimelineLogger.log("Adding Staff Availability to Timeline");
        this.availability = availability;

        const safeMonthName = (m: { name?: string; referred?: { name?: string } } | null | undefined) =>
            m?.name ?? m?.referred?.name ?? null;

        availability.staffLevels.forEach((staffLevel) => {
            const start = staffLevel.dateOrRange?.startDate;
            const startMonthName = start ? safeMonthName(start.month as { name?: string; referred?: { name?: string } }) : null;
            if (!start?.day || !startMonthName || !start?.year) return;
            const startDateAsDate = this.dateStringsToDate(start.day, startMonthName, start.year);
            let endDateAsDate: Date;
            const end = staffLevel.dateOrRange?.endDate;
            if (end == null) {
                endDateAsDate = new Date(startDateAsDate);
            } else {
                const endMonthName = safeMonthName(end.month as { name?: string; referred?: { name?: string } });
                if (!end?.day || !endMonthName || !end?.year) {
                    endDateAsDate = new Date(startDateAsDate);
                } else {
                    endDateAsDate = this.dateStringsToDate(end.day, endMonthName, end.year);
                }
            }
            this.addEvent(
                new StaffAvailabilityEventInstance(
                    Number(staffLevel.staffAvailable),
                    this.getDayOnTimeline(startDateAsDate),
                    this.getDayOnTimeline(endDateAsDate),
                ),
            );
        });
    }

    getBaselineStaff(): number {
        return Number(this.availability.baselineStaff);
    }

    anyPatientEventInstances(): boolean {
        return this.days.some((day) => day.events.some((event) => event instanceof PatientEventInstance));
    }

    anyStaffAvailabilityEventInstances(): boolean {
        return this.days.some((day) => day.events.some((event) => event instanceof StaffAvailabilityEventInstance));
    }

    getOptions(timeline: Timeline, isMultiPatient: boolean = false): string {
        // result differs by whether to show actual dates or week numbers for the major and minor labels.
        // If showing a study level chart then OrganizeByStudyDay should be true and major and minor are not actual dates
        // If showing for a specific patient or a specific start day then major and minor are actual dates
        let result = undefined;
        
        // Common options for multi-patient compact view - enable stacking for better visualization
        const multiPatientOptions = isMultiPatient ? `
                stack: true,
                stackSubgroups: true,` : '';
        
        if (this.organizeByStudyDay) {
            result = `  var options = {
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
                start: ${timeline.getReferenceDateAsDateString()},
                end: ${timeline.getEndOfTimeline()},
                min: ${timeline.getReferenceDateAsDateString()},
                max: ${timeline.getEndOfTimeline()},
                zoomFriction:30,
                margin: {
                    item: {
                        horizontal: 0,
                    },
                },${multiPatientOptions}
            };`;
        } else {
            result = `          var options = {
                showCurrentTime: false,
                format: {
                    minorLabels: {
                        millisecond:'',
                        second:     '',
                        minute:     '',
                        hour:       '',
                        weekday:    '',
                        day:        'D',
                        week:       '',
                        month:      'MM',
                        year:       'YYYY'
                    },
                    majorLabels: {
                        millisecond:'HH:mm:ss',
                        second:     'D MMMM HH:mm',
                        minute:     'ddd D MMMM',
                        hour:       'ddd D MMMM',
                        weekday:    'MMMM YYYY',
                        day:        'MMMM YYYY',
                        week:       'MMMM YYYY',
                        month:      'YYYY',
                        year:       ''
                    }
                },
                timeAxis: {scale: 'day', step: 1},
                showMajorLabels: true,
                orientation: 'both',
                start: ${timeline.getReferenceDateAsDateString()},
                end: ${timeline.getEndOfTimeline()},
                min: ${timeline.getReferenceDateAsDateString()},
                max: ${timeline.getEndOfTimeline()},
                margin: {
                    item: {
                        horizontal: 0,
                    },
                },${multiPatientOptions}
            };
            `;
        }
        return result;
    }

    public getTimelineTable(): RtString {
        const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(this);
        const html = `<div class="limited-width-container">${tableHTML}</div>`;
        return new RtString(html);
    }

    // public getTimelineChart(): RtString {
    //     const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(this);
    //     const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(this);
    //     const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
    //     const html = `<div class="limited-width-container">${chartHTML}</div>`;
    //     return new RtString(html);
    // }

    
    // The DateConcept is updated inline hence no return value.
    public static fillDateConceptFromAsString(dateConcept: DateConcept) {
        TimelineLogger.log(
          "fillDateConceptFromAsString: " + dateConcept.dateAsString
        );
        // Add "T00:00:00" to ensure the date is interpreted at midnight local time
        const actualDate = new Date(dateConcept.dateAsString + "T00:00:00");
        TimelineLogger.log("actualDate: " + actualDate);
        dateConcept.day = actualDate.getDate().toString();
        dateConcept.month = getMonthFromString(actualDate.toLocaleString('en-US', { month: 'long' }));
        dateConcept.year = actualDate.getFullYear().toString();
    }
}

/*
 * A Day represents a day on the timeline and the events that occurred on that day.
 */
export class TimelineDay {
    day: number;
    events: TimelineEventInstance[] = [];

    constructor(day: number) {
        this.day = day;
    }

    getEventInstances(): ScheduledEventInstance[] {
        let result = this.events.filter((event) => event instanceof ScheduledEventInstance) as ScheduledEventInstance[];
        return result;
    }

    getPeriodInstances() {
        return this.events.filter((event) => event instanceof PeriodEventInstance) as PeriodEventInstance[];
    }

    getPatientEventInstances() {
        return this.events.filter((event) => event instanceof PatientEventInstance) as PatientVisitEventInstance[];
    }

    getStaffAvailabilityEventInstances() {
        return this.events.filter((event) => event instanceof StaffAvailabilityEventInstance) as StaffAvailabilityEventInstance[];
    }
}

export function getMonthFromString(month: string): FreNodeReference<Month> {
    switch (month.toLowerCase()) {
        case "january":
            return FreNodeReference.create<Month>(Month.January, "Month");
        case "february":
            return FreNodeReference.create<Month>(Month.February, "Month");
        case "march":
            return FreNodeReference.create<Month>(Month.March, "Month");
        case "april":
            return FreNodeReference.create<Month>(Month.April, "Month");
        case "may":
            return FreNodeReference.create<Month>(Month.May, "Month");
        case "june":
            return FreNodeReference.create<Month>(Month.June, "Month");
        case "july":
            return FreNodeReference.create<Month>(Month.July, "Month");
        case "august":
            return FreNodeReference.create<Month>(Month.August, "Month");
        case "september":
            return FreNodeReference.create<Month>(Month.September, "Month");
        case "october":
            return FreNodeReference.create<Month>(Month.October, "Month");
        case "november":
            return FreNodeReference.create<Month>(Month.November, "Month");
        case "december":
            return FreNodeReference.create<Month>(Month.December, "Month");
        default:
            throw new Error(`Invalid month: ${month}`);
    }
}



