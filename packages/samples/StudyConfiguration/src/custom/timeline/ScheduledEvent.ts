import { BinaryExpression, Event, Day, EventStart, StudyStart, RepeatCondition, RepeatUnit, Period, StudyConfiguration, When, Daily, Weekly, Monthly } from "../../language/gen/index";
import { InterpreterContext, isRtError, RtNumber } from "@freon4dsl/core";
import { MainStudyConfigurationModelInterpreter } from "../../interpreter/MainStudyConfigurationModelInterpreter";
import { EventInstance, PeriodInstance, Timeline, TimelineInstance, TimelineInstanceState } from "./Timeline";
import { repeat } from "lodash";
import { ScheduledStudyConfiguration } from "./ScheduledStudyConfiguration";

export enum ScheduledEventState {
  Initial,
  Ready,
  Active,
  Scheduled,
  Completed
};

/*
 * A ScheduledEvent is a wrapper around an Event from the StudyConfiguration language.
 * It provides a simplified interface for the simulator and allows for the same Event to be scheduled multiple times.
 */
export class ScheduledEvent {
  configuredEvent: Event;
  state = ScheduledEventState.Initial;

  constructor(event: Event) {
    this.configuredEvent = event;
  }

  day(timeline: Timeline): number {
    console.log("ScheduledEvent.day() for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay);
    let eventStart = this.configuredEvent.schedule.eventStart;
  //   if (this.isScheduledOnASpecificDay()) {
  //     console.log("ScheduledEvent.day() eventStart is a Day for: " + this.getName() + " is a specific day: " + (eventStart as Day).startDay);
  //   } else if (eventStart instanceof When) {
  //     console.log("ScheduledEvent.day() eventStart is a When for: " + this.getName() + " is a When with time unit: " + (eventStart as When).startWhen.timeAmount.unit.name);
  //   } else {
  //     console.log("ScheduledEvent.day() eventStart is not a Day or When ");
  //  }
    const interpreter = new MainStudyConfigurationModelInterpreter()
    interpreter.setTracing(true);
    let ctx = InterpreterContext.EMPTY_CONTEXT;
    ctx.set("timeline", timeline);
    const value = interpreter.evaluateWithContext(eventStart,ctx);
    if (isRtError(value)) {
      throw new Error("interpreter isRtError, value: " + value.toString());
    } else {
      const trace = interpreter.getTrace().root.toStringRecursive();
      if (!timeline) {
        console.log("ScheduledEvent.day() timeline is null: " + trace);
      } 
      //TODO: Why was this check here and what is special about day 8?
      // else if (timeline.currentDay > 8) {
      //   console.log("ScheduledEvent.day() trace: " + trace);
      // }
    }
    // console.log("ScheduledEvent.day() for: " + this.name() + " is: " + (value as RtNumber).value);
    if (value instanceof RtNumber) {
      return (value as RtNumber).value
    } else {
      return undefined;
    }
  }


  // If a specific day is specified for the event to start on then return that day
  // otherwise return the number of days to wait from the timeline's current day.
  daysToWait(completedEvent: EventInstance,timeline: Timeline, timeNow: number) {
    if (completedEvent.scheduledEvent.getName() === this.getName() && this.isRepeatingEvent() && this.anyRepeatsNotCompleted(timeline)) {
      let waitInDays = this.daysTillNextRepeat(completedEvent);
      console.log("ScheduledEvent.daysToWait() for: " + this.getName() + " is to be repeated on timeline day: " + timeline.currentDay + " with scheduledDay of: " + waitInDays );
      return waitInDays;
    }
    if (this.isScheduledOnASpecificDay()) {
      console.log("ScheduledEvent.daysToWait() for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay + " day: " + this.day(timeline) + " result: " + this.day(timeline));
      return this.day(timeline);
    } else {
      console.log("ScheduledEvent.daysToWait() for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay + " day: " + this.day(timeline) + " result: " + (this.day(timeline) - timeline.currentDay));
      return this.day(timeline) - timeline.currentDay;
    }
  }

  getState(): ScheduledEventState {
    return this.state;
  }

  setState(state: ScheduledEventState) {
    this.state = state;
  }

  getName(): string {
    return this.configuredEvent.name;
  }

  dependency(): string {
    return null;
  }

  isRepeatingEvent(): boolean {
    return this.configuredEvent.schedule.eventRepeat instanceof RepeatCondition;
  }

  anyRepeatsNotCompleted(timeline: Timeline): boolean {
    let numberCompletedInstances = timeline.numberCompletedInstancesOf(this);
    if (this.isRepeatingEvent) {
      let repeatCondition = this.configuredEvent.schedule.eventRepeat as RepeatCondition;
      if (numberCompletedInstances <= repeatCondition.maxRepeats) { // Less that or equal because the first instance is not counted as a repeat.
        console.log("anyRepeatsNotCompleted: " + this.getName() + " timeline: " + timeline.currentDay + " maxRepeats: " + repeatCondition.maxRepeats + " numberCompletedInstances: " + numberCompletedInstances);
        return true;
      }
    }
    console.log("anyRepeatsNotCompleted: " + this.getName() + " timeline: " + timeline.currentDay + " numberCompletedInstances: " + numberCompletedInstances + " result: false");
    return false;
  }

  notYetScheduled(timeline): boolean {
    try {
      console.log('notYetScheduled: ' + this.getName() + ' timeline: ' + timeline.currentDay + ' day: ' + this.day(timeline) + ' result: ' + (this.anyRepeatsNotCompleted(timeline) || this.getState() === ScheduledEventState.Initial));
      // return this.anyRepeatsNotCompleted(timeline) || timeline.noCompletedInstanceOf(this);
      return this.anyRepeatsNotCompleted(timeline) || this.getState() === ScheduledEventState.Initial;
    }
    catch (e) {
      console.log("notYetScheduled caught exception: " + e.toString());
      // This exception is expected to happen when Event has dependency on another event that has not been completed so evaluation of FirstScheduled fails.
      return false;
    }
  }

  daysTillNextRepeat(completedEvent: EventInstance) {
    let repeatCondition = this.configuredEvent.schedule.eventRepeat as RepeatCondition;
    let repeatUnit = repeatCondition.repeatUnit;
    let repeatDays = 0;
    if (repeatCondition.repeatUnit instanceof Daily) {
      repeatDays = 1
    } else if (repeatCondition.repeatUnit instanceof Weekly) {
      repeatDays = 7
    } else if (repeatCondition.repeatUnit instanceof Monthly) {
      repeatDays = 30  //TODO: Should consult calendar to determine number of days in month?
    } else {
      console.log("daysTillNextRepeat: repeatUnit is not Daily, Weekly, or Monthly");
    }
    return repeatDays;
  }

  isScheduledOnASpecificDay() {
    const eventStart = this.configuredEvent.schedule.eventStart as EventStart;
    if (eventStart == null) {
      console.log("isScheduledOnASpecificDay: eventStart is null for: " + this.getName());
      return false;
    } else if ( eventStart instanceof Day) {
      return true;
    } else if (eventStart instanceof StudyStart) {
      return true;
    } else if (eventStart.freIsExpression()) {
      //TODO: Make this more general search of StudyStart anywhere in the expression
      console.log("isScheduledOnASpecificDay: eventStart checking is currently limited to binary expressions starting with StudyStart!");
      const eventStartExpression = eventStart as BinaryExpression;
      if (eventStartExpression.left instanceof StudyStart) {
        return true;
      }
    }
    return false;
  }

  /*
  * TODO: update this description...
  *
   * if this event has not been completed on a previous day and the timeline day is at or after the day this event is scheduled for then return a new EventInstance
   * otherwise return null.
   */
  getInstanceIfEventIsReadyToSchedule(completedEvent: EventInstance, timeline: Timeline): unknown {
    let repeatingEvent = this.isRepeatingEvent();
    if (this.isScheduledOnASpecificDay() && !repeatingEvent) {
      const day = this.configuredEvent.schedule.eventStart as Day;
      console.log("getInstanceIfEventIsReady: Not ready to schedule because:" + this.getName() + " is scheduled to start on a specific day of:" + day.startDay);
      return null;
    } else if (completedEvent.scheduledEvent.getName() === this.getName() && repeatingEvent && this.anyRepeatsNotCompleted(timeline)) {
      console.log("getInstanceIfEventIsReady: " + this.getName() + " is to be repeated on timeline day: " + timeline.currentDay + " with scheduledDay of: " + this.day(timeline) );
      return new EventInstance(this);
    } else {
      let scheduledDay = this.day(timeline);
      console.log("getInstanceIfEventIsReady scheduledDay: " + scheduledDay);
      if (timeline.noCompletedInstanceOf(this) && scheduledDay != undefined && scheduledDay >= timeline.currentDay) {
        console.log("getInstanceIfEventIsReady: " + this.getName() + " is to be scheduled on timeline day: " + timeline.currentDay + " with scheduledDay of: " + scheduledDay );
        return new EventInstance(this);
      } else {
        console.log("getInstanceIfEventIsReady: " + this.getName() + " is NOT to be scheduled on timeline day: " + timeline.currentDay + " with scheduledDay of: " + scheduledDay );
        return null;
      }
    }
  }

  private addPeriodInstance(period: Period, scheduledStudyConfiguration: ScheduledStudyConfiguration, timeline: Timeline) {
    let periodInstance = new PeriodInstance(scheduledStudyConfiguration.getScheduledPeriod(period), this.day(timeline));
    // console.log("ScheduledEvent.addPeriodInstance() for: " + this.getName() + " periodInstance: " + periodInstance.getName() + " period: " + period.name);
    timeline.addEvent(periodInstance as TimelineInstance);
  }

  // Do whatever is needed when the event is scheduled:
  // - create a new PeriodInstance if needed
  scheduled(scheduledStudyConfiguration: ScheduledStudyConfiguration, timeline: Timeline, daysToWait: number) {
    console.log("ScheduledEvent.scheduled() for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay);
    let period = this.configuredEvent.freOwner() as unknown as Period;
    let currentPeriodInstance = timeline.getCurrentPeriod();
    if (currentPeriodInstance) {
      if (currentPeriodInstance.getName() != period.name) {  // Note: the Period returned by this.configuredEvent is generated and it doesn't have the name populated because the name is the freId.
        console.log("ScheduledEvent.scheduled() names not equal so new period for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay + " currentPeriod: " + currentPeriodInstance.getName() + " period: " + period.name);
        currentPeriodInstance.setCompleted(timeline.currentDay + daysToWait - 1);
        this.addPeriodInstance(period, scheduledStudyConfiguration, timeline);
      }  
    } else {
      console.log("ScheduledEvent.scheduled() no current period so new period for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay + " period: " + period.name);
      this.addPeriodInstance(period, scheduledStudyConfiguration, timeline);    }
  }

}

