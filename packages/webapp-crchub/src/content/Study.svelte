<script lang="ts">
    import { Tabs } from "@skeletonlabs/skeleton-svelte";
    import { onDestroy, onMount } from "svelte";
    import { browser } from '$app/environment';
    import StudyCard from "../components/cards/StudyCard.svelte";
    import StudyPatients from "./StudyPatients.svelte";
    import StudyDesign from "./StudyDesign.svelte";
    import { dataStore, type Study } from "../services/data/data-store.js";
    import { setAllDrawersVisibility, setDrawerVisibility, setDrawerProps, getActiveDrawer, setActiveDrawer } from "../services/stores/side-drawer-store.js";

    let { id } = $props<{ id: string }>();

    let study = $state<Study | undefined>(undefined);
    let activeTab = $state('patients');

    // Splitter state
    let isDraggingSplitter = $state(false);
    let splitterContainer: HTMLDivElement | undefined = $state();
    let splitterHandle: HTMLButtonElement | undefined = $state();
    
    // Panel widths in rem
    const STUDY_CARD_MIN_WIDTH = 12;
    const STUDY_CARD_MAX_WIDTH = 25;
    const STUDY_CARD_DEFAULT_WIDTH = 18;
    const SPLITTER_STORAGE_KEY = 'study-card-width';
    
    let studyCardWidth = $state(STUDY_CARD_DEFAULT_WIDTH);

    // Update drawer visibility based on active tab
    $effect(() => {
        if (!id) return;
        
        if (activeTab === 'patients') {
            // Patients tab: show help and patient timeline chart
            setAllDrawersVisibility(false);
            setDrawerVisibility("help", true);
            setDrawerVisibility("patientTimelineChart", true);
            // Show all patients when on patients tab
            setDrawerProps("patientTimelineChart", { studyId: id, showAllPatients: true });
        } else if (activeTab === 'design') {
            // Study Design tab: show all study-related drawers (no patient timeline chart)
            setAllDrawersVisibility(false);
            setDrawerVisibility("help", true);
        }
    });

    // Load splitter setting from localStorage
    function loadSplitterSetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SPLITTER_STORAGE_KEY);
            if (saved) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= STUDY_CARD_MIN_WIDTH && parsed <= STUDY_CARD_MAX_WIDTH) {
                    studyCardWidth = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load splitter setting:', e);
        }
    }
    
    // Save splitter setting to localStorage
    function saveSplitterSetting() {
        if (!browser) return;
        try {
            localStorage.setItem(SPLITTER_STORAGE_KEY, studyCardWidth.toString());
        } catch (e) {
            console.warn('Failed to save splitter setting:', e);
        }
    }

    // Splitter handlers
    function handleSplitterMouseDown(event: MouseEvent) {
        if (!browser) return;
        event.preventDefault();
        isDraggingSplitter = true;
        document.addEventListener('mousemove', handleSplitterMouseMove);
        document.addEventListener('mouseup', handleSplitterMouseUp);
    }

    function handleSplitterMouseMove(event: MouseEvent) {
        if (!isDraggingSplitter || !splitterContainer) return;
        
        const rect = splitterContainer.getBoundingClientRect();
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const newWidth = ((event.clientX - rect.left) / rootFontSize);
        
        const constrainedWidth = Math.max(STUDY_CARD_MIN_WIDTH, Math.min(STUDY_CARD_MAX_WIDTH, newWidth));
        studyCardWidth = constrainedWidth;
    }

    function handleSplitterMouseUp() {
        if (!browser) return;
        isDraggingSplitter = false;
        document.removeEventListener('mousemove', handleSplitterMouseMove);
        document.removeEventListener('mouseup', handleSplitterMouseUp);
        saveSplitterSetting();
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
        loadSplitterSetting();
        await initializeStudy();
    });

    onDestroy(() => {
        var activeDrawer = getActiveDrawer();
        if (activeDrawer === "studyTimelineTable" || activeDrawer === "studyTimelineChart" || activeDrawer === "dslErrors" || activeDrawer === "patientTimelineChart") {
            setActiveDrawer(null);
        }
        setDrawerVisibility("dslErrors", false);
        setDrawerVisibility("studyTimelineTable", false);
        setDrawerVisibility("studyTimelineChart", false);
        setDrawerVisibility("patientTimelineChart", false);
    });
</script>

{#if study}
    <div class="crc-container" style="height: calc(100vh - 5.75rem);">
        <div bind:this={splitterContainer} class="splitter-container" class:dragging={isDraggingSplitter} style="height: 100%;">
            <!-- Left Panel: Study Card -->
            <div class="splitter-panel left" style="width: {studyCardWidth}rem; flex-shrink: 0;">
                <StudyCard studyId={study.id} />
            </div>
            
            <!-- Splitter - used as drag handle for resizing panels -->
            <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
            <button type="button" bind:this={splitterHandle} class="splitter-handle" onmousedown={handleSplitterMouseDown} role="separator" aria-orientation="vertical" aria-label="Resize study card panel"></button>
            
            <!-- Right Panel: Tab Content -->
            <div class="splitter-panel right" style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
                <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-6" listMargin="mb-2" base="mt-2 ml-2" contentBase="mt-0">
                    {#snippet list()}
                        <Tabs.Control stateActive="tab-active" value="patients">
                            <div class="tab-item">Patients</div>
                        </Tabs.Control>
                        <Tabs.Control stateActive="tab-active" value="design">
                            <div class="tab-item">Study Design</div> 
                        </Tabs.Control>
                    {/snippet}

                    {#snippet content()}
                        <Tabs.Panel value="patients">
                            <div class="tab-panel-content">
                                <StudyPatients studyId={study.id} active={activeTab === 'patients'} />
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="design">
                            <div class="tab-panel-content design-content">
                                <StudyDesign {id} />
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
    
    .tab-panel-content {
        height: calc(100vh - 9rem);
        overflow: hidden;
    }
    
    .design-content {
        padding: 0;
    }
</style>
