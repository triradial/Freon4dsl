import { WebappConfigurator } from "./services/dsl/webapp-configurator.js";
import { LanguageEnvironment } from "@freon4dsl/study-configuration";
import { FreLogger, ServerCommunication } from "@freon4dsl/core";
import { setCustomComponents } from "@freon4dsl/core-svelte";
import { env } from "./config/env.js";

import DatePickerComponent from "./components/custom/DatePickerComponent.svelte";
import TimePickerComponent from "./components/custom/TimePickerComponent.svelte";
import ListGroupComponent from "./components/custom/ListGroupComponent.svelte";
import ItemGroupComponent from "./components/custom/ItemGroupComponent.svelte";
import ItemGroupComponent2 from "./components/custom/ItemGroupComponent2.svelte";
import MultilineTextComponent from "./components/custom/MultilineTextComponent.svelte";

const LOGGER = new FreLogger("init");

// FreLogger.unmuteAllLogs();
// FreLogger.unmute("init");
FreLogger.unmute("Routing");
// FreLogger.unmute("ListGroupComponent");
FreLogger.unmute("ItemGroupComponent");

LOGGER.log('--- START ---');

const serverUrl = env.serverUrl;
const url = new URL(serverUrl);
const serverIp = `${url.protocol}//${url.hostname}`;
const serverPort = url.port;

// Configure the server connection settings
const serverComm = ServerCommunication.getInstance();
LOGGER.log('ServerCommunication instance created');
serverComm.SERVER_URL = serverUrl;
serverComm.SERVER_IP = serverIp;
serverComm.nodePort = parseInt(serverPort); 
LOGGER.log(`Server settings configured: ${JSON.stringify({ url: serverUrl, timeout: env.serverTimeout })}`);

// Configure the editor environment
LOGGER.log('Creating editor environment');
const webappConfigurator = WebappConfigurator.getInstance();
const editorEnvironment = LanguageEnvironment.getInstance();
LOGGER.log('Editor environment created');
webappConfigurator.setEditorEnvironment(editorEnvironment);
webappConfigurator.setServerCommunication(serverComm);
LOGGER.log('Editor environment configured');

setCustomComponents([
    { component: DatePickerComponent, knownAs: "DatePickerComponent" },
    { component: TimePickerComponent, knownAs: "TimePickerComponent" },
    { component: ListGroupComponent, knownAs: "ListGroupComponent" },
    { component: ItemGroupComponent, knownAs: "ItemGroupComponent" },
    { component: ItemGroupComponent2, knownAs: "ItemGroupComponent2" },
    { component: MultilineTextComponent, knownAs: "MultilineTextComponent" },
])

LOGGER.log('--- END ---');

// Initialize the application done by the +layout.svelte