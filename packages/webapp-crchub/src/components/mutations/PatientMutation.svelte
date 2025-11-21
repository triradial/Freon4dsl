<script lang="ts">
    import { type Patient } from "../../services/data/data-store.js";
// @ts-ignore
    import { Asterisk as IconAsterisk, Save as IconSave, X as IconX } from '@lucide/svelte';

    const { patient, action, onsave, onclose } = $props<{
        patient: Patient;
        action: "add" | "edit";
        onsave?: (patient: Patient) => void;
        onclose?: () => void;
    }>();

    let mutatedPatient = { ...patient };

    function getErrorState(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    $effect(() => {
        if (action === "edit" && patient) {
            validateAllFields();
        }
    });

    const errors = $state({
        patientNumber: "",
        initials: ""
    });
    const errorState = $state({ ...errors });
    let hasErrors = $derived(Object.values(errorState).some((error) => error !== ""));

    $effect(() => {
        validateAllFields();
    });

    function handleSave() {
        console.log("[PatientMutation] handleSave called");
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            console.log("[PatientMutation] calling onsave prop", mutatedPatient);
            onsave?.(mutatedPatient);
        }
    }

    function handleClose() {
        onclose?.();
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
        } else if (field === "initials" && !value.trim()) {
            errors[field] = "Initials are required";
        } else {
            errors[field] = "";
        }
        errorState[field] = errors[field];
    }
</script>

<div class="mutation-area max-w-sm">
    <div class="flex flex-col gap-4">
        <div>
            <div class="small-label-text">Patient Number{#if errors.patientNumber}<IconAsterisk size="12" class="object-drawer-error-indicator" />{/if}</div>
            <input class="input-field {getErrorState('patientNumber')}" type="text" bind:value={mutatedPatient.patientNumber} oninput={handleInput("patientNumber")} />
        </div>
        <div>
            <div class="small-label-text">Initials{#if errors.initials}<IconAsterisk size="12" class="object-drawer-error-indicator" />{/if}</div>
            <input class="input-field {getErrorState('initials')}" type="text" bind:value={mutatedPatient.initials} oninput={handleInput("initials")} />
        </div>
        <div>
            <div class="small-label-text">Year of Birth</div>
            <input class="input-field" type="number" bind:value={mutatedPatient.dob} min="1924" max={new Date().getFullYear()} />
        </div>
        <div>
            <div class="small-label-text">Gender</div>
            <select class="select-field" bind:value={mutatedPatient.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>
        </div>
    </div>
    <div class="flex items-center justify-center mt-8">
        <button class="standard-button primary" onclick={handleSave} disabled={hasErrors}><IconSave size="16" />Save</button>
        <button class="standard-button secondary" onclick={handleClose}><IconX size="16" />Cancel</button>
    </div>
</div>
