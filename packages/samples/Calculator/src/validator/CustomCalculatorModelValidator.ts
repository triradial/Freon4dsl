// Generated by the Freon Language Generator.
import { FreError, FreErrorSeverity } from "@freon4dsl/core";
import { CalculatorModelDefaultWorker } from "../utils/gen/CalculatorModelDefaultWorker.js";
import { CalculatorModelCheckerInterface } from "./gen/CalculatorModelValidator.js";

export class CustomCalculatorModelValidator extends CalculatorModelDefaultWorker implements CalculatorModelCheckerInterface {
    errorList: FreError[] = [];
}
