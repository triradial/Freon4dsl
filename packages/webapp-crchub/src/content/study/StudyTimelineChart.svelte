<script lang="ts">
    import ContentLoader from "../../components/drawers/ContentLoader.svelte";
    import { simulationService } from "../../services/simulation/simulation-service.js";

    // Set to true to save chart HTML to file for debugging
    const SAVE_CHART_TO_FILE = false;

    let { studyId } = $props<{ studyId: string }>();
    let isLoading = $state(true);
    let chartHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container = $state<HTMLElement | null>(null);
    let hasRenderedBefore = $state(false);
    let lastSuccessfulContent = $state<string>("");

    export function refresh(forceRefresh: boolean = false) {
        loadChart(forceRefresh);
    }

    $effect(() => {
        if (studyId) {
            loadChart(false);
        }
    });

    // Execute scripts when chartHtml changes and container is available
    $effect(() => {
        if (chartHtml && container && !isLoading) {
            // Wait a bit for DOM to settle, then execute scripts
            setTimeout(() => {
                executeScripts();
            }, 100);
        }
    });

    /**
     * Saves the chart HTML to /tmp folder via server API.
     * The chart HTML is already a complete HTML document, so we save it directly.
     */
    async function saveChartToFile(html: string, filename: string) {
        try {
            const response = await fetch('/api/save-chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, filename })
            });
            const result = await response.json();
            if (result.success) {
                console.log(`[StudyTimelineChart] Chart saved to: ${result.filepath}`);
            } else {
                console.error(`[StudyTimelineChart] Failed to save chart: ${result.error}`);
            }
        } catch (err) {
            console.error(`[StudyTimelineChart] Error saving chart:`, err);
        }
    }

    async function loadChart(forceRefresh: boolean = false) {
        const startTime = performance.now();
        console.log(`[StudyTimelineChart] Loading chart for ${studyId}, forceRefresh=${forceRefresh}`);

        isLoading = true;
        error = null;

        try {
            const simulationData = await simulationService.getSimulationData(studyId, forceRefresh);

            if (simulationData) {
                chartHtml = simulationData.chartHtml;
                lastSuccessfulContent = chartHtml;
                hasRenderedBefore = true;
                error = null;

                // Save the raw chart HTML for debugging (overwrites each time)
                if (SAVE_CHART_TO_FILE) {
                    const filename = `timeline-chart.html`;
                    saveChartToFile(chartHtml, filename);
                }

                const elapsed = performance.now() - startTime;
                console.log(`[StudyTimelineChart] Chart loaded in ${elapsed.toFixed(2)}ms`);
            } else {
                throw new Error("Failed to generate simulation data");
            }
        } catch (err: unknown) {
            console.error(`[StudyTimelineChart] Error loading chart:`, err);
            if (hasRenderedBefore) {
                error = "Current design has issues that prevent this chart from updating";
                chartHtml = lastSuccessfulContent;
            } else {
                error = "Current design has issues that prevent this chart from showing";
                chartHtml = "";
            }
        } finally {
            isLoading = false;
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

<div class="p-2">
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {/if}
    {#if isLoading}
        <ContentLoader />   
    {:else if chartHtml}
        <div class="chart-content-wrapper">
            <div bind:this={container}>
                {@html chartHtml}
            </div>
        </div>
    {/if}
</div>

<style>
    .chart-content-wrapper {
        overflow-y: auto;
        overflow-x: auto;
        max-height: calc(100vh - 150px);
    }

    /* Consistent table styling for timeline content */
    :global(.table_component table) {
        border: 1px solid var(--white-30t);
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
    }
    
    :global(.table_component caption) {
        color: var(--white-70t);
        font-weight: 600;
        margin-bottom: 0.5rem;
        text-align: left;
    }
    
    :global(.table_component th) {
        border: 1px solid var(--white-40t);
        background-color: var(--black-10t);
        color: var(--white);
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
    }
    
    :global(.table_component td) {
        border: 1px solid var(--white-20t);
        color: var(--white-90t);
        padding: 0.75rem;
    }
    
    :global(.table_component tbody tr:nth-child(even) td) {
        background-color: var(--white-10t);
    }
    
    :global(.table_component tbody tr:nth-child(odd) td) {
        background-color: var(--white-5t);
    }
    
    :global(.table_component td.text-center) {
        text-align: center;
    }
    
    :global(.table_component th.stretch) {
        width: auto;
    }
    
    :global(.table_component th.fit) {
        width: 1%;
        white-space: nowrap;
    }
</style>
