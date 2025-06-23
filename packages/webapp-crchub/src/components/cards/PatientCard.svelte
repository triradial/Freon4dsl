<script lang="ts">
    import { type Patient } from "../../services/data/data-store.js";
    import { editObject } from "../../services/stores/object-drawer-store.js";
    // @ts-ignore
    import { Pencil as IconPencil } from '@lucide/svelte';

    const { patient } = $props<{ patient: Patient }>();

    function onEditClick() {
        editObject("patient", patient.id);
    }
</script>

<div class="card card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="text-base font-bold mr-2">Patient</h3>
        <button type="button" class="icon-button btn-sm grid-header-button" onclick={onEditClick}><IconPencil /></button>
    </div>
    <div class="space-y-2">
        <div>
            <h4 class="card-label-text">Patient Number</h4>
            <p class="text-sm">{patient.patientNumber}</p>
        </div>
        <div>
            <h4 class="card-label-text">Initials</h4>
            <p class="text-xs">{patient.initials}</p>
        </div>
        <div>
            <h4 class="card-label-text">YOB</h4>
            <p class="text-xs">{patient.dob}</p>
        </div>
        <div>
            <h4 class="card-label-text">Gender</h4>
            <p class="text-xs">{patient.gender}</p>
        </div>
    </div>
</div>
