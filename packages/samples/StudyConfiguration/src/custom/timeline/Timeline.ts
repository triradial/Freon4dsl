import { RtBoolean, RtObject } from "@freon4dsl/core";
import { ScheduledEvent, ScheduledEventState } from "./ScheduledEvent";
import { Event, PatientHistory, PatientVisit } from "../../language/gen/index";
import { TimelineEventInstance, TimelineInstanceState } from "./TimelineEventInstance";
import { PeriodEventInstance } from "./PeriodEventInstance";
import { ScheduledEventInstance } from "./ScheduledEventInstance";
import { PatientEventInstance } from "./PatientEventInstance";

/*
 * A Timeline records the events and the days they occur on.
 */
export class Timeline extends RtObject {
    // Flags to control the types of logging that will be done
    scheduledLogging = false;
    periodLogging = false;
    completedEventLogging = false;
    referenceDate = new Date(2024, 0, 1);
    days: TimelineDay[] = [];
    currentDay: number = 0;

    constructor() {
        super();
    }

    setReferenceDate(referenceDate: Date) {
        this.referenceDate = referenceDate;
    }

    getReferenceDate(): Date {
        return this.referenceDate;
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

    addEvent(event: TimelineEventInstance) {
        let day = this.days.find((d) => d.day === event.startDay);
        if (!day) {
            day = new TimelineDay(event.startDay);
            this.days.push(day);
        }
        day.events.push(event);
    }

    getEvents(day: number) {
        let timelineDay = this.days.find((d) => d.day === day);
        return timelineDay ? timelineDay.events : [];
    }

    getLastScheduledEventInstanceForThisEventsName(eventToMatch: Event): ScheduledEventInstance {
        // Flatten the list of events and filter for EventInstance
        let allEventInstances = this.days.flatMap((day) =>
            day.events.filter((event) => event instanceof ScheduledEventInstance).map((event) => ({ event, day: day.day })),
        );

        // Filter the events to match the given event name
        let eventInstances = allEventInstances.filter(({ event }) => eventToMatch.name === event.getName());

        // Sort the events by the day value
        eventInstances.sort((a, b) => a.day - b.day);

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
        console.log("Timeline:");
        this.days.forEach((day) => {
            console.log("Day: " + day.day);
            day.events.forEach((event) => {
                console.log("Event: " + event.getName() + " day: " + event.startDay + " status: " + event.getState());
            });
        });
    }

    // Return true if the event has already been completed on a previous day at least once
    hasCompletedInstanceOf(scheduledEvent: ScheduledEvent) {
        for (const day of this.days) {
            for (const event of day.events) {
                if (event instanceof ScheduledEventInstance) {
                    let eventInstance = event as ScheduledEventInstance;
                    // console.log("hasCompletedInstanceOf checking if completed instance of: " + scheduledEvent.getName() + " matches event: " + eventInstance.getName() + " in state: " + eventInstance.state + " one day: " + day.day);
                    if (eventInstance.getScheduledEvent().getName() === scheduledEvent.getName() && event.state === TimelineInstanceState.Completed) {
                        console.log("There is a completed instance of: '" + scheduledEvent.getName() + "'" + " on day: " + day.day);
                        return true; // Exit nested loops early if we find a completed instance
                    }
                }
            }
        }
        // console.log("There is not already a completed instance of: '" + scheduledEvent.getName() + "'");
        return false;
    }

    numberCompletedInstancesOf(scheduledEvent: ScheduledEvent) {
        // what happens when event is a period
        let count = 0;
        for (const day of this.days) {
            for (const event of day.events) {
                if (
                    event instanceof ScheduledEventInstance &&
                    event.getScheduledEvent().getName() === scheduledEvent.getName() &&
                    event.state === TimelineInstanceState.Completed
                ) {
                    count++;
                }
            }
        }
        if (this.completedEventLogging) console.log("numberCompletedInstancesOf scheduledEvent: " + scheduledEvent.getName() + " is: " + count);
        return count;
    }

    noCompletedInstanceOf(scheduledEvent: ScheduledEvent) {
        return !this.hasCompletedInstanceOf(scheduledEvent);
    }

    getPeriods() {
        return this.days.flatMap((day) => day.events.filter((event) => event instanceof PeriodEventInstance));
    }

    getScheduleEventInstancesOrderByDay() {
        const result = this.days
            .flatMap((day) => day.events.filter((event) => event instanceof ScheduledEventInstance).map((event) => ({ event, day: day.day })))
            .sort((a, b) => {
                // console.log(`Comparing: ${a.event.getName()} day: ${a.day} and ${b.event.getName()} day: ${b.day}`);
                return a.day - b.day;
            })
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
                console.log("The first Active Period On the timeline is: " + firstActivePeriodOnTimeline.getName());
            } else {
                console.log("No active period found on the timeline");
            }
        }
        return firstActivePeriodOnTimeline;
    }

    // getUniqueEventInstanceNames() : string[] {
    //   let eventNames = this.days.flatMap(day => day.events.filter(event => event instanceof EventInstance).map(event => event.getName()));
    //   return [...new Set(eventNames)];
    // }

    getUniqueEventInstanceNames(): string[] {
        let sortedDays = this.days.sort((a, b) => a.day - b.day);
        let eventNames = sortedDays.flatMap((day) => day.events.filter((event) => event instanceof ScheduledEventInstance).map((event) => event.getName()));
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

    getOffsetOfFirstEventInstance() {
        const lowestDayItem = this.days.reduce((minItem, currentItem) => {
            return currentItem.day < minItem.day ? currentItem : minItem;
        }, this.days[0]);
        if (lowestDayItem.day >= 0) {
            // Offset only comes into play when it is negative
            return 0;
        } else {
            return Math.abs(lowestDayItem.day);
        }
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
    addPatientVisits(patientVisits: PatientVisit[]) {
        patientVisits.forEach((patientVisit) => {
            const actualVisitDateAsDate = this.dateStringsToDate(
                patientVisit.actualVisitDate.day,
                patientVisit.actualVisitDate.month.name,
                patientVisit.actualVisitDate.year,
            );
            // Convert from the date given as when the visit happened to the day of the event on the timeline
            const time1 = this.getReferenceDate().getTime(); // Get the time in milliseconds
            const time2 = actualVisitDateAsDate.getTime();
            const diffInMilliseconds = time2 - time1;
            const dayOnTimeline = diffInMilliseconds / (1000 * 60 * 60 * 24); // Convert the milliseconds from the reference date to days
            this.addEvent(new PatientEventInstance(patientVisit.visit.name, dayOnTimeline));
        });
    }

    anyPatientEventInstances(): boolean {
        return this.days.some((day) => day.events.some((event) => event instanceof PatientEventInstance));
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
        return this.events.filter((event) => event instanceof PatientEventInstance) as PatientEventInstance[];
    }
}
