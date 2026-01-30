// Generated my Freon once, will NEVER be overwritten.
import { IMainInterpreter, InterpreterContext, RtBoolean, RtError, RtNumber, RtObject, RtString, ownerOfType } from "@freon4dsl/core";
import * as Sim from "../custom/simjs/sim.js";
import { TimelineChartTemplate } from "../custom/templates/TimelineChartTemplate.js";
import { TimelineTableTemplate } from "../custom/templates/TimelineTableTemplate.js";
import { RtObjectScheduledEventWrapper } from "../custom/timeline/ScheduledEvent.js";
import { Simulator } from "../custom/timeline/Simulator.js";
import { Timeline } from "../custom/timeline/Timeline.js";
import * as language from "../language/gen/index.js";
import { StudyConfiguration, StudyConfigurationModel } from "../language/gen/index.js";
import { StudyConfigurationModelInterpreterBase } from "./gen/StudyConfigurationModelInterpreterBase.js";

let main: IMainInterpreter;

function calcTimeAmount(value: number, unit: string): RtObject {
    let unitAmount: number;
    // console.log("entered calcTimeAmount");
    // console.log("calcTimeAmount: value: " + value + ", unit: " + unit);
    if (unit === "hours") {
        unitAmount = 1 / 24; // Assuming 1 hour is 1/24 of a day
    } else if (unit === "days") {
        unitAmount = 1;
    } else if (unit === "weeks") {
        unitAmount = 7;
    } else if (unit === "months") {
        unitAmount = 30;
    } else if (unit === "forever") {
        throw new RtError("calcTimeAmount: unit of forever not implemented. Need to use some special value or maybe forever doesn't make sense.");
    } else {
        throw new RtError("calcTimeAmount: unit of: " + unit + " not implemented");
    }
    let result = value * unitAmount;
    // console.log("calcTimeAmount: result: " + result);
    return new RtNumber(result);
}

/**
 * The class containing all interpreter functions written by the language engineer.
 * This class is initially empty, and will not be overwritten if it already exists.
 */
export class StudyConfigurationModelInterpreter extends StudyConfigurationModelInterpreterBase {
  constructor(m: IMainInterpreter) {
    super();
    main = m;
  }

  evalStudyConfiguration(
    node: language.StudyConfiguration,
    ctx: InterpreterContext
  ): RtObject {
    try {
      var simulator;
      var studyConfigurationModel: StudyConfigurationModel;
      const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.

      new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
      let studyConfigurationUnit = node as StudyConfiguration;
      simulator = new Simulator(studyConfigurationUnit);

      // WHEN the study is simulated and a timeline picture is generated
      simulator.run();
      let timeline = simulator.timeline;

      const timelineDataAsScript =
        TimelineChartTemplate.getTimelineDataHTML(timeline);
      const timelineVisualizationHTML =
        TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
      const styles = ``;
      const tableHTML =
        TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
      const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(
        timelineDataAsScript + timelineVisualizationHTML
      );
      const html = `${styles}<div class="limited-width-container">${tableHTML + chartHTML}</div>`;
      return new RtString(html);
    } catch (e: any) {
      return new RtString(e.message);
    }
  }

  evalAndExpression(
    node: language.AndExpression,
    ctx: InterpreterContext
  ): RtObject {
    const left = main.evaluate(node.left, ctx) as RtBoolean;
    const right = main.evaluate(node.right, ctx) as RtBoolean;
    return left.and(right);
  }

  evalDay(node: language.Day, ctx: InterpreterContext): RtObject {
    // console.log("entered evalDay");
    // console.log("evalDay node: " + node.startDay);
    return new RtNumber(node.startDay);
  }

  evalDaily(node: language.Daily, ctx: InterpreterContext): RtObject {
    return new RtNumber(1);
  }

  evalEqualsExpression(
    node: language.EqualsExpression,
    ctx: InterpreterContext
  ): RtObject {
    const left = main.evaluate(node.left, ctx);
    const right = main.evaluate(node.right, ctx);
    return left.equals(right);
  }

