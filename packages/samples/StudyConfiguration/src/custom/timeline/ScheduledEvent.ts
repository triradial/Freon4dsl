import {
    BinaryExpression,
    Event,
    Day,
    EventStart,
    StudyStart,
    RepeatCondition,
    RepeatUnit,
    Period,
    StudyConfiguration,
    When,
    Daily,
    Weekly,
    Monthly,
    RepeatEvery,
    RepeatCount,
} from "../../language/gen/index";
import { InterpreterContext, isRtError, ownerOfType, RtBoolean, RtNumber, RtObject } from "@freon4dsl/core";
import { MainStudyConfigurationModelInterpreter } from "../../interpreter/MainStudyConfigurationModelInterpreter";
import { Timeline } from "./Timeline";
import { ScheduledEventInstance } from "./ScheduledEventInstance";
import { TimelineInstanceState } from "./TimelineEventInstance";
import { PeriodEventInstance } from "./PeriodEventInstance";
import { TimelineEventInstance } from "./TimelineEventInstance";
import { repeat } from "lodash";
import { ScheduledStudyConfiguration } from "./ScheduledStudyConfiguration";
import { start } from "repl";

export enum ScheduledEventState {
    Initial,
    Ready,
    Active,
    Scheduled,
    Completed,
}

// A wrapper around a ScheduledEvent that allows a ScheduledEvent to be put into the interpreter context.
//
export class RtObjectScheduledEventWrapper extends RtObject {
    scheduledEvent: ScheduledEvent;

    equals(other: RtObject): RtBoolean {
        throw new Error("Method not implemented.");
    }

    getScheduledEvent(): ScheduledEvent {
        return this.scheduledEvent;
    }

    constructor(public scheduledEventToWrap: ScheduledEvent) {
        super();
        this.scheduledEvent = scheduledEventToWrap;
    }
}
/*
 * A ScheduledEvent is a wrapper around an Event from the StudyConfiguration language.
 * It provides a simplified interface for the simulator and allows for the same Event to be scheduled multiple times.
 */
export class ScheduledEvent {
    configuredEvent: Event;
    state = ScheduledEventState.Initial;
    studyStartDayNumber: number;

    constructor(event: Event) {
        this.configuredEvent = event;
        this.studyStartDayNumber = (ownerOfType(event, "StudyConfiguration") as StudyConfiguration).studyStartDayNumber;
    }

    interpret(node: Object, timeline: Timeline): RtObject {
        const interpreter = new MainStudyConfigurationModelInterpreter();
        interpreter.setTracing(true);
        let ctx = InterpreterContext.EMPTY_CONTEXT;
        ctx.set("timeline", timeline);
        ctx.set("studyStartDayNumber", new RtNumber(this.studyStartDayNumber));
        const rtObjectScheduledEventWrapper = new RtObjectScheduledEventWrapper(this);
        ctx.set("scheduledEvent", rtObjectScheduledEventWrapper);
        const value = interpreter.evaluateWithContext(node, ctx);
        if (isRtError(value)) {
            const trace = interpreter.getTrace().root.toStringRecursive();
            console.log("ScheduledEvent.day() isRtError: " + trace);
            throw new Error("interpreter isRtError, value: " + value.toString());
        } else {
            return value;
        }
    }

    day(timeline: Timeline): number {
        console.log("ScheduledEvent.day() for: " + this.getName() + " timeline.currentDay: " + timeline.currentDay);
        let eventStart = this.configuredEvent.schedule.eventStart;
        if (this.isScheduledOnASpecificDay()) {
            console.log("ScheduledEvent.day() eventStart is a Day for: " + this.getName() + " is a specific day: " + (eventStart as Day).startDay);
        } else if (eventStart instanceof When) {
            if ((eventStart as When).timeAmountPart !== undefined && (eventStart as When).timeAmountPart !== null) {
                console.log(
                    "ScheduledEvent.day() eventStart is a When for: " +
                        this.getName() +
                        " is a When with timeAmount of: " +
                        (eventStart as When).timeAmountPart.operator.name +
                        " " +
                        (eventStart as When).timeAmountPart.timeAmount.value +
                        " " +
                        (eventStart as When).timeAmountPart.timeAmount.unit.name,
                );
            } else {
                console.log("ScheduledEvent.day() eventStart is a When for: " + this.getName() + " with no timeAmountPart");
            }
        } else {
            console.log("ScheduledEvent.day() eventStart is not a Day or When ");
        }
        const value = this.interpret(eventStart, timeline);
        if (value instanceof RtNumber) {
            console.log("ScheduledEvent.day() for: " + this.getName() + " is: " + (value as RtNumber).value);
            return (value as RtNumber).value;
        } else {
            return undefined;
        }
    }

