import { FreError, FreErrorSeverity } from "@freon4dsl/core";
import { StudyConfigurationModelDefaultWorker } from "../utils/gen/StudyConfigurationModelDefaultWorker.js";
import { StudyConfigurationModelCheckerInterface } from "./gen/StudyConfigurationModelValidator.js";
import { Event } from "../language/gen/index.js";

// export class CustomStudyConfigurationModelValidator extends StudyConfigurationModelDefaultWorker implements StudyConfigurationModelCheckerInterface {
//     errorList: FreError[] = [];

//     public execBeforeEvent(_modelelement: Event): boolean {
//         console.log("XXX execBeforeEvent calling super.execBeforeEvent");
//         let result = super.execBeforeEvent(_modelelement);
//         console.log("entered execBeforeEvent result:", result);
//         console.log("execBeforeEvent before finding error", this.errorList.length);

//         const errorIndex = this.errorList.indexOf(
//             this.errorList.find((error) => {
//                 console.log("execBeforeEvent error.message", error.message);
//                 return error.message === "Property 'alternativeName' must have a value";
//             }),
//         );
//         console.log("execBeforeEvent errorIndex", errorIndex);
//         if (errorIndex !== -1) {
//             console.log("execBeforeEvent removing error");
//             this.errorList.splice(errorIndex, 1);
//             console.log("execBeforeEvent errorList", this.errorList.length);
//         }
//         return false;
//     }
// }

export class CustomStudyConfigurationModelValidator extends StudyConfigurationModelDefaultWorker implements StudyConfigurationModelCheckerInterface {
    errorList: FreError[] = [];

    public execBeforeEvent(_modelelement: Event): boolean {
        let result = super.execBeforeEvent(_modelelement);

        // Remove all 'alternativeName' errors at once
        this.errorList = this.errorList.filter(error =>
            error.message !== "Property 'alternativeName' must have a value"
        );

        // Return the original validation result to allow continued validation
        return result;
    }
}
