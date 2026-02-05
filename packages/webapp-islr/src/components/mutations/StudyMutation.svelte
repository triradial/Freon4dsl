<script lang="ts">
    import { getStatusColor } from "../../services/utils.js";
    import { dataStore, type Study } from "../../services/data/data-store.js";
    // @ts-ignore
    import { Save as IconSave, X as IconX, Asterisk as IconAsterisk } from '@lucide/svelte';

    const { study, action, onsave, onclose } = $props<{
        study: Study;
        action: "add" | "edit";
        onsave?: (project: Study) => void;
        onclose?: () => void;
    }>();

    let mutatedProject = $state({ ...study });
    let rows: number = 6;

    // Extract site number from identifiers array, or initialize empty
    let siteNumber = $state(
        study.identifiers?.find(id => id.type === "siteNumber")?.identifier ?? ""
    );

    // Get existing studies from the dataStore for duplicate validation
    let existingStudies = $derived($dataStore.studies);

    let statusColor = $derived(getStatusColor(mutatedProject.status));
    
    function getErrorState(field: keyof typeof errors) {
        return errorState[field] ? "error" : "";
    }

    $effect(() => {
        console.log("[StudyMutation] $effect action:", action, "study:", study);
        if (action === "edit" && study) {
            validateAllFields();
        }
    });

    const errors = $state({
        name: "",
        siteNumber: "",
    });
    const errorState = $state({ ...errors });
    let hasErrors = $derived(Object.values(errorState).some((error) => error !== ""));

    $effect(() => {
        validateAllFields();
        console.log("[StudyMutation] errors:", errors);
        console.log("[StudyMutation] errorState:", errorState);
    });

    function handleSave() {
        validateAllFields();
        if (Object.values(errorState).every((error) => error === "")) {
            // Update identifiers with site number before saving
            const updatedIdentifiers = mutatedProject.identifiers?.filter(id => id.type !== "siteNumber") ?? [];
            if (siteNumber.trim()) {
                updatedIdentifiers.push({ type: "siteNumber", identifier: siteNumber.trim() });
            }
            const projectToSave = {
                ...mutatedProject,
                identifiers: updatedIdentifiers
            };
            console.log("[StudyMutation] calling onsave prop", projectToSave);
            onsave?.(projectToSave);
        }
    }

    function handleClose() {
        console.log("[StudyMutation] calling onclose prop");
        onclose?.();
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (field === "siteNumber") {
                siteNumber = target.value;
            }
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        validateField("name", mutatedProject.name);
        validateField("siteNumber", siteNumber);
    }

    function validateField(field: keyof typeof errors, value: string) {
        if (field === "name") {
            if (!value.trim()) {
                errors[field] = "Study name is required";
            } else if (isDuplicateName(value.trim())) {
                errors[field] = "A study with this name already exists";
            } else {
                errors[field] = "";
            }
        } else if (field === "siteNumber") {
            if (!value.trim()) {
                errors[field] = "Site number is required";
            } else if (isDuplicateSiteNumber(value.trim())) {
                errors[field] = "A study with this site number already exists";
            } else {
                errors[field] = "";
            }
        }
        errorState[field] = errors[field];
    }

    function isDuplicateName(name: string): boolean {
        return existingStudies.some(s => {
            // When editing, exclude the current study from duplicate check
            if (action === "edit" && s.id === study.id) {
                return false;
            }
            return s.name.toLowerCase() === name.toLowerCase();
        });
    }

    function isDuplicateSiteNumber(siteNum: string): boolean {
        return existingStudies.some(s => {
            // When editing, exclude the current study from duplicate check
            if (action === "edit" && s.id === study.id) {
                return false;
            }
            const existingSiteNumber = s.identifiers?.find(id => id.type === "siteNumber")?.identifier;
            return existingSiteNumber?.toLowerCase() === siteNum.toLowerCase();
        });
    }
</script>

<div class="mutation-area max-w-sm">
    <div class="flex flex-col gap-4">
        <div>
            <div class="small-label-text">Name{#if errors.name}<IconAsterisk size="12" color="red" />{/if}</div>        
            <input class="input-field {getErrorState('name')}" type="text" bind:value={mutatedProject.name} oninput={handleInput("name")} />
        </div>
        <div>
            <div class="small-label-text">Site Number{#if errors.siteNumber}<IconAsterisk size="12" color="red" />{/if}</div>        
            <input class="input-field {getErrorState('siteNumber')}" type="text" bind:value={siteNumber} oninput={handleInput("siteNumber")} />
        </div>
        <div>
            <div class="small-label-text">Title</div>
            <textarea class="textarea-field min-h-[5rem]" rows={rows} bind:value={mutatedProject.title}></textarea>
        </div>
        <div>
            <div class="small-label-text">Status</div>
            <select class="select-field" bind:value={mutatedProject.status}>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
                <option value="Withdrawn">Withdrawn</option>
            </select>
        </div>
    </div>
    <div class="flex items-center justify-center mt-8">
        <button class="standard-button primary" onclick={handleSave} disabled={hasErrors}><IconSave size="16" />Save</button>
        <button class="standard-button secondary" onclick={handleClose}><IconX size="16" />Cancel</button>
    </div>
</div>