    // If a specific day is specified for the event to start on then return that day
    // otherwise return the number of days to wait from the timeline's current day.
    daysToWait(completedEvent: ScheduledEventInstance, timeline: Timeline, timeNow: number) {
        if (completedEvent.getScheduledEvent().getName() === this.getName() && this.isRepeatingEvent() && this.anyRepeatsNotCompleted(timeline)) {
            let waitInDays = this.daysTillNextRepeat(timeline);
            console.log("'" + this.getName() + "' is to be repeated on timeline day: " + timeline.currentDay + " with days to wait of: " + waitInDays);
            return waitInDays;
        }
        if (this.isScheduledOnASpecificDay()) {
            // TODO: Remove after testing that this path is not taken.
            console.log(
                "THIS SHOULD NEVER HAPPEN! '" +
                    this.getName() +
                    "' is scheduled on a specific day with days to wait of:" +
                    this.day(timeline) +
                    " on timeline day: " +
                    timeline.currentDay,
            );
            return this.day(timeline);
        } else {
            console.log(
                "'" +
                    this.getName() +
                    "' is scheduled for day: " +
                    this.day(timeline) +
                    " on timeline day: " +
                    timeline.currentDay +
                    " with a days to wait of: " +
                    (this.day(timeline) - timeline.currentDay),
            );
            return this.day(timeline) - timeline.currentDay;
        }
    }

    getState(): ScheduledEventState {
        return this.state;
    }

    setState(state: ScheduledEventState) {
        this.state = state;
    }

    setToCompleted() {
        this.setState(ScheduledEventState.Completed);
    }

    setToScheduled() {
        this.setState(ScheduledEventState.Scheduled);
    }

    getName(): string {
        return this.configuredEvent.name;
    }

    dependency(): string {
        return null;
    }

    isRepeatingEvent(): boolean {
        let eventRepeat = this.configuredEvent.schedule.eventRepeat;
        return eventRepeat instanceof RepeatCondition || eventRepeat instanceof RepeatCount;
    }

    instanceNumber(timeline: Timeline): number {
        return timeline.numberCompletedInstancesOf(this) + 1;
    }

    anyRepeatsNotCompleted(timeline: Timeline): boolean {
        let numberCompletedInstances = timeline.numberCompletedInstancesOf(this);
        if (this.isRepeatingEvent) {
            const numberOfRepeats = this.numberOfRepeats(timeline);
            if (numberCompletedInstances <= numberOfRepeats) {
                // Less that or equal because the first instance is not counted as a repeat.
                console.log(
                    "'" +
                        this.getName() +
                        "' at day: " +
                        timeline.currentDay +
                        " has max repeats of: " +
                        numberOfRepeats +
                        " and has completed: " +
                        numberCompletedInstances,
                );
                return true;
            }
        } else {
            console.log("'" + this.getName() + "' at day: " + timeline.currentDay + " has completed all: " + numberCompletedInstances + " repeats");
        }
        return false;
    }

    numberOfRepeats(timeline: Timeline): number {
        let n = 1;
        if (this.isRepeatingEvent) {
            let eventRepeat = this.configuredEvent.schedule.eventRepeat;
            if (eventRepeat instanceof RepeatCondition) {
                let repeatCondition = eventRepeat as RepeatCondition;
                n = repeatCondition.maxRepeats;
            } else if (eventRepeat instanceof RepeatCount) {
                n = (eventRepeat as RepeatCount).repeatCount;
            }
        }
        return n;
    }

    notYetScheduled(timeline): boolean {
        try {
            // console.log('notYetScheduled: ' + this.getName() + ' timeline: ' + timeline.currentDay + ' day: ' + this.day(timeline) + ' result: ' + (this.anyRepeatsNotCompleted(timeline) || this.getState() === ScheduledEventState.Initial));
            if (this.getState() === ScheduledEventState.Scheduled) {
                return false;
            } else {
                return this.anyRepeatsNotCompleted(timeline) || this.getState() === ScheduledEventState.Initial;
            }
        } catch (e) {
            console.log("notYetScheduled caught exception: " + e.toString());
            // This exception is expected to happen when Event has dependency on another event that has not been completed so evaluation of FirstScheduled fails.
            return false;
        }
    }

