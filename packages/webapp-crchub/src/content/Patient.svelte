<script lang="ts">
    import { onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";

    import { Tabs, TabItem, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faListCheck, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
    import { dataStore, type Patient } from "../services/data/data-store.js";

    import { ModelManager } from "../services/dsl/model-manager.js";
    import { RtString } from "@freon4dsl/core";
    import { FreNodeReference } from "@freon4dsl/core";
    import { type StudyConfigurationModel, StudyConfiguration, PatientInfo, PatientHistory, PatientHistoryUnit, PatientNotAvailable } from "@freon4dsl/samples-study-configuration";
    import { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";
    import { getTimelineChart } from "../services/app/patient-timeline.js";
    import { getTimelineChartHtml } from "../services/app/patient-timeline.js";
    import { getTimeline } from "../services/app/patient-timeline.js";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { FreEditor } from "@freon4dsl/core";
    import { type Study } from "../services/data/data-store.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { Toolbar, ToolbarButton } from "flowbite-svelte";
    import { faSave, faUndo, faRedo } from "@fortawesome/free-solid-svg-icons";

    import { getChartWithPatientHistory } from "../services/utils.js";

    export let id: string;
    let patient: Patient | undefined;
    let study: Study | undefined;
    let patientInfo: PatientInfo | undefined;
    let editorLoaded = false;
    let dslEditor: FreEditor;

    let isLoading = true;
    let showChart = false;
    let chartHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;
    let unit: PatientHistoryUnit | undefined;

    onMount(async () => {
        const fetchedPatient = await dataStore.getPatient(id);
        if (!fetchedPatient) {
            console.error(`Patient with id ${id} not found`);
            return;
        }
        console.log("fetchedPatient:", fetchedPatient);
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        const modelManager = ModelManager.getInstance();
        // Create the PatientHistoryUnit to use for editing
        await modelManager.createModelUnit("PatientHistoryUnit", "PatientHistoryUnit");
        var patientHistoryUnit =  modelManager.modelStore.getUnitByName("PatientHistoryUnit") as PatientHistoryUnit;

        // Get the model data for all the Patients
        var patientInfo = await modelManager.openModelUnit(fetchedPatient.studyId, "PatientInfo") as PatientInfo;
        console.log("PatientInfo:", patientInfo);
        if (patientInfo === null || patientInfo === undefined) {
            //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
            await modelManager.createModelUnit("PatientInfo", "PatientInfo");
            patientInfo =  modelManager.modelStore.getUnitByName("PatientInfo") as PatientInfo;
            await modelManager.setCurrentUnit(patientInfo);
            await modelManager.saveCurrentUnit();
        } else {
            var found = false;
            patientInfo.patientHistories.forEach(aPatientHistory => {
                if (!found && aPatientHistory.id === fetchedPatient.id) {
                    console.log("found patientHistory: ", aPatientHistory);
                    patientHistoryUnit.patientHistory = aPatientHistory;
                    found = true;
                    console.log("found should be true: ", found)
                };
            });
            patientHistoryUnit.patientHistory.id = fetchedPatient.id;
        }
        await modelManager.setCurrentUnit(patientHistoryUnit);
        await modelManager.saveCurrentUnit();
        const curUnit = modelManager.getCurrentUnit();
        console.log("curUnit: ", curUnit);
        console.log("unit: ", patientHistoryUnit);
        await modelManager.openModelUnit(fetchedPatient.studyId, "PatientHistoryUnit");
        unit = patientHistoryUnit;
        setTimeout(() => {
            editorLoaded = true;
        }, 3000);

        if (fetchedPatient) {
            patient = fetchedPatient;
            // await loadChart(patient.studyId);
        } else {
            console.error(`Patient with id ${id} not found`);
        }
    });

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            console.log("calling getChartWithPatientHistory");
            chartHtml = await getChartWithPatientHistory(id);
            await new Promise((resolve) => setTimeout(() => resolve(null), 0)); // Allow DOM to update
            if (container) {
                await loadChartData();
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < 3000) {
                    await new Promise((resolve) => setTimeout(resolve, 5000 - elapsedTime));
                }
                showChart = true;
            } else {
                console.error("Container not found");
                throw new Error("Container not available");
            }
        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    async function getChart(id: string) {
        const modelManager = ModelManager.getInstance();
        const unit = (await modelManager.openModelUnit(id, "StudyConfiguration")) as StudyConfiguration;
        const rtObject = getTimelineChart(unit) as RtString;
        return rtObject.asString();
    }

    async function loadChartData() {
        return new Promise<void>((resolve) => {
            if (container) {
                container.innerHTML = chartHtml;
                executeScripts();
            }
            resolve();
        });
    }

    function handleSaveStudy() {
        const currentUnit: PatientHistoryUnit = ModelManager.getInstance().getCurrentUnit() as PatientHistoryUnit;
        if (currentUnit) {
            currentUnit.patientHistory = unit?.patientHistory as PatientHistory;
        }
        ModelManager.getInstance().saveCurrentUnit();
        console.log("PatientInfo.Saved");
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
        console.log("Undo action");
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
        console.log("Redo action");
    }

    function executeScripts() {
        if (container) {
            const scripts = container.querySelectorAll("script");
            scripts.forEach((oldScript) => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));

                // Wrap the script content in a function that checks for vis
                const wrappedContent = `
                (function checkVis() {
                    if (typeof vis !== 'undefined') {
                        ${oldScript.innerHTML}
                    } else {
                        setTimeout(checkVis, 100);
                    }
                })();
            `;
                newScript.appendChild(document.createTextNode(wrappedContent));
                if (oldScript.parentNode) {
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                }
            });
        }
    }
</script>

{#if patient}
    <div class="crc-container">
        <div class="crc-card">
            <PatientCard {patient} />
        </div>

        <div class="crc-content">
            <Tabs tabStyle="pill" class="crc-tab">
                <TabItem title="Visits" >
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faListCheck} class="w-4 h-4" />Visits
                    </div>
                    <div class="crc-grid"></div>
                </TabItem>
                <TabItem open title="Unavailable">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faListCheck} class="w-4 h-4" />Unavailable
                    </div>
                    {#if editorLoaded}
                        <Toolbar class="toolbar">
                            <ToolbarButton class="toolbar-button" on:click={handleSaveStudy}><FontAwesomeIcon icon={faSave} /></ToolbarButton>
                            <ToolbarButton class="toolbar-button" on:click={handleUndoAction}><FontAwesomeIcon icon={faUndo} /></ToolbarButton>
                            <ToolbarButton class="toolbar-button" on:click={handleRedoAction}><FontAwesomeIcon icon={faRedo} /></ToolbarButton>
                        </Toolbar>
                        <div class="crc-editor crc-content-width">
                            <FreonComponent editor={dslEditor} />
                        </div>
                    {:else}
                        <div class="h-full crc-content-width">
                            <ListPlaceholder
                                divClass="p-4 space-y-4 mr-1 rounded border border-gray-200 divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700"
                            />
                        </div>
                    {/if}
                </TabItem>
                <TabItem title="Schedule" on:click={() => patient && loadChart(patient.studyId)}>
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} class="w-4 h-4" />Schedule
                    </div>
                    <div style="display: {isLoading || !showChart ? 'block' : 'none'}">
                        <ListPlaceholder divClass="mb-4" />
                    </div>
                    <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
                        <div bind:this={container}>
                            {@html chartHtml}
                        </div>
                    </div>
                </TabItem>
            </Tabs>
        </div>
    </div>
{:else}
    <p>Loading patient...</p>
{/if}
