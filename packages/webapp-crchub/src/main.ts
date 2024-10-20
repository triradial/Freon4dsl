import App from "./App.svelte";
import { Amplify } from "aws-amplify";
import awsconfig from "../amplifyconfiguration.json";

import { WebappConfigurator } from "@freon4dsl/webapp-lib";
import { StudyConfigurationModelEnvironment } from "@freon4dsl/samples-study-configuration";
import { ServerCommunication } from "@freon4dsl/core";
import { setCustomComponents } from "@freon4dsl/core-svelte";
import { initializeDatastore } from "./services/dataStore";

import DatePicker from "./components/custom/DatePicker.svelte";
import ExpandCollapseWrapperComponent from "./components/custom/ExpandCollapseWrapperComponent.svelte";
import TimePicker from "./components/custom/TimePicker.svelte";

WebappConfigurator.getInstance().setEditorEnvironment(StudyConfigurationModelEnvironment.getInstance());
WebappConfigurator.getInstance().setServerCommunication(ServerCommunication.getInstance());
setCustomComponents([
    { component: DatePicker, knownAs: "DatePicker" },
    { component: ExpandCollapseWrapperComponent, knownAs: "ExpandCollapseWrapper" },
    { component: TimePicker, knownAs: "TimePicker" },
]);

Amplify.configure(awsconfig);

async function initializeApp() {

    const app = new App({
        target: document.body,
        props: {
            // you can pass props here if needed
        },
    });

    return app;
}

export default initializeApp();
