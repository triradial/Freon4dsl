<script lang="ts">
    import { onMount, onDestroy, getContext } from "svelte";
    import StudyCard from "../components/cards/StudyCard.svelte";
    import PatientGrid from "../components/content/PatientGrid.svelte";
    import DSLFooter from "../components/common/DSLFooter.svelte";
    import { Tabs, AppBar } from "@skeletonlabs/skeleton-svelte";
    import { dataStore, type Study } from "../services/data/data-store.js";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { FreEditor } from "@freon4dsl/core";
    import { type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { getActiveDrawer, setActiveDrawer, setDrawerVisibility, setDrawerProps } from "../services/stores/side-drawer-store.js";
    // @ts-ignore
    import { User as IconUser, PencilRuler as IconPencilRuler, Save as IconSave, Redo as IconRedo, Undo as IconUndo } from '@lucide/svelte';

    let { id } = $props<{ id: string }>();

    let study = $state<Study | undefined>(undefined);
    let editorLoaded = $state(false);
    let activeTab = $state('patients');

    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit = $state<StudyConfiguration | undefined>(undefined);

    const footerConfig = [
        { id: "showScheduling", label: "Scheduling" },
        { id: "showChecklists", label: "Checklists" },
        { id: "showReferences", label: "References", parent: "showChecklists" },
        { id: "showSystems", label: "Systems", parent: "showChecklists" },
        { id: "showPeople", label: "People", parent: "showChecklists" },
        { id: "showDescriptions", label: "Descriptions" },
        { id: "showSharedTasks", label: "Shared Tasks" },
    ];

    let footerItems = $derived(
        unit
            ? footerConfig.map(cfg => ({
                ...cfg,
                visible: !!unit[cfg.id as keyof StudyConfiguration],
            }))
            : footerConfig.map(cfg => ({ ...cfg, visible: false }))
    );

    async function initializeStudy() {
        // get the study data
        study = await dataStore.getStudy(id);
        await dataStore.getStudyPatients(id);
        if (!study) {
            console.error(`Study with id ${id} not found`);
            return;
        }
        
        // Get the model data for the study
        const result = await ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration");
        if (result !== undefined) {
            unit = result as StudyConfiguration;
            setTimeout(() => {
                editorLoaded = true;
            }, 3000);
        } else {
            console.error("Failed to load study configuration");
        }

        // Set initial visibility based on studyConfigurationUnit
        footerItems = footerItems.map((item) => ({
            ...item,
            visible: unit[item.id as keyof StudyConfiguration] as boolean,
        }));

    }

    onMount(() => {
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        initializeStudy();
    });

    onDestroy(() => {
        editorLoaded = false;
        var activeDrawer = getActiveDrawer();
        if (activeDrawer === "studyTimelineTable" || activeDrawer === "studyTimelineChart" || activeDrawer === "dslErrors") {
            setActiveDrawer(null);
        }
        setDrawerVisibility("dslErrors", false);
        setDrawerVisibility("studyTimelineTable", false);
        setDrawerVisibility("studyTimelineChart", false);
    });

    function handleCheckboxChange(id: string, visible: boolean) {
        if (unit && id in unit) {
            (unit[id as keyof StudyConfiguration] as boolean) = visible;
        }
    }

    function handleSaveStudy() {
        ModelManager.getInstance().saveCurrentUnit();
        console.log("Study.Save study");
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
        console.log("Undo action");
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
        console.log("Redo action");
    }
</script>

{#if study}
    <div class="crc-container">
        <div class="card-container">
            <StudyCard {study} />
        </div>
        <div class="crc-content">
            <Tabs value={activeTab} onValueChange={(e) => activeTab = e.value} listGap="gap-6" listMargin="mb-2" base="mt-2" contentBase="mt-0">
                {#snippet list()}
                    <Tabs.Control stateActive="tab-active" value="patients">
                        <div class="tab-item"><IconUser size="16" />Patients</div>
                    </Tabs.Control>
                    <Tabs.Control stateActive="tab-active" value="design">
                        <div class="tab-item"><IconPencilRuler size="16" />Study Design</div> 
                    </Tabs.Control>
                {/snippet}

                {#snippet content()}
                    <Tabs.Panel value="patients">
                        <div class="crc-grid inside-tab">
                            <PatientGrid studyId={study.id} />
                        </div>
                    </Tabs.Panel>
                    <Tabs.Panel value="design">
                        <!-- {#if editorLoaded} -->
                            <div class="flex gap-2 mb-2">
                                <button type="button" class="icon-button primary inverted" onclick={handleSaveStudy}><IconSave /></button>
                                <button type="button" class="icon-button primary inverted" onclick={handleUndoAction}><IconUndo /></button>
                                <button type="button" class="icon-button primary inverted" onclick={handleRedoAction}><IconRedo /></button>
                            </div>
                            <div class="crc-editor crc-content-width">
                                <FreonComponent editor={dslEditor} />
                            </div>
                            <div class="crc-editor-footer h-8 crc-content-width">
                                <DSLFooter items={footerItems} onCheckboxChange={handleCheckboxChange} />
                            </div>
                    </Tabs.Panel>
                {/snippet}
            </Tabs>
        </div>
    </div>
{:else}
    <div class="h-full crc-content-width">
        <div class="placeholder animate-pulse"></div>
    </div>
{/if}
