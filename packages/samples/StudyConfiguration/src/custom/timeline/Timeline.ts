import { RtBoolean, RtObject } from '@freon4dsl/core';
import { ScheduledEvent, ScheduledEventState } from './ScheduledEvent';
import { Event } from '../../language/gen/index';
import { ScheduledPeriod } from './ScheduledPeriod';
import { ScheduledStudyConfiguration } from './ScheduledStudyConfiguration';

// Flags to control the types of logging that will be done
export let scheduledLogging = false;
export let periodLogging = false;
/*
 * A Timeline records the events and the days they occur on.
 */
export class Timeline extends RtObject{

  days: TimelineDay[] = [];

  currentDay: number = 0;

  constructor() {
    super();
  }

  equals(other: RtObject): RtBoolean {
    throw new Error('Timelines are not comparable. Method not implemented.');
  }

  newEventInstance(scheduledEvent: ScheduledEvent, dayEventWillOccurOn: number) {
    return new EventInstance(scheduledEvent, dayEventWillOccurOn);
  }

  getEventsForDay(day: number) {
    return this.days.find(d => d.day === day).events.map(event => {event instanceof(EventInstance)});
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
    let day = this.days.find(d => d.day === event.startDay);
    if (!day) {
      day = new TimelineDay(event.startDay);
      this.days.push(day);
    }
    day.events.push(event);
  }

  getEvents(day: number) {
    let timelineDay = this.days.find(d => d.day === day);
    return timelineDay ? timelineDay.events : [];
  }

  getLastInstanceForThisEvent(eventToMatch: Event): EventInstance {
    let allEventInstances = this.days.flatMap(day => day.events.filter ( event => event instanceof EventInstance));
    let eventInstances = allEventInstances.filter(event => eventToMatch.name === event.getName());
    const lastInstance = eventInstances[eventInstances.length - 1] as EventInstance; // TODO: sort by day and get the most recent
    if (!lastInstance) {
      console.log("No instance of: '" + eventToMatch.name + "' on timeline");
      return null;
    } else {
      return lastInstance;
    }
  }

  printTimeline() {
    console.log("Timeline:");
    this.days.forEach(day => {
      console.log("Day: " + day.day);
      day.events.forEach(event => {
        console.log("Event: " + event.getName() + " day: " + event.startDay + " status: " + event.getState() );
      });
    });
  }

  // Return true if the event has already been completed on a previous day at least once
  hasCompletedInstanceOf(scheduledEvent: ScheduledEvent) {
    for (const day of this.days) {
      for (const event of day.events) {
        if (event instanceof(EventInstance)) {
          let eventInstance = event as EventInstance;
          // console.log("hasCompletedInstanceOf checking if completed instance of: " + scheduledEvent.getName() + " matches event: " + eventInstance.getName() + " in state: " + eventInstance.state + " one day: " + day.day);
          if (eventInstance.scheduledEvent.getName() === scheduledEvent.getName() && event.state === TimelineInstanceState.Completed) {
            console.log("There is a completed instance of: '" + scheduledEvent.getName() + "'" + " on day: " + day.day);
            return true; // Exit nested loops early if we find a completed instance
          }
        }
      }
    } 
    console.log("There is not already a completed instance of: '" + scheduledEvent.getName() + "'");   
    return false;
  }

  numberCompletedInstancesOf(scheduledEvent: ScheduledEvent) {
    // what happens when event is a period
    let count = 0;
    for (const day of this.days) {
      for (const event of day.events) {
        if (event instanceof(EventInstance) && event.scheduledEvent.getName() === scheduledEvent.getName() && event.state === TimelineInstanceState.Completed) {
          count++;
        }
      }
    }
    console.log("numberCompletedInstancesOf scheduledEvent: " + scheduledEvent.getName() + " is: " + count);    
    return count;
  }

  noCompletedInstanceOf(scheduledEvent: ScheduledEvent) {
    return !this.hasCompletedInstanceOf(scheduledEvent);
  }

  getPeriods() {
    return this.days.flatMap(day => day.events.filter(event => event instanceof PeriodInstance));
  }

  getPeriodInstanceFor(scheduledPeriodName: string) {
    return this.getPeriods().find(period => (period as PeriodInstance).scheduledPeriod.getName() === scheduledPeriodName) as PeriodInstance;
  }

