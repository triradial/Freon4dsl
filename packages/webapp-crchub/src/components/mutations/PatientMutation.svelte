<script lang="ts">
    import { type Study, type Patient } from "../../services/data/data-store.js";
    import { createEventDispatcher } from "svelte";
    // @ts-ignore
    import { Save as IconSave, X as IconX } from '@lucide/svelte';

    const { study, patient, action } = $props<{
        study: Study;
        patient: Patient;
        action: "add" | "edit";
    }>();

    let mutatedPatient = { ...patient };
    const dispatch = createEventDispatcher<{
        save: Patient;
        close: void;
    }>();

    function getInputClass(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    $effect(() => {
        console.log("[PatientMutation] $effect edit:", action, patient);
        if (action === "edit" && patient) {
            validateAllFields();
        }
    });

    $effect(() => {
        console.log("[PatientMutation] $effect add:", action, patient);
        if (action === "add" && patient) {
            mutatedPatient.studyId = study.id;
            mutatedPatient.study = study.name;
        }
    });

    let errors = {
        patientNumber: "",
    };
    let errorState = { ...errors };
    let hasErrors = Object.values(errorState).some((error) => error !== "");

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

<div class="card crc-mutation-area max-w-sm">
    <div class="space-y-2">
        <div>
            <h4 class="card-label-text">Patient Number</h4>
            <input
                type="text"
                bind:value={mutatedPatient.patientNumber}
                oninput={handleInput("patientNumber")}
                class="crc-field {getInputClass('patientNumber')}"
            />
        </div>
        <div>
            <h4 class="card-label-text">Initials</h4>
            <input type="text" bind:value={mutatedPatient.initials} class="crc-field" />
        </div>
        <div>
            <h4 class="card-label-text">YOB</h4>
            <input type="number" bind:value={mutatedPatient.dob} min="1924" max={new Date().getFullYear()} class="crc-field" />
        </div>
        <div>
            <h4 class="card-label-text">Gender</h4>
            <select bind:value={mutatedPatient.gender} class="select crc-field">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>
        </div>
    </div>
    <div class="flex items-center justify-center mt-4">
        <button class="btn btn-sm preset-filled primary-button mr-2" onclick={saveChanges} disabled={hasErrors}><IconSave />Save</button>
        <button class="btn btn-sm preset-filled secondary-button" onclick={cancelEdit}><IconX />Cancel</button>
    </div>
</div>
