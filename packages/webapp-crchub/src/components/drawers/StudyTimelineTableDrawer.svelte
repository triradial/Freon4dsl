<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { type FreEnvironment, RtString } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/study-configuration";
    import { getChecklistAsMarkdown, getTimelineTable } from "../../services/app/study-timeline.js";
    import { marked } from "marked";

    let { studyId } = $props<{ studyId: string }>();
    let isLoading = $state(true);
    let tableHtml = $state<string>("");
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let container: HTMLElement | null = null;
    let container2: HTMLElement | null = null;
    let showTable = $state(false);

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadAllData(studyId);
    }

    $effect(() => {
        console.log("[StudyTimelineTableDrawer] $effect studyId:", studyId);
        if (studyId) {
            console.log("studyId", studyId);
            loadAllData(studyId);
        }
    });

    async function loadAllData(id: string) {
        console.log("loadAllData: ", id);
        isLoading = true;
        showTable = false;
        error = null;
        try {
            const startTime = Date.now();
            const modelManager = ModelManager.getInstance();
            await modelManager.openModel(id);
            const model = modelManager.currentModel as StudyConfigurationModel;
            const unit = model.configuration;

            if (!unit) {
                throw new Error("Configuration unit is not available in the model.");
            }
            
            // From loadTableData
            const rtObject = getTimelineTable(unit) as RtString;
            tableHtml = rtObject.asString();

            // From loadChecklistAsMarkdown
            const checklistAsMarkdown = getChecklistAsMarkdown(unit);
            const htmlContent = marked(checklistAsMarkdown);
            checklistHtml = `<div class="limited-width-container">${htmlContent}</div>`;

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
    <div style="display: {isLoading || !showTable ? 'block' : 'none'}">
        <div class="placeholder animate-pulse mb-4"></div>
    </div>
    <div style="display: {!isLoading && showTable ? 'block' : 'none'}">
        <div bind:this={container}>
            {@html tableHtml}
        </div>
    </div>

    <div style="display: block" class="markdown-body">
        <div bind:this={container2}>
            {@html checklistHtml}
        </div>
    </div>
</div>

<style>
    .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
    }

    @media (max-width: 767px) {
        .markdown-body {
            padding: 15px;
        }
    }
</style>
