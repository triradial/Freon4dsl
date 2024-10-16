// Generated by the Freon Language Generator.
import { FreProjection, FreCombinedActions, FreTyper, FreStdlib, FreScoper } from "@freon4dsl/core";
import { CustomEntityModelActions, CustomEntityModelProjection } from "../editor/index.js";
import { CustomEntityModelScoper } from "../scoper/index.js";
import { CustomEntityModelTyperPart } from "../typer/index.js";
import { CustomEntityModelValidator } from "../validator/index.js";
import { CustomEntityModelStdlib } from "../stdlib/index.js";
import { EntityModelCheckerInterface } from "../validator/gen/index.js";

/**
 * Class FreonConfiguration is the place where you can add all your customisations.
 * These will be used through the 'freonConfiguration' constant by any generated
 * part of your language environment.
 */
class FreonConfiguration {
    // add your custom editor projections here
    customProjection: FreProjection[] = [new CustomEntityModelProjection()];
    // add your custom editor actions here
    customActions: FreCombinedActions[] = [new CustomEntityModelActions()];
    // add your custom validations here
    customValidations: EntityModelCheckerInterface[] = [new CustomEntityModelValidator()];
    // add your custom scopers here
    customScopers: FreScoper[] = [new CustomEntityModelScoper()];
    // add your custom type-providers here
    customTypers: FreTyper[] = [new CustomEntityModelTyperPart()];
    // add extra predefined instances here
    customStdLibs: FreStdlib[] = [new CustomEntityModelStdlib()];
}

export const freonConfiguration = new FreonConfiguration();