  evalEventReference(
    node: language.EventReference,
    ctx: InterpreterContext
  ): RtObject {
    // console.log("entered evalEventReference");
    const timeline = ctx.find("timeline") as unknown as Timeline;
    const referencedEvent = node.$event;
    const eventState = node.eventState; //TODO: need to check for the correct state.

    let owningEvent = ownerOfType(node, "Event") as language.Event;
    if (referencedEvent == undefined || referencedEvent == null) {
        console.log("evalEventReference: referencedEvent is null/undefined for owningEvent");
        return undefined;
    }
    const referencedEventName = (referencedEvent as { name?: string; referred?: { name?: string } })?.name ?? (referencedEvent as { referred?: { name?: string } })?.referred?.name;
    const eventStateName = (eventState as { name?: string })?.name ?? (eventState as { referred?: { name?: string } })?.referred?.name;
    console.log("evalEventReference: referencedEvent: " + referencedEventName);
    console.log("evalEventReference: referencedEvent: eventState: " + eventStateName);
    let lastInstanceOfReferencedEvent =
      timeline.getLastScheduledEventInstanceForThisEventsName(referencedEvent);
    if (
      lastInstanceOfReferencedEvent === null ||
      lastInstanceOfReferencedEvent === undefined
    ) {
      console.log(
          "The event '" +
              "owningEvent.name" +
              "' reference to: '" +
              "referencedEvent.name" +
              "' cannot be evaluated because the referenced event is not on the timeline",
      );
      return undefined; // Can't determine the time of the event because it's dependency hasn't reached the right status yet.
    } else {
      if (
        lastInstanceOfReferencedEvent.getScheduledEvent().isRepeatingEvent()
      ) {
        const nodeEventStateName = (node.eventState as { name?: string })?.name ?? (node.eventState as { referred?: { name?: string } })?.referred?.name;
        if (nodeEventStateName === (language.EventState.eachCompleted as { name?: string })?.name) {
          const numberOfReferencedEventCompleted =
            timeline.numberCompletedInstancesOf(
              lastInstanceOfReferencedEvent.getScheduledEvent()
            );
          let owningScheduledEvent = (
            ctx.find("scheduledEvent") as RtObjectScheduledEventWrapper
          ).getScheduledEvent();
          const numberOfThisEventCompleted =
            timeline.numberCompletedInstancesOf(owningScheduledEvent);
          if (numberOfReferencedEventCompleted <= numberOfThisEventCompleted) {
            if (
              numberOfReferencedEventCompleted >=
              owningScheduledEvent.numberOfRepeats(timeline) + 1
            ) {
              console.log(
                "The event '" +
                  (owningEvent as { name?: string })?.name +
                  "' has a each-completed reference to:'" +
                  referencedEventName +
                  "' and the parallel repeating event hasn't completed yet so the expression containing it cannot yet be evaluated"
              );
            } else {
              console.log(
                "The event '" +
                  (owningEvent as { name?: string })?.name +
                  "' has a each-completed reference to:'" +
                  referencedEventName +
                  "' and the parallel repeating event is completed"
              );
            }
            return undefined; // dependency on a repeating event that we run in parallel with and the parallel event hasn't completed yet
          }
        } else {
          if (
            lastInstanceOfReferencedEvent
              .getScheduledEvent()
              .anyRepeatsNotCompleted(timeline)
          ) {
            console.log(
              "The event '" +
                (owningEvent as { name?: string })?.name +
                "' has a reference to:'" +
                referencedEventName +
                "' a repeating event that hasn't completed yet so the expression containing it cannot yet be evaluated"
            );
            return undefined; // dependency on a repeating event that hasn't completed yet
          }
        }
      }
      let result = lastInstanceOfReferencedEvent.startDay;
      // if (eventState.name === language.EventState.completed.name || eventState.name === language.EventState.eachCompleted.name) {
      //     result = result + 1;
      // }
      const when = node.freOwner() as language.When;
      if (when.timeAmountPart !== undefined && when.timeAmountPart !== null) {
        const timeAmount = main.evaluate(when.timeAmountPart, ctx) as RtNumber;
        return new RtNumber(result + timeAmount.value);
      } else {
        return new RtNumber(result);
      }
    }
  }

  evalPrevious(node: language.Previous, ctx: InterpreterContext): RtObject {
    const timeline = ctx.find("timeline") as unknown as Timeline;
    const lastCompletedEvent =
      timeline.getLastCompletedScheduledEventInstance();
    console.log("evalPrevious: lastCompletedEvent: " + lastCompletedEvent?.startDay);
    if (node.timeAmountPart !== undefined && node.timeAmountPart !== null) {
      const timeAmount = main.evaluate(node.timeAmountPart, ctx) as RtNumber;
      console.log("evalPrevious: timeAmount: " + timeAmount.value);
      return new RtNumber(lastCompletedEvent.startDay + timeAmount.value);
    } else {
      console.log("evalPrevious without time amount: lastCompletedEvent.startDay: " + lastCompletedEvent?.startDay);
      return new RtNumber(lastCompletedEvent?.startDay);
    }
  }

  evalGreaterThenExpression(
    node: language.GreaterThenExpression,
    ctx: InterpreterContext
  ): RtObject {
    const left = main.evaluate(node.left, ctx) as RtNumber;
    const right = main.evaluate(node.right, ctx) as RtNumber;
    return RtBoolean.of(left.value > right.value);
  }

  evalMinusExpression(
    node: language.MinusExpression,
    ctx: InterpreterContext
  ): RtObject {
    const left = main.evaluate(node.left, ctx);
    const right = main.evaluate(node.right, ctx);
    return (left as RtNumber).minus(right as RtNumber);
  }

  evalMonthly(node: language.Monthly, ctx: InterpreterContext): RtObject {
    return new RtNumber(30);
  }

  evalNumber(
    node: language.NumberLiteralExpression,
    ctx: InterpreterContext
  ): RtObject {
    return new RtNumber(node.value);
  }

  evalNumberLiteralExpression(
    node: language.NumberLiteralExpression,
    ctx: InterpreterContext
  ): RtObject {
    return new RtNumber(node.value);
  }

