<script lang="ts">
    import { Modal } from '@skeletonlabs/skeleton-svelte';

    const { 
        open = false,
        onsave,
        oncancel
    } = $props<{ 
        open?: boolean;
        onsave?: (viewName: string) => void;
        oncancel?: () => void;
    }>();

    let viewName = $state('');

    function handleSave() {
        if (viewName.trim().length === 0) return;
        onsave?.(viewName.trim());
        viewName = '';
    }

    function handleCancel() {
        oncancel?.();
        viewName = '';
    }
</script>

<Modal
    open={open}
    onOpenChange={(e) => { if (!e.open) handleCancel(); }}
    contentBase="save-view-dialog shadow-xl"
    positionerJustify="justify-center"
    positionerAlign="items-center"
    positionerPadding=""
    transitionsPositionerIn={{ y: 0, duration: 200 }}
    transitionsPositionerOut={{ y: 0, duration: 200 }}
    modal={true}
    closeOnInteractOutside={false}
>
    {#snippet content()}
        <header class="flex justify-between items-center mb-2">
            <h3>Save Current View</h3>
        </header>
        <div class="flex flex-col gap-2">
            <input id="view-name" type="text" bind:value={viewName} class="input-field" placeholder="Enter a name" />
        </div>
        <footer class="flex justify-end gap-2 mt-4">
            <button type="button" class="standard-button primary" onclick={handleSave}>Save</button>
            <button type="button" class="standard-button secondary" onclick={handleCancel}>Cancel</button>
        </footer>
    {/snippet}
</Modal> 
