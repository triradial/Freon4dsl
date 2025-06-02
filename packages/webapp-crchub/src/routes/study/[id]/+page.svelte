<script lang="ts">
    import { page } from '$app/stores';
    import StudyContent from '../../../content/Study.svelte';
</script>

<StudyContent id={$page.params.id} /> 