    daysTillNextRepeat(timeline: Timeline): number {
        let eventRepeat = this.configuredEvent.schedule.eventRepeat;
        if (eventRepeat instanceof RepeatCondition) {
            let repeatCondition = this.configuredEvent.schedule.eventRepeat as RepeatCondition;
            let repeatUnit = repeatCondition.repeatUnit;
            let repeatDays = this.interpret(repeatUnit, timeline) as RtNumber;
            return repeatDays.value;
        } else if (eventRepeat instanceof RepeatCount) {
            let eventStart = this.configuredEvent.schedule.eventStart as EventStart;
            let repeatDays = undefined;
            if (eventStart instanceof When) {
                repeatDays = this.interpret((eventStart as When).timeAmountPart.timeAmount, timeline) as RtNumber;
            } else {
                repeatDays = this.interpret(eventStart, timeline) as RtNumber;
            }
            return repeatDays.value;
        } else {
            throw new Error(
                "'" +
                    this.getName() +
                    "' timeline day of: " +
                    timeline.currentDay +
                    " can not calculate days till next repeat because the EventRepeat is not a RepeatCondition or RepeatCount",
            );
        }
    }

    isScheduledOnASpecificDay() {
        const eventStart = this.configuredEvent.schedule.eventStart as EventStart;
        if (eventStart == null) {
            console.log("isScheduledOnASpecificDay: eventStart is null for: " + this.getName());
            return false;
        } else if (eventStart instanceof Day) {
            return true;
        } else if (eventStart instanceof StudyStart) {
            return true;
            // } else if (eventStart.freIsExpression()) { THIS IS NO LONGER NEEDED BECAUSE EVENTSTART IS NEVER AN EXPRESSION
            //     //TODO: Make this more general search of StudyStart anywhere in the expression
            //     // console.log("isScheduledOnASpecificDay: eventStart checking is currently limited to binary expressions starting with StudyStart!");
            //     const eventStartExpression = eventStart as BinaryExpression;
            //     if (eventStartExpression.left instanceof StudyStart) {
            //         return true;
            //     }
        }
        return false;
    }

    /*
     * TODO: update this description...
     *
     * if this event has not been completed on a previous day and the timeline day is at or after the day this event is scheduled for then return a new EventInstance
     * otherwise return null.
     */
    getInstanceIfEventIsReadyToSchedule(completedEvent: ScheduledEventInstance, time: number, timeline: Timeline): ScheduledEventInstance {
        let repeatingEvent = this.isRepeatingEvent();
        console.log("ScheduledEvent.getInstanceIfEventIsReadyToSchedule() for: " + this.getName());
        let scheduledDay = this.day(timeline);
        if (this.isScheduledOnASpecificDay() && !repeatingEvent) {
            if (timeline.scheduledLogging)
                console.log(
                    "'" + this.getName() + "' is not a ready-to-schedule event because it is already scheduled to start on a specific day of: " + scheduledDay,
                );
            return null;
        } else if (repeatingEvent && scheduledDay != undefined) {
            // && scheduledDay >= timeline.currentDay) {
            if (this.notYetScheduled(timeline)) {
                console.log(
                    " '" +
                        this.getName() +
                        "' is a repeating event with " +
                        timeline.numberCompletedInstancesOf(this) +
                        " completed instances and is to be scheduled on timeline day: " +
                        timeline.currentDay +
                        " with scheduledDay of: " +
                        scheduledDay,
                );
                let daysToWait = this.daysToWait(completedEvent, timeline, time);
                if (daysToWait != scheduledDay) {
                    console.log(
                        " '" +
                            this.getName() +
                            "' is a repeating event with " +
                            timeline.numberCompletedInstancesOf(this) +
                            " completed instances and is to be scheduled on timeline day: " +
                            timeline.currentDay +
                            " with scheduledDay of: " +
                            scheduledDay +
                            " and daysToWait: " +
                            daysToWait,
                    );
                }
                return new ScheduledEventInstance(this, time + daysToWait, this.instanceNumber(timeline));
            } else if (completedEvent.getScheduledEvent().getName() === this.getName() && this.anyRepeatsNotCompleted(timeline)) {
                // TODO: determine why this is never taken
                console.log(
                    " '" +
                        this.getName() +
                        "' with " +
                        timeline.numberCompletedInstancesOf(this) +
                        " completed instances is to be scheduled on timeline day: " +
                        timeline.currentDay +
                        " with repeat on scheduledDay of: " +
                        scheduledDay,
                );
                return new ScheduledEventInstance(this, time + scheduledDay, this.instanceNumber(timeline));
            } else {
                console.log(
                    " '" +
                        this.getName() +
                        "' is a repeating event with " +
                        timeline.numberCompletedInstancesOf(this) +
                        " completed instances NOT to be scheduled on timeline day: " +
                        timeline.currentDay +
                        " with scheduledDay of: " +
                        scheduledDay,
                );
                return null;
            }
        } else {
            // console.log("getInstanceIfEventIsReady scheduledDay: " + scheduledDay);
            if ([ScheduledEventState.Scheduled, ScheduledEventState.Completed].includes(this.getState())) {
                return null;
            }
            if (timeline.noCompletedInstanceOf(this) && scheduledDay != undefined && scheduledDay >= timeline.currentDay) {
                console.log(
                    " '" +
                        this.getName() +
                        "' is to be scheduled on timeline day: " +
                        timeline.currentDay +
                        " because it's scheduled day of: " +
                        scheduledDay +
                        " is available and beyond the current day",
                );
                return new ScheduledEventInstance(this, scheduledDay);
            } else {
                if (isNaN(timeline.currentDay)) {
                    console.log(" '" + this.getName() + "' is not a ready-to-schedule event because timeline.currentDay is NaN");
                }
                if (scheduledDay == undefined) {
                    console.log(
                        " '" +
                            this.getName() +
                            "' is not a ready-to-schedule event on timeline day: " +
                            timeline.currentDay +
                            " because its scheduled day is not available",
                    );
                } else {
                    if (timeline.completedEventLogging)
                        console.log(
                            " '" +
                                this.getName() +
                                "' is not a ready-to-schedule event on timeline day: " +
                                timeline.currentDay +
                                " with scheduled day of: " +
                                scheduledDay +
                                " because it's completed",
                        );
                }
                return null;
            }
        }
    }