  // Return the first period that is active. There should be only one.
  getActivePeriod(): PeriodInstance {
    let firstActivePeriodOnTimeline = this.getPeriods().find(period => (period as PeriodInstance).getState() === TimelineInstanceState.Active) as PeriodInstance;
    if (periodLogging) {
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
    let eventNames = sortedDays.flatMap(day => day.events.filter(event => event instanceof EventInstance).map(event => event.getName()));
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
      return 0
    } else {
      return Math.abs(lowestDayItem.day);
    }
  }

}

export abstract class TimelineEventInstance {
  startDay: number;      // The day the instance occurred on
  endDay: number;        // The day the instance ended on
  state: TimelineInstanceState = TimelineInstanceState.Active;

  setState(state: TimelineInstanceState) {
    this.state = state;
  }

  getState() {
    return this.state;
  }

  getEndDay(timeline: Timeline) {
    if (this.endDay === undefined) {
      return timeline.currentDay;
    } else {  
      return this.endDay;
    }
  }

  getEndDayAsDateFrom(referenceDate: Date, timeline: Timeline) : Date {
    const result = new Date(referenceDate);
    const dayOffsetOfFirstEventInstance = timeline.getOffsetOfFirstEventInstance();
    result.setDate(result.getDate() + this.getEndDay(timeline) + dayOffsetOfFirstEventInstance);
    result.setHours(23, 59, 59);
    return result;
  }

  getEndDayStringAsDateFrom(referenceDate: Date, timeline: Timeline): string {
    return TimelineEventInstance.formatDate(this.getEndDayAsDateFrom(referenceDate, timeline));
  }

  setEndDay(endDay: number) {
    this.endDay = endDay;
  }

  getStartDay() {
    return this.startDay;
  }

  getStartDayAsDate(fromReferenceDate: Date, timeline: Timeline): Date {
    const result = new Date(fromReferenceDate);
    const dayOffsetOfFirstEventInstance = timeline.getOffsetOfFirstEventInstance();
    result.setDate(result.getDate() + this.getStartDay() + dayOffsetOfFirstEventInstance);
    return result;
  }

  getStartDayAsDateString(fromReferenceDate: Date, timeline: Timeline): string {
    return TimelineEventInstance.formatDate(this.getStartDayAsDate(fromReferenceDate, timeline));
  }

  getEndOfStartDayAsDateString(fromReferenceDate: Date, timeline: Timeline): string {
    const endOfStartDay = this.getStartDayAsDate(fromReferenceDate, timeline)
    endOfStartDay.setHours(23, 59, 59);
    const result = TimelineEventInstance.formatDate(endOfStartDay);
    return result;
  }


  abstract getName(): string;

  // static formatDate(date: Date): string {
  //   const options: Intl.DateTimeFormatOptions = {
  //       year: 'numeric',
  //       month: '2-digit',
  //       day: '2-digit'
  //   };
  //   return date.toLocaleDateString('en-CA', options).replace(/-/g, ', ');
  // }

  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth()).toString().padStart(2, '0'); // getMonth() returns 0 for January
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}, ${month}, ${day}, ${hours}, ${minutes}, ${seconds}`;
  }
}

export class PeriodInstance extends TimelineEventInstance {

  scheduledPeriod: ScheduledPeriod;

  constructor(scheduledPeriod: ScheduledPeriod, startDay: number, endDay?: number) {
    super();
    this.scheduledPeriod = scheduledPeriod;
    this.startDay = startDay;
    this.endDay = endDay;
    this.setState(TimelineInstanceState.Active);
  } 

  getName() {
    return this.scheduledPeriod.getName();
  }

  getIdOfScheduledPeriod() {
    return this.scheduledPeriod.configuredPeriod.freId();
  }

  setCompleted(onDay: number) {
    this.setState(TimelineInstanceState.Completed);
    this.setEndDay(onDay);
  } 
}

export enum TimelineInstanceState {
  Ready,
  Scheduled,
  Active,
  Completed
}

 /*
  * An EventInstance represents an instance of an event on a day on the timeline.
  */
export class EventInstance extends TimelineEventInstance {

  scheduledEvent: ScheduledEvent; // The scheduled event that this instance was created from
  state : TimelineInstanceState = TimelineInstanceState.Ready;


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

/*
 * A Day represents a day on the timeline and the events that occurred on that day.
 */
export class TimelineDay {
  day: number;
  events: TimelineEventInstance[] = [];

  constructor(day: number) {
    this.day = day;
  }

  getEventInstances() : EventInstance[] {
    let result = this.events.filter(event => event instanceof EventInstance) as EventInstance[];
    return result;
  }

  getPeriodInstances() {
    return this.events.filter(event => event instanceof(PeriodInstance)) as PeriodInstance[];
  }}


