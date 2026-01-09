<script lang="ts">
    import { ExternalStringBox, RtString } from "@freon4dsl/core";
    import { getTimelineChart, type StudyConfigurationModel } from "@freon4dsl/study-configuration";
    import { onMount } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";

    export let box: ExternalStringBox;

    let container: HTMLElement;
    let chartHtml: string = "";
    let isChartInitialized = false;

    onMount(() => {
        loadChartData();
    });

    $effect(() => {
        if (container && !isChartInitialized) {
            executeScripts();
            isChartInitialized = true;
        }
    });

    function getChart() {
        console.log("TimelineChar.getChart");
        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const unit = model.configuration;
        const timeline = getTimelineAsOfADate(unit);
        const rtObject = timeline.getTimelineChart() as RtString;
        chartHtml = rtObject.asString();
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
                getChart();
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    function executeScripts() {
        const scripts = container.querySelectorAll("script");
        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            newScript.textContent = oldScript.textContent;
            oldScript.replaceWith(newScript);
        });
    }

    function refresh() {
        getChart();
        if (container) {
            container.innerHTML = chartHtml;
            executeScripts();
        }
    }

    // Expose the refresh method to the parent component
    box.refreshComponent = refresh;
</script>

<div bind:this={container}>
    {@html chartHtml}
</div>
