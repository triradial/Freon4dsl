import './app.css';
import { initializeApp } from './services/initialization/app-initialization.js';

import { WebappConfigurator } from "./services/dsl/webapp-configurator.js";
import { LanguageEnvironment } from "@freon4dsl/study-configuration";
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
const editorEnvironment = LanguageEnvironment.getInstance();
webappConfigurator.setEditorEnvironment(editorEnvironment);
webappConfigurator.setServerCommunication(serverComm);

setCustomComponents([
    { component: DatePicker, knownAs: "DatePicker" },
    { component: ExpandCollapseWrapperComponent, knownAs: "ExpandCollapseWrapper" },
    { component: TimePicker, knownAs: "TimePicker" },
]);

// Initialize the application
initializeApp();
