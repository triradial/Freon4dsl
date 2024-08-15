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
import { RulesModelInterpreterInit } from "./gen/RulesModelInterpreterInit";

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
export class MainRulesModelInterpreter implements FreInterpreter {
    private static main: IMainInterpreter = null;

    constructor() {
        if (MainRulesModelInterpreter.main === null) {
            MainRulesModelInterpreter.main = MainInterpreter.instance(RulesModelInterpreterInit, getConceptFunction, getPropertyFunction);
        }
    }

    setTracing(value: boolean) {
        MainRulesModelInterpreter.main.setTracing(value);
    }

    getTrace(): InterpreterTracer {
        return MainRulesModelInterpreter.main.getTrace();
    }

    evaluate(node: Object): RtObject {
        MainRulesModelInterpreter.main.reset();
        try {
            return MainRulesModelInterpreter.main.evaluate(node, InterpreterContext.EMPTY_CONTEXT);
        } catch (e: any) {
            return new RtError(e.message);
        }
    }

    evaluateWithContext(node: Object, ctx: InterpreterContext): RtObject {
        MainRulesModelInterpreter.main.reset();
        try {
            return MainRulesModelInterpreter.main.evaluate(node, ctx);
        } catch (e: any) {
            return new RtError(e.message);
        }
    }
}
