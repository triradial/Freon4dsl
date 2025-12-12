<script lang="ts">
  import { page } from '$app/stores';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore } from '../../services/stores/side-drawer-store.js';
  import FacilityContent from '../../content/Facility.svelte';
  import { LABEL } from '../../constants/label-constants.js';
  import { dataStore } from '../../services/data/data-store.js';

  let studyId = $state($page.url.searchParams.get('studyId') || '');
  let organizationName = $state<string>('');
  let didSetVisibility = false;

  // If no studyId provided in URL, load the first available study
  $effect(() => {
    if (!studyId && $dataStore.studies && $dataStore.studies.length > 0) {
      studyId = $dataStore.studies[0].id;
      console.log('[facility/+page] No studyId in URL, using first available study:', studyId);
    }
  });

  // Load organization name for breadcrumb
  $effect(() => {
    if (studyId) {
      (async () => {
        const site = await dataStore.getUserStudySite(studyId);
        if (site && site.orgName) {
          organizationName = site.orgName;
        }
      })();
    }
  });

  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      didSetVisibility = true;
    }
  });

  $effect(() => {
    const breadcrumbLabel = organizationName 
      ? `${LABEL.FACILITY}: ${organizationName}`
      : LABEL.FACILITY;
    
    setBreadcrumb([
      { label: breadcrumbLabel }
    ]);
  });
</script>

{#if studyId}
  <FacilityContent {studyId} />
{:else}
  <div class="crc-container p-2">
    <div class="crc-editor crc-content-width">
      <span class="editor-message">Loading facility information...</span>
    </div>
  </div>
{/if}

