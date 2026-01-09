<script lang="ts">
  import { page } from '$app/stores';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore } from '../../services/stores/side-drawer-store.js';
  import AvailabilityContent from '../../content/Availability.svelte';
  import { LABEL } from '../../constants/label-constants.js';
  import { dataStore } from '../../services/data/data-store.js';

  let studyId = $state($page.url.searchParams.get('studyId') || '');
  let didSetVisibility = false;

  // If no studyId provided in URL, load the first available study
  $effect(() => {
    if (!studyId && $dataStore.studies && $dataStore.studies.length > 0) {
      studyId = $dataStore.studies[0].id;
      console.log('[availability/+page] No studyId in URL, using first available study:', studyId);
    }
  });

  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      setDrawerVisibility("staffAvailability", true);
      didSetVisibility = true;
    }
  });

  $effect(() => {
    setBreadcrumb([
      { label: LABEL.STUDIES, href: "/studies" },
      { label: "Staff Availability" }
    ]);
  });
</script>

{#if studyId}
  <AvailabilityContent {studyId} />
{:else}
  <div class="crc-container p-2">
    <div class="crc-editor crc-content-width">
      <span class="editor-message">Loading availability...</span>
    </div>
  </div>
{/if} 