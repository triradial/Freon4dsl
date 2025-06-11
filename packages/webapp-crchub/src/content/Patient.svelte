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

    import { getChartWithPatientHistory } from "../services/utils.js";

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
        console.log("fetchedPatient:", fetchedPatient);
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        const modelManager = ModelManager.getInstance();
        // Create the PatientHistoryUnit to use for editing
        await modelManager.createNewUnit("PatientHistoryUnit", "PatientHistoryUnit");
        var patientHistoryUnit =  modelManager.modelStore.getUnitByName("PatientHistoryUnit") as PatientHistoryUnit;
        // clearPatientHistory(patientHistoryUnit.patientHistory);
        //TODO: Talk to Graham about changing patientNumber to patient_id or something else that can be initials, etc. 
        patientHistoryUnit.patientHistory.patient_id = fetchedPatient.patientNumber;

        // Get the model data for all the Patients
        patientInfo = await modelManager.openModelUnit(fetchedPatient.studyId, "PatientInfo") as PatientInfo;
        console.log("PatientInfo:", patientInfo);
        if (patientInfo === null || patientInfo === undefined) {
            //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
            console.log("Creating PatientInfo");
            await modelManager.modelStore.createUnit("PatientInfo", "PatientInfo");
        } else {
            var found = false;
            console.log("Found patientInfo with patientHistories: ", patientInfo.patientHistories);
            console.log("length of patientHistories: ", patientInfo.patientHistories.length);
            patientInfo.patientHistories.forEach(aPatientHistory => {
                console.log("aPatientHistory.patient_id: ", aPatientHistory.patient_id);
                if (!found && aPatientHistory.patient_id === fetchedPatient.patientNumber) {
                    console.log("found patientHistory for patientNumber: ", fetchedPatient.patientNumber, " patientHistory: ", aPatientHistory);
                    patientHistoryUnit.patientHistory = aPatientHistory.copy();
                    found = true;
                    console.log("found should be true: ", found)
                };
            });
        }
        await modelManager.setCurrentUnit(patientHistoryUnit);
        await modelManager.openModelUnitWithoutSavingCurrentUnit(patientHistoryUnit);
        unit = patientHistoryUnit;
        setTimeout(() => {
            editorLoaded = true;
        }, 300);

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

    async function handleSaveStudy() {
        console.log("saving patientInfo");
        var patientNumber: string;
        var study_id: string;
        const modelManager = ModelManager.getInstance();
        if (!patient) {
            console.error("Patient object is undefined");
            return;
        } else {
            patientNumber = patient.patientNumber;
            study_id = patient.studyId;
        }
        console.log("patient_id: ", patientNumber);
        // var patientHistoryUnit = modelManager.getCurrentUnit() as PatientHistoryUnit;
        var patientHistoryUnit = unit as PatientHistoryUnit;
        console.log("patientHistoryUnit.patientHistory: ", patientHistoryUnit?.patientHistory);
        const patientInfo = await modelManager.modelStore.getUnitByName("PatientInfo") as PatientInfo;
        var found = false;
        console.log("handleSaveStudy patientInfo.patientHistories: ", patientInfo.patientHistories);
        console.log("handleSaveStudypatientInfo.patientHistories.length: ", patientInfo.patientHistories.length);
        patientInfo.patientHistories.forEach(aPatientHistory => {
            console.log("handleSaveStudyaPatientHistory.patient_id: ", aPatientHistory.patient_id);
            if (aPatientHistory.patient_id === patientNumber) {
                found = true;
                console.log("handleSaveStudy found patientHistory: ", aPatientHistory);
                aPatientHistory.patientVisits.length = 0;
                patientHistoryUnit?.patientHistory.patientVisits.forEach(visit => aPatientHistory.patientVisits.push(visit.copy()));
                aPatientHistory.patientNotAvailableDates = patientHistoryUnit?.patientHistory.patientNotAvailableDates.copy();
                console.log("set history...");
            }
        });
        if (!found) {
            console.log("Not found so setting history...");
            patientInfo.patientHistories.push(patientHistoryUnit?.patientHistory.copy() as PatientHistory);
        }
        console.log("before save patientInfo.patientHistories: ", patientInfo.patientHistories);
        await modelManager.modelStore.saveUnit(patientInfo);
        console.log("after save patientHistoryUnit: ", patientHistoryUnit);
        unit = patientHistoryUnit;
        await modelManager.openModelUnitWithoutSavingCurrentUnit(patientHistoryUnit);
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
