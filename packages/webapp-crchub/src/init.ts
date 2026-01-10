import { FreLogger, ServerCommunication } from "@freon4dsl/core";
import { setCustomComponents } from "@freon4dsl/core-svelte";
import { LanguageEnvironment } from "@freon4dsl/study-configuration";
// @ts-ignore - TimelineLogger is not exported from package index, using direct path
import TimelineLogger from "@freon4dsl/study-configuration/src/custom/timeline/TimelineLogger.js";
import { env } from "./config/env.js";
import { WebappConfigurator } from "./services/dsl/webapp-configurator.js";

import AbbreviationComponent from "./components/custom/AbbreviationComponent.svelte";
import DatePickerComponent from "./components/custom/DatePickerComponent.svelte";
import DateRangePickerComponent from "./components/custom/DateRangePickerComponent.svelte";
import DisplayNothingComponent from "./components/custom/DisplayNothingComponent.svelte";

import ListGroupComponent from "./components/custom/ListGroupComponent.svelte";
import MultilineTextComponent from "./components/custom/MultilineTextComponent.svelte";
import PhoneInputComponent from "./components/custom/PhoneInputComponent.svelte";
import ReferenceComponent from "./components/custom/ReferenceComponent.svelte";
import SingleLineItemComponent from "./components/custom/SingleLineItemComponent.svelte";
import UrlInputComponent from "./components/custom/UrlInputComponent.svelte";

import CustomNumericComponent from "./components/custom/freon/CustomNumericComponent.svelte";
import CustomSelectComponent from "./components/custom/freon/CustomSelectComponent.svelte";
import CustomActionsComponent from "./components/custom/freon/CustomActionsComponent.svelte";
import SelectableWrapperComponent from "./components/custom/freon/SelectableWrapperComponent.svelte";
import CustomTimePickerComponent from "./components/custom/freon/CustomTimePickerComponent.svelte";
import ItemGroupComponent from "./components/custom/freon/ItemGroupComponent.svelte";
import ItemGroupComponent2 from "./components/custom/freon/CustomTimePickerComponent.svelte";

const LOGGER = new FreLogger("init");

// FreLogger.unmuteAllLogs();
// FreLogger.unmute("init");
// FreLogger.unmute("Routing");
FreLogger.unmute("EditorState");  // Enable ModelManager logs

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

/* Timeline Logger */
TimelineLogger.enable();  // Uncomment to enable TimelineLogger
// TimelineLogger.disable(); // Uncomment to explicitly disable TimelineLogger

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
    { component: DateRangePickerComponent, knownAs: "DateRangePickerComponent" },
    { component: CustomTimePickerComponent, knownAs: "CustomTimePickerComponent" },
    { component: ListGroupComponent, knownAs: "ListGroupComponent" },
    { component: ItemGroupComponent, knownAs: "ItemGroupComponent" },
    { component: ItemGroupComponent2, knownAs: "ItemGroupComponent2" },
    { component: MultilineTextComponent, knownAs: "MultilineTextComponent" },
    { component: DisplayNothingComponent, knownAs: "DisplayNothingComponent" },
    { component: AbbreviationComponent, knownAs: "AbbreviationComponent" },
    { component: ReferenceComponent, knownAs: "ReferenceComponent" },
    { component: UrlInputComponent, knownAs: "UrlInputComponent" },
    { component: PhoneInputComponent, knownAs: "PhoneInputComponent" },
    { component: SingleLineItemComponent, knownAs: "SingleLineItemComponent" },
    { component: CustomNumericComponent, knownAs: "CustomNumericComponent" },
    { component: CustomSelectComponent, knownAs: "CustomSelectComponent" },
    { component: CustomActionsComponent, knownAs: "CustomActionsComponent" },
    { component: SelectableWrapperComponent, knownAs: "SelectableWrapperComponent" },
])

LOGGER.log('--- END ---');

// Initialize the application done by the +layout.svelte