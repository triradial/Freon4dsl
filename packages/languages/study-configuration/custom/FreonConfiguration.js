import { CustomStudyConfigurationModelActions } from "./CustomStudyConfigurationModelActions.js";
import { CustomStudyConfigurationModelProjection } from "./CustomStudyConfigurationModelProjection.js";
import { CustomStudyConfigurationModelScoper } from "./CustomStudyConfigurationModelScoper.js";
import { CustomStudyConfigurationModelTyperPart } from "./CustomStudyConfigurationModelTyperPart.js";
import { CustomStudyConfigurationModelValidator } from "./CustomStudyConfigurationModelValidator.js";
import { CustomStudyConfigurationModelStdlib } from "./CustomStudyConfigurationModelStdlib.js";
class FreonConfiguration {
    constructor() {
        this.customProjection = [new CustomStudyConfigurationModelProjection()];
        this.customActions = [new CustomStudyConfigurationModelActions()];
        this.customValidations = [new CustomStudyConfigurationModelValidator()];
        this.customScopers = [new CustomStudyConfigurationModelScoper()];
        this.customTypers = [new CustomStudyConfigurationModelTyperPart()];
        this.customStdLibs = [new CustomStudyConfigurationModelStdlib()];
    }
}
export const freonConfiguration = new FreonConfiguration();
//# sourceMappingURL=FreonConfiguration.js.map