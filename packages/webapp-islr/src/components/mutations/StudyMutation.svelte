<script lang="ts">
    import { getStatusColor } from "../../services/utils.js";
    import { type Study } from "../../services/data/data-store.js";
    // @ts-ignore
    import { Save as IconSave, X as IconX, Asterisk as IconAsterisk } from '@lucide/svelte';

    const { study, action, onsave, onclose } = $props<{
        study: Study;
        action: "add" | "edit";
        onsave?: (project: Study) => void;
        onclose?: () => void;
    }>();

    let mutatedProject = { ...study };
    let rows: number = 6;

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
            console.log("[StudyMutation] calling onsave prop", mutatedProject);
            onsave?.(mutatedProject);
        }
    }

    function handleClose() {
        console.log("[StudyMutation] calling onclose prop");
        onclose?.();
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }

    function validateAllFields() {
        (Object.keys(mutatedProject) as Array<keyof typeof errors>).forEach((key) => {
            if (key in errors) {
                validateField(key, mutatedProject[key]);
            }
        });
    }

    function validateField(field: keyof typeof errors, value: string) {
        if (field === "name" && !value.trim()) {
            errors[field] = "Project name is required";
        } else {
            errors[field] = "";
        }
        errorState[field] = errors[field];
    }
</script>

<div class="mutation-area max-w-sm">
    <div class="flex flex-col gap-4">
        <div>
            <div class="small-label-text">Name{#if errors.name}<IconAsterisk size="12" color="red" />{/if}</div>        
            <input class="input-field {getErrorState('name')}" type="text" bind:value={mutatedProject.name} oninput={handleInput("name")} />
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
