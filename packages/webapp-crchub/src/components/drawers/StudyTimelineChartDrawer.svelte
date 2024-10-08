<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Skeleton, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faHeart, faEllipsisV } from "@fortawesome/free-solid-svg-icons";

    import { WebappConfigurator, EditorState, EditorRequestsHandler } from "@freon4dsl/webapp-lib";
    import { type FreEnvironment, RtString } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
    import { getTimelineChart } from "../../services/app/Timeline";

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
            chartHtml = getChart(studyId);
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
        const studyConfigurationModel = EditorState.getInstance().modelStore.model as StudyConfigurationModel;
        const studyConfigurationUnit = studyConfigurationModel.configuration;
        const rtObject = getTimelineChart(studyConfigurationUnit) as RtString;
        return rtObject.asString();
    }

    async function loadChartData() {
        return new Promise<void>((resolve) => {
            const link = document.createElement("link");
            link.href = "https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css";
            link.rel = "stylesheet";
            document.head.appendChild(link);

            const script = document.createElement("script");
            script.src = "https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js";
            script.onload = () => {
                executeScripts();
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    function executeScripts() {
        if (container) {
            const scripts = container.querySelectorAll("script");
            scripts.forEach((oldScript) => {
                const newScript = document.createElement("script");
                newScript.textContent = oldScript.textContent;
                oldScript.replaceWith(newScript);
            });
        }
    }
</script>

<svelte:head>
    <script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
    <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
</svelte:head>

<div class="drawer-content-area p-2">
    <div style="display: {isLoading || !showChart ? 'block' : 'none'}">
        <ListPlaceholder class="mb-4" />
    </div>
    <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
        <div bind:this={container}>
            {@html chartHtml}
        </div>
    </div>
</div>
