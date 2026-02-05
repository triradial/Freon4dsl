<script lang="ts">
    import { browser } from '$app/environment';
    import { AST, FreChangeManager, FreEditor, FreEditorUtil, FrePartDelta, FrePartListDelta, FrePrimDelta, FrePrimListDelta, FreUndoManager } from "@freon4dsl/core";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { Tabs } from "@skeletonlabs/skeleton-svelte";
    import { runInAction } from "mobx";
    import { onDestroy, onMount } from "svelte";
    import StudyDesignDisplayOptions from "./StudyDesignDisplayOptions.svelte";
    import { dataStore, type Study } from "../../services/data/data-store.js";
    import { EditorRequestsHandler } from "../../services/dsl/editor-requests-handler.js";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../../services/dsl/webapp-configurator.js";
// @ts-ignore
    import { Redo as IconRedo, Undo as IconUndo, Eye as IconEye, ChevronsDownUp as IconCollapseAll, ChevronsUpDown as IconExpandAll, ChevronsLeftRight as IconResetDefaults } from '@lucide/svelte';
    import { simulationService } from "../../services/simulation/simulation-service.js";
    import { expandCollapseStore } from "../../services/stores/expand-collapse-store.js";
    import { perfLogger } from "../../services/performance-logger.js";
    import StudyChecklist from "./StudyChecklist.svelte";
    import StudyDesignErrors from "./StudyDesignErrors.svelte";
    import StudyTimelineChart from "./StudyTimelineChart.svelte";
    import StudyTimelineTable from "./StudyTimelineTable.svelte";

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
    let isSaving = $state(false);
    // Flag to track when undo/redo is in progress (to skip redundant change callbacks)
    let isUndoRedoInProgress = false;

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
    
    // Undo/redo button state
    let canUndo = $state(false);
    let canRedo = $state(false);
    
    // Update undo/redo button states based on stack availability
    function updateUndoRedoState() {
        if (!unit) {
            canUndo = false;
            canRedo = false;
            return;
        }
        const undoManager = FreUndoManager.getInstance();
        const undoText = undoManager.nextUndoAsText(unit);
        const redoText = undoManager.nextRedoAsText(unit);
        // Enable buttons if there's anything in the stack
        // When clicking, we'll skip PartDeltas to find the actual user change (PrimDelta)
        canUndo = undoText !== "nothing left to undo";
        canRedo = redoText !== "nothing left to redo";
        console.log('🔄 updateUndoRedoState:', { canUndo, canRedo, undoText, redoText });
    }

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
        perfLogger.mark('debounced-save-triggered');
        console.log('💾 StudyDesign.svelte: debouncedSave called');
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            console.log('💾 StudyDesign.svelte: debouncedSave timeout fired, calling handleSaveStudy');
            perfLogger.mark('debounced-save-timeout-fired');
            handleSaveStudy();
        }, 1000); // 1 second debounce
    }

    const footerConfig = [
        { id: "showScheduling", label: "Schedules" },
        { id: "showChecklists", label: "Checklists" },
        { id: "showSteps", label: "Steps", parent: "showChecklists" },
        { id: "showReferences", label: "References", parent: "showSteps" },
        { id: "showSystems", label: "Systems", parent: "showSteps" },
        { id: "showPeople", label: "People", parent: "showSteps" },
        // { id: "showDescriptions", label: "Descriptions" },
        { id: "showSharedTasks", label: "Shared Tasks" },
    ];
    
    // Calculate counts for display options
    function calculateCounts(studyConfig: StudyConfiguration | undefined): Record<string, number> {
        const counts: Record<string, number> = {};
        if (!studyConfig) return counts;
        
        let totalSteps = 0;
        let totalReferences = 0;
        let totalSystems = 0;
        let totalPeople = 0;
        
        // Iterate through all periods, events, and tasks to count
        for (const period of studyConfig.periods ?? []) {
            for (const event of period.events ?? []) {
                for (const eventTask of event.tasks ?? []) {
                    // Get steps from Task or SharedTask (via TaskReference)
                    let steps: any[] = [];
                    if ('steps' in eventTask && Array.isArray(eventTask.steps)) {
                        steps = eventTask.steps;
                    } else if ('task' in eventTask && eventTask.task && 'steps' in eventTask.task) {
                        // TaskReference - get steps from the referenced SharedTask
                        steps = eventTask.task.steps ?? [];
                    }
                    
                    totalSteps += steps.length;
                    
                    for (const step of steps) {
                        totalReferences += (step.references ?? []).length;
                        totalSystems += (step.systems ?? []).length;
                        totalPeople += (step.people ?? []).length;
                    }
                }
            }
        }
        
        counts.showSteps = totalSteps;
        counts.showReferences = totalReferences;
        counts.showSystems = totalSystems;
        counts.showPeople = totalPeople;
        
        return counts;
    }

    let footerItems = $derived(() => {
        mobxVersion;
        if (!unit) {
            return footerConfig.map(cfg => ({ ...cfg, visible: false, count: undefined as number | undefined }));
        } else {
            const counts = calculateCounts(unit);
            return footerConfig.map(cfg => ({
                ...cfg,
                visible: !!unit[cfg.id as keyof StudyConfiguration],
                count: counts[cfg.id] as number | undefined,
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
        perfLogger.start('initialize-study');
        
        // Reset the expand/collapse store so this study uses the language-defined isExpanded defaults
        // This ensures expand/collapse commands from a previously viewed study don't affect this study
        expandCollapseStore.reset();
        
        // get the study data
        perfLogger.start('fetch-study-data');
        study = await dataStore.getStudy(id);
        if (!study) {
            await dataStore.getStudies();
            study = await dataStore.getStudy(id);
        }
        perfLogger.end('fetch-study-data');
        
        if (!study) {
            console.error(`Study with id ${id} not found`);
            perfLogger.end('initialize-study', { error: 'study not found' });
            return;
        }
        
        // Get the model data for the study
        console.log(`[StudyDesign.svelte] initializeStudy: Starting to load model for study ${study.id} (${study.name})`);
        console.log(`[StudyDesign.svelte] Calling ModelManager.openModelUnit(${study.id}, "StudyConfiguration")`);
        
        perfLogger.start('open-model-unit');
        const result = await ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration") as StudyConfiguration;
        perfLogger.end('open-model-unit');
        
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
            
            perfLogger.start('update-visible-projections');
            updateVisibleProjections(unit);
            perfLogger.end('update-visible-projections');
            
            // Update error count
            perfLogger.start('initial-validator-run');
            errorCount = ModelManager.getInstance().runValidator().length;
            perfLogger.end('initial-validator-run', { errorCount });
            
            // Initialize undo/redo button states
            updateUndoRedoState();
        } else {
            noModelAvailable = true;
            console.warn(`[StudyDesign.svelte] ⚠️ Study ${study.id} (${study.name}) has no StudyConfiguration model available`);
            console.warn(`[StudyDesign.svelte] Result was ${result === undefined ? 'undefined' : 'null'}`);
        }
        
        perfLogger.end('initialize-study');
    }

    onMount(async () => {
        loadSplitterSetting();
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        await initializeStudy();

        // Subscribe to FreChangeManager changes
        const changeCallback = (delta) => {
            perfLogger.start('change-callback', { 
                deltaType: delta.constructor.name,
                propertyName: delta.propertyName 
            });
            
            // Prevent infinite loops: ignore changes while saving
            if (isSaving) {
                perfLogger.end('change-callback', { skipped: 'isSaving' });
                return;
            }
            
            // Skip changes triggered by undo/redo operations - those are handled separately
            if (isUndoRedoInProgress) {
                console.log("⏭️ StudyDesign.svelte: Change during undo/redo - skipping", {
                    propertyName: delta.propertyName,
                    deltaType: delta.constructor.name
                });
                perfLogger.end('change-callback', { skipped: 'undoRedoInProgress' });
                return;
            }
            
            // Only save if the change is from the unit we're editing
            // This prevents infinite loops: when model.addUnit() is called during openModel,
            // those changes have delta.unit !== unit, so they're ignored here
            if (!unit || delta.unit !== unit) {
                perfLogger.end('change-callback', { skipped: 'differentUnit' });
                return;
            }
            
            if (delta instanceof FrePrimDelta) {
                if (delta.oldValue != delta.newValue) {
                    console.log("💾 StudyDesign.svelte: FrePrimDelta change detected", {
                        propertyName: delta.propertyName,
                        oldValue: delta.oldValue,
                        newValue: delta.newValue
                    });
                    debouncedSave();
                    // Update undo/redo button states after data change (with small delay for stack update)
                    setTimeout(updateUndoRedoState, 10);
                    // Update display options counts
                    mobxVersion++;
                }
            } else if (delta instanceof FrePrimListDelta) {
                console.log("💾 StudyDesign.svelte: FrePrimListDelta change detected", {
                    propertyName: delta.propertyName
                });
                debouncedSave();
                // Update undo/redo button states after data change
                setTimeout(updateUndoRedoState, 10);
                // Update display options counts
                mobxVersion++;
            } else if (delta instanceof FrePartListDelta) {
                console.log("💾 StudyDesign.svelte: FrePartListDelta change detected", {
                    propertyName: delta.propertyName
                });
                debouncedSave();
                // Update undo/redo button states after data change
                setTimeout(updateUndoRedoState, 10);
                // Update display options counts
                mobxVersion++;
            } else if (delta instanceof FrePartDelta) {
                console.log("💾 StudyDesign.svelte: FrePartDelta change detected", {
                    propertyName: delta.propertyName
                });
                debouncedSave();
                // Update undo/redo button states after data change
                setTimeout(updateUndoRedoState, 10);
                // Update display options counts
                mobxVersion++;
            } else {
                console.warn("⚠️ Unknown change from FreChangeManager:", delta);
            }
            
            perfLogger.end('change-callback');
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
        perfLogger.start('update-projections-internal');
        
        let names = [];

        const showScheduling = studyConfiguration.showScheduling;
        const showChecklists = studyConfiguration.showChecklists;
        // @ts-ignore - showSteps may not exist on type until regenerated, default to true
        const showSteps = studyConfiguration.showSteps ?? true;
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

        // Steps are shown inside Task when Steps checkbox is enabled
        if (showSteps) {
            names.push("stepsShow");
        }

        // Shared tasks are part of AbstractTask so they need a separate projection.
        if (showSharedTasks) {
            names.push("sharedTasksShow");
        }
        
        // Handle combinations of people, systems, and references (only if steps are visible)
        if (showSteps) {
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
        }
        if (studyConfiguration.showDescriptions) {
            names.push("descriptionsShow");
        }
        
        const proj = dslEditor.projection;
    
        perfLogger.start('ast-change-projections');
        AST.change(() => {
            proj.enableProjections(names);

            // Let the editor know that the projections have changed.
            perfLogger.start('run-in-action-projection');
            runInAction( () => {
                dslEditor.forceRecalculateProjection++;
            });
            perfLogger.end('run-in-action-projection');
        });
        perfLogger.end('ast-change-projections');
        
        perfLogger.end('update-projections-internal', { projectionCount: names.length, projections: names });
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
        perfLogger.mark('error-count-async-triggered');
        
        if (errorCountRefreshTimeout) {
            clearTimeout(errorCountRefreshTimeout);
        }

        errorCountRefreshTimeout = setTimeout(() => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    perfLogger.start('validator-run');
                    errorCount = ModelManager.getInstance().runValidator().length;
                    perfLogger.end('validator-run', { errorCount });
                    
                    // Refresh the errors component
                    if (errorsComponent) {
                        perfLogger.start('errors-component-refresh');
                        errorsComponent.refresh();
                        perfLogger.end('errors-component-refresh');
                    }
                    // Only refresh the currently active timeline tab (not all tabs)
                    if (activeTab === 'timeline-table' && timelineTableComponent) {
                        perfLogger.start('timeline-table-refresh');
                        timelineTableComponent.refresh(true); // force refresh
                        perfLogger.end('timeline-table-refresh');
                    } else if (activeTab === 'timeline-chart' && timelineChartComponent) {
                        perfLogger.start('timeline-chart-refresh');
                        timelineChartComponent.refresh(true); // force refresh
                        perfLogger.end('timeline-chart-refresh');
                    } else if (activeTab === 'checklist' && checklistComponent) {
                        perfLogger.start('checklist-refresh');
                        checklistComponent.refresh(true); // force refresh
                        perfLogger.end('checklist-refresh');
                    }
                }, { timeout: 1000 });
            } else {
                setTimeout(() => {
                    perfLogger.start('validator-run');
                    errorCount = ModelManager.getInstance().runValidator().length;
                    perfLogger.end('validator-run', { errorCount });
                    
                    // Refresh the errors component
                    if (errorsComponent) {
                        perfLogger.start('errors-component-refresh');
                        errorsComponent.refresh();
                        perfLogger.end('errors-component-refresh');
                    }
                    // Only refresh the currently active timeline tab (not all tabs)
                    if (activeTab === 'timeline-table' && timelineTableComponent) {
                        perfLogger.start('timeline-table-refresh');
                        timelineTableComponent.refresh(true); // force refresh
                        perfLogger.end('timeline-table-refresh');
                    } else if (activeTab === 'timeline-chart' && timelineChartComponent) {
                        perfLogger.start('timeline-chart-refresh');
                        timelineChartComponent.refresh(true); // force refresh
                        perfLogger.end('timeline-chart-refresh');
                    } else if (activeTab === 'checklist' && checklistComponent) {
                        perfLogger.start('checklist-refresh');
                        checklistComponent.refresh(true); // force refresh
                        perfLogger.end('checklist-refresh');
                    }
                }, 0);
            }
        }, 300); // 300ms debounce
    }

    async function handleSaveStudy() {
        perfLogger.start('handle-save-study');
        console.log('💾 StudyDesign.svelte: handleSaveStudy called');
        isSaving = true;
        try {
            // Use forceSaveCurrentUnit to ensure the unit is marked as dirty and actually saved
            // This is necessary because Freon's change detection (FrePartDelta etc.) triggers
            // debouncedSave, but doesn't automatically add the unit to InMemoryModel.dirtyUnits
            perfLogger.start('force-save-current-unit');
            await ModelManager.getInstance().forceSaveCurrentUnit();
            perfLogger.end('force-save-current-unit');
            
            // Clear simulation cache since model has changed
            perfLogger.start('clear-simulation-cache');
            simulationService.clearCache(id);
            perfLogger.end('clear-simulation-cache');
            
            // Update error count and refresh active timeline tab asynchronously after save
            updateErrorCountAsync();
        } catch (error) {
            perfLogger.end('handle-save-study', { error: String(error) });
            throw error;
        } finally {
            isSaving = false;
            perfLogger.end('handle-save-study');
        }
    }

    /**
     * Extract property name from delta text like "FreTransactionDelta<PartDelta: set TimeAmount.unit to days>"
     * Returns the property name (e.g., "unit") or null if not found.
     */
    function extractPropertyFromDeltaText(deltaText: string): string | null {
        // Match pattern like "set TypeName.propertyName to" or "set TypeName.propertyName old"
        const match = deltaText.match(/set \w+\.(\w+) (?:to|old)/);
        return match ? match[1] : null;
    }
    
    function handleUndoAction() {
        if (!dslEditor || !canUndo) return;
        
        perfLogger.start('undo-action');
        
        const undoManager = FreUndoManager.getInstance();
        const MAX_SKIP = 50; // Safety limit
        let skipCount = 0;
        
        // Set flag to skip change callbacks during undo
        isUndoRedoInProgress = true;
        let lastDelta: any = undefined;
        
        try {
            while (skipCount < MAX_SKIP) {
                const nextUndoText = unit ? undoManager.nextUndoAsText(unit) : 'nothing left to undo';
                
                if (nextUndoText === 'nothing left to undo') {
                    console.log('🔙 UNDO: Nothing left to undo (after skipping', skipCount, 'entries)');
                    break;
                }
                
                const isPrimDelta = nextUndoText.includes('PrimDelta');
                
                // Do the undo
                perfLogger.start('undo-single-step');
                const delta = EditorRequestsHandler.getInstance().undoWithDelta();
                perfLogger.end('undo-single-step');
                lastDelta = delta;
                
                if (isPrimDelta) {
                    // Found a PrimDelta - this is a user change, stop here
                    console.log('🔙 UNDO: Undid PrimDelta:', { nextUndoText, skippedEntries: skipCount });
                    break;
                } else {
                    // It's a PartDelta - check if we should skip (validator duplication) or stop (user change)
                    const currentProp = extractPropertyFromDeltaText(nextUndoText);
                    const peekNext = unit ? undoManager.nextUndoAsText(unit) : 'nothing left to undo';
                    const nextProp = extractPropertyFromDeltaText(peekNext);
                    const nextIsPrimDelta = peekNext.includes('PrimDelta');
                    
                    // Only skip if the NEXT entry is also a PartDelta for the SAME property
                    // This indicates validator duplication, not a user change
                    if (!nextIsPrimDelta && peekNext !== 'nothing left to undo' && currentProp && currentProp === nextProp) {
                        console.log('🔙 UNDO: Skipped duplicate PartDelta:', { property: currentProp, nextUndoText, skipCount });
                        skipCount++;
                        // Continue loop to skip duplicates
                    } else {
                        // Next is different (PrimDelta, different property, or empty) - this PartDelta might be meaningful, stop
                        console.log('🔙 UNDO: Undid PartDelta:', { property: currentProp, nextUndoText, skippedEntries: skipCount });
                        break;
                    }
                }
            }
            
            // Handle selection updates if the previously selected box is no longer in the tree
            if (lastDelta !== undefined && !dslEditor.isBoxInTree(dslEditor.selectedBox)) {
                perfLogger.start('select-after-undo');
                FreEditorUtil.selectAfterUndo(dslEditor, lastDelta);
                perfLogger.end('select-after-undo');
            }
            // Trigger component refresh via selectionChanged
            perfLogger.start('selection-changed-after-undo');
            dslEditor.selectionChanged();
            perfLogger.end('selection-changed-after-undo');
        } finally {
            isUndoRedoInProgress = false;
        }
        // Update undo/redo button states
        updateUndoRedoState();
        // Save the model after undo (model has changed)
        debouncedSave();
        // Update error count and refresh timeline components asynchronously
        updateErrorCountAsync();
        // Update display options counts
        mobxVersion++;
        
        perfLogger.end('undo-action', { skippedEntries: skipCount });
    }

    function handleRedoAction() {
        if (!dslEditor || !canRedo) return;
        
        perfLogger.start('redo-action');
        
        const undoManager = FreUndoManager.getInstance();
        const MAX_SKIP = 50; // Safety limit
        let skipCount = 0;
        
        // Set flag to skip change callbacks during redo
        isUndoRedoInProgress = true;
        let lastDelta: any = undefined;
        
        try {
            while (skipCount < MAX_SKIP) {
                const nextRedoText = unit ? undoManager.nextRedoAsText(unit) : 'nothing left to redo';
                
                if (nextRedoText === 'nothing left to redo') {
                    console.log('🔜 REDO: Nothing left to redo (after skipping', skipCount, 'entries)');
                    break;
                }
                
                const isPrimDelta = nextRedoText.includes('PrimDelta');
                
                // Do the redo
                perfLogger.start('redo-single-step');
                const delta = EditorRequestsHandler.getInstance().redoWithDelta();
                perfLogger.end('redo-single-step');
                lastDelta = delta;
                
                if (isPrimDelta) {
                    // Found a PrimDelta - this is a user change, stop here
                    console.log('🔜 REDO: Redid PrimDelta:', { nextRedoText, skippedEntries: skipCount });
                    break;
                } else {
                    // It's a PartDelta - check if we should skip (validator duplication) or stop (user change)
                    const currentProp = extractPropertyFromDeltaText(nextRedoText);
                    const peekNext = unit ? undoManager.nextRedoAsText(unit) : 'nothing left to redo';
                    const nextProp = extractPropertyFromDeltaText(peekNext);
                    const nextIsPrimDelta = peekNext.includes('PrimDelta');
                    
                    // Only skip if the NEXT entry is also a PartDelta for the SAME property
                    // This indicates validator duplication, not a user change
                    if (!nextIsPrimDelta && peekNext !== 'nothing left to redo' && currentProp && currentProp === nextProp) {
                        console.log('🔜 REDO: Skipped duplicate PartDelta:', { property: currentProp, nextRedoText, skipCount });
                        skipCount++;
                        // Continue loop to skip duplicates
                    } else {
                        // Next is different (PrimDelta, different property, or empty) - this PartDelta might be meaningful, stop
                        console.log('🔜 REDO: Redid PartDelta:', { property: currentProp, nextRedoText, skippedEntries: skipCount });
                        break;
                    }
                }
            }
            
            // Handle selection updates if the previously selected box is no longer in the tree
            if (lastDelta !== undefined && !dslEditor.isBoxInTree(dslEditor.selectedBox)) {
                perfLogger.start('select-after-redo');
                FreEditorUtil.selectAfterUndo(dslEditor, lastDelta);
                perfLogger.end('select-after-redo');
            }
            // Trigger component refresh via selectionChanged
            perfLogger.start('selection-changed-after-redo');
            dslEditor.selectionChanged();
            perfLogger.end('selection-changed-after-redo');
        } finally {
            isUndoRedoInProgress = false;
        }
        // Update undo/redo button states
        updateUndoRedoState();
        // Save the model after redo (model has changed)
        debouncedSave();
        // Update error count and refresh timeline components asynchronously
        updateErrorCountAsync();
        // Update display options counts
        mobxVersion++;
        
        perfLogger.end('redo-action', { skippedEntries: skipCount });
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
            {#if editorLoaded}
                <div class="flex gap-2 mb-2 items-center">
                    <button type="button" class="standard2-button primary inverted" onclick={handleUndoAction} tabindex="-1" disabled={!canUndo} title={canUndo ? 'Undo' : 'Nothing to undo'}><IconUndo size="16" /></button>
                    <button type="button" class="standard2-button primary inverted" onclick={handleRedoAction} tabindex="-1" disabled={!canRedo} title={canRedo ? 'Redo' : 'Nothing to redo'}><IconRedo size="16" /></button>
                    <span class="toolbar-separator"></span>
                    <button type="button" class="standard2-button primary inverted" onclick={() => { expandCollapseStore.expandAll(); dslEditor?.selectionChanged(); }} tabindex="-1" title="Expand All"><IconExpandAll size="16" /></button>
                    <button type="button" class="standard2-button primary inverted" onclick={() => { expandCollapseStore.resetToDefaults(); dslEditor?.selectionChanged(); }} tabindex="-1" title="Reset to Defaults"><IconResetDefaults size="16" /></button>
                    <button type="button" class="standard2-button primary inverted" onclick={() => { expandCollapseStore.collapseAll(); dslEditor?.selectionChanged(); }} tabindex="-1" title="Collapse All"><IconCollapseAll size="16" /></button>
                    <span class="toolbar-separator"></span>
                    <StudyDesignDisplayOptions items={footerItems()} onCheckboxChange={handleCheckboxChange} />              
                </div>
                <div class="crc-editor crc-content-width" style="flex: 1; overflow: auto;">
                    <FreonComponent editor={dslEditor} />
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
            
        <!-- Splitter - used as drag handle for resizing panels -->
        <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
        <button type="button" bind:this={splitterHandle} class="splitter-handle" onmousedown={handleSplitterMouseDown} role="separator" aria-orientation="vertical" aria-label="Resize tabs panel"></button>
            
        <!-- Right Panel: Tabs -->
        <div class="splitter-panel" style="width: {tabsPanelWidth}rem; flex-shrink: 0; display: flex; flex-direction: column; overflow: hidden;">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-8" listMargin="mb-1" base="mt-4 mr-4 ml-4" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control stateActive="tab-active" value="errors">
                        <div class="tab-item tab-item-with-badge">
                            <span>Issues</span>
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
    
    .splitter-panel {
        height: 100%;
    }
        
    :global(.tab-content-wrapper) {
        height: calc(100vh - 12.5rem);
        overflow: auto;
        padding: 0;
    }
</style>
