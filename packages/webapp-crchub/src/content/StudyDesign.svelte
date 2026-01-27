<script lang="ts">
    import { AST, FreChangeManager, FreEditor, FrePartDelta, FrePartListDelta, FrePrimDelta, FrePrimListDelta } from "@freon4dsl/core";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { Tabs } from "@skeletonlabs/skeleton-svelte";
    import { runInAction } from "mobx";
    import { onDestroy, onMount } from "svelte";
    import { browser } from '$app/environment';
    import DSLFooter from "../components/common/DSLFooter.svelte";
    import { dataStore, type Study } from "../services/data/data-store.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    // @ts-ignore
    import { Undo as IconUndo, Redo as IconRedo } from '@lucide/svelte';
    import StudyDesignErrors from "./study/StudyDesignErrors.svelte";
    import StudyTimelineTable from "./study/StudyTimelineTable.svelte";
    import StudyTimelineChart from "./study/StudyTimelineChart.svelte";
    import StudyChecklist from "./study/StudyChecklist.svelte";
    import { simulationService } from "../services/simulation/simulation-service.js";

    let { id } = $props<{ id: string }>();

    let study = $state<Study | undefined>(undefined);
    let editorLoaded = $state(false);
    let noModelAvailable = $state(false);
    let activeTab = $state('errors');
    let errorCount = $state(0);

    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit = $state<StudyConfiguration | undefined>(undefined);
    let mobxVersion = $state(0);

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeChangeManager: (() => void) | undefined;

    // Splitter state for editor/tabs panels
    let isDraggingSplitter = $state(false);
    let splitterContainer: HTMLDivElement | undefined = $state();
    let splitterHandle: HTMLButtonElement | undefined = $state();
    
    // Panel widths in rem
    const TABS_PANEL_MIN_WIDTH = 20;
    const TABS_PANEL_MAX_WIDTH = 90;
    const TABS_PANEL_DEFAULT_WIDTH = 30;
    const SPLITTER_STORAGE_KEY = 'study-design-tabs-width';
    
    let tabsPanelWidth = $state(TABS_PANEL_DEFAULT_WIDTH);
    let errorsComponent: StudyDesignErrors | undefined = $state();
    let timelineTableComponent: StudyTimelineTable | undefined = $state();
    let timelineChartComponent: StudyTimelineChart | undefined = $state();
    let checklistComponent: StudyChecklist | undefined = $state();
    let errorCountRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

    // Load splitter setting from localStorage
    function loadSplitterSetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SPLITTER_STORAGE_KEY);
            if (saved) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= TABS_PANEL_MIN_WIDTH && parsed <= TABS_PANEL_MAX_WIDTH) {
                    tabsPanelWidth = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load splitter setting:', e);
        }
    }
    
    // Save splitter setting to localStorage
    function saveSplitterSetting() {
        if (!browser) return;
        try {
            localStorage.setItem(SPLITTER_STORAGE_KEY, tabsPanelWidth.toString());
        } catch (e) {
            console.warn('Failed to save splitter setting:', e);
        }
    }

    function debouncedSave() {
        console.log('💾 StudyDesign.svelte: debouncedSave called');
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            console.log('💾 StudyDesign.svelte: debouncedSave timeout fired, calling handleSaveStudy');
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

    // Splitter handlers
    function handleSplitterMouseDown(event: MouseEvent) {
        if (!browser) return;
        event.preventDefault();
        isDraggingSplitter = true;
        document.addEventListener('mousemove', handleSplitterMouseMove);
        document.addEventListener('mouseup', handleSplitterMouseUp);
    }

    function handleSplitterMouseMove(event: MouseEvent) {
        if (!isDraggingSplitter || !splitterContainer) return;
        
        const rect = splitterContainer.getBoundingClientRect();
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const newTabsWidth = ((rect.right - event.clientX) / rootFontSize);
        
        const constrainedWidth = Math.max(TABS_PANEL_MIN_WIDTH, Math.min(TABS_PANEL_MAX_WIDTH, newTabsWidth));
        tabsPanelWidth = constrainedWidth;
    }

    function handleSplitterMouseUp() {
        if (!browser) return;
        isDraggingSplitter = false;
        document.removeEventListener('mousemove', handleSplitterMouseMove);
        document.removeEventListener('mouseup', handleSplitterMouseUp);
        saveSplitterSetting();
    }

    async function initializeStudy() {
        // get the study data
        study = await dataStore.getStudy(id);
        if (!study) {
            await dataStore.getStudies();
            study = await dataStore.getStudy(id);
        }
        if (!study) {
            console.error(`Study with id ${id} not found`);
            return;
        }
        
        // Get the model data for the study
        console.log(`[StudyDesign.svelte] initializeStudy: Starting to load model for study ${study.id} (${study.name})`);
        console.log(`[StudyDesign.svelte] Calling ModelManager.openModelUnit(${study.id}, "StudyConfiguration")`);
        
        const result = await ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration") as StudyConfiguration;
        
        console.log(`[StudyDesign.svelte] ModelManager.openModelUnit returned:`, {
            resultType: typeof result,
            isUndefined: result === undefined,
            isNull: result === null,
            hasValue: result !== undefined && result !== null
        });
        
        if (result !== undefined && result !== null) {
            unit = result;
            editorLoaded = true;
            console.log(`[StudyDesign.svelte] ✅ Model loaded successfully for study ${study.id}`);
            updateVisibleProjections(unit);
            // Update error count
            errorCount = ModelManager.getInstance().runValidator().length;
        } else {
            noModelAvailable = true;
            console.warn(`[StudyDesign.svelte] ⚠️ Study ${study.id} (${study.name}) has no StudyConfiguration model available`);
            console.warn(`[StudyDesign.svelte] Result was ${result === undefined ? 'undefined' : 'null'}`);
        }
    }

    onMount(async () => {
        loadSplitterSetting();
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        await initializeStudy();

        // Subscribe to FreChangeManager changes
        const changeCallback = (delta) => {
            if (delta instanceof FrePrimDelta) {
                if (delta.oldValue != delta.newValue) {
                    console.log("💾 StudyDesign.svelte: FrePrimDelta change detected", {
                        propertyName: delta.propertyName,
                        oldValue: delta.oldValue,
                        newValue: delta.newValue
                    });
                    debouncedSave();
                }
            } else if (delta instanceof FrePrimListDelta) {
                console.log("💾 StudyDesign.svelte: FrePrimListDelta change detected", {
                    propertyName: delta.propertyName
                });
                debouncedSave();
            } else if (delta instanceof FrePartListDelta) {
                console.log("💾 StudyDesign.svelte: FrePartListDelta change detected", {
                    propertyName: delta.propertyName
                });
                debouncedSave();
            } else if (delta instanceof FrePartDelta) {
                console.log("💾 StudyDesign.svelte: FrePartDelta change detected", {
                    propertyName: delta.propertyName
                });
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
        if (errorCountRefreshTimeout) {
            clearTimeout(errorCountRefreshTimeout);
        }
    });

    // Show the projections that are enabled in the study configuration.
    function updateVisibleProjections(studyConfiguration: StudyConfiguration) {
        let names = [];

        const showScheduling = studyConfiguration.showScheduling;
        const showChecklists = studyConfiguration.showChecklists;
        const showSharedTasks = studyConfiguration.showSharedTasks;
        const showPeople = studyConfiguration.showPeople;
        const showSystems = studyConfiguration.showSystems;
        const showReferences = studyConfiguration.showReferences;
        const showDescriptions = studyConfiguration.showDescriptions;

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
        if (studyConfiguration.showDescriptions) {
            names.push("descriptionsShow");
        }
        
        const proj = dslEditor.projection;
    
        AST.change(() => {
            proj.enableProjections(names);

            // Let the editor know that the projections have changed.
            runInAction( () => {
                dslEditor.forceRecalculateProjection++;
            });
        });
    }

    function handleCheckboxChange(id: string, visible: boolean) {
        if (unit && id in unit) {
            (unit[id as keyof StudyConfiguration] as boolean) = visible;
            updateVisibleProjections(unit as StudyConfiguration);
            mobxVersion++;
        }
    }

    // Async function to update error count without blocking UI
    function updateErrorCountAsync() {
        if (errorCountRefreshTimeout) {
            clearTimeout(errorCountRefreshTimeout);
        }

        errorCountRefreshTimeout = setTimeout(() => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    errorCount = ModelManager.getInstance().runValidator().length;
                    // Refresh the errors component
                    if (errorsComponent) {
                        errorsComponent.refresh();
                    }
                    // Only refresh the currently active timeline tab (not all tabs)
                    if (activeTab === 'timeline-table' && timelineTableComponent) {
                        timelineTableComponent.refresh(true); // force refresh
                    } else if (activeTab === 'timeline-chart' && timelineChartComponent) {
                        timelineChartComponent.refresh(true); // force refresh
                    } else if (activeTab === 'checklist' && checklistComponent) {
                        checklistComponent.refresh(true); // force refresh
                    }
                }, { timeout: 1000 });
            } else {
                setTimeout(() => {
                    errorCount = ModelManager.getInstance().runValidator().length;
                    // Refresh the errors component
                    if (errorsComponent) {
                        errorsComponent.refresh();
                    }
                    // Only refresh the currently active timeline tab (not all tabs)
                    if (activeTab === 'timeline-table' && timelineTableComponent) {
                        timelineTableComponent.refresh(true); // force refresh
                    } else if (activeTab === 'timeline-chart' && timelineChartComponent) {
                        timelineChartComponent.refresh(true); // force refresh
                    } else if (activeTab === 'checklist' && checklistComponent) {
                        checklistComponent.refresh(true); // force refresh
                    }
                }, 0);
            }
        }, 300); // 300ms debounce
    }

    function handleSaveStudy() {
        console.log('💾 StudyDesign.svelte: handleSaveStudy called');
        ModelManager.getInstance().saveCurrentUnit();
        // Clear simulation cache since model has changed
        simulationService.clearCache(id);
        // Update error count and refresh active timeline tab asynchronously after save
        updateErrorCountAsync();
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
        // Update error count and refresh timeline components asynchronously
        updateErrorCountAsync();
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
        // Update error count and refresh timeline components asynchronously
        updateErrorCountAsync();
    }

    // Update error count when tab changes to errors
    $effect(() => {
        if (activeTab === 'errors' && editorLoaded) {
            // Update error count asynchronously when tab becomes active
            updateErrorCountAsync();
        }
    });

    // Refresh timeline tab when it becomes active (lazy load)
    $effect(() => {
        if (activeTab === 'timeline-table' && timelineTableComponent) {
            timelineTableComponent.refresh(false); // use cache if available
        } else if (activeTab === 'timeline-chart' && timelineChartComponent) {
            timelineChartComponent.refresh(false); // use cache if available
        } else if (activeTab === 'checklist' && checklistComponent) {
            checklistComponent.refresh(false); // use cache if available
        }
    });
