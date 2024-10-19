<script lang="ts">
    import { Card, Badge, Button, Input, Select, Textarea, Helper } from "flowbite-svelte";
    import type { ColorVariant } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faHeart, faPencil, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
    import { getStatusColor } from "../../services/utils";
    import { type Study } from "../../services/dataStore";
    import { createEventDispatcher } from "svelte";

    export let study: Study;
    export let action: 'add' | 'edit';
    let mutatedStudy = { ...study };
    const dispatch = createEventDispatcher();

    $: statusColor = getStatusColor(mutatedStudy.status) as ColorVariant;
    $: getInputClass = (field: keyof typeof errors) => {
        return errorState[field] ? 'error' : '';
    }
    $: if (action === 'edit' && study) {
        validateAllFields();
    }
    let errors = {
        name: "",
    };
    $: errorState = { ...errors };
    $: hasErrors = Object.values(errorState).some(error => error !== "");

    function saveChanges() {
        validateAllFields();
        if (Object.values(errorState).every(error => error === "")) {
            dispatch("save", mutatedStudy);
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
        (Object.keys(mutatedStudy) as Array<keyof typeof errors>).forEach(key => {
            if (key in errors) {
                validateField(key, mutatedStudy[key]);
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

<Card class="crc-mutation-area max-w-sm">
    <div class="space-y-2">
        <div>
            <h4 class="card-label-text">Name</h4>
            <Input type="text" bind:value={mutatedStudy.name} on:input={handleInput('name')} class="crc-field {getInputClass('name')}" />
        </div>
        <div>
            <h4 class="card-label-text">Title</h4>
            <Textarea class="crc-field min-h-[5rem]" rows="6" bind:value={mutatedStudy.title} />
        </div>
        <div>
            <h4 class="card-label-text">Status</h4>
            <Select class="crc-field" bind:value={mutatedStudy.status}>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
                <option value="Withdrawn">Withdrawn</option>
            </Select>
        </div>
        <div>
            <h4 class="card-label-text">Phase</h4>
            <Input type="text" bind:value={mutatedStudy.phase} class="crc-field" />
        </div>
        <div>
            <h4 class="card-label-text">Therapeutic Area</h4>
            <Input type="text" bind:value={mutatedStudy.therapeuticArea} class="crc-field" />
        </div>
        <div>
            <h4 class="card-label-text text-gray-700">Current Protocol</h4>
            <Input type="text" bind:value={mutatedStudy.currentProtocol} class="crc-field" />
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
