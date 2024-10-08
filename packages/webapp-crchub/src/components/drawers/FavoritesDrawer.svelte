<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faHeart, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

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
