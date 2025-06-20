<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Skeleton, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faHeart, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { type FreEnvironment, RtString } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
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
        loadChecklistAsMarkdown(studyId);
    }

    $: {
        if (studyId) {
            console.log("studyId", studyId);
            loadChecklistAsMarkdown(studyId);
        }
    }

    async function loadChecklistAsMarkdown(id: string) {
        isLoading = true;
        showTable = false;
        error = null;
        try {
            const startTime = Date.now();
            checklistHtml = await loadChecklistData(studyId);
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 2000) {
                await new Promise((resolve) => setTimeout(resolve, 2000 - elapsedTime));
            }
            // checklistHtml = `<div class="limited-width-container">${checklistHtml}</div>`;
        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    async function loadChecklistData(id: string) {
        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
        const unit = model.configuration;
        const checklistAsMarkdown = getChecklistAsMarkdown(unit);
        const htmlContent = await marked(checklistAsMarkdown);
        return htmlContent;
    }
</script>

<div class="drawer-content-area p-2">
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
