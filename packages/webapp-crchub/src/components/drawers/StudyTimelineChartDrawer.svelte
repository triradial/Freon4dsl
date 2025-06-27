<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { RtString } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/study-configuration";
    import { getTimelineChart } from "../../services/app/study-timeline.js";
    import ContentLoader from "./ContentLoader.svelte";

    let { studyId } = $props<{ studyId: string }>();
    let isLoading = $state(true);
    let showChart = $state(false);
    let chartHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container: HTMLElement | null = null;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        buildChart(studyId);
    }

    $effect(() => {
        console.log("[StudyTimelineChartDrawer] $effect studyId:", studyId);
        if (studyId) {
            console.log("studyId", studyId);
            buildChart(studyId);
        }
    });

    async function buildChart(id: string) {
        console.log("build StudyTimelineChart: ", id);
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();

            // Get the model and configuration unit
            const modelManager = ModelManager.getInstance();
            await modelManager.openModel(id);
            const model = modelManager.currentModel as StudyConfigurationModel;
            const unit = model.configuration;
            if (!unit) {
                throw new Error("Configuration unit is not available in the model.");
            }
            // Get the timeline chart
            const rtObject = getTimelineChart(unit, false, true) as RtString;
            chartHtml = rtObject.asString();
            await new Promise((resolve) => setTimeout(() => resolve(null), 0)); // Allow DOM to update
            await loadChartData();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 5000) {
                await new Promise((resolve) => setTimeout(resolve, 5000 - elapsedTime));
            }
            showChart = true;
            
        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    async function loadChartData() {
        if (container) {
            container.innerHTML = chartHtml;
            await executeScripts(); // Wait for scripts to actually execute
        }
    }

    function executeScripts() {
        return new Promise<void>((resolve) => {
            if (container) {
                // Wait for vis library to be available
                const waitForVis = () => {
                    if (typeof (window as any).vis !== 'undefined') {
                        const scripts = container!.querySelectorAll("script");
                        scripts.forEach((oldScript) => {
                            const newScript = document.createElement("script");
                            newScript.textContent = oldScript.textContent;
                            oldScript.replaceWith(newScript);
                        });
                        
                        // Wait for next frame to ensure scripts execute
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    } else {
                        // Check again in a short while
                        setTimeout(waitForVis, 50);
                    }
                };
                
                waitForVis();
            } else {
                resolve();
            }
        });
    }
</script>

<svelte:head>
    <script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
    <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
</svelte:head>

<div class="drawer-content-area p-2">

    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {:else}
        <div style="display: {isLoading ? 'block' : 'none'}">
            <ContentLoader />   
        </div>
        <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
            <div bind:this={container}>
                {@html chartHtml}
            </div>
        </div>
    {/if}
</div>
