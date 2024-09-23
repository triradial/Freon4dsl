<script lang="ts">
    import { onMount } from 'svelte';
    import StudyCard from '../components/cards/StudyCard.svelte';

    onMount(async () => {
    });

    const study = {
      name: "Study BE-X5",
      title: "Effect of combination of device Megabond with varying dosses of Compound Treatment of Patients With Advanced Malignancies",
      phase: "III",
      therapeuticArea: "Oncology",
      currentProtocol: "v1",
      status: "Planning"
    };
    
</script>

<div class="crc-grid">
  <StudyCard study={study} />
</div>
