<script lang="ts">
    import Organizations from '../../content/Organizations.svelte';
    import { breadcrumbStore } from '../../services/stores/breadcrumb-store.js';
    import { LABEL } from '../../constants/label-constants.js';
    import { onMount } from 'svelte';

    onMount(() => {
        breadcrumbStore.set([
            { label: LABEL.ORGANIZATIONS, href: undefined }
        ]);
    });
</script>

<Organizations />



