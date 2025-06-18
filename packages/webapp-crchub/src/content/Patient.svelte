<script lang="ts">
    import { onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";

    import { Tabs, TabItem, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faListCheck, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
    import { dataStore, type Patient } from "../services/data/data-store.js";

    import { ModelManager } from "../services/dsl/model-manager.js";
    import { AST, RtString } from "@freon4dsl/core";
    import { FreNodeReference } from "@freon4dsl/core";
    import { type StudyConfigurationModel, StudyConfiguration, PatientInfo, PatientHistory, PatientVisit, PatientHistoryUnit, PatientNotAvailable } from "@freon4dsl/samples-study-configuration";
    import { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";
    import { getTimelineAsOfADate } from "../services/app/patient-timeline.js";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { FreEditor } from "@freon4dsl/core";
    import { type Study } from "../services/data/data-store.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { Toolbar, ToolbarButton } from "flowbite-svelte";
    import { faSave, faUndo, faRedo } from "@fortawesome/free-solid-svg-icons";

    import { fillDateConceptFromAsString } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";

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
        patientHistory.patientVisits.splice(0);
        patientHistory.patientNotAvailableDates.dates.splice(0);
    }

    onMount(async () => {
        const fetchedPatient = await dataStore.getPatient(id);
        if (!fetchedPatient) {
            console.error(`Patient with id ${id} not found`);
            return;
        }
        patient = fetchedPatient;
        AST.change(async () => {  
            dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
            const modelManager = ModelManager.getInstance();

            // Create the PatientHistoryUnit to use just for editing of one patient at a time
            await modelManager.createNewUnit("PatientHistoryUnit", "PatientHistoryUnit");
            var patientHistoryUnit =  modelManager.modelStore.getUnitByName("PatientHistoryUnit") as PatientHistoryUnit;
            clearPatientHistory(patientHistoryUnit.patientHistory);
            //TODO: Talk to Graham about changing patientNumber to patient_id or something else that can be initials, etc. 
            patientHistoryUnit.patientHistory.patient_id = fetchedPatient.patientNumber;
            // Get the model data for all the Patients
            patientInfo = await modelManager.openModelUnitWithoutSavingCurrentUnit(fetchedPatient.studyId, "PatientInfo") as PatientInfo;
            if (patientInfo === null || patientInfo === undefined) {
                //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
                await modelManager.modelStore.createUnit("PatientInfo", "PatientInfo");
            } else {
                // The PatientInfo already exists, we need to setup the patientHistory for editing
                var found = false;
                patientInfo.patientHistories.forEach(aPatientHistory => {
                    if (!found && aPatientHistory.patient_id === fetchedPatient.patientNumber) {
                        aPatientHistory.patientVisits.forEach(visit => patientHistoryUnit.patientHistory.patientVisits.push(visit.copy()));
                        aPatientHistory.patientNotAvailableDates.dates.forEach(dateRange => patientHistoryUnit.patientHistory.patientNotAvailableDates.dates.push(dateRange.copy()));
                        patientHistoryUnit.patientHistory.startOfStudyDate = aPatientHistory.startOfStudyDate?.copy();
                        patientHistoryUnit.patientHistory.id = aPatientHistory.id;
                        patientHistoryUnit.patientHistory.patient_id = aPatientHistory.patient_id;
                        found = true;
                    };
                });
            }
            // Display the patientHistory for editing
            await modelManager.setCurrentUnit(patientHistoryUnit);
            await modelManager.displayModelUnit(patientHistoryUnit);
            unit = patientHistoryUnit;
        });

        setTimeout(() => {
            editorLoaded = true;
        }, 300);

        if (fetchedPatient) {
            // await loadChart(patient.studyId);
        } else {
            console.error(`Patient with id ${id} not found`);
        }
    });

    const getTimelineChartError = () => {
        const html = `<div class="limited-width-container"><div class='text-red-500'>Error: PatientInfo not found</div></div>`;
        return new RtString(html);
    };

    const fillDateConcept = (dateConcept: any) => {
        fillDateConceptFromAsString(dateConcept);
    };

    const getChartWithPatientHistory = async (referenceDate: Date) => {
        const fetchedPatient = await dataStore.getPatient(id);

        var found = false;
        var patientHistory: PatientHistory = PatientHistory.create({});
        if (!patientInfo || patientInfo === undefined) {
            const rtObject = getTimelineChartError() as RtString;
            return rtObject.asString();
        }

        patientInfo!.patientHistories.forEach(aPatientHistory => {
            if (!found && aPatientHistory.patient_id === patient!.patientNumber) {
                aPatientHistory.patientVisits.forEach(visit => {
                    var updatedVisit = visit.copy(); 
                    fillDateConcept(updatedVisit.actualVisitDate);  // Use the action wrapper
                    patientHistory.patientVisits.push(updatedVisit);
                });
                aPatientHistory.patientNotAvailableDates.dates.forEach(dateRange => {
                    var updatedDateRange = dateRange.copy();
                    fillDateConcept(updatedDateRange.startDate);  // Use the action wrapper
                    if (updatedDateRange.endDate) {
                        fillDateConcept(updatedDateRange.endDate);  // Use the action wrapper
                    }
                    patientHistory.patientNotAvailableDates.dates.push(updatedDateRange);
                });
                found = true;
            };
        });
        var referenceDateForTimeline : Date | undefined;
        if (referenceDate === undefined) {
            if (patientHistory.patientVisits.length > 0) {
                referenceDateForTimeline = new Date(patientHistory.patientVisits[0].actualVisitDate.dateAsString);
            } else {
                referenceDateForTimeline = new Date(2024, 8, 30);
            }
        }

        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const studyConfig = model.configuration;
        studyConfig.studyStartDayNumber = 0;
        let timeline = getTimelineAsOfADate(studyConfig, referenceDateForTimeline, patientHistory);
        const rtObject = (timeline as any).getTimelineChartHtml() as RtString;
        return rtObject.asString();
    };

    async function getChart(id: string) {
        const modelManager = ModelManager.getInstance();
        const unit = (await modelManager.openModelUnit(id, "StudyConfiguration")) as StudyConfiguration;
        const timeline = getTimelineAsOfADate(unit);
        const rtObject = timeline.getTimelineChart() as RtString;
        return rtObject.asString();
    }

    async function loadChart(id: string) {
        AST.change(async () => {  
            isLoading = true;
            showChart = false;
            error = null;
            try {
                patientInfo = await ModelManager.getInstance().openModelUnitWithoutSavingCurrentUnit(patient!.studyId, "PatientInfo") as PatientInfo;

                const startTime = Date.now();
                const referenceDate = new Date(2024, 8, 30);
                chartHtml = await getChartWithPatientHistory(referenceDate);
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
        });
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
                aPatientHistory.patientVisits.splice(0);
                unit?.patientHistory.patientVisits.forEach(visit => {
                    aPatientHistory.patientVisits.push(visit.copy());
                });
                aPatientHistory.patientNotAvailableDates.dates.splice(0);
                unit!.patientHistory.patientNotAvailableDates.dates.forEach(dateRange => aPatientHistory.patientNotAvailableDates.dates.push(dateRange.copy()));
            }
        });
        // If the patientHistory for this patient was not previously entered we need to add it to the list of all patientHistories in the PatientInfo
        if (!found) {
            patientInfo.patientHistories.push(unit?.patientHistory.copy() as PatientHistory);
        }
        // Saving all the patientHistories stored in the PatientInfo even though we are only editing one patient at a time
        await modelManager.modelStore.saveUnit(patientInfo);
        // Force the editor to reload the patientHistoryUnit
        await modelManager.displayModelUnit(unit!);
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
