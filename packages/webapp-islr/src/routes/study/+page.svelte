<script lang="ts">
  import { page } from '$app/stores';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore, setDrawerProps } from '../../services/stores/side-drawer-store.js';
  import StudyContent from '../../content/Study.svelte';
  import { LABEL } from '../../constants/label-constants.js';
  import { dataStore } from '../../services/data/data-store.js';

  let projectName = '';
  let id = $page.url.searchParams.get('id') || '';
  let didSetVisibility = false;

  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      setDrawerVisibility("dslErrors", true);
      didSetVisibility = true;

      setDrawerProps("dslErrors", { studyId: id });
    }
  });

  $effect(() => {
    // Depend on $dataStore.studies so this effect reruns when projects are loaded
    void $dataStore.studies;
    (async () => {
      let project = await dataStore.getStudy(id);
      if (project) {
        projectName = project.name;
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/projects" },
          { label: LABEL.STUDY + ": " + projectName }
        ]);
      } else {
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/projects" },
          { label: LABEL.STUDY + ": Not Found" }
        ]);
      }
    })();
  });
</script>

<StudyContent {id} /> 