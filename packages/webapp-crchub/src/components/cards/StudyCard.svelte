<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    const { studyId } = $props<{ studyId: string }>();

    let study = $derived($dataStore.studies.find(s => s.id === studyId));
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil, Trash2 as IconTrash } from '@lucide/svelte';
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";

    let statusColor = $derived(study ? getStatusColor(study.status) : "");
    let deleteDialogOpen = $state(false);

    function onEditClick() {
        if (study) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("study", study));
        }
    }

    function onDeleteClick() {
        if (study) {
            deleteDialogOpen = true;
        }
    }

    function onStudyChanged() {
        // Refresh studies data after delete
        dataStore.getStudies();
    }
</script>

{#if study}
<div class="card card-area max-w-sm h-full">
    <div class="flex items-center mb-4">
        <h3 class="main-label-text mr-2">Study</h3>
        <div class="flex items-center gap-2">
            <button type="button" class="grid-button general-button" onclick={onEditClick} title="Edit Study" aria-label="Edit Study">
                <IconPencil size={16} />
            </button>
            <button type="button" class="grid-button delete-button" onclick={onDeleteClick} title="Delete Study" aria-label="Delete Study">
                <IconTrash size={16} />
            </button>
        </div>
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

<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="study"
    object={study}
    on:delete={() => {
        onStudyChanged();
        deleteDialogOpen = false;
    }}
    on:cancel={() => {
        deleteDialogOpen = false;
    }}
/>
{:else}
<div>Study not found.</div>
{/if}
