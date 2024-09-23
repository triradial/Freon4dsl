import { ScheduledEvent } from "./ScheduledEvent";
import { Timeline } from "./Timeline";
import { TimelineEventInstance, TimelineInstanceState } from "./TimelineEventInstance";

/*
 * Represents an instance of a scheduled event on a day on the timeline.
 */

export class ScheduledEventInstance extends TimelineEventInstance {

  scheduledEvent: ScheduledEvent; // The scheduled event that this instance was created from
  state: TimelineInstanceState = TimelineInstanceState.Ready;


  constructor(scheduledEvent: ScheduledEvent, startDay: number) {
    super();
    this.startDay = startDay;
    this.scheduledEvent = scheduledEvent;
  }

  completed() {
    this.state = TimelineInstanceState.Completed;
    this.scheduledEvent.setToCompleted();
  }

  scheduled() {
    this.state = TimelineInstanceState.Scheduled;
    this.scheduledEvent.setToScheduled();
  }

  completeCurrentPeriod(timeline: Timeline, onDay: number) {
    this.scheduledEvent.completeCurrentPeriod(timeline, onDay);
  }

  getName() {
    return this.scheduledEvent.getName();
  }

  anyDaysBefore() {
    const daysBefore = this.scheduledEvent.configuredEvent.schedule.eventWindow.daysBefore.count;
    return daysBefore !== 0 && daysBefore != undefined;
  }

  anyDaysAfter() {
    const daysAfter = this.scheduledEvent.configuredEvent.schedule.eventWindow.daysAfter.count;
    return daysAfter != 0 && daysAfter != undefined;
  }

  // getStartDayOfWindow() {
  //   return this.scheduledEvent.configuredEvent.schedule.eventWindow.daysBefore.count - this.startDay;
  // }
  // getStartDayOfWindowAsDateFrom(referenceDate: Date, timeline: Timeline) {
  //   const result = this.getStartDayAsDateFrom(referenceDate, timeline);
  //   const dayOffsetOfFirstEventInstance = timeline.getOffsetOfFirstEventInstance();
  //   result.setDate(result.getDate() - this.getStartDayOfWindow() + dayOffsetOfFirstEventInstance);
  //   return result;
  // }
  // getStartDayOfWindowStringAsDateFrom(referenceDate: Date, timeline: Timeline) {
  //   return TimelineInstance.formatDate(this.getStartDayOfWindowAsDateFrom(referenceDate, timeline));
  // }
  // getEndDayOfWindow() {
  //   return this.scheduledEvent.configuredEvent.schedule.eventWindow.daysAfter.count + this.startDay;
  // }
  startDayOfBeforeWindowAsDate(fromReferenceDate: Date, timeline: Timeline) {
    const startDate = new Date(this.getStartDayAsDate(fromReferenceDate, timeline));
    startDate.setDate(startDate.getDate() - this.scheduledEvent.configuredEvent.schedule.eventWindow.daysBefore.count);
    return startDate;
  }

  startDayOfBeforeWindowAsDateString(fromReferenceDate: Date, timeline: Timeline) {
    return TimelineEventInstance.formatDate(this.startDayOfBeforeWindowAsDate(fromReferenceDate, timeline));
  }

  endDayOfBeforeWindowAsDate(fromReferenceDate: Date, timeline: Timeline) {
    const endDate = new Date(this.getStartDayAsDate(fromReferenceDate, timeline));
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    return endDate;
  }

  endDayOfBeforeWindowAsDateString(fromReferenceDate: Date, timeline: Timeline) {
    return TimelineEventInstance.formatDate(this.endDayOfBeforeWindowAsDate(fromReferenceDate, timeline));
  }

  startDayOfAfterWindowAsDate(fromReferenceDate: Date, timeline: Timeline) {
    const startDate = new Date(this.getStartDayAsDate(fromReferenceDate, timeline));
    startDate.setDate(startDate.getDate() + 1);
    return startDate;
  }

  startDayOfAfterWindowAsDateString(fromReferenceDate: Date, timeline: Timeline) {
    return TimelineEventInstance.formatDate(this.startDayOfAfterWindowAsDate(fromReferenceDate, timeline));
  }

  endDayOfAfterWindowAsDate(fromReferenceDate: Date, timeline: Timeline) {
    const endDate = new Date(this.getStartDayAsDate(fromReferenceDate, timeline));
    endDate.setDate(endDate.getDate() + this.scheduledEvent.configuredEvent.schedule.eventWindow.daysAfter.count);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    return endDate;
  }

  endDayOfAfterWindowAsDateString(fromReferenceDate: Date, timeline: Timeline) {
    return TimelineEventInstance.formatDate(this.endDayOfAfterWindowAsDate(fromReferenceDate, timeline));
  }

}
