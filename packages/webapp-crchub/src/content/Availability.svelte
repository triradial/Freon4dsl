<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    import { WebappConfigurator } from "@freon4dsl/webapp-lib";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { EditorState } from "@freon4dsl/webapp-lib";
    import { FreEditor } from "@freon4dsl/core";

    import { type Availability } from "@freon4dsl/samples-study-configuration";

    import { ListPlaceholder } from 'flowbite-svelte';

    let modelname = "11119f8b-1c2d-4e5f-9e8b-6a7b8c9d0e1f";

    let modelManager = EditorState.getInstance();
    let dslEditor: FreEditor;
    let unit: Availability;   
    let editorLoaded = false;

    onMount(async () => {
      dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
      const result = await modelManager.openUnitForModel(modelname, "Availability");
        if (result !== undefined) {
            unit = result as Availability;
            setTimeout(() => {
                editorLoaded = true;
            }, 2500);
        } else {
            console.error('Failed to load study configuration');
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
      <ListPlaceholder divClass="p-4 space-y-4 mr-1 rounded border border-gray-200 divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700" />
    </div>
  {/if}
</div>

