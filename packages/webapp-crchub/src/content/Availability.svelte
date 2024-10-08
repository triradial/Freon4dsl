<script lang="ts">
    import { onMount } from 'svelte';

    import { WebappConfigurator } from "@freon4dsl/webapp-lib";
    import { FreonComponent } from "@freon4dsl/core-svelte";
    import { EditorState } from "@freon4dsl/webapp-lib";
    
    let modelname = "ScheduleExample2";
    let unitname = "Availability";
    let comm = EditorState.getInstance(); 
    
    onMount(async () => {
      comm.openUnitForModel(modelname, unitname);

    });

</script>

<div class="crc-container">
  <FreonComponent editor={WebappConfigurator.getInstance().editorEnvironment.editor} />
</div>

