import { type FreProjection, type FreCombinedActions, type FreTyper, type FreStdlib, type FreScoper } from "@freon4dsl/core";
import { type StudyConfigurationModelCheckerInterface } from "../src/validator/index.js";
declare class FreonConfiguration {
    customProjection: FreProjection[];
    customActions: FreCombinedActions[];
    customValidations: StudyConfigurationModelCheckerInterface[];
    customScopers: FreScoper[];
    customTypers: FreTyper[];
    customStdLibs: FreStdlib[];
}
export declare const freonConfiguration: FreonConfiguration;
export {};
//# sourceMappingURL=FreonConfiguration.d.ts.map