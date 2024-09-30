<script lang="ts">
    import { onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";

    import { Tabs, TabItem } from 'flowbite-svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faListCheck, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
    import { getPatient } from "../services/datastore";
    import { WebappConfigurator } from "@freon4dsl/webapp-lib";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { EditorState } from "@freon4dsl/webapp-lib";

    export let id: string;
    let patient: any;

    // let model = "StudyConfiguration";
    // let comm = EditorState.getInstance();

    onMount(async () => {
        // await loadPatients();
        patient = getPatient(id);

        // comm.openModel(model);

    });
  

</script>

{#if patient}
    <div class="crc-container">
        <div class="crc-card">
            <PatientCard {patient} />
        </div>
        <div class="crc-content">
            <Tabs tabStyle="underline" class="crc-tab">
                <TabItem open title="Tasks">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faListCheck} class="w-4 h-4" />Tasks
                    </div>
                    <div class="crc-grid">
                    </div>
                </TabItem>
                <TabItem title="Schedule">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} class="w-4 h-4" />Schedule
                    </div>
                 </TabItem>
            </Tabs>
        </div>
    </div>
{:else}
    <p>Loading patient...</p>
{/if}
