import { Day, Period, StudyConfiguration } from "../../language/gen/index.js";
import { ScheduledEvent, ScheduledEventState } from "./ScheduledEvent.js";
import { ScheduledEventInstance } from "./ScheduledEventInstance.js";
import { ScheduledPeriod } from "./ScheduledPeriod.js";
import { Timeline } from "./Timeline.js";
import TimelineLogger from "./TimelineLogger.js";

// StudyConfigurationSchedule is a wrapper around a StudyConfiguration that manages access to instances of ScheduledPeriods and ScheduledEvents of those periods.
// These classes have the behavior needed for simulation and timelines that are not part of the DSL-based StudyConfiguration.

export class ScheduledStudyConfiguration {
    scheduledPeriods: ScheduledPeriod[] = [];
    studyConfiguration: StudyConfiguration;

    //TODO: change so the Scheduled Events are inside the scheduled periods
    constructor(studyConfiguration: StudyConfiguration) {
        this.studyConfiguration = studyConfiguration;
        const periods = this.getConfiguredPeriods() ?? [];
        this.scheduledPeriods = periods
            .filter((p): p is NonNullable<typeof p> => p != null)
            .map((configuredPeriod) => new ScheduledPeriod(configuredPeriod));
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
        TimelineLogger.log("All Events In Schedule\n" + events);
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
            TimelineLogger.log("no scheduledPeriod found", scheduledPeriod);
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
        if (!firstEventOnDay1) {
            TimelineLogger.log("getFirstStudyStartEvent: no event on day 1 found");
            return undefined;
        }
        TimelineLogger.log("getFirstStudyStartEvent firstEventOnDay1: " + firstEventOnDay1.getName());
        return firstEventOnDay1;
    }

    getEventsScheduledOnASpecificDay(): ScheduledEvent[] {
        //TODO: sort in order of day so scheduling happens in order.
        const allEvents = this.getAllEventsInSchedule();
        console.log("[ScheduledStudyConfiguration] getEventsScheduledOnASpecificDay: checking", allEvents.length, "events");
        allEvents.forEach(e => {
            const eventStart = e.configuredEvent?.schedule?.eventStart;
            console.log("[ScheduledStudyConfiguration] Event:", e.getName(), 
                "eventStart type:", eventStart?.constructor?.name || eventStart?.freLanguageConcept?.() || typeof eventStart,
                "isScheduledOnASpecificDay:", e.isScheduledOnASpecificDay());
        });
        let eventsOnASpecificDayInAnyPeriod = allEvents.filter((scheduledEvent) => scheduledEvent.isScheduledOnASpecificDay());
        TimelineLogger.log("There are: " + eventsOnASpecificDayInAnyPeriod.length + " events on a Specific Day across all the periods");
        console.log("[ScheduledStudyConfiguration] Found", eventsOnASpecificDayInAnyPeriod.length, "events scheduled on specific days");
        return eventsOnASpecificDayInAnyPeriod;
    }

    // anyEventsToSchedule(timeline): boolean {
    //   let firstNoScheduledEvent = this.getAllEventsInSchedule().find(scheduledEvent => scheduledEvent.notYetScheduled(timeline));
    //   return firstNoScheduledEvent === undefined;
    // }

    getEventsReadyToBeScheduled(completedEvent: ScheduledEventInstance, time: number, timeline: Timeline): ScheduledEventInstance[] {
        TimelineLogger.log("Searching schedule for all events ready to be scheduled");
        let readyEvents = this.getAllEventsInSchedule()
            .map((scheduledEvent) => scheduledEvent.getInstanceIfEventIsReadyToSchedule(completedEvent, time, timeline))
            .filter((instance) => instance !== null) as ScheduledEventInstance[];
        TimelineLogger.log("There are: " + readyEvents.length + " events ready to be scheduled");
        return readyEvents;
    }
}
