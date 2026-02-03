import { type FreInterpreter, InterpreterContext, InterpreterTracer, RtObject } from "@freon4dsl/core";
export declare class MainStudyConfigurationModelInterpreter implements FreInterpreter {
    private static main;
    constructor();
    private static getMain;
    setTracing(value: boolean): void;
    getTrace(): InterpreterTracer;
    evaluate(node: Object): RtObject;
    evaluateWithContext(node: Object, ctx: InterpreterContext): RtObject;
}
//# sourceMappingURL=MainStudyConfigurationModelInterpreter.d.ts.map