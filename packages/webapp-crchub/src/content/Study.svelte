<script lang="ts">
    import { onMount, onDestroy, getContext } from "svelte";
    import StudyCard from "../components/cards/StudyCard.svelte";
    import PatientGrid from "../components/content/PatientGrid.svelte";
    import DSLFooter from "../components/common/DSLFooter.svelte";
    import { Tabs, AppBar } from "@skeletonlabs/skeleton-svelte";
    import { dataStore, type Study } from "../services/data/data-store.js";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { FreEditor, FreProjectionHandler } from "@freon4dsl/core";
    import { type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { getActiveDrawer, setActiveDrawer, setDrawerVisibility } from "../services/stores/side-drawer-store.js";
    // @ts-ignore
    import { User as IconUser, PencilRuler as IconPencilRuler, Save as IconSave, Redo as IconRedo, Undo as IconUndo } from '@lucide/svelte';

    let { id } = $props<{ id: string }>();

    let study = $state<Study | undefined>(undefined);
    let editorLoaded = $state(false);
    let noModelAvailable = $state(false);
    let activeTab = $state('patients');

    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit = $state<StudyConfiguration | undefined>(undefined);
    let mobxVersion = $state(0);

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeEditorChange: (() => void) | undefined;

    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            handleSaveStudy();
        }, 1000); // 1 second debounce
    }

    const footerConfig = [
        { id: "showScheduling", label: "Scheduling" },
        { id: "showChecklists", label: "Checklists" },
        { id: "showReferences", label: "References", parent: "showChecklists" },
        { id: "showSystems", label: "Systems", parent: "showChecklists" },
        { id: "showPeople", label: "People", parent: "showChecklists" },
        { id: "showDescriptions", label: "Descriptions" },
        { id: "showSharedTasks", label: "Shared Tasks" },
    ];

    let footerItems = $derived(() => {
        mobxVersion;
        if (!unit) {
            return footerConfig.map(cfg => ({ ...cfg, visible: false }));
        } else {
            return footerConfig.map(cfg => ({
                ...cfg,
                visible: !!unit[cfg.id as keyof StudyConfiguration],
            }));
        }
    });

    async function initializeStudy() {
        // get the study data
        study = await dataStore.getStudy(id);
        if (!study) {
            // Try fetching all studies from backend, then try again
            await dataStore.getStudies();
            study = await dataStore.getStudy(id);
        }
        if (!study) {
            console.error(`Study with id ${id} not found`);
            return;
        }
        
        // Get the model data for the study
        const result = await ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration");
        if (result !== undefined && result !== null) {
            unit = result;
            setTimeout(() => {
                editorLoaded = true;
            }, 3000);
        } else {
            noModelAvailable = true;
        }
    }

    onMount(async () => {
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        console.log("[DEBUG] dslEditor instance in Study.svelte", dslEditor);
        initializeStudy();

        if (dslEditor && typeof dslEditor.subscribeToChanges === 'function') {
            unsubscribeEditorChange = dslEditor.subscribeToChanges((why) => {
                debouncedSave();
            });
        }
    });

    onDestroy(() => {
        editorLoaded = false;
        if (unsubscribeEditorChange) unsubscribeEditorChange();
        var activeDrawer = getActiveDrawer();
        if (activeDrawer === "studyTimelineTable" || activeDrawer === "studyTimelineChart" || activeDrawer === "dslErrors") {
            setActiveDrawer(null);
        }
        setDrawerVisibility("dslErrors", false);
        setDrawerVisibility("studyTimelineTable", false);
        setDrawerVisibility("studyTimelineChart", false);
    });

    import { runInAction } from "mobx";

    function updateVisibleProjections(id: string, visible: boolean) {
        let fullListOfProjections = [
            "SharedTaskShow",
            "SharedTaskHide",
            "SchedulingShow",
            "SchedulingHide",
            "SchedulingDetailsShow",
            "SchedulingDetailsHide",
            "ChecklistsShow",
            "ChecklistsHide",
            "ReferencesShow",
            "ReferencesHide",
            "SystemsShow",
            "SystemsHide",
            "PeopleShow",
            "PeopleHide",
            "DescriptionsShow",
            "DescriptionsHide",
            "NotesShow",
            "NotesHide",
        ]

        let names = [];
        if (id === "showSharedTasks" && visible) {
            names.push("SharedTaskShow");
        } else {
            names.push("SharedTaskHide");
        }
        if (id === "showScheduling" && visible) {
            names.push("SchedulingShow");
        } else {
            names.push("SchedulingHide");
        }
        if (id === "showSchedulingDetails" && visible) {
            names.push("SchedulingDetailsShow");
        } else {
            names.push("SchedulingDetailsHide");
        }
        if (id === "showChecklists" && visible) {
            names.push("ChecklistsShow");
        } else {
            names.push("ChecklistsHide");
        }
        if (id === "showReferences" && visible) {
            names.push("ReferencesShow");
        } else {
            names.push("ReferencesHide");
        }
        if (id === "showSystems" && visible) {
            names.push("SystemsShow");
        } else {
            names.push("SystemsHide");
        }
        if (id === "showPeople" && visible) {
            names.push("PeopleShow");
        } else {
            names.push("PeopleHide");
        }
        if (id === "showDescriptions" && visible) {
            names.push("DescriptionsShow");
        } else {
            names.push("DescriptionsHide");
        }
        if (id === "showNotes" && visible) {
            names.push("NotesShow");
        } else {
            names.push("NotesHide");
        }

        const proj = dslEditor.projection;
        proj.enableProjections(names);

        // Let the editor know that the projections have changed.
        // TODO: This should go automatically through mobx.
        //       But observing the projections array does not work as expected.
        runInAction( () => {
            dslEditor.forceRecalculateProjection++;
        })
        // redo the validation to set the errors in the new box tree
        // todo reinstate the following statement
        // this.validate();
    }

    function handleCheckboxChange(id: string, visible: boolean) {
        if (unit && id in unit) {
            (unit[id as keyof StudyConfiguration] as boolean) = visible;
            // updateVisibleProjections(id, visible);
            ModelManager.getInstance().saveCurrentUnit();
            mobxVersion++;
        }
    }

    function handleSaveStudy() {
        ModelManager.getInstance().saveCurrentUnit();
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
    }
