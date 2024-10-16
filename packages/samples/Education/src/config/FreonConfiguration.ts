// Generated by the Freon Language Generator.
import { FreProjection, FreCombinedActions, FreTyper, FreStdlib, FreScoper } from "@freon4dsl/core";
import { CustomEducationActions, CustomEducationProjection } from "../editor/index.js";
import { CustomEducationScoper } from "../scoper/index.js";
import { CustomEducationTyperPart } from "../typer/index.js";
import { CustomEducationValidator } from "../validator/index.js";
import { CustomEducationStdlib } from "../stdlib/index.js";
import { EducationCheckerInterface } from "../validator/gen/index.js";

/**
 * Class FreonConfiguration is the place where you can add all your customisations.
 * These will be used through the 'freonConfiguration' constant by any generated
 * part of your language environment.
 */
class FreonConfiguration {
    // add your custom editor projections here
    customProjection: FreProjection[] = [new CustomEducationProjection()];
    // add your custom editor actions here
    customActions: FreCombinedActions[] = [new CustomEducationActions()];
    // add your custom validations here
    customValidations: EducationCheckerInterface[] = [new CustomEducationValidator()];
    // add your custom scopers here
    customScopers: FreScoper[] = [new CustomEducationScoper()];
    // add your custom type-providers here
    customTypers: FreTyper[] = [new CustomEducationTyperPart()];
    // add extra predefined instances here
    customStdLibs: FreStdlib[] = [new CustomEducationStdlib()];
}

export const freonConfiguration = new FreonConfiguration();