  evalOrExpression(
    node: language.OrExpression,
    ctx: InterpreterContext
  ): RtObject {
    const left = main.evaluate(node.left, ctx) as RtBoolean;
    const right = main.evaluate(node.right, ctx) as RtBoolean;
    return left.or(right);
  }

  evalPlusExpression(
    node: language.PlusExpression,
    ctx: InterpreterContext
  ): RtObject {
    const left = main.evaluate(node.left, ctx);
    const right = main.evaluate(node.right, ctx);
    return (left as RtNumber).plus(right as RtNumber);
  }

  evalRepeatCount(
    node: language.RepeatCount,
    ctx: InterpreterContext
  ): RtObject {
    return new RtNumber(node.repeatCount);
  }

  evalRepeatEvery(
    node: language.RepeatEvery,
    ctx: InterpreterContext
  ): RtObject {
    let timeInDays = main.evaluate(node.repeatEvery, ctx) as RtNumber;
    return timeInDays;
  }

  // StartDay is used in expressions vs. StudyStart is used in Scheduling. Will this be confusing to users?
  evalStartDay(node: language.StartDay, ctx: InterpreterContext): RtObject {
    let studyStartDayNumber = ctx.find("studyStartDayNumber") as RtNumber;
    return studyStartDayNumber;
  }

  // StartDay is used in expressions vs. StudyStart is used in Scheduling. Will this be confusing to users?
  evalStudyStart(node: language.StudyStart, ctx: InterpreterContext): RtObject {
    let studyStartDayNumber = ctx.find("studyStartDayNumber") as RtNumber;
    let startDay = studyStartDayNumber.value;
    if (node.timeAmountPart !== undefined && node.timeAmountPart !== null) {
      const timeAmount = main.evaluate(node.timeAmountPart, ctx) as RtNumber;
      return new RtNumber(timeAmount.value + startDay);
    } else {
      return studyStartDayNumber;
    }
  }

  evalFirstDayOfStudy(
    node: language.FirstDayOfStudy,
    ctx: InterpreterContext
  ): RtObject {
    // TODO: Ask Jos if should create an expression for this rather than hardcoding the operator.
    let studyStartDayNumber = ctx.find("studyStartDayNumber") as RtNumber;
    let startDay = studyStartDayNumber.value;
    if (node.timeAmountPart !== undefined && node.timeAmountPart !== null) {
      const timeAmount = main.evaluate(node.timeAmountPart, ctx) as RtNumber;
      return new RtNumber(timeAmount.value + startDay);
    } else {
      return studyStartDayNumber;
    }
  }

  evalBaseline(node: language.Baseline, ctx: InterpreterContext): RtObject {
    return this.evalFirstDayOfStudy(node, ctx);
  }

  evalTimeAmountPart(
    node: language.TimeAmountPart,
    ctx: InterpreterContext
  ): RtObject {
    let result = 0;
    if (node !== undefined && node !== null) {
      let displacementFromEvent = main.evaluate(
        node.timeAmount,
        ctx
      ) as RtNumber;
      const op = node.operator as { name?: string; referred?: { name?: string } } | null | undefined;
      const operator = op?.name ?? op?.referred?.name ?? "";
      if (operator === (language.SimpleOperators.plus as { name?: string })?.name) {
        result = result + displacementFromEvent.value;
      } else if (operator === (language.SimpleOperators.minus as { name?: string })?.name) {
        result = result - displacementFromEvent.value;
      } else {
        throw new RtError(
          "evalTimeAmountPart: operator of: " + operator + " not implemented"
        );
      }
    }

    return new RtNumber(result);
  }

  evalTimeAmount(node: language.TimeAmount, ctx: InterpreterContext): RtObject {
    const unit = node.unit as { name?: string; referred?: { name?: string } } | null | undefined;
    const unitName = unit?.name ?? unit?.referred?.name ?? "day";
    return calcTimeAmount(node.value, unitName);
  }

  evalTime(node: language.Time, ctx: InterpreterContext): RtObject {
    //TODO: Unify TimeAmount and Time?
    const value = Number(node.value);
    const unit = node.unit as { name?: string; referred?: { name?: string } } | null | undefined;
    const unitName = unit?.name ?? unit?.referred?.name ?? "day";
    return calcTimeAmount(value, unitName);
  }

  evalWeekly(node: language.Weekly, ctx: InterpreterContext): RtObject {
    return new RtNumber(7);
  }

  evalWhen(node: language.When, ctx: InterpreterContext): RtObject {
    // console.log("entered evalWhen: " + node.startWhen.freLanguageConcept);
    return main.evaluate(node.startWhen, ctx);
  }

  // Unscheduled events don't have a predetermined schedule day - they are only
  // added to a patient's schedule when explicitly triggered (e.g., termination,
  // adverse event, protocol deviation). Return undefined so the simulator 
  // skips scheduling them automatically.
  evalUnscheduled(node: language.Unscheduled, ctx: InterpreterContext): RtObject {
    return undefined;
  }

  // AnyDay extends Unscheduled - same behavior
  evalAnyDay(node: language.AnyDay, ctx: InterpreterContext): RtObject {
    return undefined;
  }
}
