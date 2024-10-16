// Generated by the Freon Language Generator.
// Generated my Freon, will be overwritten with every generation.
import {
    ConceptFunction,
    FreInterpreter,
    IMainInterpreter,
    InterpreterContext,
    InterpreterTracer,
    MainInterpreter,
    OwningPropertyFunction,
    FreNode,
    RtObject,
    RtError,
} from "@freon4dsl/core";
import { CalculatorModelInterpreterInit } from "./gen/CalculatorModelInterpreterInit.js";

const getPropertyFunction: OwningPropertyFunction = (node: Object) => {
    const index = (node as FreNode).freOwnerDescriptor().propertyIndex;
    return (node as FreNode).freOwnerDescriptor().propertyName + (index !== undefined ? "[" + index + "]" : "");
};

/**
 * Function that returns the concept name for `node`.
 * Used by the interpreter to find which evaluator should be use for each node.
 */
const getConceptFunction: ConceptFunction = (node: Object) => {
    if (node === undefined) {
        return "";
    }
    return (node as FreNode).freLanguageConcept();
};

/**
 * The facade around the actual interpreter to avoid improper usage.
 * Sets the functions used to access the expression tree.
 * Ensures all internal interpreter state is cleaned when creating a new instance.
 */
export class MainCalculatorModelInterpreter implements FreInterpreter {
    private static main: IMainInterpreter = null;

    constructor() {
        if (MainCalculatorModelInterpreter.main === null) {
            MainCalculatorModelInterpreter.main = MainInterpreter.instance(
                CalculatorModelInterpreterInit,
                getConceptFunction,
                getPropertyFunction,
            );
        }
    }

    setTracing(value: boolean) {
        MainCalculatorModelInterpreter.main.setTracing(value);
    }

    getTrace(): InterpreterTracer {
        return MainCalculatorModelInterpreter.main.getTrace();
    }

    evaluate(node: Object): RtObject {
        return this.evaluateWithContext(node, InterpreterContext.EMPTY_CONTEXT);
    }

    evaluateWithContext(node: Object, ctx: InterpreterContext): RtObject {
        MainCalculatorModelInterpreter.main.reset();
        try {
            return MainCalculatorModelInterpreter.main.evaluate(node, ctx);
        } catch (e: any) {
            return new RtError(e.message);
        }
    }
}