</script>

{#if study}
    <div class="crc-container">
        <div class="card-container">
            <StudyCard studyId={study.id} />
        </div>
        <div class="crc-content">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-6" listMargin="mb-2" base="mt-2" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control stateActive="tab-active" value="patients">
                        <div class="tab-item"><IconUser size="16" />Patients</div>
                    </Tabs.Control>
                    <Tabs.Control stateActive="tab-active" value="design">
                        <div class="tab-item"><IconPencilRuler size="16" />Study Design</div> 
                    </Tabs.Control>
                {/snippet}

                {#snippet content()}
                    <Tabs.Panel value="patients">
                        <div class="crc-grid inside-tab">
                            <PatientGrid studyId={study.id} />
                        </div>
                    </Tabs.Panel>
                    <Tabs.Panel value="design">
                       {#if editorLoaded}
                            <div class="flex gap-2 mb-2">
                                <button type="button" class="icon-button primary inverted" onclick={handleUndoAction}><IconUndo /></button>
                                <button type="button" class="icon-button primary inverted" onclick={handleRedoAction}><IconRedo /></button>
                            </div>
                            <div class="crc-editor crc-content-width">
                                <FreonComponent editor={dslEditor} />
                            </div>
                            <div class="crc-editor-footer h-8 crc-content-width">
                                <DSLFooter items={footerItems()} onCheckboxChange={handleCheckboxChange} />
                            </div>
                        {:else}
                            {#if noModelAvailable === false}
                                <div class="crc-editor crc-content-width">
                                    <div class="placeholder animate-pulse"></div>
                                </div>
                            {:else}
                                <div class="crc-editor crc-content-width">
                                    <span class="editor-message">No model available</span>
                                </div>
                            {/if}
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
