import { FreProjectionHandler, FreLogger, type FreEnvironment, AstActionExecutor } from "@freon4dsl/core";
import { runInAction } from "mobx";
import { WebappConfigurator } from "./webapp-configurator.js";

const LOGGER = new FreLogger("EditorRequestsHandler"); // .mute();

export class EditorRequestsHandler {
    private static instance: EditorRequestsHandler;
    static getInstance(): EditorRequestsHandler {
        if (EditorRequestsHandler.instance === null || EditorRequestsHandler.instance === undefined) {
            EditorRequestsHandler.instance = new EditorRequestsHandler();
        }
        return EditorRequestsHandler.instance;
    }

    private environment: FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;

    /**
     * Makes sure that the editor shows the current unit using the projections selected by the user
     * @param names
     */
    enableProjections(names: string[]): void {
        LOGGER.log("enabling Projection " + names);
        const proj = this.environment.editor.projection;
        if (proj instanceof FreProjectionHandler) {
            proj.enableProjections(names);
        }
        runInAction(() => {
            this.environment.editor.forceRecalculateProjection++;
        })
    }

    redo = (): void => {
        AstActionExecutor.getInstance(this.environment.editor).redo();
    }

    undo = (): void => {
        AstActionExecutor.getInstance(this.environment.editor).undo();
    }

    cut = (): void => {
        AstActionExecutor.getInstance(this.environment.editor).cut();
    }

    copy = (): void => {
        AstActionExecutor.getInstance(this.environment.editor).copy();
    }

    paste = (): void => {
        AstActionExecutor.getInstance(this.environment.editor).paste();
    }
}
