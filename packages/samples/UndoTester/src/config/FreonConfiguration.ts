// Generated by the Freon Language Generator.
import { FreProjection, FreCombinedActions, FreTyper, FreStdlib, FreScoper } from "@freon4dsl/core";
import { CustomUndoModelActions, CustomUndoModelProjection } from "../editor/index.js";
import { CustomUndoModelScoper } from "../scoper/index.js";
import { CustomUndoModelTyperPart } from "../typer/index.js";
import { CustomUndoModelValidator } from "../validator/index.js";
import { CustomUndoModelStdlib } from "../stdlib/index.js";
import { UndoModelCheckerInterface } from "../validator/gen/index.js";

/**
 * Class FreonConfiguration is the place where you can add all your customisations.
 * These will be used through the 'freonConfiguration' constant by any generated
 * part of your language environment.
 */
class FreonConfiguration {
    // add your custom editor projections here
    customProjection: FreProjection[] = [new CustomUndoModelProjection()];
    // add your custom editor actions here
    customActions: FreCombinedActions[] = [new CustomUndoModelActions()];
    // add your custom validations here
    customValidations: UndoModelCheckerInterface[] = [new CustomUndoModelValidator()];
    // add your custom scopers here
    customScopers: FreScoper[] = [new CustomUndoModelScoper()];
    // add your custom type-providers here
    customTypers: FreTyper[] = [new CustomUndoModelTyperPart()];
    // add extra predefined instances here
    customStdLibs: FreStdlib[] = [new CustomUndoModelStdlib()];
}

export const freonConfiguration = new FreonConfiguration();
