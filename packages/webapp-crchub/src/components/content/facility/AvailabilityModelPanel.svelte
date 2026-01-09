<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { env } from "../../../config/env.js";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { FreEditor } from "@freon4dsl/core";
    import { ModelManager } from "../../../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../../../services/dsl/webapp-configurator.js";
    import { type Availability } from "@freon4dsl/study-configuration";

    let { studyId, refreshTrigger = $bindable() } = $props<{ 
        studyId: string;
        refreshTrigger?: number;
    }>();

    interface AvailabilityModel {
        nodes: any[];
        languages: any[];
        serializationFormatVersion: string;
    }

    let model = $state<AvailabilityModel | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let lastUpdated = $state<Date | null>(null);
    
    // Freon editor state
    let dslEditor = $state<FreEditor | undefined>(undefined);
    let editorLoaded = $state(false);
    let availabilityUnit = $state<Availability | undefined>(undefined);

    // Compute staff levels as a derived value
    let staffLevels = $derived.by(() => {
        if (!model) return [];
        return getStaffLevelsSummary(model);
    });

    async function loadModel() {
        isLoading = true;
        error = null;
        try {
            // Fetch the model directly from the server as JSON
            const response = await fetch(`${env.serverUrl}/getModelUnit?model=${encodeURIComponent(studyId)}&unit=Availability`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    model = null;
                    error = "No availability model found";
                } else {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
                }
            } else {
                const responseText = await response.text();
                console.log('[AvailabilityModelPanel] Raw response text:', responseText.substring(0, 200));
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error('[AvailabilityModelPanel] Failed to parse JSON:', e);
                    throw new Error('Invalid JSON response from server');
                }
                
                console.log('[AvailabilityModelPanel] Parsed response:', data);
                
                // The server returns the model directly (not wrapped in {result: ...})
                // Check if data has nodes property (it's the model)
                if (data && data.nodes && Array.isArray(data.nodes)) {
                    model = data as AvailabilityModel;
                    lastUpdated = new Date();
                    console.log('[AvailabilityModelPanel] Model loaded successfully, nodes count:', model.nodes.length);
                } else {
                    model = null;
                    error = "No availability model found (invalid format)";
                    console.warn('[AvailabilityModelPanel] Invalid model format - expected nodes array, got:', data);
                }
            }
        } catch (err) {
            console.error('[AvailabilityModelPanel] Error loading model:', err);
            error = err instanceof Error ? err.message : "Failed to load model";
            model = null;
        } finally {
            isLoading = false;
        }
    }

    function formatModelForDisplay(model: AvailabilityModel): string {
        try {
            return JSON.stringify(model, null, 2);
        } catch (err) {
            return "Error formatting model";
        }
    }

    function getStaffLevelsSummary(model: AvailabilityModel): Array<{count: number, startDate: string, endDate: string}> {
        if (!model || !model.nodes) return [];
        
        const staffLevels: Array<{count: number, startDate: string, endDate: string}> = [];
        
        // Find root Availability node
        const rootNode = model.nodes.find((n: any) => n.parent === null && 
            n.classifier?.key === "-key-Availability");
        
        if (!rootNode) return [];
        
        // Find baseline staff count
        const baselineProp = rootNode.properties?.find((p: any) => 
            p.property?.key === "-key-Availability-baselineStaff");
        const totalStaff = baselineProp ? parseInt(baselineProp.value) : 0;
        
        // Find StaffLevel nodes
        const staffLevelContainment = rootNode.containments?.find((c: any) => 
            c.containment?.key === "-key-Availability-staffLevels");
        
        if (!staffLevelContainment) return [];
        
        for (const staffLevelId of staffLevelContainment.children || []) {
            const staffLevelNode = model.nodes.find((n: any) => n.id === staffLevelId);
            if (!staffLevelNode) continue;
            
            // Get staff count
            const countProp = staffLevelNode.properties?.find((p: any) => 
                p.property?.key === "-key-StaffLevel-staffAvailable");
            const count = countProp ? parseInt(countProp.value) : 0;
            
            // Get date range
            const dateRangeContainment = staffLevelNode.containments?.find((c: any) => 
                c.containment?.key === "-key-StaffLevel-dateOrRange");
            const dateRangeId = dateRangeContainment?.children?.[0];
            
            if (!dateRangeId) continue;
            
            const dateRangeNode = model.nodes.find((n: any) => n.id === dateRangeId);
            if (!dateRangeNode) continue;
            
            const startContainment = dateRangeNode.containments?.find((c: any) => 
                c.containment?.key === "-key-DateRange-startDate");
            const endContainment = dateRangeNode.containments?.find((c: any) => 
                c.containment?.key === "-key-DateRange-endDate");
            
            const startDateId = startContainment?.children?.[0];
            const endDateId = endContainment?.children?.[0];
            
            let startDate = "";
            let endDate = "";
            
            if (startDateId) {
                const startDateNode = model.nodes.find((n: any) => n.id === startDateId);
                const dateProp = startDateNode?.properties?.find((p: any) => 
                    p.property?.key === "-key-DateConcept-dateAsString");
                startDate = dateProp?.value || "";
            }
            
            if (endDateId) {
                const endDateNode = model.nodes.find((n: any) => n.id === endDateId);
                const dateProp = endDateNode?.properties?.find((p: any) => 
                    p.property?.key === "-key-DateConcept-dateAsString");
                endDate = dateProp?.value || "";
            }
            
            if (startDate && endDate) {
                staffLevels.push({ count, startDate, endDate });
            }
        }
        
        return staffLevels.sort((a, b) => a.startDate.localeCompare(b.startDate));
    }

    // Watch for refresh trigger changes
    $effect(() => {
        if (refreshTrigger !== undefined && refreshTrigger > 0) {
            loadModel();
            initializeFreonEditor();
        }
    });

    async function initializeFreonEditor() {
        try {
            dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
            const result = await ModelManager.getInstance().openModelUnit(studyId, "Availability") as Availability;
            if (result !== undefined && result !== null) {
                availabilityUnit = result;
                editorLoaded = true;
                console.log('[AvailabilityModelPanel] Freon editor loaded successfully');
            } else {
                editorLoaded = false;
                console.warn('[AvailabilityModelPanel] No availability unit found for Freon editor');
            }
        } catch (err) {
            console.error('[AvailabilityModelPanel] Error initializing Freon editor:', err);
            editorLoaded = false;
        }
    }

    onMount(async () => {
        await loadModel();
        await initializeFreonEditor();
    });
    
    onDestroy(() => {
        editorLoaded = false;
    });