</script>

{#if study}
    <div bind:this={splitterContainer} class="splitter-container" class:dragging={isDraggingSplitter}>
        <!-- Left Panel: Study Designer -->
        <div class="splitter-panel" style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div class="main-label-text mb-2" style="padding: 0.5rem 1rem 0 1rem;">Study Design</div>
            {#if editorLoaded}
                <div class="flex gap-2 mb-2" style="padding: 0 1rem;">
                    <button type="button" class="icon-button primary inverted" onclick={handleUndoAction} tabindex="-1"><IconUndo /></button>
                    <button type="button" class="icon-button primary inverted" onclick={handleRedoAction} tabindex="-1"><IconRedo /></button>
                </div>
                <div class="crc-editor crc-content-width" style="flex: 1; overflow: auto;">
                    <FreonComponent editor={dslEditor} />
                </div>
                <div class="crc-editor-footer h-8 crc-content-width">
                    <DSLFooter items={footerItems()} onCheckboxChange={handleCheckboxChange} />
                </div>
            {:else}
                {#if noModelAvailable === false}
                    <div class="crc-editor crc-content-width" style="flex: 1; overflow: auto;">
                        <div class="placeholder animate-pulse"></div>
                    </div>
                {:else}
                    <div class="crc-editor crc-content-width" style="flex: 1; overflow: auto;">
                        <span class="editor-message">No model available</span>
                    </div>
                {/if}
            {/if}
        </div>
            
        <!-- Splitter -->
        <button type="button" bind:this={splitterHandle} class="splitter-handle" onmousedown={handleSplitterMouseDown} role="slider" aria-label="Resize tabs panel"></button>
            
        <!-- Right Panel: Tabs -->
        <div class="splitter-panel" style="width: {tabsPanelWidth}rem; flex-shrink: 0; display: flex; flex-direction: column; overflow: hidden;">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-8" listMargin="mb-1" base="mt-4 mr-4 ml-4" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control stateActive="tab-active" value="errors">
                        <div class="tab-item tab-item-with-badge">
                            <span>Errors</span>
                            {#if errorCount > 0}
                                <span class="badge tab-badge">{errorCount}</span>
                            {/if}
                        </div>
                    </Tabs.Control>
                    <Tabs.Control stateActive="tab-active" value="timeline-table">
                        <div class="tab-item">Timeline Table</div>
                    </Tabs.Control>
                    <Tabs.Control stateActive="tab-active" value="timeline-chart">
                        <div class="tab-item">Timeline Chart</div>
                    </Tabs.Control>
                    <Tabs.Control stateActive="tab-active" value="checklist">
                        <div class="tab-item">Checklist</div>
                    </Tabs.Control>
                    <Tabs.Indicator />
                {/snippet}
                {#snippet content()}
                    <Tabs.Panel value="errors">
                        <div class="tab-content-wrapper">
                            <StudyDesignErrors bind:this={errorsComponent} studyId={id} />
                        </div>
                    </Tabs.Panel>
                    <Tabs.Panel value="timeline-table">
                        <div class="tab-content-wrapper">
                            <StudyTimelineTable bind:this={timelineTableComponent} studyId={id} />
                        </div>
                    </Tabs.Panel>
                    <Tabs.Panel value="timeline-chart">
                        <div class="tab-content-wrapper">
                            <StudyTimelineChart bind:this={timelineChartComponent} studyId={id} />
                        </div>
                    </Tabs.Panel>
                    <Tabs.Panel value="checklist">
                        <div class="tab-content-wrapper">
                            <StudyChecklist bind:this={checklistComponent} studyId={id} />
                        </div>
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

<style>
    .crc-editor {
        height: calc(100% - 3rem);
        overflow: auto;
    }
    
    .crc-editor-footer {
        height: 2rem;
    }
    
    .splitter-panel {
        height: 100%;
    }
    
    :global(.tab-content-wrapper) {
        height: calc(100vh - 12.5rem);
        overflow: auto;
        padding: 0;
    }
</style>
