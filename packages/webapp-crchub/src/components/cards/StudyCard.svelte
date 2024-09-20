<script lang="ts">
    import { Card, Button } from 'flowbite-svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faHeart } from '@fortawesome/free-solid-svg-icons';
  
    let isLiked = false;
  
    function toggleLike() {
      isLiked = !isLiked;
    }
  </script>
  
  <Card class="max-w-sm">
    <div class="flex items-center justify-between mb-4">
      <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Study</h5>
      <Button color="light" class="p-1" on:click={toggleLike}>
        <FontAwesomeIcon icon={faHeart} class={isLiked ? 'text-blue-700' : 'text-gray-500'} />
      </Button>
    </div>
    <div class="flow-root">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li class="py-3 sm:py-4">
          <div class="flex items-center space-x-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                General
              </p>
              <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                Study BE-X5
              </p>
              <p class="text-xs text-gray-500 truncate dark:text-gray-400">
                Effect of combination of device Megabond with varying dosses of Compound Treatment of Patients With Advanced Malignancies
              </p>
            </div>
          </div>
        </li>
        <li class="py-3 sm:py-4">
          <div class="flex items-center space-x-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                Phase
              </p>
              <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                III
              </p>
            </div>
          </div>
        </li>
        <li class="py-3 sm:py-4">
          <div class="flex items-center space-x-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                Therapeutic Area
              </p>
              <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                Oncology
              </p>
            </div>
          </div>
        </li>
        <li class="py-3 sm:py-4">
          <div class="flex items-center space-x-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                Current Protocol
              </p>
              <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                v1
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </Card>