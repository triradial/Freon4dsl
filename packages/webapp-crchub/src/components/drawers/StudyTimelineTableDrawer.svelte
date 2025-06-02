<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Skeleton, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faHeart, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { type FreEnvironment, RtString } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/study-configuration";
    import { getChecklistAsMarkdown, getTimelineTable } from "../../services/app/study-timeline.js";
    import { marked } from "marked";

    export let studyId: string;
    let isLoading = true;
    let tableHtml: string = "";
    let checklistHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;
    let container2: HTMLElement | null = null;
    let showTable = false;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadTable(studyId);
        loadChecklistAsMarkdown(studyId);
    }

    $effect(() => {
        if (studyId) {
            console.log("studyId", studyId);
            loadTable(studyId);
            loadChecklistAsMarkdown(studyId);
        }
    });

    async function loadChecklistAsMarkdown(id: string) {
        console.log("loadChecklistAsMarkdown: ", id);
        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const unit = model.configuration;
        const checklistAsMarkdown = getChecklistAsMarkdown(unit);
        const htmlContent = marked(checklistAsMarkdown);
        console.log("htmlContent: ", htmlContent);
        checklistHtml = `<div class="limited-width-container">${htmlContent}</div>`;
    }

    async function loadTable(id: string) {
        console.log("loadTable: ", id);
        isLoading = true;
        showTable = false;
        error = null;
        try {
            const startTime = Date.now();
            tableHtml = loadTableData(studyId);
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

    function loadTableData(id: string) {
        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const unit = model.configuration;
        const rtObject = getTimelineTable(unit) as RtString;
        return rtObject.asString();
    }
</script>

<div class="drawer-content-area p-2">
    <div style="display: {isLoading || !showTable ? 'block' : 'none'}">
        <ListPlaceholder divClass="mb-4" />
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
