<script lang="ts">
    import { Modal } from '@skeletonlabs/skeleton-svelte';
    import { createEventDispatcher } from "svelte";
    // @ts-ignore
    import { CircleCheck as IconCircleCheck, CircleX as IconCircleX } from '@lucide/svelte';

    const { open = false } = $props<{ open?: boolean }>();

    const dispatch = createEventDispatcher<{
        save: void;
        discard: void;
    }>();

    function handleSave() {
        dispatch("save");
    }

    function handleDiscard() {
        dispatch("discard");
    }
</script>

<Modal
    open={open}
    onOpenChange={(e) => { if (!e.open) handleDiscard(); }}
    contentBase="confirm-change-mode-dialog shadow-xl confirm-unsaved-bg"
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
            <h3>Unsaved Changes</h3>
        </header>
        <div>
            <p class="text-sm text-gray-500">
                You have unsaved changes. Do you want to save your changes before switching views?
            </p>
        </div>
        <footer class="flex justify-end gap-2 mt-8">
            <button type="button" class="standard-button primary" onclick={handleSave}><IconCircleCheck size="16" />Yes, save and switch</button>
            <button type="button" class="standard-button secondary" onclick={handleDiscard}><IconCircleX size="16" />No, discard and switch</button>
        </footer>
    {/snippet}
</Modal> 