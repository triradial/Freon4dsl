<script lang="ts">
    import { onMount, onDestroy, getContext } from "svelte";
    import StudyCard from "../components/cards/StudyCard.svelte";
    import PatientList from '../components/content/PatientGrid.svelte';
    import DSLFooter from '../components/common/DSLFooter.svelte';

    import { Tabs, TabItem } from 'flowbite-svelte';
    import { ListPlaceholder, Skeleton } from 'flowbite-svelte';

    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faUser, faSwatchbook } from '@fortawesome/free-solid-svg-icons';
    import { getStudy } from "../services/datastore";

    import { WebappConfigurator } from "@freon4dsl/webapp-lib";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { EditorState } from "@freon4dsl/webapp-lib";
    import { FreEditor } from "@freon4dsl/core";
    import { type StudyConfigurationModel, type StudyConfiguration } from "@freon4dsl/samples-study-configuration";

    import { getActiveDrawer, setActiveDrawer, setDrawerVisibility, setDrawerProps } from "../services/drawerStore";

    export let id: string;
    let study: any;
    let editorLoaded = false;

    let modelName = "ScheduleExample2";
    let unitName = "StudyConfiguration";
    let modelManager = EditorState.getInstance();
    let dslEditor: FreEditor;
    let studyConfigurationUnit: StudyConfiguration;

    let footerItems = [
        { id: 'showActivityDetails', label: 'Shared Tasks', visible: true },
        { id: 'showSystems', label: 'Systems', visible: true },
        { id: 'showScheduling', label: 'Scheduling', visible: true },
        { id: 'showChecklists', label: 'Checklists', visible: true },
        { id: 'showDescriptions', label: 'Descriptions', visible: true },
    ];

    onMount(async () => {
        // get the study data
        study = getStudy(id);

        // Get the model data for the study
        const result = await modelManager.openUnitForModel(modelName, unitName);
        if (result !== undefined) {
            studyConfigurationUnit = result as StudyConfiguration;
            setTimeout(() => {
                editorLoaded = true;
            }, 5000);
        } else {
            console.error('Failed to load study configuration');
        }

         // Set initial visibility based on studyConfigurationUnit
         footerItems = footerItems.map(item => ({
            ...item,
            visible: studyConfigurationUnit[item.id as keyof StudyConfiguration] as boolean
        }));
 
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;

        // initialize the study chart drawer for the study
        setDrawerProps("studyTimelineTable", { studyId: id });
        setDrawerVisibility('studyTimelineTable', true);
        setDrawerProps("studyTimelineChart", { studyId: id });
        setDrawerVisibility('studyTimelineChart', true);
    });

    onDestroy(() => {
        editorLoaded = false;
        var activeDrawer = getActiveDrawer();
        if (activeDrawer === 'studyTimelineTable' || activeDrawer === 'studyTimelineChart') {
            setActiveDrawer(null);
        }
        setDrawerVisibility('studyTimelineTable', false);
        setDrawerVisibility('studyTimelineChart', false);
    });

    function handleCheckboxChange(id: string, visible: boolean) {
        if (id in studyConfigurationUnit) {
            (studyConfigurationUnit[id as keyof StudyConfiguration] as boolean) = visible;
        }
    }

</script>

{#if study}
    <div class="crc-container">
        <div class="crc-card">
            <StudyCard {study} />
        </div>
        <div class="crc-content">
            <Tabs tabStyle="underline" class="crc-tab">
                <TabItem open title="Patients" class="tab-item">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} class="w-4 h-4" />Patients
                    </div>
                    <div class="crc-grid inside-tab">
                        <PatientList studyId={study.id} />
                    </div>
                </TabItem>
                <TabItem title="Study Design" class="tab-item">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faSwatchbook} class="w-4 h-4" />Study Design
                    </div>
                    {#if editorLoaded}
                        <div class="crc-editor">
                            <FreonComponent editor={dslEditor} />
                        </div>
                        <div class="h-8 w-full">
                            <DSLFooter items={footerItems} onCheckboxChange={handleCheckboxChange} />
                        </div>
                    {:else}
                        <div class="h-full w-full">
                            <ListPlaceholder divClass="p-4 space-y-4 mr-1 rounded border border-gray-200 divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700" />
                        </div>
                    {/if}
                </TabItem>
            </Tabs>
        </div>
    </div>
{:else}
    <Skeleton size="sm" class="my-8 " />
{/if}
 