<script lang="ts">
    import { Card, Badge, Button, Input, Select, Textarea, Helper } from "flowbite-svelte";
    import type { ColorVariant } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faHeart, faPencil, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
    import { getStatusColor } from "../../services/utils";
    import { type Study } from "../../services/dataStore";
    import { createEventDispatcher } from "svelte";

    export let study: Study;
    export let isEditing = false;
    let editedStudy = { ...study };
    const dispatch = createEventDispatcher();

    $: statusColor = getStatusColor(isEditing ? editedStudy.status : study.status) as ColorVariant;
    $: getInputClass = (field: keyof typeof errors) => {
        return errorState[field] ? 'error' : '';
    }
    $: if (isEditing) {
        validateAllFields();
    }
    let errors = {
        name: "",
    };
    $: errorState = { ...errors };
    $: hasErrors = Object.values(errorState).some(error => error !== "");

    function toggleEdit() {
        isEditing = !isEditing;
        if (isEditing) {
            editedStudy = { ...study };
            validateAllFields();
        }
    }

    function saveChanges() {
        validateAllFields();
        if (Object.values(errorState).every(error => error === "")) {
            dispatch("save", editedStudy);
            isEditing = false;
        }
    }

    function cancelEdit() {
        editedStudy = { ...study };
        isEditing = false;
        errors = { name: "" };
        errorState = { ...errors };  // Update reactive error state
    }

    function handleInput(field: keyof typeof errors) {
        return (event: Event) => {
            const target = event.target as HTMLInputElement;
            validateField(field, target.value);
        };
    }
    
    function validateAllFields() {
        (Object.keys(editedStudy) as Array<keyof typeof errors>).forEach(key => {
            if (key in errors) {
                validateField(key, editedStudy[key]);
            }
        });
    }

    function validateField(field: keyof typeof errors, value: string) {
        if (field === 'name' && !value.trim()) {
            errors[field] = 'Study name is required';
        } else {
            errors[field] = '';
        }
        errorState = { ...errors };  // Update reactive error state
    }

</script>

<Card class="crc-card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="text-base font-bold mr-2">Study</h3>
        {#if !isEditing}
            <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={toggleEdit}>
                <FontAwesomeIcon icon={faPencil} />
            </Button>
        {/if}
    </div>
    <div class="space-y-2">
        <div>
            <h4 class="card-label-text">Name</h4>
            {#if isEditing}
                <Input type="text" bind:value={editedStudy.name} on:input={handleInput('name')} class="crc-field {getInputClass('name')}" />
            {:else}
                <p class="text-sm">{study.name}</p>
            {/if}
        </div>
        <div>
            <h4 class="card-label-text">Title</h4>
            {#if isEditing}
                <Textarea class="crc-field min-h-[5rem]" rows="6" bind:value={editedStudy.title} />
            {:else}
                <p class="text-xs">{study.title}</p>
            {/if}
        </div>
        <div>
            <h4 class="card-label-text">Status</h4>
            {#if isEditing}
                <Select class="crc-field" bind:value={editedStudy.status}>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Planned">Planned</option>
                </Select>
            {:else}
                <Badge color={statusColor} class="text-xs">{study.status}</Badge>
            {/if}
        </div>
        <div>
            <h4 class="card-label-text">Phase</h4>
            {#if isEditing}
                <Input type="text" bind:value={editedStudy.phase} class="crc-field" />
            {:else}
                <p class="text-sm">{study.phase}</p>
            {/if}
        </div>
        <div>
            <h4 class="card-label-text">Therapeutic Area</h4>
            {#if isEditing}
                <Input type="text" bind:value={editedStudy.therapeuticArea} class="crc-field" />
            {:else}
                <p class="text-sm">{study.therapeuticArea}</p>
            {/if}
        </div>
        <div>
            <h4 class="card-label-text text-gray-700">Current Protocol</h4>
            {#if isEditing}
                <Input type="text" bind:value={editedStudy.currentProtocol} class="crc-field" />
            {:else}
                <p class="text-sm">{study.currentProtocol}</p>
            {/if}
        </div>
    </div>
    {#if isEditing}
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
    {/if}
</Card>

<style>
    :global(.card) {
        border-radius: 0;
        box-shadow: none;
        border: 1px solid #e5e7eb;
    }
</style>
