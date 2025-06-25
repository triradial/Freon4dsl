<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ListPlaceholder } from "flowbite-svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { Availability } from "@freon4dsl/samples-study-configuration";
    import { Toolbar, ToolbarButton } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faSave, faUndo, faRedo } from "@fortawesome/free-solid-svg-icons";
    import { FreonComponent } from "@freon4dsl/core-svelte";


    // PDFMake and Markdown-it imports
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";
    import MarkdownIt from "markdown-it";
    import { WebappConfigurator } from "services/dsl/webapp-configurator.js";
    import { AST, type FreEditor, type FreModelUnit } from "@freon4dsl/core";
    import { EditorRequestsHandler } from "services/dsl/editor-requests-handler.js";

    pdfMake.vfs = pdfFonts as any;
    const md = new MarkdownIt();

    export let studyId: string;
    let isLoading = true;
    let error: string | null = null;
    let editorLoaded = false;
    let dslAvailabilityEditor: FreEditor;
    let unit: Availability | undefined;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadStaffAvailability();
    }

    $: {
        if (studyId) {
            loadStaffAvailability();
        }
    }

    async function loadStaffAvailability() {
        isLoading = true;
        error = null;
        AST.change(async () => {  
            dslAvailabilityEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
            const modelManager = ModelManager.getInstance();

            // Create the PatientHistoryUnit to use just for editing of one patient at a time
            unit =  modelManager.modelStore.getUnitByName("Availability") as Availability;
            // Get the model data for all the Patients
            if (unit === null || unit === undefined) {
                //This is the first time any patients for the study are being edited, so we need to create the PatientInfo
                await modelManager.modelStore.createUnit("Availability", "Availability");
            } 
            // Display the availability for editing
            await modelManager.setCurrentUnit(unit);
            await modelManager.displayModelUnit(unit);
        });

        setTimeout(() => {
            editorLoaded = true;
        }, 300);

        isLoading = false;
    }


    async function handleSaveAvailability() {
        const modelManager = ModelManager.getInstance();
        await modelManager.modelStore.saveUnit(unit as FreModelUnit);
        // await modelManager.displayModelUnit(unit!);
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

{#if unit}
    <div class="crc-container">
        <div class="crc-content">
            {#if editorLoaded}
                <Toolbar class="toolbar">
                    <ToolbarButton class="toolbar-button" on:click={handleSaveAvailability}><FontAwesomeIcon icon={faSave} /></ToolbarButton>
                    <ToolbarButton class="toolbar-button" on:click={handleUndoAction}><FontAwesomeIcon icon={faUndo} /></ToolbarButton>
                    <ToolbarButton class="toolbar-button" on:click={handleRedoAction}><FontAwesomeIcon icon={faRedo} /></ToolbarButton>
                </Toolbar>
                <div class="crc-editor crc-content-width">
                    <FreonComponent editor={dslAvailabilityEditor} />
                </div>
            {:else}
                <div class="h-full crc-content-width">
                    <ListPlaceholder
                        divClass="p-4 space-y-4 mr-1 rounded border border-gray-200 divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700"
                    />
                </div>
            {/if}
        </div>
    </div>
{:else}
    <p>Loading Availability...</p>
{/if}

<style>
    div.drawer-content-area div.markdown-body .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
        min-height: 100% !important;
    }

    @media (max-width: 767px) {
        .markdown-body {
            padding: 15px;
        }
    }
</style>
