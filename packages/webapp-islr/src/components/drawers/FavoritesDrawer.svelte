<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch('close');
    }

    export function refresh() {
        dispatch("refresh");
        console.log("refresh favorites");
    }
</script>

<div class="drawer-content-area">
</div>
