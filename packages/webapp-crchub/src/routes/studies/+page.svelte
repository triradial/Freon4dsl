<script lang="ts">
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore } from '../../services/stores/side-drawer-store.js';
  import StudiesContent from '../../content/Studies.svelte';
  import { LABEL } from '../../constants/label-constants.js';

  let didSetVisibility = false;
  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      setDrawerVisibility("favorites", true);
      setBreadcrumb([{ label: LABEL.STUDIES }]);
      console.log("Drawers after visibility set:", $drawerStore.drawers);
      didSetVisibility = true;
    }
  });
</script>

<StudiesContent /> 