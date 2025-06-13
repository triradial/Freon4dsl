<script lang="ts">
  import { page } from '$app/stores';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { setAllDrawersVisibility, setDrawerVisibility, drawerStore } from '../../services/stores/side-drawer-store.js';
  import PatientContent from '../../content/Patient.svelte';
  import { LABEL } from '../../constants/label-constants.js';
  import { dataStore } from '../../services/data/data-store.js';

  let patientName = '';
  let studyName = '';
  let id = $page.url.searchParams.get('id') || '';
  let didSetVisibility = false;

  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      setDrawerVisibility("favorites", true);
      didSetVisibility = true;
    }
  });

  $effect(() => {
    (async () => {
      let patient = await dataStore.getPatient(id);
      if (patient) {
        patientName = patient.name;
        let study = await dataStore.getStudy(patient.studyId);
        if (study) {
          studyName = study.name;
          setBreadcrumb([
            { label: LABEL.STUDIES, href: "/studies" },
            { label: LABEL.STUDY + ": " + studyName, href: "/study?id=" + study.id },
            { label: LABEL.PATIENT + ": " + patientName }
          ]);
        } else {
          setBreadcrumb([
            { label: LABEL.STUDIES, href: "/studies" },
            { label: LABEL.PATIENT + ": " + patientName }
          ]);
        }
      } else {
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/studies" },
          { label: LABEL.PATIENT + ": Not Found" }
        ]);
      }
    })();
  });
</script>

<PatientContent {id} /> 