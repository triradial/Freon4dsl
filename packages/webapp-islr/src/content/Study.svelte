<script lang="ts">
    import { AST, FreChangeManager, FreEditor, FrePartDelta, FrePartListDelta, FrePrimDelta, FrePrimListDelta } from "@freon4dsl/core";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { type ProjectConfiguration } from "@freon4dsl/project-configuration";
    import { Tabs } from "@skeletonlabs/skeleton-svelte";
    import { runInAction } from "mobx";
    import { onDestroy, onMount } from "svelte";
    import StudyCard from "../components/cards/StudyCard.svelte";
    import DSLFooter from "../components/common/DSLFooter.svelte";
    import { dataStore, type Study } from "../services/data/data-store.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { getActiveDrawer, setActiveDrawer, setDrawerVisibility } from "../services/stores/side-drawer-store.js";
// @ts-ignore
    import { PencilRuler as IconPencilRuler, Redo as IconRedo, Undo as IconUndo } from '@lucide/svelte';

    let { id } = $props<{ id: string }>();

    let project = $state<Study | undefined>(undefined);
    let editorLoaded = $state(false);
    let noModelAvailable = $state(false);
    let activeTab = $state('design');

    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit = $state<ProjectConfiguration | undefined>(undefined);
    let mobxVersion = $state(0);

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeChangeManager: (() => void) | undefined;

    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            handleSaveProject();
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
                visible: !!unit[cfg.id as keyof ProjectConfiguration],
            }));
        }
    });

    async function initializeProject() {
        // get the project data
        project = await dataStore.getStudy(id);
        if (!project) {
            await dataStore.getStudies();
            project = await dataStore.getStudy(id);
        }
        if (!project) {
            console.error(`Project with id ${id} not found`);
            return;
        }
        
        // Get the model data for the project
        console.log("initializeProject: openModelUnit: " + project.id);
        const result = await ModelManager.getInstance().openModelUnit(project.id, "ProjectConfiguration") as ProjectConfiguration;
        if (result !== undefined && result !== null) {
            unit = result;
            editorLoaded = true;
            updateVisibleProjections(unit);
        } else {
            noModelAvailable = true;
        }
    }

    onMount(async () => {
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        await initializeProject();

        // Subscribe to FreChangeManager changes
        const changeCallback = (delta) => {
            if (delta instanceof FrePrimDelta) {
                if (delta.oldValue != delta.newValue) {
                    // console.debug("✅ Data changed from FreChangeManager:", delta);
                    debouncedSave();
                }
            } else             if (delta instanceof FrePrimListDelta) {
                // console.debug("✅ List change from FreChangeManager:", delta);
                debouncedSave();
            } else if (delta instanceof FrePartListDelta) {
                // console.debug("✅ Part List change from FreChangeManager:", delta);
                debouncedSave();
            } else if (delta instanceof FrePartDelta) {
                // console.debug("✅ Part change from FreChangeManager:", delta);
                debouncedSave();
            } else {
                console.warn("⚠️ Unknown change from FreChangeManager:", delta);
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
    });

    onDestroy(() => {
        editorLoaded = false;
        if (unsubscribeChangeManager) unsubscribeChangeManager();
        var activeDrawer = getActiveDrawer();
        if (activeDrawer === "dslErrors") {
            setActiveDrawer(null);
        }
        setDrawerVisibility("dslErrors", false);
    });

    // Show the projections that are enabled in the project configuration.
    function updateVisibleProjections(ProjectConfiguration: ProjectConfiguration) {
        let names = [];

        const showScheduling = ProjectConfiguration.showScheduling;
        const showChecklists = ProjectConfiguration.showChecklists;
        const showSharedTasks = ProjectConfiguration.showSharedTasks;
        const showPeople = ProjectConfiguration.showPeople;
        const showSystems = ProjectConfiguration.showSystems;
        const showReferences = ProjectConfiguration.showReferences;
        const showDescriptions = ProjectConfiguration.showDescriptions;

        // Scheduling and checklists are both part of Event so they need combined and separate projections.
        if (showScheduling && showChecklists) {
            names.push("schedulingAndChecklistsShow");
        } else if (showScheduling) {
            names.push("schedulingShow");
        } else if (showChecklists) {
            names.push("checklistsShow");
        }

        // Shared tasks are part of AbstractTask so they need a separate projection.
        if (showSharedTasks) {
            names.push("sharedTasksShow");
        }
        
        // Handle combinations of people, systems, and references  
        if (showPeople && showSystems && showReferences) {
            names.push("peopleSystemsReferencesShow");
        } else if (showPeople && showSystems) {
            names.push("peopleSystemsShow");
        } else if (showPeople && showReferences) {
            names.push("peopleReferencesShow");
        } else if (showSystems && showReferences) {
            names.push("systemsReferencesShow");
        } else {
            // Individual projections
            if (showPeople) {
                names.push("peopleShow");
            }
            if (showSystems) {
                names.push("systemsShow");
            }
            if (showReferences) {
                names.push("referencesShow");
            }
        }
        if (ProjectConfiguration.showDescriptions) {
            names.push("descriptionsShow");
        }
        
        //TODO: determine why this projection is needed
        // names.push("Custom");

        const proj = dslEditor.projection;
    
        AST.change(() => {
            proj.enableProjections(names);

            // Let the editor know that the projections have changed.
            // TODO: This should go automatically through mobx.
            //       But observing the projections array does not work as expected.
            runInAction( () => {
                dslEditor.forceRecalculateProjection++;
            });
            // redo the validation to set the errors in the new box tree
            // todo reinstate the following statement
            // this.validate();
        });
    }

    function handleCheckboxChange(id: string, visible: boolean) {
        if (unit && id in unit) {
            (unit[id as keyof ProjectConfiguration] as boolean) = visible;
            updateVisibleProjections(unit as ProjectConfiguration);
            mobxVersion++;
        }
    }

    function handleSaveProject() {
        ModelManager.getInstance().saveCurrentUnit();
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
    }
</script>

{#if project}
    <div class="crc-container">
        <div class="card-container">
            <StudyCard studyId={project.id} />
        </div>
        <div class="crc-content">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-6" listMargin="mb-2" base="mt-2" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control stateActive="tab-active" value="design">
                        <div class="tab-item"><IconPencilRuler size="16" />Project Specification</div> 
                    </Tabs.Control>
                {/snippet}

                {#snippet content()}
                    <Tabs.Panel value="design">
                       {#if editorLoaded}
                            <div class="flex gap-2 mb-2">
                                <button type="button" class="icon-button primary inverted" onclick={handleUndoAction} tabindex="-1"><IconUndo /></button>
                                <button type="button" class="icon-button primary inverted" onclick={handleRedoAction} tabindex="-1"><IconRedo /></button>
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
