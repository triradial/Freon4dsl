<script lang="ts">
    import { Card, Button, Input, Select, Helper } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
    import { type Patient } from "../../services/dataStore";
    import { createEventDispatcher } from "svelte";

    export let patient: Patient;
    export let action: "add" | "edit";
    let mutatedPatient = { ...patient };
    const dispatch = createEventDispatcher();

    $: getInputClass = (field: keyof typeof errors) => {
        return errorState[field] ? "error" : "";
    };
    $: if (action === "edit" && patient) {
        validateAllFields();
    }
    let errors = {
        patientNumber: "",
    };
    $: errorState = { ...errors };
    $: hasErrors = Object.values(errorState).some((error) => error !== "");

    function saveChanges() {
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            dispatch("save", mutatedPatient);
        }
    }

    function cancelEdit() {
        dispatch("close");
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        (Object.keys(mutatedPatient) as Array<keyof typeof errors>).forEach((key) => {
            if (key in errors) {
                validateField(key, mutatedPatient[key]);
            }
        });
    }

    function validateField(field: keyof typeof errors, value: string) {
        if (field === "patientNumber" && !value.trim()) {
            errors[field] = "Patient number is required";
        } else {
            errors[field] = "";
        }
        errorState = { ...errors };
    }
</script>

<Card class="crc-mutation-area max-w-sm">
    <div class="space-y-2">
        <div>
            <h4 class="card-label-text">Patient Number</h4>
            <Input type="text" bind:value={mutatedPatient.patientNumber} on:input={handleInput("patientNumber")} class="crc-field {getInputClass('patientNumber')}" />
        </div>
        <div>
            <h4 class="card-label-text">Initials</h4>
            <Input type="text" bind:value={mutatedPatient.initials} class="crc-field" />
        </div>
        <div>
            <h4 class="card-label-text">YOB</h4>
            <Input type="date" bind:value={mutatedPatient.dob} class="crc-field" />
        </div>
        <div>
            <h4 class="card-label-text">Gender</h4>
            <Select bind:value={mutatedPatient.gender} class="crc-field">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </Select>
        </div>
    </div>
    <div class="flex items-center justify-center mt-4">
        <Button size="xs" color="primary" class="mr-2" on:click={saveChanges} disabled={hasErrors}>
            <FontAwesomeIcon icon={faSave} class="mr-2" />
            Save
        </Button>
        <Button size="xs" color="light" on:click={cancelEdit}>
            <FontAwesomeIcon icon={faTimes} class="mr-2" />
            Cancel
        </Button>
    </div>
</Card>

<style>
    :global(.card) {
        border-radius: 0;
        box-shadow: none;
        border: 1px solid #e5e7eb;
    }
</style>
