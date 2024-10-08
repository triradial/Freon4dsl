<script lang="ts">
    import { onMount, onDestroy, getContext } from "svelte";
    import StudyCard from "../components/cards/StudyCard.svelte";
    import PatientList from '../components/content/PatientGrid.svelte';

    import { Tabs, TabItem } from 'flowbite-svelte';
    import { ListPlaceholder, Skeleton } from 'flowbite-svelte';

    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faUser, faSwatchbook } from '@fortawesome/free-solid-svg-icons';
    import { getStudy } from "../services/datastore";

    import { WebappConfigurator } from "@freon4dsl/webapp-lib";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { EditorState } from "@freon4dsl/webapp-lib";

    import { getActiveDrawer, setActiveDrawer, setDrawerVisibility, setDrawerProps } from "../services/drawerStore";

    export let id: string;
    let study: any;
    let editorLoaded = false;

    let modelname = "ScheduleExample2";
    let unitname = "StudyConfiguration";
    let comm = EditorState.getInstance();

    onMount(async () => {
        // get the study data
        study = getStudy(id);

        // get the model data for the study
        //comm.openModel(modelname);
        comm.openUnitForModel(modelname, unitname);
        setTimeout(() => {
            editorLoaded = true;
        }, 5000);
        
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
                        <FreonComponent editor={WebappConfigurator.getInstance().editorEnvironment.editor} />
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
 