<script lang="ts">
    import { Card, Badge, Button } from "flowbite-svelte";
    import { type Patient } from "../../services/dataStore";
    import { editObject } from "../../services/objectDrawerStore";

    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faPencil } from "@fortawesome/free-solid-svg-icons";

    export let patient: Patient;

    function onEditClick() {
        editObject("patient", patient.id);
    }
</script>

<Card class="crc-card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="text-base font-bold mr-2">Patient</h3>
        <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={onEditClick}>
            <FontAwesomeIcon icon={faPencil} />
        </Button>
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
</Card>

<style>
    :global(.card) {
        border-radius: 0;
        box-shadow: none;
        border: 1px solid #e5e7eb;
    }
</style>
