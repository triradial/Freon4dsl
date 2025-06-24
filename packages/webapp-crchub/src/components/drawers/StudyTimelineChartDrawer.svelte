<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ListPlaceholder } from "flowbite-svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { AST, RtString } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
    import { getTimelineChart } from "../../services/app/study-timeline.js";

    export let studyId: string;
    let isLoading = true;
    let showChart = false;
    let chartHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadChart(studyId);
    }

    $: {
        if (studyId) {
            console.log("studyId", studyId);
            loadChart(studyId);
        }
    }

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            chartHtml = getChart(id);
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

    function getChart(id: string) {
        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const unit = model.configuration;
        const rtObject = getTimelineChart(unit) as RtString;
        return rtObject.asString();
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
    <div style="display: {isLoading ? 'block' : 'none'}" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">Preparing Study Timeline...</p>
    </div>
    <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
        <div bind:this={container}>
            {@html chartHtml}
        </div>
    </div>
</div>
