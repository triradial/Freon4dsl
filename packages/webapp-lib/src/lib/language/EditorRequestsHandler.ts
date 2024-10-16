import {
    FreProjectionHandler,
    FreError,
    FreLogger,
    FreSearcher,
    type FreEnvironment,
    AstActionExecutor,
} from "@freon4dsl/core";
import type { FreNode } from "@freon4dsl/core";
import { runInAction } from "mobx";
import {
    activeTab,
    errorsLoaded,
    errorTab, modelErrors,
    searchResultLoaded,
    searchResults,
    searchTab,
} from "../components/stores/InfoPanelStore.js";
import { EditorState } from "./EditorState.js";
import { WebappConfigurator } from "$lib/WebappConfigurator.js";

const LOGGER = new FreLogger("EditorRequestsHandler"); // .mute();

export class EditorRequestsHandler {
    private static instance: EditorRequestsHandler = null;

    static getInstance(): EditorRequestsHandler {
        if (EditorRequestsHandler.instance === null) {
            EditorRequestsHandler.instance = new EditorRequestsHandler();
        }
        return EditorRequestsHandler.instance;
    }

    private langEnv: FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;

    /**
     * Makes sure that the editor shows the current unit using the projections selected by the user
     * @param names
     */
    enableProjections(names: string[]): void {
        LOGGER.log("enabling Projection " + names);
        const proj = this.langEnv.editor.projection;
        if (proj instanceof FreProjectionHandler) {
            proj.enableProjections(names);
        }
        // Let the editor know that the projections have changed.
        // TODO: This should go automatically through mobx.
        //       But observing the projections array does not work as expected.
        runInAction( () => {
            this.langEnv.editor.forceRecalculateProjection++;
        })
        // redo the validation to set the errors in the new box tree
        // todo reinstate the following statement
        // this.validate();
    }

    redo = (): void => {
        AstActionExecutor.getInstance(this.langEnv.editor).redo();
    }

    undo = (): void => {
        AstActionExecutor.getInstance(this.langEnv.editor).undo();
    }

    cut = (): void => {
        AstActionExecutor.getInstance(this.langEnv.editor).cut();
    }

    copy = (): void => {
        AstActionExecutor.getInstance(this.langEnv.editor).copy();
    }

    paste = (): void => {
        AstActionExecutor.getInstance(this.langEnv.editor).paste();
    }

    validate = (): void => {
        LOGGER.log("validate called");
        errorsLoaded.set(false);
        activeTab.set(errorTab);
        EditorState.getInstance().getErrors();
        errorsLoaded.set(true);
        if (!!modelErrors[0]) {
            EditorState.getInstance().selectElement(modelErrors[0].reportedOn);
        }
    }

    findText(stringToFind: string) {
        // todo loading of errors and search results should also depend on whether something has changed in the unit shown
        LOGGER.log("findText called");
        searchResultLoaded.set(false);
        activeTab.set(searchTab);
        const searcher = new FreSearcher();
        const results: FreNode[] = searcher.findString(
            stringToFind,
            EditorState.getInstance().currentUnit,
            this.langEnv.writer,
        );
        this.showSearchResults(results, stringToFind);
    }

    findStructure(elemToMatch: Partial<FreNode>) {
        LOGGER.log("findStructure called");
        searchResultLoaded.set(false);
        activeTab.set(searchTab);
        const searcher = new FreSearcher();
        const results: FreNode[] = searcher.findStructure(elemToMatch, EditorState.getInstance().currentUnit);
        this.showSearchResults(results, "elemToMatch");
    }

    findNamedElement(nameToFind: string, metatypeSelected: string) {
        LOGGER.log("findNamedElement called");
        searchResultLoaded.set(false);
        activeTab.set(searchTab);
        const searcher = new FreSearcher();
        const results: FreNode[] = searcher.findNamedElement(
            nameToFind,
            EditorState.getInstance().currentUnit,
            metatypeSelected,
        );
        this.showSearchResults(results, nameToFind);
    }

    private showSearchResults(results: FreNode[], stringToFind: string) {
        const itemsToShow: FreError[] = [];
        if (!results || results.length === 0) {
            itemsToShow.push(new FreError("No results for " + stringToFind, null, "", ""));
        } else {
            for (const elem of results) {
                // message: string, element: FreNode | FreNode[], locationdescription: string, severity?: FreErrorSeverity
                // todo show some part of the text string instead of the element id
                itemsToShow.push(new FreError(elem.freId(), elem, elem.freId(), ""));
            }
        }
        searchResults.set(itemsToShow);
        searchResultLoaded.set(true);
    }
}
