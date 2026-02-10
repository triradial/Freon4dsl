<script lang="ts">
    import { Modal } from '@skeletonlabs/skeleton-svelte';
    // @ts-ignore
    import { AlertTriangle as IconAlertTriangle, Info as IconInfo } from '@lucide/svelte';
    import { lastPasteReport, showPasteReportPopup, clearPasteReport } from '../../services/stores/paste-duplicates-store.js';

    // Subscribe to the stores
    let report = $derived($lastPasteReport);
    let isOpen = $derived($showPasteReportPopup);

    function handleClose() {
        clearPasteReport();
    }

    // Limit displayed items for duplicates
    const MAX_DISPLAYED = 10;
    let displayedItems = $derived(report?.skippedItems ? report.skippedItems.slice(0, MAX_DISPLAYED) : []);
    let remainingCount = $derived(report?.skippedItems ? Math.max(0, report.skippedItems.length - MAX_DISPLAYED) : 0);

    // Check report type
    let isError = $derived(report?.type === 'error');
    let isDuplicates = $derived(report?.type === 'duplicates');
</script>

<Modal
    open={isOpen}
    onOpenChange={() => {}}
    contentBase="paste-duplicates-dialog shadow-xl"
    positionerJustify="justify-center"
    positionerAlign="items-center"
    positionerPadding=""
    transitionsPositionerIn={{ y: 0, duration: 200 }}
    transitionsPositionerOut={{ y: 0, duration: 200 }}
    modal={true}
    closeOnInteractOutside={false}
    closeOnEscape={true}
>
    {#snippet content()}
        {#if report}
            <header class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                    {#if isError}
                        <IconAlertTriangle size="24" class="text-yellow-500" />
                        <h3 class="text-lg font-semibold">{report.errorTitle || 'Paste Error'}</h3>
                    {:else}
                        <IconInfo size="24" class="text-blue-500" />
                        <h3 class="text-lg font-semibold">Paste Results</h3>
                    {/if}
                </div>
            </header>

            {#if isError}
                <div class="mb-4">
                    <p class="text-sm text-gray-600">
                        {report.errorMessage}
                    </p>
                </div>
            {:else if isDuplicates}
                <div class="mb-4">
                    {#if report.addedCount && report.addedCount > 0}
                        <p class="text-sm text-green-600 mb-2">
                            ✓ Added {report.addedCount} item{report.addedCount !== 1 ? 's' : ''}.
                        </p>
                    {/if}
                    <p class="text-sm text-gray-600">
                        {#if report.addedCount && report.addedCount > 0}
                            The following {report.skippedItems?.length} item{report.skippedItems?.length !== 1 ? 's were' : ' was'}
                            already in the list and {report.skippedItems?.length !== 1 ? 'were' : 'was'} skipped:
                        {:else}
                            No items were added. All {report.skippedItems?.length} item{report.skippedItems?.length !== 1 ? 's were' : ' was'}
                            already in the list:
                        {/if}
                    </p>
                </div>

                <div class="paste-duplicates-list">
                    <ul class="duplicate-items">
                        {#each displayedItems as item}
                            <li class="duplicate-item">
                                <IconAlertTriangle size="14" class="text-yellow-500 inline mr-1" />
                                <span class="duplicate-message">{item}</span>
                            </li>
                        {/each}
                        {#if remainingCount > 0}
                            <li class="duplicate-item text-gray-500 italic">
                                ... and {remainingCount} more
                            </li>
                        {/if}
                    </ul>
                </div>
            {/if}

            <footer class="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    class="standard-button primary inverted"
                    onclick={handleClose}
                >
                    OK
                </button>
            </footer>
        {/if}
    {/snippet}
</Modal>

<style>
    :global(.paste-duplicates-dialog) {
        max-width: 32rem;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
    }

    .paste-duplicates-list {
        max-height: 40vh;
        overflow-y: auto;
        padding-right: 0.5rem;
    }

    .duplicate-items {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .duplicate-item {
        padding: 0.5rem;
        background: #fef3c7;
        border-radius: 0.25rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .duplicate-message {
        color: #374151;
    }
</style>
