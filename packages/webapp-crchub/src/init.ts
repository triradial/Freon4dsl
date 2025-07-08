import { WebappConfigurator } from "./services/dsl/webapp-configurator.js";
import { LanguageEnvironment } from "@freon4dsl/study-configuration";
import { ServerCommunication } from "@freon4dsl/core";
import { setCustomComponents } from "@freon4dsl/core-svelte";
import { env } from "./config/env.js";

import DatePicker from "./components/custom/DatePicker.svelte";
import ExpandCollapseWrapperComponent from "./components/custom/ExpandCollapseWrapperComponent.svelte";
import TimePicker from "./components/custom/TimePicker.svelte";
import ListGroupComponent from "./components/custom/ListGroup.svelte";

console.log('Starting init.ts initialization');

const serverUrl = env.serverUrl;
const url = new URL(serverUrl);
const serverIp = `${url.protocol}//${url.hostname}`;
const serverPort = url.port;

// Configure the server connection settings
const serverComm = ServerCommunication.getInstance();
console.log('ServerCommunication instance created');
serverComm.SERVER_URL = serverUrl;
serverComm.SERVER_IP = serverIp;
serverComm.nodePort = parseInt(serverPort); 
console.log('Server settings configured:', { url: serverUrl, timeout: env.serverTimeout });

// Configure the editor environment
console.log('Creating editor environment');
const webappConfigurator = WebappConfigurator.getInstance();
const editorEnvironment = LanguageEnvironment.getInstance();
console.log('Editor environment created');
webappConfigurator.setEditorEnvironment(editorEnvironment);
webappConfigurator.setServerCommunication(serverComm);
console.log('Editor environment configured');

setCustomComponents([
    { component: DatePicker, knownAs: "DatePicker" },
    { component: ExpandCollapseWrapperComponent, knownAs: "ExpandCollapseWrapper" },
    { component: TimePicker, knownAs: "TimePicker" },
    { component: ListGroupComponent, knownAs: "ListGroup" },
]);
console.log('Custom components set');

console.log('init.ts initialization complete');
// Initialize the application done by the +layout.svelte