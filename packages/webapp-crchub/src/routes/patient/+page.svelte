<script lang="ts">
  import { page } from '$app/stores';
  import { LABEL } from '../../constants/label-constants.js';
  import StudyPatient from '../../content/StudyPatient.svelte';
  import { dataStore } from '../../services/data/data-store.js';
  import { setBreadcrumb } from '../../services/stores/breadcrumb-store.js';

  let patientIdentifier = $state('');
  let studyName = $state('');
  let effectiveStudyId = $state('');
  let loadError = $state('');
  let id = $page.url.searchParams.get('id') || '';
  let studyIdFromUrl = $page.url.searchParams.get('studyId') || '';

  // Load patient data and set breadcrumb
  $effect(() => {
    if (!id) return;
    loadError = '';
    
    (async () => {
      try {
        let patient = await dataStore.getPatient(id);
        if (patient) {
          patientIdentifier = patient.patientNumber || patient.id;
          // Use studyId from URL if available (preserves context from study page), otherwise use patient.studyId
          effectiveStudyId = studyIdFromUrl || patient.studyId;
          let study = await dataStore.getStudy(effectiveStudyId);
          if (study) {
            studyName = study.name;
            setBreadcrumb([
              { label: LABEL.STUDIES, href: "/studies" },
              { label: LABEL.STUDY + ": " + studyName, href: "/study?id=" + study.id },
              { label: LABEL.PATIENT + ": " + patientIdentifier }
            ]);
          } else {
            setBreadcrumb([
              { label: LABEL.STUDIES, href: "/studies" },
              { label: LABEL.PATIENT + ": " + patientIdentifier }
            ]);
          }
        } else {
          setBreadcrumb([
            { label: LABEL.STUDIES, href: "/studies" },
            { label: LABEL.PATIENT + ": Not Found" }
          ]);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
        loadError = 'Failed to load patient data. Please try refreshing the page.';
        setBreadcrumb([
          { label: LABEL.STUDIES, href: "/studies" },
          { label: LABEL.PATIENT + ": Error" }
        ]);
      }
    })();
  });
</script>

{#if loadError}
  <div class="error-patient">{loadError}</div>
{:else if id && effectiveStudyId}
  <StudyPatient patientId={id} studyId={effectiveStudyId} />
{:else if id}
  <div class="loading-patient">Loading patient data...</div>
{:else}
  <div class="error-patient">No patient ID provided</div>
{/if}

<style>
  .loading-patient,
  .error-patient {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-secondary);
  }
</style> 