    private addPeriodInstance(period: Period, scheduledStudyConfiguration: ScheduledStudyConfiguration, periodStartDay: number, timeline: Timeline) {
        // let periodInstance = new PeriodInstance(scheduledStudyConfiguration.getScheduledPeriod(period), this.day(timeline));
        let periodInstance = new PeriodEventInstance(scheduledStudyConfiguration.getScheduledPeriod(period), this.day(timeline));
        // console.log("ScheduledEvent.addPeriodInstance() for: " + this.getName() + " periodInstance: " + periodInstance.getName() + " period: " + period.name);
        timeline.addEvent(periodInstance as TimelineEventInstance);
    }

    // Do whatever is needed when the event is scheduled:
    // - As of now all we do is is log that the event was scheduled.
    scheduled(scheduledStudyConfiguration: ScheduledStudyConfiguration, timeline: Timeline, daysToWait: number) {
        if (timeline.scheduledLogging)
            console.log("scheduled: " + this.getName() + " on timeline.currentDay: " + timeline.currentDay + " with wait of: " + daysToWait);
    }

    /* 
  Do whatever is needed when the event is started:
    - As of now all we do is check if the event is the start of a new period and if so create a new PeriodInstance

    Note about setting the completion day of the period:
    - currentDayOfSchedule is the scheduled day which can be a negative value. 
    - timeline.currentDay is the day starting from 0/1 (depending on the studyStartDayNumber)
  */
    started(scheduledStudyConfiguration: ScheduledStudyConfiguration, timeline: Timeline, currentDayOfSchedule: number) {
        let period = this.configuredEvent.freOwner() as unknown as Period;
        let activePeriodInstance = timeline.getActivePeriod();
        if (activePeriodInstance) {
            if (activePeriodInstance.getName() != period.name) {
                console.log(
                    "Active period name is not equal to period of started event so setting new active period to: " +
                        period.name +
                        " and completing period: " +
                        activePeriodInstance.getName() +
                        " because event: '" +
                        this.getName() +
                        "' was started on timeline.currentDay: " +
                        timeline.currentDay +
                        " current day of Schedule: " +
                        currentDayOfSchedule,
                );
                activePeriodInstance.setCompleted(timeline.currentDay - 1); // Minus one because the period ends on the day before the day of the started event.
                this.addPeriodInstance(period, scheduledStudyConfiguration, null, timeline);
            }
        } else {
            console.log(
                "No active period so adding period: '" +
                    period.name +
                    "' because event: '" +
                    this.getName() +
                    "' was started on timeline.currentDay: " +
                    timeline.currentDay,
            );
            this.addPeriodInstance(period, scheduledStudyConfiguration, null, timeline);
        }
    }

    completeCurrentPeriod(timeline: Timeline, onDay: number) {
        let currentPeriodInstance = timeline.getActivePeriod();
        if (currentPeriodInstance) {
            console.log("Complete active Period: '" + currentPeriodInstance.getName() + "' on day: " + onDay + " because of event: '" + this.getName() + "'");
            currentPeriodInstance.setCompleted(onDay);
        } else {
            console.log("ERROR: No active period to complete on day: " + onDay + " for event: '" + this.getName() + "'");
        }
    }
}
