<script lang="ts">
    import { Tabs } from "@skeletonlabs/skeleton-svelte";
    import { onMount } from "svelte";
    import { browser } from '$app/environment';
    import StudyCard from "../components/cards/StudyCard.svelte";
    import PatientGrid from "../components/content/patient/PatientGrid.svelte";
    import { dataStore, type Study } from "../services/data/data-store.js";
    import AllPatientsTimelineChart from "./patient/AllPatientsTimelineChart.svelte";

    let { id } = $props<{ id: string }>();

    let study = $state<Study | undefined>(undefined);
    let activeTab = $state('timeline-chart');

    // Splitter state
    let isDraggingSplitter1 = $state(false);
    let isDraggingSplitter2 = $state(false);
    let splitterContainer: HTMLDivElement | undefined = $state();
    let splitterHandle1: HTMLButtonElement | undefined = $state();
    let splitterHandle2: HTMLButtonElement | undefined = $state();
    
    // Panel widths in rem
    const STUDY_CARD_MIN_WIDTH = 12;
    const STUDY_CARD_MAX_WIDTH = 25;
    const STUDY_CARD_DEFAULT_WIDTH = 18;
    
    const TABS_PANEL_MIN_WIDTH = 20;
    const TABS_PANEL_MAX_WIDTH = 50;
    const TABS_PANEL_DEFAULT_WIDTH = 30;
    
    let studyCardWidth = $state(STUDY_CARD_DEFAULT_WIDTH);
    let tabsPanelWidth = $state(TABS_PANEL_DEFAULT_WIDTH);

    // Splitter handlers
    function handleSplitter1MouseDown(event: MouseEvent) {
        if (!browser) return;
        event.preventDefault();
        isDraggingSplitter1 = true;
        document.addEventListener('mousemove', handleSplitter1MouseMove);
        document.addEventListener('mouseup', handleSplitter1MouseUp);
    }

    function handleSplitter1MouseMove(event: MouseEvent) {
        if (!isDraggingSplitter1 || !splitterContainer) return;
        
        const rect = splitterContainer.getBoundingClientRect();
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const newWidth = ((event.clientX - rect.left) / rootFontSize);
        
        const constrainedWidth = Math.max(STUDY_CARD_MIN_WIDTH, Math.min(STUDY_CARD_MAX_WIDTH, newWidth));
        studyCardWidth = constrainedWidth;
    }

    function handleSplitter1MouseUp() {
        if (!browser) return;
        isDraggingSplitter1 = false;
        document.removeEventListener('mousemove', handleSplitter1MouseMove);
        document.removeEventListener('mouseup', handleSplitter1MouseUp);
    }

    function handleSplitter2MouseDown(event: MouseEvent) {
        if (!browser) return;
        event.preventDefault();
        isDraggingSplitter2 = true;
        document.addEventListener('mousemove', handleSplitter2MouseMove);
        document.addEventListener('mouseup', handleSplitter2MouseUp);
    }

    function handleSplitter2MouseMove(event: MouseEvent) {
        if (!isDraggingSplitter2 || !splitterContainer) return;
        
        const rect = splitterContainer.getBoundingClientRect();
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const newTabsWidth = ((rect.right - event.clientX) / rootFontSize);
        
        const constrainedWidth = Math.max(TABS_PANEL_MIN_WIDTH, Math.min(TABS_PANEL_MAX_WIDTH, newTabsWidth));
        tabsPanelWidth = constrainedWidth;
    }

    function handleSplitter2MouseUp() {
        if (!browser) return;
        isDraggingSplitter2 = false;
        document.removeEventListener('mousemove', handleSplitter2MouseMove);
        document.removeEventListener('mouseup', handleSplitter2MouseUp);
    }

    async function initializeStudy() {
        // get the study data
        study = await dataStore.getStudy(id);
        if (!study) {
            await dataStore.getStudies();
            study = await dataStore.getStudy(id);
        }
        if (!study) {
            console.error(`Study with id ${id} not found`);
            return;
        }
    }

    onMount(async () => {
        await initializeStudy();
    });
</script>

{#if study}
    <div class="crc-container" style="height: calc(100vh - 5.75rem);">
        <div bind:this={splitterContainer} class="splitter-container" class:dragging={isDraggingSplitter1 || isDraggingSplitter2} style="height: 100%;">
        <!-- Left Panel: Study Card -->
        <div class="splitter-panel" style="width: {studyCardWidth}rem; flex-shrink: 0;">
            <StudyCard studyId={study.id} />
        </div>
        
        <!-- First Splitter -->
        <button 
            type="button"
            bind:this={splitterHandle1}
            class="splitter-handle"
            onmousedown={handleSplitter1MouseDown}
            role="slider"
            aria-label="Resize study card panel"
        ></button>
        
        <!-- Middle Panel: Patient Grid -->
        <div class="splitter-panel" style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div class="main-label-text mb-2" style="padding: 0.5rem 1rem 0 1rem;">Patients</div>
            <div class="crc-grid inside-root" style="flex: 1; overflow: hidden;">
                <PatientGrid studyId={study.id} />
            </div>
        </div>
        
        <!-- Second Splitter -->
        <button 
            type="button"
            bind:this={splitterHandle2}
            class="splitter-handle"
            onmousedown={handleSplitter2MouseDown}
            role="slider"
            aria-label="Resize tabs panel"
        ></button>
        
        <!-- Right Panel: Tabs -->
        <div class="splitter-panel" style="width: {tabsPanelWidth}rem; flex-shrink: 0; display: flex; flex-direction: column; overflow: hidden;">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-6" listMargin="mb-2" base="mt-2" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control stateActive="tab-active" value="timeline-chart">
                        <div class="tab-item">Timeline Chart</div>
                    </Tabs.Control>
                    <Tabs.Indicator />
                {/snippet}
                {#snippet content()}
                    <Tabs.Panel value="timeline-chart">
                        <div class="tab-content-wrapper">
                            <AllPatientsTimelineChart studyId={id} />
                        </div>
                    </Tabs.Panel>
                {/snippet}
            </Tabs>
        </div>
        </div>
    </div>
{:else}
    <div class="h-full crc-content-width">
        <div class="placeholder animate-pulse"></div>
    </div>
{/if}

<style>
    .splitter-panel {
        height: 100%;
    }
    
    :global(.tab-content-wrapper) {
        height: calc(100vh - 9.2rem);
        overflow: auto;
        padding: 0;
    }
</style>
