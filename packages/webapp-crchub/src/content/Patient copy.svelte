<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";
    import { Tabs, TabItem, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faListCheck } from "@fortawesome/free-solid-svg-icons";
    import { dataStore, type Patient } from "../services/data/data-store.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { AST } from "@freon4dsl/core";
    import { PatientInfo, PatientHistory, PatientHistoryUnit } from "@freon4dsl/samples-study-configuration";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { FreEditor } from "@freon4dsl/core";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { Toolbar, ToolbarButton } from "flowbite-svelte";
    import { faSave, faUndo, faRedo } from "@fortawesome/free-solid-svg-icons";
    import { setDrawerProps, setDrawerVisibility } from "services/stores/side-drawer-store.js";

    export let id: string;
    let patient: Patient | undefined;
    let editorLoaded = false;
    let dslEditor: FreEditor;
    let unit: PatientHistoryUnit | undefined;
    let patientInfo: PatientInfo | undefined;

    function clearPatientHistory(patientHistory: PatientHistory) {
        patientHistory.patientVisits.splice(0);
        patientHistory.patientNotAvailableDates.dates.splice(0);
    }

    onMount(async () => {
        patient = await dataStore.getPatient(id);
        if (!patient) {
            console.error(`Patient with id ${id} not found`);
            return;
        }
        AST.change(async () => {  
            dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
            const modelManager = ModelManager.getInstance();

            // Create the PatientHistoryUnit to use just for editing of one patient at a time
            await modelManager.createBasicModelUnit("PatientHistoryUnit", "PatientHistoryUnit");
            var patientHistoryUnit =  modelManager.modelStore.getUnitByName("PatientHistoryUnit") as PatientHistoryUnit;
            clearPatientHistory(patientHistoryUnit.patientHistory);
            //TODO: Talk to Graham about changing patientNumber to patient_id or something else that can be initials, etc. 
            patientHistoryUnit.patientHistory.patient_id = patient!.patientNumber;
            // Get the model data for all the Patients
            patientInfo = await modelManager.openModelUnitWithoutSavingCurrentUnit(patient!.studyId, "PatientInfo") as PatientInfo;
            if (patientInfo === null || patientInfo === undefined) {
                //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
                await modelManager.modelStore.createUnit("PatientInfo", "PatientInfo");
            } else {
                // The PatientInfo already exists, we need to setup the patientHistory for editing
                var found = false;
                patientInfo.patientHistories.forEach(aPatientHistory => {
                    if (!found && aPatientHistory.patient_id === patient!.patientNumber) {
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

        if (patient) {
            // await loadChart(patient.studyId);
        } else {
            console.error(`Patient with id ${id} not found`);
        }
        setDrawerProps("studyChecklist", { studyId: patient!.studyId });
        setDrawerVisibility("studyChecklist", true);
        setDrawerProps("patientTimelineChart", { id: id });
        setDrawerVisibility("patientTimelineChart", true);
        setDrawerProps("staffAvailability", { studyId: id });
        setDrawerVisibility("staffAvailability", true);
    });

    onDestroy(() => {
        setDrawerVisibility("studyChecklist", false);
        setDrawerVisibility("patientTimelineChart", false);
    });

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
            </Tabs>
        </div>
    </div>
{:else}
    <p>Loading patient...</p>
{/if}