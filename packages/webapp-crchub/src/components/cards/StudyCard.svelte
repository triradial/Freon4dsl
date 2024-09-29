<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faHeart } from '@fortawesome/free-solid-svg-icons';

  export let study;
  let isLiked = false;

  function toggleLike() {
    isLiked = !isLiked;
  }
</script>

<Card class="crc-card-area max-w-sm h-full">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-base font-bold">Study</h3>
  </div>
  <div class="space-y-2">
    <div>
      <h4 class="card-label-text">Name</h4>
      <p class="text-sm">{study.name}</p>
    </div>
    <div>
      <h4 class="card-label-text">Title</h4>
      <p class="text-xs">{study.title}</p>
    </div>
    <div>
      <h4 class="card-label-text">Phase</h4>
      <p class="text-sm">{study.phase}</p>
    </div>
    <div>
      <h4 class="card-label-text">Therapeutic Area</h4>
      <p class="text-sm">{study.therapeuticArea}</p>
    </div>
    <div>
      <h4 class="card-label-text text-gray-700">Current Protocol</h4>
      <p class="text-sm">{study.currentProtocol}</p>
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