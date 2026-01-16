<script lang="ts">
  import { page } from '$app/stores';
  import { LABEL } from '../../constants/label-constants.js';
  import StudyDesignContent from '../../content/StudyDesign.svelte';
  import { dataStore } from '../../services/data/data-store.js';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  let studyName = '';
  let id = $page.url.searchParams.get('id') || '';

  $effect(() => {
    // Depend on $dataStore.studies so this effect reruns when studies are loaded
    void $dataStore.studies;
    (async () => {
      let study = await dataStore.getStudy(id);
      if (study) {
        studyName = study.name;
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/studies" },
          { label: LABEL.STUDY + ": " + studyName },
          { label: "Study Design" }
        ]);
      } else {
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/studies" },
          { label: LABEL.STUDY + ": Not Found" },
          { label: "Study Design" }
        ]);
      }
    })();
  });
</script>

<StudyDesignContent {id} />
