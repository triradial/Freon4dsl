import App from "./App.svelte";

import { WebappConfigurator } from "@freon4dsl/webapp-lib";
import { StudyConfigurationModelEnvironment } from "@freon4dsl/samples-study-configuration";
import { ServerCommunication } from "@freon4dsl/core";
import { setCustomComponents } from "@freon4dsl/core-svelte";
import { env } from "./config/env.js";

import DatePicker from "./components/custom/DatePicker.svelte";
import ExpandCollapseWrapperComponent from "./components/custom/ExpandCollapseWrapperComponent.svelte";
import TimePicker from "./components/custom/TimePicker.svelte";

// Configure the server connection settings
const serverComm = ServerCommunication.getInstance();
serverComm.setServerConfig({
    serverUrl: env.serverUrl,
    serverTimeout: env.serverTimeout
});

// Configure the editor environment
const webappConfigurator = WebappConfigurator.getInstance();
const editorEnvironment = StudyConfigurationModelEnvironment.getInstance();
webappConfigurator.setEditorEnvironment(editorEnvironment);
webappConfigurator.setServerCommunication(serverComm);

setCustomComponents([
    { component: DatePicker, knownAs: "DatePicker" },
    { component: ExpandCollapseWrapperComponent, knownAs: "ExpandCollapseWrapper" },
    { component: TimePicker, knownAs: "TimePicker" },
]);

async function initializeApp() {

    const app = new App({
        target: document.body,
        props: {},
    });

    return app;
}

export default initializeApp();
