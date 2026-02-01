<script lang="ts">
    import { Modal } from '@skeletonlabs/skeleton-svelte';
    // @ts-ignore
    import { AlertTriangle as IconAlertTriangle, Info as IconInfo } from '@lucide/svelte';
    import { lastLoadReport, showMismatchPopup, schemaMismatchTracker, type SchemaMismatch } from '../../services/dsl/schema-mismatch-tracker.js';
    import { ModelManager } from '../../services/dsl/model-manager.js';

    // Subscribe to the stores
    let report = $derived($lastLoadReport);
    let isOpen = $derived($showMismatchPopup);
    let isSaving = $state(false);

    async function handleClose() {
        // Save the model to persist the cleaned data (without the unknown properties)
        // The unit was already marked as "dirty" in model-manager when mismatches were detected
        isSaving = true;
        console.log('[SchemaMismatchDialog] Saving model to remove obsolete data...');
        try {
            await ModelManager.getInstance().saveCurrentUnit();
            console.log('[SchemaMismatchDialog] ✅ Model saved successfully - obsolete data removed');
        } catch (e) {
            console.error('[SchemaMismatchDialog] ❌ Failed to save model:', e);
        } finally {
            isSaving = false;
            schemaMismatchTracker.clearReport();
        }
    }

    function getMismatchTypeLabel(type: SchemaMismatch['type']): string {
        switch (type) {
            case 'unknown_property':
                return 'Obsolete Properties';
            case 'unknown_concept':
                return 'Obsolete Elements';
            case 'unresolved_child':
                return 'Orphaned References';
            default:
                return 'Other';
        }
    }

    function getMismatchTypeColor(type: SchemaMismatch['type']): string {
        switch (type) {
            case 'unknown_property':
                return 'text-yellow-600';
            case 'unknown_concept':
                return 'text-orange-600';
            case 'unresolved_child':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    }

    // Group mismatches by type for cleaner display
    function groupMismatches(mismatches: SchemaMismatch[]): Map<string, SchemaMismatch[]> {
        const grouped = new Map<string, SchemaMismatch[]>();
        for (const mismatch of mismatches) {
            const existing = grouped.get(mismatch.type) || [];
            existing.push(mismatch);
            grouped.set(mismatch.type, existing);
        }
        return grouped;
    }

    let groupedMismatches = $derived(report ? groupMismatches(report.mismatches) : new Map());
</script>

<Modal
    open={isOpen}
    onOpenChange={() => {}}
    contentBase="schema-mismatch-dialog shadow-xl"
    positionerJustify="justify-center"
    positionerAlign="items-center"
    positionerPadding=""
    transitionsPositionerIn={{ y: 0, duration: 200 }}
    transitionsPositionerOut={{ y: 0, duration: 200 }}
    modal={true}
    closeOnInteractOutside={false}
    closeOnEscape={false}
>
    {#snippet content()}
        {#if report}
            <header class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                    <IconInfo size="24" class="text-blue-500" />
                    <h3 class="text-lg font-semibold">Study Design Cleanup</h3>
                </div>
            </header>
            
            <div class="mb-4">
                <p class="text-sm text-gray-600">
                    The study design contained data from an older version of the application 
                    that is no longer supported. The following obsolete data has been removed and will be 
                    saved automatically when you dismiss this dialog.
                </p>
            </div>

            <div class="schema-mismatch-list">
                {#each [...groupedMismatches.entries()] as [type, mismatches]}
                    <div class="mismatch-group mb-3">
                        <h4 class="text-sm font-medium {getMismatchTypeColor(type as SchemaMismatch['type'])} mb-2 flex items-center gap-1">
                            <IconAlertTriangle size="16" />
                            {getMismatchTypeLabel(type as SchemaMismatch['type'])} ({mismatches.length})
                        </h4>
                        <ul class="mismatch-items">
                            {#each mismatches as mismatch}
                                <li class="mismatch-item">
                                    <span class="mismatch-message">{mismatch.message}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </div>

            <footer class="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
                <button 
                    type="button" 
                    class="standard-button primary inverted" 
                    onclick={handleClose}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'OK'}
                </button>
            </footer>
        {/if}
    {/snippet}
</Modal>

<style>
    :global(.schema-mismatch-dialog) {
        max-width: 32rem;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
    }

    .schema-mismatch-list {
        max-height: 40vh;
        overflow-y: auto;
        padding-right: 0.5rem;
    }

    .mismatch-items {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .mismatch-item {
        padding: 0.5rem;
        background: #f9fafb;
        border-radius: 0.25rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .mismatch-message {
        display: block;
        color: #374151;
    }
</style>
