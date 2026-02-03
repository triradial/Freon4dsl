import { InterpreterContext, MainInterpreter, RtError, } from "@freon4dsl/core";
import { StudyConfigurationModelInterpreterInit } from "../src/interpreter/StudyConfigurationModelInterpreterInit.js";
const getPropertyFunction = (node) => {
    const index = node.freOwnerDescriptor().propertyIndex;
    return node.freOwnerDescriptor().propertyName + (index !== undefined ? "[" + index + "]" : "");
};
const getConceptFunction = (node) => {
    if (node === undefined) {
        return "";
    }
    return node.freLanguageConcept();
};
export class MainStudyConfigurationModelInterpreter {
    constructor() {
        MainStudyConfigurationModelInterpreter.getMain();
    }
    static getMain() {
        return (this.main ??= MainInterpreter.instance(StudyConfigurationModelInterpreterInit, getConceptFunction, getPropertyFunction));
    }
    setTracing(value) {
        MainStudyConfigurationModelInterpreter.getMain().setTracing(value);
    }
    getTrace() {
        return MainStudyConfigurationModelInterpreter.getMain().getTrace();
    }
    evaluate(node) {
        return this.evaluateWithContext(node, InterpreterContext.EMPTY_CONTEXT);
    }
    evaluateWithContext(node, ctx) {
        MainStudyConfigurationModelInterpreter.getMain().reset();
        try {
            return MainStudyConfigurationModelInterpreter.getMain().evaluate(node, ctx);
        }
        catch (e) {
            return new RtError(e.message);
        }
    }
}
MainStudyConfigurationModelInterpreter.main = null;
//# sourceMappingURL=MainStudyConfigurationModelInterpreter.js.map