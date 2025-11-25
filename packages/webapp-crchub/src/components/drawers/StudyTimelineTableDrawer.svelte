<script lang="ts">
    import { RtString } from "@freon4dsl/core";
    import { StudyConfiguration } from "@freon4dsl/study-configuration";
    import { createEventDispatcher } from "svelte";
    import { getTimelineTable } from "../../services/app/study-timeline.js";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import ContentLoader from "./ContentLoader.svelte";
    
    let { studyId } = $props<{ studyId: string }>();

    let isLoading = $state(true);
    let tableHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container = $state<HTMLElement | null>(null);
    let showTable = $state(false);

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        buildTable(studyId);
    }

    $effect(() => {
        console.log("[StudyTimelineTableDrawer] $effect studyId:", studyId);
        if (studyId) {
            console.log("studyId", studyId);
            buildTable(studyId);
        }
    });

    async function buildTable(id: string) {
        console.log("build StudyTimelineTable: ", id);
        isLoading = true;
        showTable = false;
        error = null;
        try {
            const startTime = Date.now();

            // Get the configuration unit without opening the model (to preserve current model if viewing patient)
            const modelManager = ModelManager.getInstance();
            const unit = await modelManager.getModelUnitWithoutOpening(id, "StudyConfiguration") as StudyConfiguration;
            if (!unit) {
                throw new Error("Configuration unit is not available in the model.");
            }
            
            // Get the timeline table
            const rtObject = getTimelineTable(unit) as RtString;
            tableHtml = rtObject.asString();
            await new Promise((resolve) => setTimeout(() => resolve(null), 0));
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 2000) {
                await new Promise((resolve) => setTimeout(resolve, 2000 - elapsedTime));
            }
            showTable = true;

        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="drawer-content-area p-2">
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {:else}
        {#if isLoading || !showTable}
            <ContentLoader />
        {:else}
            <div bind:this={container} class="timeline-content-wrapper">
                {@html tableHtml}
            </div>
        {/if}
    {/if}
</div>

<style>
    .timeline-content-wrapper {
        overflow-y: auto;
        overflow-x: auto;
        max-height: calc(100vh - 150px);
    }
</style>
