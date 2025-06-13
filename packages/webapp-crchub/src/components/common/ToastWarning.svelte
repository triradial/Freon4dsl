<script lang="ts">
    import { getContext } from 'svelte';
    import { type ToastContext } from '@skeletonlabs/skeleton-svelte';

    const toast: ToastContext = getContext('toast');

    const props = $props<{
        message?: string;
        type?: 'info' | 'success' | 'warning' | 'error';
    }>();

    const message = $derived(props.message ?? 'Incorrect username or password. Please try again.');
    const type = $derived(props.type ?? 'error');

    function showToast() {
        toast.create({
            title: message,
            type
        });
    }

    // Show toast immediately when component is mounted
    showToast();
</script>
