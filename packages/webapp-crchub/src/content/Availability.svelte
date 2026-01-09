<script lang="ts">
    import { FreChangeManager, FreEditor, FrePartDelta, FrePartListDelta, FrePrimDelta, FrePrimListDelta } from "@freon4dsl/core";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { type Availability } from "@freon4dsl/study-configuration";
    import { onDestroy, onMount } from "svelte";
    import { EditorRequestsHandler } from "../services/dsl/editor-requests-handler.js";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
// @ts-ignore
    import { Redo as IconRedo, Undo as IconUndo } from '@lucide/svelte';

    let { studyId } = $props<{ studyId: string }>();

    let dslEditor = $state<FreEditor | undefined>(undefined);
    let unit = $state<Availability | undefined>(undefined);
    let editorLoaded = $state(false);
    let noModelAvailable = $state(false);

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeChangeManager: (() => void) | undefined;

    function debouncedSave() {
        console.log("⏰ Availability.svelte: debouncedSave called");
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            console.log("⏰ Availability.svelte: debouncedSave timeout triggered, calling handleSaveAvailability");
            handleSaveAvailability();
        }, 1000); // 1 second debounce
    }

    async function initializeAvailability() {
        // Get the model data for the availability using the study ID
        // Note: Availability is facility-level, but accessed via study ID
        // The backend uses the study ID to find the organization through: study -> site -> organization
        console.log("📅 Availability.svelte: Opening availability model for study:", studyId);
        const result = await ModelManager.getInstance().openModelUnit(studyId, "Availability") as Availability;
        if (result !== undefined && result !== null) {
            unit = result;
            editorLoaded = true;
            console.log("✅ Availability.svelte: Availability model loaded successfully");
        } else {
            noModelAvailable = true;
            console.error("❌ Availability.svelte: Failed to load availability model for study:", studyId);
        }
    }

    onMount(async () => {
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        await initializeAvailability();

        // Subscribe to FreChangeManager changes
        const changeCallback = (delta) => {
            console.log("🔄 Availability.svelte: Change detected:", delta.constructor.name);
            if (delta instanceof FrePrimDelta) {
                if (delta.oldValue != delta.newValue) {
                    console.log("✅ Availability.svelte: Primitive change detected, triggering save");
                    debouncedSave();
                }
            } else if (delta instanceof FrePrimListDelta) {
                console.log("✅ Availability.svelte: Primitive list change detected, triggering save");
                debouncedSave();
            } else if (delta instanceof FrePartListDelta) {
                console.log("✅ Availability.svelte: Part list change detected, triggering save");
                debouncedSave();
            } else if (delta instanceof FrePartDelta) {
                console.log("✅ Availability.svelte: Part change detected, triggering save");
                debouncedSave();
            } else {
                console.warn("⚠️ Availability.svelte: Unknown change type from FreChangeManager:", delta);
            }
        };
        FreChangeManager.getInstance().subscribeToPrimitive(changeCallback);
        FreChangeManager.getInstance().subscribeToPart(changeCallback);
        FreChangeManager.getInstance().subscribeToListElement(changeCallback);
        FreChangeManager.getInstance().subscribeToList(changeCallback);
        unsubscribeChangeManager = () => {
            const manager = FreChangeManager.getInstance();
            // Remove from primitive callbacks
            const primArr = manager.changePrimCallbacks;
            const primIdx = primArr.indexOf(changeCallback);
            if (primIdx !== -1) primArr.splice(primIdx, 1);

            // Remove from part callbacks
            const partArr = manager.changePartCallbacks;
            const partIdx = partArr.indexOf(changeCallback);
            if (partIdx !== -1) partArr.splice(partIdx, 1);

            // Remove from list element callbacks
            const listElemArr = manager.changeListElemCallbacks;
            const listElemIdx = listElemArr.indexOf(changeCallback);
            if (listElemIdx !== -1) listElemArr.splice(listElemIdx, 1);

            // Remove from list callbacks
            const listArr = manager.changeListCallbacks;
            const listIdx = listArr.indexOf(changeCallback);
            if (listIdx !== -1) listArr.splice(listIdx, 1);
        };
    });

    onDestroy(() => {
        editorLoaded = false;
        if (unsubscribeChangeManager) unsubscribeChangeManager();
    });

    function handleSaveAvailability() {
        console.log("💾 Availability.svelte: Starting save operation");
        try {
            if (unit) {
                ModelManager.getInstance().saveModelUnit(unit);
                console.log("✅ Availability.svelte: Save operation completed successfully");
            } else {
                console.error("❌ Availability.svelte: No unit available to save");
            }
        } catch (error) {
            console.error("❌ Availability.svelte: Error during save:", error);
        }
    }

    function handleUndoAction() {
        EditorRequestsHandler.getInstance().undo();
    }

    function handleRedoAction() {
        EditorRequestsHandler.getInstance().redo();
    }
</script>

<div class="crc-container p-2">
    {#if editorLoaded}
        <div class="flex gap-2 mb-2">
            <button type="button" class="icon-button primary inverted" onclick={handleUndoAction} tabindex="-1"><IconUndo /></button>
            <button type="button" class="icon-button primary inverted" onclick={handleRedoAction} tabindex="-1"><IconRedo /></button>
        </div>
        <div class="crc-editor crc-content-width">
            <FreonComponent editor={dslEditor} />
        </div>
    {:else}
        {#if noModelAvailable === false}
            <div class="crc-editor crc-content-width">
                <div class="placeholder animate-pulse"></div>
            </div>
        {:else}
            <div class="crc-editor crc-content-width">
                <span class="editor-message">No model available</span>
            </div>
        {/if}
    {/if}
</div>
