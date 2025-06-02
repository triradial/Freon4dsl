<script lang="ts">
    import { page } from '$app/stores';
    import PatientContent from '../../../content/Patient.svelte';
</script>

<PatientContent id={$page.params.id} /> 