<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    const { patientId } = $props<{ patientId: string }>();

    let patient = $derived($dataStore.patients.find(p => p.id === patientId));
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil, Trash2 as IconTrash } from '@lucide/svelte';
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";

    let statusColor = $derived(patient ? getStatusColor(patient.gender) : ""); // Example: use gender for color, adjust as needed
    let deleteDialogOpen = $state(false);

    function onEditClick() {
        if (patient) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("patient", patient));
        }
    }

    function onDeleteClick() {
        if (patient) {
            deleteDialogOpen = true;
        }
    }

    function onPatientChanged() {
        // Refresh patients data after delete
        dataStore.getPatients();
    }
</script>

{#if patient}
<div class="card card-area max-w-sm h-full">
    <div class="flex items-center justify-between mb-4">
        <h3 class="main-label-text mr-2">PATIENT</h3>
        <div class="flex items-center gap-2">
            <button type="button" class="grid-button general-button" onclick={onEditClick} title="Edit Patient" aria-label="Edit Patient">
                <IconPencil size={16} />
            </button>
            <button type="button" class="grid-button delete-button" onclick={onDeleteClick} title="Delete Patient" aria-label="Delete Patient">
                <IconTrash size={16} />
            </button>
        </div>
    </div>
    <div class="space-y-4">
        <div>
            <div class="small-label-text">Patient Number</div>
            <p class="standard-text">{patient.patientNumber}</p>
        </div>
        <div>
            <div class="small-label-text">Initials</div>
            <p class="standard-text">{patient.initials}</p>
        </div>
        <div>
            <div class="small-label-text">Gender</div>
            <span class="badge {statusColor} standard-text">{patient.gender || "None"}</span>
        </div>
        <div>
            <div class="small-label-text">DOB</div>
            <p class="standard-text">{patient.dob || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Initials</div>
            <p class="standard-text">{patient.initials || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Study</div>
            <p class="standard-text">{patient.study || "None"}</p>
        </div>
    </div>
</div>

<DeleteObjectDialog
    open={deleteDialogOpen}
    objectType="patient"
    object={patient}
    on:delete={() => {
        onPatientChanged();
        deleteDialogOpen = false;
    }}
    on:cancel={() => {
        deleteDialogOpen = false;
    }}
/>
{:else}
<div>Patient not found.</div>
{/if}
