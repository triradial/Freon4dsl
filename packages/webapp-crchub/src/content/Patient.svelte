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
    import { type StudyConfigurationModel, StudyConfiguration, PatientInfo, PatientHistory, PatientVisit, PatientHistoryUnit, PatientNotAvailable } from "@freon4dsl/samples-study-configuration";
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

    import { getChartWithPatientHistory, getMonthFromString } from "../services/utils.js";

    export let id: string;
    let patient: Patient | undefined;
    let editorLoaded = false;
    let dslEditor: FreEditor;

    let isLoading = true;
    let showChart = false;
    let chartHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;
    let unit: PatientHistoryUnit | undefined;
    let patientInfo: PatientInfo | undefined;

    function clearPatientHistory(patientHistory: PatientHistory) {
        patientHistory.patientVisits.length = 0;
        patientHistory.patientNotAvailableDates = PatientNotAvailable.create({});
    }

    onMount(async () => {
        const fetchedPatient = await dataStore.getPatient(id);
        if (!fetchedPatient) {
            console.error(`Patient with id ${id} not found`);
            return;
        }
        patient = fetchedPatient;
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        const modelManager = ModelManager.getInstance();

        // Create the PatientHistoryUnit to use just for editing of one patient at a time
        await modelManager.createNewUnit("PatientHistoryUnit", "PatientHistoryUnit");
        var patientHistoryUnit =  modelManager.modelStore.getUnitByName("PatientHistoryUnit") as PatientHistoryUnit;
        clearPatientHistory(patientHistoryUnit.patientHistory);
        //TODO: Talk to Graham about changing patientNumber to patient_id or something else that can be initials, etc. 
        patientHistoryUnit.patientHistory.patient_id = fetchedPatient.patientNumber;
        // Get the model data for all the Patients
        patientInfo = await modelManager.openModelUnit(fetchedPatient.studyId, "PatientInfo") as PatientInfo;
        if (patientInfo === null || patientInfo === undefined) {
            //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
            await modelManager.modelStore.createUnit("PatientInfo", "PatientInfo");
        } else {
            // The PatientInfo already exists, we need to setup the patientHistory for editing
            var found = false;
            patientInfo.patientHistories.forEach(aPatientHistory => {
                if (!found && aPatientHistory.patient_id === fetchedPatient.patientNumber) {
                    patientHistoryUnit.patientHistory = aPatientHistory.copy();
                    found = true;
                };
            });
        }
        // Display the patientHistory for editing
        await modelManager.setCurrentUnit(patientHistoryUnit);
        await modelManager.openModelUnitWithoutSavingCurrentUnit(patientHistoryUnit);
        unit = patientHistoryUnit;
        setTimeout(() => {
            editorLoaded = true;
        }, 300);

        if (fetchedPatient) {
            // await loadChart(patient.studyId);
        } else {
            console.error(`Patient with id ${id} not found`);
        }
    });


    async function getChartWithPatientHistory2() {
        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const unit = model.configuration;

        const fetchedPatient = await dataStore.getPatient(id);
        var patientInfo = await ModelManager.getInstance().openModelUnit(fetchedPatient!.studyId, "PatientInfo") as PatientInfo;
        let timeline = getTimeline(unit) as Timeline;

        var found = false;
        var patientHistory: PatientHistory = PatientHistory.create({});
        patientInfo.patientHistories.forEach(aPatientHistory => {
            if (!found && aPatientHistory.patient_id === patient!.patientNumber) {
                aPatientHistory.patientVisits.forEach(visit => {
                    console.log("visit: ", visit);
                    console.log("visit.actualVisitDateAsString: ", visit.actualVisitDateAsString);
                    const actualVisitDate = new Date(visit.actualVisitDateAsString);
                    console.log("actualVisitDate as Date: ", actualVisitDate);
                    visit.actualVisitDate.day = actualVisitDate.getDate().toString();
                    console.log("visit.actualVisitDate.day: ", visit.actualVisitDate.day);
                    console.log("actualVisitDate.toLocaleString('en-US', { month: 'long' }): ", actualVisitDate.toLocaleString('en-US', { month: 'long' }));
                    visit.actualVisitDate.month = getMonthFromString(actualVisitDate.toLocaleString('en-US', { month: 'long' }));
                    console.log("visit.actualVisitDate.month: ", visit.actualVisitDate.month);
                    visit.actualVisitDate.year = actualVisitDate.getFullYear().toString();
                    console.log("visit.actualVisitDate.year: ", visit.actualVisitDate.year);
                    patientHistory.patientVisits.push(visit.copy());
                });
                patientHistory.patientNotAvailableDates = aPatientHistory.patientNotAvailableDates.copy();
                found = true;
            };
        });
        timeline.setPatientHistory(patientHistory!);
        timeline.addPatientEvents(patientHistory!);
        const rtObject = getTimelineChartHtml(timeline) as RtString;
        return rtObject.asString();
   }

 
    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            console.log("calling getChartWithPatientHistory");
            chartHtml = await getChartWithPatientHistory2();
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

    async function handleSaveStudy() {
        const modelManager = ModelManager.getInstance();
        var patientNumber = patient!.patientNumber;
        const patientInfo = await modelManager.modelStore.getUnitByName("PatientInfo") as PatientInfo;
        
        var found = false;
        // If the patientHistory for this patient was previously entered we need to replace it with the current value
        patientInfo.patientHistories.forEach(aPatientHistory => {
            if (aPatientHistory.patient_id === patientNumber) {
                found = true;
                aPatientHistory.patientVisits.length = 0;
                unit?.patientHistory.patientVisits.forEach(visit => aPatientHistory.patientVisits.push(visit.copy()));
                aPatientHistory.patientNotAvailableDates = unit!.patientHistory.patientNotAvailableDates.copy();
            }
        });
        // If the patientHistory for this patient was not previously entered we need to add it to the list of all patientHistories in the PatientInfo
        if (!found) {
            patientInfo.patientHistories.push(unit?.patientHistory.copy() as PatientHistory);
        }
        // Saving all the patientHistories stored in the PatientInfo even though we are only editing one patient at a time
        await modelManager.modelStore.saveUnit(patientInfo);
        // Force the editor to reload the patientHistoryUnit
        await modelManager.openModelUnitWithoutSavingCurrentUnit(unit!);
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
                <TabItem open title="Patient Info">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faListCheck} class="w-4 h-4" />Patient Info
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
