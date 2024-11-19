import { FreError, FreErrorSeverity } from "@freon4dsl/core";
import { StudyConfigurationModelDefaultWorker } from "../utils/gen/StudyConfigurationModelDefaultWorker.js";
import { StudyConfigurationModelCheckerInterface } from "./gen/StudyConfigurationModelValidator.js";
import { Event } from "../language/gen/index.js";

export class CustomStudyConfigurationModelValidator extends StudyConfigurationModelDefaultWorker implements StudyConfigurationModelCheckerInterface {
    errorList: FreError[] = [];

    public override execAfterEvent(_modelelement: Event): boolean {
        let result = super.execBeforeEvent(_modelelement);
        const errorIndex = this.errorList.indexOf(
            this.errorList.find((error) => {
                return error.message === "Property 'alternativeName' must have a value";
            }),
        );
        if (errorIndex !== -1) {
            console.log("execBeforeEvent removing alternativeName error");
            this.errorList.splice(errorIndex, 1);
        }
        return false;
    }
}