</script>

<div class="availability-model-panel">
    <div class="panel-header">
        <h3>Availability Model</h3>
        <button type="button" class="refresh-button" onclick={loadModel} title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
            </svg>
        </button>
    </div>

    {#if isLoading}
        <div class="loading">Loading model...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if model}
        <div class="model-content">
            {#if lastUpdated}
                <div class="last-updated">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            {/if}
            
            {#if staffLevels.length > 0}
                <div class="staff-levels-summary">
                    <h4>Staff Levels</h4>
                    <div class="staff-levels-list">
                        {#each staffLevels as level}
                            <div class="staff-level-item">
                                <span class="count">{level.count} staff</span>
                                <span class="date-range">{level.startDate} to {level.endDate}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            
            {#if editorLoaded && dslEditor}
                <div class="freon-viewer-container">
                    <FreonComponent editor={dslEditor} />
                </div>
            {/if}
        </div>
    {:else}
        <div class="no-model">No availability model found</div>
    {/if}
</div>

<style>
    .availability-model-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--color-surface-100);
        border-radius: 8px;
        padding: 16px;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--color-surface-300);
    }

    .panel-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text);
    }

    .refresh-button {
        padding: 6px;
        background: none;
        border: 1px solid var(--color-surface-300);
        border-radius: 4px;
        cursor: pointer;
        color: var(--color-text);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }

    .refresh-button:hover {
        background-color: var(--color-surface-200);
    }

    .model-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .last-updated {
        font-size: 12px;
        color: var(--color-surface-600);
        font-style: italic;
    }

    .staff-levels-summary {
        background-color: var(--color-surface-50);
        border: 1px solid var(--color-surface-300);
        border-radius: 4px;
        padding: 12px;
    }

    .staff-levels-summary h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text);
    }

    .staff-levels-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .staff-level-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background-color: var(--color-surface-100);
        border-radius: 4px;
        font-size: 13px;
    }

    .staff-level-item .count {
        font-weight: 600;
        color: var(--color-primary-600);
    }

    .staff-level-item .date-range {
        color: var(--color-surface-700);
        font-family: monospace;
    }

    .loading, .error, .no-model {
        padding: 16px;
        text-align: center;
        color: var(--color-surface-600);
    }

    .error {
        color: var(--color-error-600);
    }

    .freon-viewer-container {
        margin-top: 16px;
        border: 1px solid var(--color-surface-300);
        border-radius: 4px;
        overflow: hidden;
        min-height: 200px;
        max-height: 400px;
        overflow-y: auto;
        background-color: var(--color-surface-50);
    }

    .freon-viewer-container :global(div) {
        padding: 12px;
    }
</style>

