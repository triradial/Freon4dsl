import { FreLogger, ServerCommunication } from "@freon4dsl/core";
import { setCustomComponents } from "@freon4dsl/core-svelte";
import { StudyExtractModelEnvironment } from "@freon4dsl/project-configuration";
import { env } from "./config/env.js";
import { WebappConfigurator } from "./services/dsl/webapp-configurator.js";

import AbbreviationComponent from "./components/custom/AbbreviationComponent.svelte";
import DatePickerComponent from "./components/custom/DatePickerComponent.svelte";
import DateRangePickerComponent from "./components/custom/DateRangePickerComponent.svelte";
import DisplayNothingComponent from "./components/custom/DisplayNothingComponent.svelte";
import MultilineTextComponent from "./components/custom/MultilineTextComponent.svelte";
import PhoneInputComponent from "./components/custom/PhoneInputComponent.svelte";
import SingleLineItemComponent from "./components/custom/SingleLineItemComponent.svelte";
import TabFixComponent from "./components/custom/TabFixComponent.svelte";
import TimePickerComponent from "./components/custom/TimePickerComponent.svelte";
import UrlInputComponent from "./components/custom/UrlInputComponent.svelte";

const LOGGER = new FreLogger("init");

// FreLogger.unmuteAllLogs();
// FreLogger.unmute("init");
// FreLogger.unmute("Routing");

/* Custom Components */
// FreLogger.unmute("DatePickerComponent");
// FreLogger.unmute("DateRangePickerComponent");
// FreLogger.unmute("TimePickerComponent");
// FreLogger.unmute("ItemGroupComponent2");
// FreLogger.unmute("CustomTextbox");

/* Freon Components */
// FreLogger.unmute("TextboxComponent");

// FreLogger.unmute("RenderComponent");
// FreLogger.unmute("ElementComponent");
// FreLogger.unmute("FragmentComponent");
// FreLogger.unmute("FreonComponent");
// FreLogger.unmute("LayoutComponent");
// FreLogger.unmute("ListComponent");



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
const editorEnvironment = StudyExtractModelEnvironment.getInstance();
LOGGER.log('Editor environment created');
webappConfigurator.setEditorEnvironment(editorEnvironment);
webappConfigurator.setServerCommunication(serverComm);
LOGGER.log('Editor environment configured');

setCustomComponents([
    { component: DatePickerComponent, knownAs: "DatePickerComponent" },
    { component: DateRangePickerComponent, knownAs: "DateRangePickerComponent" },
    { component: TimePickerComponent, knownAs: "TimePickerComponent" },
    { component: MultilineTextComponent, knownAs: "MultilineTextComponent" },
    { component: DisplayNothingComponent, knownAs: "DisplayNothingComponent" },
    { component: AbbreviationComponent, knownAs: "AbbreviationComponent" },
    { component: TabFixComponent, knownAs: "TabFixComponent" },
    { component: UrlInputComponent, knownAs: "UrlInputComponent" },
    { component: PhoneInputComponent, knownAs: "PhoneInputComponent" },
    { component: SingleLineItemComponent, knownAs: "SingleLineItemComponent" },
])

LOGGER.log('--- END ---');

// Initialize the application done by the +layout.svelte