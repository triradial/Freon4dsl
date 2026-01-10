import { RecommendedWindowOf } from "../../language/gen/index.js";
import { ScheduledEvent } from "./ScheduledEvent.js";
import { Timeline } from "./Timeline.js";
import { TimelineEventInstance, TimelineInstanceState } from "./TimelineEventInstance.js";
import TimelineLogger from "./TimelineLogger.js";

/*
 * Represents an instance of a scheduled event on a day on the timeline.
 */

export class ScheduledEventInstance extends TimelineEventInstance {
    scheduledEvent: ScheduledEvent; // The scheduled event that this instance was created from
    state: TimelineInstanceState = TimelineInstanceState.Ready;
    instanceNumber: number;

    constructor(scheduledEvent: ScheduledEvent, startDay: number, instanceNumber: number = 1) {
        if (instanceNumber > 1)
            TimelineLogger.log("creating ScheduledEventInstance: " + scheduledEvent.getName() + " instance:" + instanceNumber + " startDay:" + startDay);
        super(startDay);
        this.scheduledEvent = scheduledEvent;
        this.instanceNumber = instanceNumber;
    }

    getAlternativeName() {
        let alternativeName = this.scheduledEvent.configuredEvent.alternativeName.trim();
        if (!alternativeName || alternativeName.length == 0) alternativeName = this.getName();
        if (!alternativeName.includes("#") && this.instanceNumber > 1) alternativeName = alternativeName + " (#)";
        alternativeName = alternativeName.replace("#", this.instanceNumber.toString());
        return alternativeName || "Name Missing";
    }

    getScheduledEvent() {
        return this.scheduledEvent;
    }

    getInstanceNumber(): number {
        return this.instanceNumber;
    }

    getStartDayOfWindow() {
        const eventWindow = this.getScheduledEvent().configuredEvent.schedule.eventWindow;
        return eventWindow instanceof RecommendedWindowOf ? eventWindow.daysBefore.count : 0;
    }

    getEndDayOfWindow() {
        const eventWindow = this.getScheduledEvent().configuredEvent.schedule.eventWindow;
        return eventWindow instanceof RecommendedWindowOf ? eventWindow.daysAfter.count : 0;
    }

    completed() {
        this.state = TimelineInstanceState.Completed;
        this.getScheduledEvent().setToCompleted();
    }

    scheduled() {
        this.state = TimelineInstanceState.Scheduled;
        this.getScheduledEvent().setToScheduled();
    }

    completeCurrentPeriod(timeline: Timeline, onDay: number) {
        this.getScheduledEvent().completeCurrentPeriod(timeline, onDay);
    }

    getName() {
        return this.getScheduledEvent().getName();
    }

    anyDaysBefore() {
        const eventWindow = this.getScheduledEvent().configuredEvent.schedule.eventWindow;
        const daysBefore = eventWindow instanceof RecommendedWindowOf ? eventWindow.daysBefore.count : 0;
        if (this.getName() == "V1 Randomization") {
            TimelineLogger.log("ScheduledEventInstance.anyDaysBefore() for: V1 Randomization daysBefore: " + daysBefore);
        }
        if (daysBefore !== 0 && daysBefore != undefined) {
            TimelineLogger.log("ScheduledEventInstance.anyDaysBefore() for: " + this.getName() + " daysBefore: " + daysBefore);
        }
        return daysBefore !== 0 && daysBefore != undefined;
    }

    anyDaysAfter() {
        const eventWindow = this.getScheduledEvent().configuredEvent.schedule.eventWindow;
        const daysAfter = eventWindow instanceof RecommendedWindowOf ? eventWindow.daysAfter.count : 0;
        return daysAfter != 0 && daysAfter != undefined;
    }

    startDayOfBeforeWindowAsDate(timeline: Timeline) {
        const startDate = new Date(this.getStartDayAsDate(timeline));
        const eventWindow = this.getScheduledEvent().configuredEvent.schedule.eventWindow;
        const daysBefore = eventWindow instanceof RecommendedWindowOf ? eventWindow.daysBefore.count : 0;
        startDate.setDate(startDate.getDate() - daysBefore);
        return startDate;
    }

    startDayOfBeforeWindowAsDateString(timeline: Timeline) {
        return TimelineEventInstance.formatDate(this.startDayOfBeforeWindowAsDate(timeline));
    }

    endDayOfBeforeWindowAsDate(timeline: Timeline) {
        const endDate = new Date(this.getStartDayAsDate(timeline));
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(59);
        return endDate;
    }

    endDayOfBeforeWindowAsDateString(timeline: Timeline) {
        return TimelineEventInstance.formatDate(this.endDayOfBeforeWindowAsDate(timeline));
    }

    startDayOfAfterWindowAsDate(timeline: Timeline) {
        const startDate = new Date(this.getStartDayAsDate(timeline));
        startDate.setDate(startDate.getDate() + 1);
        return startDate;
    }

    startDayOfAfterWindowAsDateString(timeline: Timeline) {
        return TimelineEventInstance.formatDate(this.startDayOfAfterWindowAsDate(timeline));
    }

    endDayOfAfterWindowAsDate(timeline: Timeline) {
        const endDate = new Date(this.getStartDayAsDate(timeline));
        const eventWindow = this.getScheduledEvent().configuredEvent.schedule.eventWindow;
        const daysAfter = eventWindow instanceof RecommendedWindowOf ? eventWindow.daysAfter.count : 0;
        endDate.setDate(endDate.getDate() + daysAfter);
        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(59);
        return endDate;
    }

    endDayOfAfterWindowAsDateString(timeline: Timeline) {
        return TimelineEventInstance.formatDate(this.endDayOfAfterWindowAsDate(timeline));
    }
}
