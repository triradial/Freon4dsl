<script lang="ts">
  import { page } from '$app/stores';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore, setDrawerProps } from '../../services/stores/side-drawer-store.js';
  import StudyContent from '../../content/Study.svelte';
  import { LABEL } from '../../constants/label-constants.js';
  import { dataStore } from '../../services/data/data-store.js';

  let studyName = '';
  let id = $page.url.searchParams.get('id') || '';
  let didSetVisibility = false;

  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      setDrawerVisibility("dslErrors", true);
      setDrawerVisibility("studyTimelineTable", true);
      setDrawerVisibility("studyTimelineChart", true);
      setDrawerVisibility("studyChecklist", true);
      setDrawerVisibility("patientTimelineChart", true);
      didSetVisibility = true;

      setDrawerProps("dslErrors", { studyId: id });
      setDrawerProps("studyTimelineTable", { studyId: id });
      setDrawerProps("studyTimelineChart", { studyId: id });
      setDrawerProps("studyChecklist", { studyId: id });
      // Show all patients when viewing study (no specific patient id)
      setDrawerProps("patientTimelineChart", { studyId: id, showAllPatients: true });
    }
  });

  $effect(() => {
    // Depend on $dataStore.studies so this effect reruns when studies are loaded
    void $dataStore.studies;
    (async () => {
      let study = await dataStore.getStudy(id);
      if (study) {
        studyName = study.name;
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/studies" },
          { label: LABEL.STUDY + ": " + studyName }
        ]);
      } else {
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/studies" },
          { label: LABEL.STUDY + ": Not Found" }
        ]);
      }
    })();
  });
</script>

<StudyContent {id} /> 