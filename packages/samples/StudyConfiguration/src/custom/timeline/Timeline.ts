import { RtBoolean, RtObject } from '@freon4dsl/core';
import { ScheduledEvent, ScheduledEventState } from './ScheduledEvent';
import { Event } from '../../language/gen/index';
import { TimelineEventInstance, TimelineInstanceState } from './TimelineEventInstance';
import { PeriodEventInstance } from './PeriodEventInstance';
import { ScheduledEventInstance } from './ScheduledEventInstance';

/*
 * A Timeline records the events and the days they occur on.
 */
export class Timeline extends RtObject {

  // Flags to control the types of logging that will be done
  scheduledLogging = false;
  periodLogging = false;
  completedEventLogging = false;

  days: TimelineDay[] = [];

  currentDay: number = 0;

  constructor() {
    super();
  }

  equals(other: RtObject): RtBoolean {
    throw new Error('Timelines are not comparable. Method not implemented.');
  }

  newEventInstance(scheduledEvent: ScheduledEvent, dayEventWillOccurOn: number) {
    return new ScheduledEventInstance(scheduledEvent, dayEventWillOccurOn);
  }

  getEventsForDay(day: number) {
    return this.days.find(d => d.day === day).events.map(event => {event instanceof(ScheduledEventInstance)});
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

  getLastInstanceForThisEvent(eventToMatch: Event): ScheduledEventInstance {
    // Flatten the list of events and filter for EventInstance
    let allEventInstances = this.days.flatMap(day => 
      day.events.filter(event => event instanceof ScheduledEventInstance).map(event => ({ event, day: day.day }))
    );
  
    // Filter the events to match the given event name
    let eventInstances = allEventInstances.filter(({ event }) => eventToMatch.name === event.getName());
  
    // Sort the events by the day value
    eventInstances.sort((a, b) => a.day - b.day);
  
    // Get the last instance from the sorted list
    const lastInstance = eventInstances.length > 0 ? eventInstances[eventInstances.length - 1].event as ScheduledEventInstance : null;
  
    if (!lastInstance) {
      // console.log("No instance of: '" + eventToMatch.name + "' on timeline");
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
        if (event instanceof(ScheduledEventInstance)) {
          let eventInstance = event as ScheduledEventInstance;
          // console.log("hasCompletedInstanceOf checking if completed instance of: " + scheduledEvent.getName() + " matches event: " + eventInstance.getName() + " in state: " + eventInstance.state + " one day: " + day.day);
          if (eventInstance.scheduledEvent.getName() === scheduledEvent.getName() && event.state === TimelineInstanceState.Completed) {
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
        if (event instanceof(ScheduledEventInstance) && event.scheduledEvent.getName() === scheduledEvent.getName() && event.state === TimelineInstanceState.Completed) {
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
    return this.days.flatMap(day => day.events.filter(event => event instanceof PeriodEventInstance));
  }

  getPeriodInstanceFor(scheduledPeriodName: string) {
    return this.getPeriods().find(period => (period as PeriodEventInstance).scheduledPeriod.getName() === scheduledPeriodName) as PeriodEventInstance;
  }

  // Return the first period that is active. There should be only one.
  getActivePeriod(): PeriodEventInstance {
    let firstActivePeriodOnTimeline = this.getPeriods().find(period => (period as PeriodEventInstance).getState() === TimelineInstanceState.Active) as PeriodEventInstance;
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
    let eventNames = sortedDays.flatMap(day => day.events.filter(event => event instanceof ScheduledEventInstance).map(event => event.getName()));
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

  getMaxDayOnTimeline() {
    const dayOffsetOfFirstEventInstance = this.getOffsetOfFirstEventInstance();
    return this.currentDay + dayOffsetOfFirstEventInstance;
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

  getEventInstances() : ScheduledEventInstance[] {
    let result = this.events.filter(event => event instanceof ScheduledEventInstance) as ScheduledEventInstance[];
    return result;
  }

  getPeriodInstances() {
    return this.events.filter(event => event instanceof(PeriodEventInstance)) as PeriodEventInstance[];
  }}


