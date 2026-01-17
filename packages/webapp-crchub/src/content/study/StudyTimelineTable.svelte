<script lang="ts">
    import ContentLoader from "../../components/drawers/ContentLoader.svelte";
    import { simulationService } from "../../services/simulation/simulation-service.js";
    import StudyTimelineTableContent from "./StudyTimelineTableContent.svelte";
    
    let { studyId } = $props<{ studyId: string }>();

    let isLoading = $state(true);
    let tableHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container = $state<HTMLElement | null>(null);
    let hasRenderedBefore = $state(false);
    let lastSuccessfulContent = $state<string>("");

    export function refresh(forceRefresh: boolean = false) {
        loadTable(forceRefresh);
    }

    $effect(() => {
        if (studyId) {
            loadTable(false);
        }
    });

    async function loadTable(forceRefresh: boolean = false) {
        const startTime = performance.now();
        console.log(`[StudyTimelineTable] Loading table for ${studyId}, forceRefresh=${forceRefresh}`);
        
        isLoading = true;
        error = null;
        
        try {
            const simulationData = await simulationService.getSimulationData(studyId, forceRefresh);
            
            if (simulationData) {
                tableHtml = simulationData.tableHtml;
                lastSuccessfulContent = tableHtml;
                hasRenderedBefore = true;
                error = null;
                
                const elapsed = performance.now() - startTime;
                console.log(`[StudyTimelineTable] Table loaded in ${elapsed.toFixed(2)}ms`);
            } else {
                throw new Error("Failed to generate simulation data");
            }
        } catch (err: unknown) {
            console.error(`[StudyTimelineTable] Error loading table:`, err);
            if (hasRenderedBefore) {
                error = "Current design has issues that prevent this table from updating";
                tableHtml = lastSuccessfulContent;
            } else {
                error = "Current design has issues that prevent this table from showing";
                tableHtml = "";
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<div>
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {/if}
    {#if isLoading}
        <ContentLoader />
    {:else if tableHtml}
        <div bind:this={container} class="timeline-content-wrapper">
            <StudyTimelineTableContent {tableHtml} />
        </div>
    {/if}
</div>

<style>
    .timeline-content-wrapper {
        overflow-y: auto;
        overflow-x: auto;
        max-height: calc(100vh - 150px);
    }
</style>
