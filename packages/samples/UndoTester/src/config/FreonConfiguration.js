"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freonConfiguration = void 0;
var editor_1 = require("../editor");
var scoper_1 = require("../scoper");
var typer_1 = require("../typer");
var validator_1 = require("../validator");
var stdlib_1 = require("../stdlib");
/**
 * Class FreonConfiguration is the place where you can add all your customisations.
 * These will be used through the 'freonConfiguration' constant by any generated
 * part of your language environment.
 */
var FreonConfiguration = /** @class */ (function () {
    function FreonConfiguration() {
        // add your custom editor projections here
        this.customProjection = [new editor_1.CustomUndoModelProjection()];
        // add your custom editor actions here
        this.customActions = [new editor_1.CustomUndoModelActions()];
        // add your custom validations here
        this.customValidations = [new validator_1.CustomUndoModelValidator()];
        // add your custom scopers here
        this.customScopers = [new scoper_1.CustomUndoModelScoper()];
        // add your custom type-providers here
        this.customTypers = [new typer_1.CustomUndoModelTyperPart()];
        // add extra predefined instances here
        this.customStdLibs = [new stdlib_1.CustomUndoModelStdlib()];
    }
    return FreonConfiguration;
}());
exports.freonConfiguration = new FreonConfiguration();
