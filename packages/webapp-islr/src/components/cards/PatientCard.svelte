<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    const { patientId } = $props<{ patientId: string }>();

    let patient = $derived($dataStore.patients.find(p => p.id === patientId));
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil } from '@lucide/svelte';

    let statusColor = $derived(patient ? getStatusColor(patient.gender) : ""); // Example: use gender for color, adjust as needed

    function onEditClick() {
        if (patient) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("patient", patient.id));
        }
    }
</script>

{#if patient}
<div class="card card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="main-label-text mr-2">Patient</h3>
        <button type="button" class="icon-button primary inverted" onclick={onEditClick}><IconPencil /></button>
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
{:else}
<div>Patient not found.</div>
{/if}
