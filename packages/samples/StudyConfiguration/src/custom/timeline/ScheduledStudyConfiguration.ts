import { Timeline } from "./Timeline.js";
import { ScheduledEventInstance } from "./ScheduledEventInstance.js";
import { BinaryExpression, Day, EventStart, Period, StudyConfiguration, StudyStart } from "../../language/gen/index.js";
import { ScheduledEvent, ScheduledEventState } from "./ScheduledEvent.js";
import { ScheduledPeriod } from "./ScheduledPeriod.js";

// StudyConfigurationSchedule is a wrapper around a StudyConfiguration that manages access to instances of ScheduledPeriods and ScheduledEvents of those periods.
// These classes have the behavior needed for simulation and timelines that are not part of the DSL-based StudyConfiguration.

export class ScheduledStudyConfiguration {
    scheduledPeriods: ScheduledPeriod[] = [];
    studyConfiguration: StudyConfiguration;

    //TODO: change so the Scheduled Events are inside the scheduled periods
    constructor(studyConfiguration: StudyConfiguration) {
        this.studyConfiguration = studyConfiguration;
        this.scheduledPeriods = this.getConfiguredPeriods().map((configuredPeriod) => new ScheduledPeriod(configuredPeriod));
    }

    getAllEventsInSchedule() {
        return this.scheduledPeriods.map((scheduledPeriod) => scheduledPeriod.getAllScheduledEvents().flat()).flat();
    }

    allEventsCompleted() {
        this.displayAllEventsInSchedule();
        return this.getAllEventsInSchedule().find((e) => e.getState() !== ScheduledEventState.Completed) == undefined;
    }

    displayAllEventsInSchedule() {
        const events = this.getAllEventsInSchedule()
            .map((e) => `${e.getName()} ${ScheduledEventState[e.getState()]}`)
            .join("\n");
        console.log("All Events In Schedule\n" + events);
    }

    getConfiguredPeriods() {
        return this.studyConfiguration.periods;
    }

    getFirstScheduledPeriod() {
        //TODO: change to search for the period with a visit on day-0 or StartDay.
        return this.scheduledPeriods[0];
    }

    getAllEventsInAScheduledPeriod(scheduledPeriod: ScheduledPeriod) {
        return this.getAllEventsInAPeriod(scheduledPeriod.configuredPeriod);
    }

    getAllEventsInAPeriod(period: Period) {
        let scheduledPeriod = this.scheduledPeriods.find((scheduledPeriod) => scheduledPeriod.configuredPeriod === period);
        if (scheduledPeriod) {
            return scheduledPeriod.getAllScheduledEvents();
        } else {
            return [];
        }
    }

    getScheduledPeriod(period: Period) {
        let scheduledPeriod = this.scheduledPeriods.find((scheduledPeriod) => scheduledPeriod.configuredPeriod === period);
        if (!scheduledPeriod) {
            console.log("no scheduledPeriod found", scheduledPeriod);
        }
        return scheduledPeriod;
    }

    getFirstStudyStartEvent(): ScheduledEvent | undefined {
        let eventsOnADay = this.getEventsScheduledOnASpecificDay();
        let firstEventOnDay1 = eventsOnADay.find((scheduledEvent) => {
            if (scheduledEvent.configuredEvent.schedule.eventStart instanceof Day) {
                return ((scheduledEvent.configuredEvent.schedule.eventStart as Day).startDay as number) === 1;
            } else {
                return false;
            }
        });
        console.log("getFirstStudyStartEvent firstEventOnDay1: " + firstEventOnDay1.getName());
        return firstEventOnDay1;
    }

    getEventsScheduledOnASpecificDay(): ScheduledEvent[] {
        //TODO: sort in order of day so scheduling happens in order.
        let eventsOnASpecificDayInAnyPeriod = this.getAllEventsInSchedule().filter((scheduledEvent) => scheduledEvent.isScheduledOnASpecificDay());
        console.log("There are: " + eventsOnASpecificDayInAnyPeriod.length + " events on a Specific Day across all the periods");
        return eventsOnASpecificDayInAnyPeriod;
    }

    // anyEventsToSchedule(timeline): boolean {
    //   let firstNoScheduledEvent = this.getAllEventsInSchedule().find(scheduledEvent => scheduledEvent.notYetScheduled(timeline));
    //   return firstNoScheduledEvent === undefined;
    // }

    getEventsReadyToBeScheduled(completedEvent: ScheduledEventInstance, time: number, timeline: Timeline): ScheduledEventInstance[] {
        console.log("Searching schedule for all events ready to be scheduled");
        let readyEvents = this.getAllEventsInSchedule()
            .map((scheduledEvent) => scheduledEvent.getInstanceIfEventIsReadyToSchedule(completedEvent, time, timeline))
            .filter((instance) => instance !== null) as ScheduledEventInstance[];
        console.log("There are: " + readyEvents.length + " events ready to be scheduled");
        return readyEvents;
    }
}
