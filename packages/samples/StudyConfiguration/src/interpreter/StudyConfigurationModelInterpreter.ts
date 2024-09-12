// Generated my Freon once, will NEVER be overwritten.
import { InterpreterContext, IMainInterpreter, RtObject, RtError, RtNumber, RtBoolean, RtString, ownerOfType } from "@freon4dsl/core";
import { StudyConfigurationModelInterpreterBase } from "./gen/StudyConfigurationModelInterpreterBase";
import * as language from "../language/gen/index";
import { Timeline } from "../custom/timeline/Timeline";

import * as Sim from "../custom/simjs/sim.js"
import { Simulator, } from "../custom/timeline/Simulator";
import { StudyConfiguration, StudyConfigurationModel } from "../custom/../language/gen/index";
import { StudyConfigurationModelEnvironment } from "../custom/../config/gen/StudyConfigurationModelEnvironment";
import { TimelineScriptTemplate } from "../custom/templates/TimelineScriptTemplate";
import { TimelineTableTemplate } from "../custom/templates/TimelineTableTemplate";
import { RtObjectScheduledEventWrapper, ScheduledEvent } from "custom/timeline/ScheduledEvent";

let main: IMainInterpreter;


function calcTimeAmount(value: number, unit: string, ): RtObject {
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
        throw new RtError("evalTimeAmount: unit of months not implemented. Need to calculate the number of days in a month.");
    } else if (unit === "forever") {
        throw new RtError("evalTimeAmount: unit of forever not implemented. Need to use some special value or maybe forever doesn't make sense.");
    } else {
        throw new RtError("evalTimeAmount: unit of: " + unit + " not implemented");
    }
    let result = value * unitAmount;
    // console.log("evalTimeAmount: result: " + result);
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

    evalStudyConfiguration(node: language.StudyConfiguration, ctx: InterpreterContext): RtObject {
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

            const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
            const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
            const chartHTML = TimelineScriptTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
            const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);

            return new RtString(tableHTML + TimelineTableTemplate.addSomeSpace() + chartHTML);
        } catch (e: any) {
            return new RtString(e.message);
        }
    }

    evalAndExpression(node: language.AndExpression, ctx: InterpreterContext): RtObject {
        const left = main.evaluate(node.left, ctx) as RtBoolean;
        const right = main.evaluate(node.right, ctx) as RtBoolean;
        return (left).and(right);
    }

    evalDay(node: language.Day, ctx: InterpreterContext): RtObject {
        // console.log("entered evalDay");
        // console.log("evalDay node: " + node.startDay);
        return new RtNumber(node.startDay);
    }

    evalDaily(node: language.Daily, ctx: InterpreterContext): RtObject {
        return new RtNumber(1);
    }

    evalEqualsExpression(node: language.EqualsExpression, ctx: InterpreterContext): RtObject {
        const left = main.evaluate(node.left, ctx);
        const right = main.evaluate(node.right, ctx);
        return (left).equals(right);
    }

    evalEventReference(node: language.EventReference, ctx: InterpreterContext): RtObject {
        // console.log("entered evalEventReference");
        const timeline = ctx.find("timeline") as unknown as Timeline;
        const referencedEvent = node.$event;
        const operator = node.operator;
        const timeAmount = node.timeAmount;
        const eventState = node.eventState;
        
        // let owningEvent = ((node.freOwner() as language.When).freOwner() as language.EventSchedule).freOwner() as language.Event;
        let owningEvent = ownerOfType(node, "Event") as language.Event; 
        // console.log("evalEventReference: referencedEvent: " + referencedEvent.name);
        // console.log("evalEventReference: referencedEvent: operator: " + operator.name);
        // console.log("evalEventReference: referencedEvent: timeAmount: " + timeAmount.value + " unit: " + timeAmount.unit.name);
        // console.log("evalEventReference: referencedEvent: eventState: " + eventState.name);
        let lastInstanceOfReferencedEvent = timeline.getLastInstanceForThisEvent(referencedEvent);
        if (lastInstanceOfReferencedEvent === null || lastInstanceOfReferencedEvent === undefined) {
            console.log("The event '" + owningEvent.name + "' reference to: '" + referencedEvent.name + "' cannot be evaluated because the referenced event is not on the timeline" );
            return undefined; // Can't determine the time of the event because it's dependency hasn't reached the right status yet.
        } else {
            if (owningEvent.name === 'V14-V18') {
                let fakeLastInstanceOfReferencedEvent = timeline.getLastInstanceForThisEvent(referencedEvent);
                console.log("evalEventReference: owningEvent: " + owningEvent.name + " fake: " + fakeLastInstanceOfReferencedEvent.scheduledEvent.getName() + " last: " + lastInstanceOfReferencedEvent.scheduledEvent.getName());
            }    
            if (lastInstanceOfReferencedEvent.scheduledEvent.isRepeatingEvent()) {
                if (node.eventState.name === language.EventState.eachCompleted.name) { 
                    const numberOfReferencedEventCompleted = timeline.numberCompletedInstancesOf(lastInstanceOfReferencedEvent.scheduledEvent);
                    let owningScheduledEvent = (ctx.find("scheduledEvent") as RtObjectScheduledEventWrapper).scheduledEvent; 
                    const numberOfThisEventCompleted = timeline.numberCompletedInstancesOf(owningScheduledEvent);
                    if (numberOfReferencedEventCompleted <= numberOfThisEventCompleted) {
                        console.log("The event '" + owningEvent.name + "' has a each-completed reference to:'" + referencedEvent.name + "' and the parallel repeating event hasn't completed yet so the expression containing it cannot yet be evaluated" );
                        return undefined; // dependency on a repeating event that we run in parallel with and the parallel event hasn't completed yet
                    }
                 } else { 
                    if (lastInstanceOfReferencedEvent.scheduledEvent.anyRepeatsNotCompleted(timeline)) {
                        console.log("The event '" + owningEvent.name + "' has a reference to:'" + referencedEvent.name + "' a repeating event that hasn't completed yet so the expression containing it cannot yet be evaluated" );
                        return undefined; // dependency on a repeating event that hasn't completed yet
                    }
                }
            }
            let displacementFromEvent = main.evaluate(node.timeAmount, ctx) as RtNumber;
            const result = lastInstanceOfReferencedEvent.startDay + displacementFromEvent.value;
            return new RtNumber(result);
        }
    }

    evalEventStart(node: language.EventStart, ctx: InterpreterContext): RtObject {
        if (node instanceof language.Day) {
            // console.log("evalEventStart: node is a Day");
            return main.evaluate(node, ctx);
        } else if (node instanceof language.When) {
            // console.log("evalEventStart: node is a When");
            return main.evaluate(node, ctx);
        } else {
            throw new RtError("evalEventSchedule: eventStart is not a Day or When");
        }
    }

    evalGreaterThenExpression(node: language.GreaterThenExpression, ctx: InterpreterContext): RtObject {
        const left = main.evaluate(node.left, ctx) as RtNumber;
        const right = main.evaluate(node.right, ctx) as RtNumber;
        return RtBoolean.of(left.value > right.value);
    }

    evalMinusExpression(node: language.MinusExpression, ctx: InterpreterContext): RtObject {
        const left = main.evaluate(node.left, ctx);
        const right = main.evaluate(node.right, ctx);
        return (left as RtNumber).minus(right as RtNumber);
    }

    evalMonthly(node: language.Monthly, ctx: InterpreterContext): RtObject {
        return new RtNumber(30);
    }

    evalNumber(node: language.NumberLiteralExpression, ctx: InterpreterContext): RtObject {
        return new RtNumber(node.value);
    }

    evalNumberLiteralExpression(node: language.NumberLiteralExpression, ctx: InterpreterContext): RtObject {
        return new RtNumber(node.value);
    }

    evalOrExpression(node: language.OrExpression, ctx: InterpreterContext): RtObject {
        const left = main.evaluate(node.left, ctx) as RtBoolean;
        const right = main.evaluate(node.right, ctx) as RtBoolean;
        return (left).or(right);
    }

    evalPlusExpression(node: language.PlusExpression, ctx: InterpreterContext): RtObject {
        const left = main.evaluate(node.left, ctx);
        const right = main.evaluate(node.right, ctx);
        return (left as RtNumber).plus(right as RtNumber);
    }

    evalRepeatCount(node: language.RepeatCount, ctx: InterpreterContext): RtObject {
        return new RtNumber(node.repeatCount)
    }

    evalRepeatEvery(node: language.RepeatEvery, ctx: InterpreterContext): RtObject {
        let timeInDays = main.evaluate(node.repeatEvery, ctx) as RtNumber;
        return timeInDays;
    }

    evalStartDay(node: language.StartDay, ctx: InterpreterContext): RtObject {
        return this.evalStudyStart(node, ctx); // TODO: decide if keeping both this and StudyStart is a necessary convenience; they should be merged?
    }

    evalStudyStart(node: language.StudyStart, ctx: InterpreterContext): RtObject {
        let studyStartDayNumber = ctx.find("studyStartDayNumber") as RtNumber;
        return studyStartDayNumber;
    }

    evalTimeAmount(node: language.TimeAmount, ctx: InterpreterContext): RtObject {
        return calcTimeAmount(node.value, node.unit.name);
    }

    evalTime(node: language.Time, ctx: InterpreterContext): RtObject {
        //TODO: Unify TimeAmount and Time?
        const value = Number(node.value);
        return calcTimeAmount(value, node.unit.name);
    }

    evalWeekly(node: language.Weekly, ctx: InterpreterContext): RtObject {
        return new RtNumber(7);
    }

    evalWhen(node: language.When, ctx: InterpreterContext): RtObject {
        // console.log("entered evalWhen");
        return main.evaluate(node.startWhen, ctx);
    }
}