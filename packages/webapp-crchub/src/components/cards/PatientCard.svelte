<script lang="ts">
  import { Card } from 'flowbite-svelte';

  export let patient;

</script>

<Card class="crc-card-area max-w-sm h-full">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-base font-bold">Patient</h3>
  </div>
  <div class="space-y-2">
    <div>
      <h4 class="card-label-text">Name</h4>
      <p class="text-sm">{patient.displayName}</p>
    </div>
    <div>
      <h4 class="card-label-text">DOB</h4>
      <p class="text-xs">{patient.dob}</p>
    </div>
    <div>
      <h4 class="card-label-text">Gender</h4>
      <p class="text-sm">{patient.gender}</p>
    </div>
  </div>
</Card>

<style>
  :global(.card) {
    border-radius: 0;
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
</style>