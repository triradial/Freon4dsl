<script lang="ts">
    import People from '../../content/People.svelte';
    import { breadcrumbStore } from '../../services/stores/breadcrumb-store.js';
    import { LABEL } from '../../constants/label-constants.js';
    import { onMount } from 'svelte';

    onMount(() => {
        breadcrumbStore.set([
            { label: LABEL.PEOPLE, href: undefined }
        ]);
    });
</script>

<People />



