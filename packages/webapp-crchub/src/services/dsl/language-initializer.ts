import { fileExtensions, languageName, projectionNames, projectionsShown, unitTypes } from "./language-store.js";
import { FreProjectionHandler, FreLanguage, FreUndoManager, type FreEnvironment } from "@freon4dsl/core";
import { setUserMessage } from "./usermessage-store.js";
import { WebappConfigurator } from "./webapp-configurator.js";

export class LanguageInitializer {
    /**
     * Fills the Webapp Stores with initial values that describe the language,
     * and make sure that the editor is able to get user message to the webapp.
     */
    static initialize(): void {
        let langEnv: FreEnvironment | undefined = WebappConfigurator.getInstance().editorEnvironment;
        if (!langEnv) {
            return;
        }
        // the language name
        languageName.value = langEnv.languageName;

        // the names of the unit types
        unitTypes.list = FreLanguage.getInstance().getUnitNames();

        // the file extensions for all unit types
        // because 'langEnv.fileExtensions.values()' is not an Array but an IterableIterator,
        // we transfer the value to a tmp array.
        const tmp: string[] = [];
        for (const val of langEnv.fileExtensions.values()) {
            tmp.push(val);
        }
        fileExtensions.list = tmp;

        // the names of the projections / views
        const proj: FreProjectionHandler = langEnv.editor.projection;
        let nameList: string[] = proj.projectionNames();
        projectionNames.list = nameList;
        projectionsShown.list = nameList; // initially, all projections are shown

        // let the editor know how to set the user message,
        // we do this by assigning our own method to the editor's method
        langEnv.editor.setUserMessage = setUserMessage;

        // start the undo manager
        FreUndoManager.getInstance();
    }
}
