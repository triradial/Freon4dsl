<script lang="ts">
    import { AST, FreChangeManager, FreEditor, FrePartDelta, FrePartListDelta, FrePrimDelta, FrePrimListDelta } from "@freon4dsl/core";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { PatientHistory, PatientHistoryUnit, PatientInfo } from "@freon4dsl/study-configuration";
    import { Tabs } from '@skeletonlabs/skeleton-svelte';
    import { runInAction } from "mobx";
    import { onDestroy, onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";
    import { dataStore, type Patient } from "../services/data/data-store.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { setDrawerVisibility } from "../services/stores/side-drawer-store.js";
// @ts-ignore
    import { CalendarDays as IconCalendarDays, Redo as IconRedo, Undo as IconUndo } from '@lucide/svelte';

    let { id } = $props<{ id: string }>();

    let patient = $state<Patient | undefined>(undefined);
    let isLoading = $state(true);
    let activeTab = $state('schedule');
    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit: PatientHistoryUnit | undefined;
    let patientInfo: PatientInfo | undefined;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeChangeManager: (() => void) | undefined;
    let isSaving = $state(false);

    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            handleSavePatient();
        }, 1000); // 1 second debounce
    }

    onMount(async () => {
        // Load the patient data
        const fetchedPatient = await dataStore.getPatient(id);
        if (fetchedPatient) {
            patient = fetchedPatient;
        } else {
            // Patient not found
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
                runInAction(() => {
                    var found = false;
                    patientInfo.patientHistories.forEach(aPatientHistory => {
                        if (!found && aPatientHistory.patient_id === patient!.patientNumber) {
                            aPatientHistory.patientVisits.forEach(visit => patientHistoryUnit.patientHistory.patientVisits.push(visit.copy()));
                            aPatientHistory.patientNotAvailableDates.forEach(dateRange => patientHistoryUnit.patientHistory.patientNotAvailableDates.push(dateRange.copy()));
                            patientHistoryUnit.patientHistory.startOfStudyDate = aPatientHistory.startOfStudyDate?.copy();
                            patientHistoryUnit.patientHistory.id = aPatientHistory.id;
                            patientHistoryUnit.patientHistory.patient_id = aPatientHistory.patient_id;
                            found = true;
                            };
                    });
                });
            }
            // Display the patientHistory for editing
            await modelManager.setCurrentUnit(patientHistoryUnit);
            await modelManager.displayModelUnit(patientHistoryUnit);
            unit = patientHistoryUnit;
        });

        // Subscribe to FreChangeManager changes AFTER model setup is complete
        // Add a small delay to ensure model setup is fully complete
        setTimeout(() => {
            const changeCallback = (delta) => {
            if (isSaving) {
                return;
            }
            
            // Only save if the change is from the unit we're editing, not from patientInfo
            // This prevents infinite loops: when we modify patientInfo during save (lines 155-173),
            // those changes have delta.unit === patientInfo, so they're ignored here
            if (!unit || delta.unit !== unit) {
                return;
            }
            
            if (delta instanceof FrePrimDelta) {
                if (delta.oldValue != delta.newValue) {
                    debouncedSave();
                }
            } else if (delta instanceof FrePrimListDelta) {
                debouncedSave();
            } else if (delta instanceof FrePartListDelta) {
                debouncedSave();
            } else if (delta instanceof FrePartDelta) {
                debouncedSave();
            }
        };
            FreChangeManager.getInstance().subscribeToPrimitive(changeCallback);
            FreChangeManager.getInstance().subscribeToPart(changeCallback);
            FreChangeManager.getInstance().subscribeToListElement(changeCallback);
            FreChangeManager.getInstance().subscribeToList(changeCallback);
            unsubscribeChangeManager = () => {
                const manager = FreChangeManager.getInstance();
                // Remove from primitive callbacks
                const primArr = manager.changePrimCallbacks;
                const primIdx = primArr.indexOf(changeCallback);
                if (primIdx !== -1) primArr.splice(primIdx, 1);

                // Remove from part callbacks
                const partArr = manager.changePartCallbacks;
                const partIdx = partArr.indexOf(changeCallback);
                if (partIdx !== -1) partArr.splice(partIdx, 1);

                // Remove from list element callbacks
                const listElemArr = manager.changeListElemCallbacks;
                const listElemIdx = listElemArr.indexOf(changeCallback);
                if (listElemIdx !== -1) listElemArr.splice(listElemIdx, 1);

                // Remove from list callbacks
                const listArr = manager.changeListCallbacks;
                const listIdx = listArr.indexOf(changeCallback);
                if (listIdx !== -1) listArr.splice(listIdx, 1);
            };
        }, 100); // 100ms delay to ensure model setup is complete

        setTimeout(() => {
            isLoading = false;
        }, 300);
    });

    onDestroy(() => {
        setDrawerVisibility("studyChecklist", false);
        setDrawerVisibility("patientTimelineChart", false);
        setDrawerVisibility("visitChecklist", false);
        if (unsubscribeChangeManager) unsubscribeChangeManager();
    });

    async function handleSavePatient() {
        if (isSaving) {
            return;
        }
        
        isSaving = true;
        
        try {
            const modelManager = ModelManager.getInstance();
            var patientNumber = patient!.patientNumber;
            const patientInfo = await modelManager.getModelUnit("PatientInfo") as PatientInfo;
            
            runInAction(() => {
                var found = false;
                // If the patientHistory for this patient was previously entered we need to replace it with the current value
                patientInfo.patientHistories.forEach(aPatientHistory => {
                    if (aPatientHistory.patient_id === patientNumber) {
                        found = true;
                        aPatientHistory.patientVisits.splice(0);
                        unit?.patientHistory.patientVisits.forEach(visit => {
                            aPatientHistory.patientVisits.push(visit.copy());
                        });
                        aPatientHistory.patientNotAvailableDates.splice(0);
                        unit!.patientHistory.patientNotAvailableDates.forEach(dateRange => aPatientHistory.patientNotAvailableDates.push(dateRange.copy()));
                    }
                });
                // If the patientHistory for this patient was not previously entered we need to add it to the list of all patientHistories in the PatientInfo
                if (!found) {
                    patientInfo.patientHistories.push(unit?.patientHistory.copy() as PatientHistory);
                }
            });
            
            // Saving all the patientHistories stored in the PatientInfo even though we are only editing one patient at a time
            await modelManager.saveModelUnit(patientInfo);
        } catch (error) {
            // Error during save
        } finally {
            isSaving = false;
        }
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
    }

    function clearPatientHistory(patientHistory: PatientHistory) {
        runInAction(() => {
            patientHistory.patientVisits.splice(0);
            patientHistory.patientNotAvailableDates.splice(0);
        });
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
                    <Tabs.Control stateActive="tab-active" value="patient-info">
                        <div class="tab-item"><IconCalendarDays size="16" />Completed Visits and Availability</div>
                    </Tabs.Control>
                {/snippet}

                {#snippet content()}
                    <Tabs.Panel value="schedule">
                        {#if !isLoading}
                            <div class="flex gap-2 mb-2">
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
