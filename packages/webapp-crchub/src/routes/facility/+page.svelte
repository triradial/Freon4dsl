<script lang="ts">
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore } from '../../services/stores/side-drawer-store.js';
  import FacilityContent from '../../content/Facility2.svelte';
  import { LABEL } from '../../constants/label-constants.js';
  import { dataStore } from '../../services/data/data-store.js';

  let organizationName = $state<string>('');
  let didSetVisibility = false;

  // Load organization name for breadcrumb
  $effect(() => {
    (async () => {
      const organization = await dataStore.getUserOrganization();
      if (organization && organization.name) {
        organizationName = organization.name;
      }
    })();
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

<FacilityContent />

