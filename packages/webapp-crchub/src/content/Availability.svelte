<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { WebappConfigurator } from "../services/dsl/webapp-configurator.js";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { FreEditor } from "@freon4dsl/core";
    import { type Availability } from "@freon4dsl/study-configuration";

    let modelname = "11119f8b-1c2d-4e5f-9e8b-6a7b8c9d0e1f";

    let modelManager: ModelManager = ModelManager.getInstance();
    let dslEditor = $state<FreEditor>();
    let unit: Availability;
    let editorLoaded = $state(false);

    onMount(async () => {
        dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
        const result = await modelManager.openModelUnit(modelname, "Availability");
        if (result !== undefined) {
            unit = result as Availability;
            setTimeout(() => {
                editorLoaded = true;
            }, 2500);
        } else {
            console.error("Failed to load study configuration");
        }
    });

    onDestroy(() => {
        editorLoaded = false;
    });
</script>

<div class="crc-container p-2">
    {#if editorLoaded}
        <FreonComponent editor={dslEditor} />
    {:else}
        <div class="h-full crc-content-width">
            <div class="placeholder animate-pulse"></div>
        </div>
    {/if}
</div>
