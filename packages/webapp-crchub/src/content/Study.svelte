<script lang="ts">
    import { onMount } from "svelte";
    import StudyCard from "../components/cards/StudyCard.svelte";
    import PatientList from '../components/content/PatientList.svelte';

    import { Tabs, TabItem } from 'flowbite-svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faUser, faSwatchbook } from '@fortawesome/free-solid-svg-icons';
    import { studies, loadStudies } from "../services/datastore";
    import { WebappConfigurator } from "@freon4dsl/webapp-lib";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { EditorState } from "@freon4dsl/webapp-lib";

    export let id: string;
    let study: any;

    let model = "StudyConfiguration";
    let comm = EditorState.getInstance();

    onMount(async () => {
        await loadStudies();
        study = $studies.find((s) => s.id === id);

        comm.openModel(model);

    });
  

</script>

{#if study}
    <div class="crc-container">
        <div class="crc-card">
            <StudyCard {study} />
        </div>
        <div class="crc-content">
            <Tabs tabStyle="underline" class="crc-tab">
                <TabItem open title="Patients">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} class="w-4 h-4" />Patients
                    </div>
                    <div class="crc-grid">
                        <PatientList />
                    </div>
                </TabItem>
                <TabItem title="Study Design">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faSwatchbook} class="w-4 h-4" />Study Design
                    </div>
                    <FreonComponent editor={WebappConfigurator.getInstance().editorEnvironment.editor} />
                </TabItem>
            </Tabs>
        </div>
    </div>
{:else}
    <p>Loading study...</p>
{/if}
