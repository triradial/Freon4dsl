import { type FreEnvironment, type IServerCommunication } from "@freon4dsl/core";
import { LanguageInitializer } from "./language-initializer.js";

export class WebappConfigurator {
    private static instance: WebappConfigurator;

    static getInstance(): WebappConfigurator {
        if (WebappConfigurator.instance === null || WebappConfigurator.instance === undefined) {
            WebappConfigurator.instance = new WebappConfigurator();
        }
        return WebappConfigurator.instance;
    }

    serverCommunication!: IServerCommunication;
    editorEnvironment!: FreEnvironment;

    setServerCommunication(serverCommunication: IServerCommunication): void {
        WebappConfigurator.getInstance().serverCommunication = serverCommunication;
    }

    setEditorEnvironment(editorEnvironment: FreEnvironment): void {
        WebappConfigurator.getInstance().editorEnvironment = editorEnvironment;
        LanguageInitializer.initialize();
    }
}
