<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    let helpHtml: string = "";

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch('close');
    }

    export function refresh() {
        dispatch("refresh");
        console.log("refresh help");
    }
</script>

<div class="drawer-content-area">
    {@html helpHtml}
</div>
