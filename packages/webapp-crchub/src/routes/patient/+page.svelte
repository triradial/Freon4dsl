<script lang="ts">
  import { page } from '$app/stores';
  import { LABEL } from '../../constants/label-constants.js';
  import PatientContent from '../../content/Patient.svelte';
  import { dataStore } from '../../services/data/data-store.js';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';
  import { drawerStore, setAllDrawersVisibility, setDrawerProps, setDrawerVisibility } from '../../services/stores/side-drawer-store.js';

  let patientIdentifier = '';
  let studyName = '';
  let id = $page.url.searchParams.get('id') || '';
  let didSetVisibility = false;

  // Set up drawer visibility once when drawers are available
  $effect(() => {
    if (didSetVisibility) return;
    if ($drawerStore && $drawerStore.drawers && Object.keys($drawerStore.drawers).length > 0) {
      setAllDrawersVisibility(false);
      setDrawerVisibility("help", true);
      setDrawerVisibility("studyTimelineTable", true);
      setDrawerVisibility("studyChecklist", true);
      setDrawerVisibility("patientTimelineChart", true);
      setDrawerVisibility("visitChecklist", true);
      
      // Set initial props for visitChecklist with today's date (will be updated when patient data loads)
      if (id) {
        const today = new Date();
        setDrawerProps("visitChecklist", { patientId: id, studyId: "", selectedDate: today });
      }
      
      didSetVisibility = true;
    }
  });

  // Load patient data and set drawer props once we have all the data
  $effect(() => {
    if (!id) return;
    
    (async () => {
      let patient = await dataStore.getPatient(id);
      if (patient) {
        patientIdentifier = patient.patientNumber || patient.id;
        let study = await dataStore.getStudy(patient.studyId);
        if (study) {
          studyName = study.name;
          setBreadcrumb([
            { label: LABEL.STUDIES, href: "/studies" },
            { label: LABEL.STUDY + ": " + studyName, href: "/study?id=" + study.id },
            { label: LABEL.PATIENT + ": " + patientIdentifier }
          ]);
          
          // Set drawer props once we have all the data
          setDrawerProps("patientTimelineChart", { id: id, studyId: patient.studyId, showAllPatients: false });
          // Set visitChecklist drawer props with today's date as default
          const today = new Date();
          setDrawerProps("visitChecklist", { patientId: id, studyId: patient.studyId, selectedDate: today });
        } else {
          setBreadcrumb([
            { label: LABEL.STUDIES, href: "/studies" },
            { label: LABEL.PATIENT + ": " + patientIdentifier }
          ]);
          
          // Set drawer props even if study not found (we still have patient id)
          setDrawerProps("patientTimelineChart", { id: id, showAllPatients: false });
          // Set visitChecklist drawer props with today's date as default (even without studyId)
          const today = new Date();
          setDrawerProps("visitChecklist", { patientId: id, studyId: patient.studyId || "", selectedDate: today });
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