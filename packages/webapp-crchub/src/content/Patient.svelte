<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";
    import { Tabs } from '@skeletonlabs/skeleton-svelte';
    import { dataStore, type Patient } from "../services/data/data-store.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { AST, RtString } from "@freon4dsl/core";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { PatientInfo, PatientHistory, PatientHistoryUnit } from "@freon4dsl/study-configuration";
    import { FreonComponent } from "@freon4dsl/core-svelte"; 
    import { FreEditor } from "@freon4dsl/core"; 
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { setDrawerVisibility } from "../services/stores/side-drawer-store.js";

    // @ts-ignore
    import { CalendarDays as IconCalendarDays, ListTodo as IconListTodo, Save as IconSave, Redo as IconRedo, Undo as IconUndo } from '@lucide/svelte';

    let { id } = $props<{ id: string }>();

    let patient = $state<Patient | undefined>(undefined);
    let isLoading = $state(true);
    let activeTab = $state('schedule');
    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit: PatientHistoryUnit | undefined;
    let patientInfo: PatientInfo | undefined;


    onMount(async () => {
        // Load the patient data
        const fetchedPatient = await dataStore.getPatient(id);
        if (fetchedPatient) {
            patient = fetchedPatient;
        } else {
            console.error(`Patient with id ${id} not found`);
        }

        // Load the patient history for editing
        AST.change(async () => {  
            dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
            const modelManager = ModelManager.getInstance();

            // Create the PatientHistoryUnit to use just for editing of one patient at a time
            await modelManager.createBasicModelUnit("PatientHistoryUnit", "PatientHistoryUnit");
            var patientHistoryUnit =  modelManager.getModelUnit("PatientHistoryUnit") as PatientHistoryUnit;
            clearPatientHistory(patientHistoryUnit.patientHistory);
            //TODO: Talk to Graham about changing patientNumber to patient_id or something else that can be initials, etc. 
            patientHistoryUnit.patientHistory.patient_id = patient!.patientNumber;
            // Get the model data for all the Patients
            patientInfo = await modelManager.openModelUnitWithoutSavingCurrentUnit(patient!.studyId, "PatientInfo") as PatientInfo;
            if (patientInfo === null || patientInfo === undefined) {
                //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
                await modelManager.createRawModelUnit("PatientInfo", "PatientInfo");
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
            isLoading = false;
        }, 300);
    });

    onDestroy(() => {
        setDrawerVisibility("studyChecklist", false);
        setDrawerVisibility("patientTimelineChart", false);
    });

    async function handleSaveStudy() {
        const modelManager = ModelManager.getInstance();
        var patientNumber = patient!.patientNumber;
        const patientInfo = await modelManager.getModelUnit("PatientInfo") as PatientInfo;
        
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
        await modelManager.saveModelUnit(patientInfo);
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

    function clearPatientHistory(patientHistory: PatientHistory) {
        patientHistory.patientVisits.splice(0);
        patientHistory.patientNotAvailableDates.dates.splice(0);
    }
</script>

{#if patient}
    <div class="crc-container">
        <div class="card-container">
            <PatientCard patientId={patient.id} />
        </div>

        <div class="crc-content">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-6" listMargin="mb-2" base="mt-2" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control value="schedule">
                        <div class="flex items-center gap-2"><IconCalendarDays />Schedule</div>
                    </Tabs.Control>
                {/snippet}

                {#snippet content()}
                    <Tabs.Panel value="schedule">
                        {#if !isLoading}
                            <div class="flex gap-2 mb-2">
                                <button type="button" class="icon-button primary inverted" onclick={handleSaveStudy}><IconSave /></button>
                                <button type="button" class="icon-button primary inverted" onclick={handleUndoAction}><IconUndo /></button>
                                <button type="button" class="icon-button primary inverted" onclick={handleRedoAction}><IconRedo /></button>
                            </div>
                            <div class="crc-editor crc-content-width">
                                <FreonComponent editor={dslEditor} />
                            </div>
                        {:else}
                            <div class="h-full crc-content-width">
                                <div class="placeholder animate-pulse"></div>
                            </div>
                        {/if}
                    </Tabs.Panel>
                {/snippet}
            </Tabs>
        </div>
    </div>
{:else}
    <div class="h-full crc-content-width">
        <div class="placeholder animate-pulse"></div>
    </div>
{/if}
