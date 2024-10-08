<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Skeleton, ListPlaceholder } from 'flowbite-svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faHeart, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

    import { WebappConfigurator, EditorState, EditorRequestsHandler } from "@freon4dsl/webapp-lib";
    import { type FreEnvironment, RtString } from '@freon4dsl/core';
    import { type StudyConfigurationModel } from '@freon4dsl/samples-study-configuration';
    import { getTimelineTable } from '../../services/app/Timeline';

    export let studyId: string;
    let isLoading = true;
    let tableHtml: string = '';
    let error: string | null = null;
    let container: HTMLElement | null = null;
    let showTable = false;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch('close');
    }

    export function refresh() {
        dispatch("refresh");
        loadTable(studyId);
    }

    $: {
        if (studyId) {
            console.log("studyId", studyId);
            loadTable(studyId);
        }
    }

    async function loadTable(id: string) {
        isLoading = true;
        showTable = false;
        error = null;
        try {
            const startTime = Date.now();
            tableHtml = loadTableData(studyId);
            await new Promise(resolve => setTimeout(() => resolve(null), 0));
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 2000) {
                await new Promise((resolve) => setTimeout(resolve, 2000 - elapsedTime));
            }    
            showTable = true;                    
         } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : 'An error occurred while fetching chart data';
        } finally {
            isLoading = false;
        }
    }

    function loadTableData(id: string) {
		const studyConfigurationModel = EditorState.getInstance().modelStore.model as StudyConfigurationModel;
		const studyConfigurationUnit = studyConfigurationModel.configuration;
		const rtObject = getTimelineTable(studyConfigurationUnit) as RtString;
		return rtObject.asString();
    }

</script>

<div class="drawer-content-area p-2">
    <div style="display: {isLoading || !showTable ? 'block' : 'none'}">
        <ListPlaceholder class="mb-4" />
    </div>
    <div style="display: {!isLoading && showTable ? 'block' : 'none'}">
        <div bind:this={container}>
            {@html tableHtml}
        </div>
    </div>
</div>