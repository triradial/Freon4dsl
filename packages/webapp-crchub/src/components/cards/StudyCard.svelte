<script lang="ts">
    import { dataStore, type Study } from "../../services/data/data-store.js";
    import { navigateTo } from "../../services/routing/route-action.js";
    import { onMount, onDestroy } from "svelte";
    import { mount, unmount } from "svelte";
    
    const { studyId } = $props<{ studyId: string }>();

    // Try to get study from store first, then fall back to fetching
    let studyFromStore = $derived($dataStore.studies.find(s => s.id === studyId));
    let fetchedStudy = $state<Study | null>(null);
    let study = $derived(studyFromStore || fetchedStudy);
    
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil, Trash2 as IconTrash } from '@lucide/svelte';

    let statusColor = $derived(study ? getStatusColor(study.status) : "");
    
    // Delete confirmation popover state
    let deleteConfirmInstance: any = null;
    let deleteConfirmContainer: HTMLDivElement | null = null;
    let deleteConfirmTriggerElement: HTMLElement | null = null;
    
    // Fetch study if not found in store
    onMount(async () => {
        if (!studyFromStore && studyId) {
            const result = await dataStore.getStudy(studyId);
            if (result) {
                fetchedStudy = result;
            }
        }
    });
    
    onDestroy(() => {
        // Cleanup popover on component destroy
        handleDeleteCancel();
    });

    function onEditClick() {
        if (study) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("study", study));
        }
    }

    async function onDeleteClick(event: MouseEvent) {
        if (!study) return;
        // Close any existing delete confirm popover
        handleDeleteCancel();
        
        // Get the trigger element (delete button)
        deleteConfirmTriggerElement = event.currentTarget as HTMLElement;
        
        // Create container and mount component
        deleteConfirmContainer = document.createElement('div');
        document.body.appendChild(deleteConfirmContainer);
        
        // Dynamic import to avoid module loading issues
        const { default: DeleteConfirmPopover } = await import("../popovers/DeleteConfirmPopover.svelte");
        
        deleteConfirmInstance = mount(DeleteConfirmPopover, {
            target: deleteConfirmContainer,
            props: {
                open: true,
                triggerElement: deleteConfirmTriggerElement,
                itemName: study.name || '',
                itemType: 'study',
                onClose: handleDeleteCancel,
                onConfirm: handleDeleteConfirm
            }
        });
    }
    
    function handleDeleteCancel() {
        if (deleteConfirmInstance) {
            try {
                unmount(deleteConfirmInstance);
            } catch (e) {
                console.warn('[StudyCard] Error unmounting delete confirm popover:', e);
            }
            deleteConfirmInstance = null;
        }
        if (deleteConfirmContainer && deleteConfirmContainer.parentNode) {
            deleteConfirmContainer.parentNode.removeChild(deleteConfirmContainer);
            deleteConfirmContainer = null;
        }
        deleteConfirmTriggerElement = null;
    }
    
    async function handleDeleteConfirm() {
        if (!study?.id) {
            handleDeleteCancel();
            return;
        }
        
        try {
            const success = await dataStore.deleteStudy(study.id);
            handleDeleteCancel();
            if (success) {
                // Navigate to studies list after successful deletion
                navigateTo("studies");
            }
        } catch (error) {
            console.error('[StudyCard] Error deleting study:', error);
            handleDeleteCancel();
        }
    }
</script>

{#if study}
<div class="card card-area max-w-sm h-full">
    <div class="flex items-center gap-1 mb-4">
        <h3 class="main-label-text mr-1">Study</h3>
        <button type="button" class="grid-button general-button" onclick={onEditClick} title="Edit Study" aria-label="Edit Study">
            <IconPencil size={16} />
        </button>
        <button type="button" class="grid-button delete-button" onclick={onDeleteClick} title="Delete Study" aria-label="Delete Study">
            <IconTrash size={16} />
        </button>
    </div>
    <div class="space-y-4">
        <div>
            <div class="small-label-text">STUDY</div>
            <p class="standard-text">{study.name}</p>
        </div>
        <div>
            <div class="small-label-text">Title</div>
            <p class="standard-text">{study.title || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Status</div>
            <span class="badge {statusColor} standard-text">{study.status || "None"}</span>
        </div>
        <div>
            <div class="small-label-text">Phase</div>
            <p class="standard-text">{study.phase || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Therapeutic Area</div>
            <p class="standard-text">{study.therapeuticArea || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Current Protocol</div>
            <p class="standard-text">{study.currentProtocol || "-"}</p>
        </div>
    </div>
</div>
{:else}
<div>Study not found.</div>
{/if}

<style>
    /* No local styles needed - popover is a separate component mounted to body */
</style>
