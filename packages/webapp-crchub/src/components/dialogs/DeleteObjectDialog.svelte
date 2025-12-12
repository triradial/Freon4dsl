<script lang="ts">
    import { Modal } from '@skeletonlabs/skeleton-svelte';
    import { createEventDispatcher } from "svelte";
    import { dataStore } from "../../services/data/data-store.js";
    // @ts-ignore
    import { CircleCheck as IconCircleCheck, CircleX as IconCircleX } from '@lucide/svelte';

    const { open = false, objectType, object } = $props<{ 
        open?: boolean; 
        objectType: "study" | "patient" | "person"; 
        object: { id: string; person_id?: string; [key: string]: any } 
    }>();

    const dispatch = createEventDispatcher<{
        delete: void;
        cancel: void;
    }>();

    let isDeleting = $state(false);
    let errorMessage = $state<string | null>(null);

    function getTitle() {
        return "Delete " + toProperCase(objectType);
    }

    async function handleDelete() {
        if (isDeleting) return;
        
        isDeleting = true;
        errorMessage = null;
        
        try {
            let success = false;
        if (objectType === "study") {
                success = await dataStore.deleteStudy(object.id);
        } else if (objectType === "patient") {
                success = await dataStore.deletePatient(object.id);
        } else if (objectType === "person") {
                const personId = object.person_id || object.id;
                success = await dataStore.deletePerson(personId);
        }
            
            if (success) {
                dispatch("delete");
            } else {
                errorMessage = `Failed to delete ${objectType}. Please try again.`;
            }
        } catch (error) {
            console.error(`Error deleting ${objectType}:`, error);
            // Use the error message if available, otherwise use a generic message
            const errorMsg = error instanceof Error ? error.message : `An error occurred while deleting the ${objectType}`;
            errorMessage = errorMsg || `An error occurred while deleting the ${objectType}. Please try again.`;
        } finally {
            isDeleting = false;
        }
    }

    function handleCancel() {
        errorMessage = null;
        dispatch("cancel");
    }

    function toProperCase(str: string) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    function getObjectName() {
        if (!object) return '';
        
        if (objectType === "study") {
            return object.name || object.id;
        } else if (objectType === "patient") {
            return object.patientNumber || object.initials || object.id;
        } else if (objectType === "person") {
            return object.name || object.email || object.id;
        }
        return object.id;
    }
</script>

<Modal
    open={open}
    onOpenChange={(e) => { if (!e.open) handleCancel(); }}
    contentBase="delete-dialog shadow-xl"
    positionerJustify="justify-center"
    positionerAlign="items-center"
    positionerPadding=""
    transitionsPositionerIn={{ y: 0, duration: 200 }}
    transitionsPositionerOut={{ y: 0, duration: 200 }}
    modal={true}
    closeOnInteractOutside={false}
>
    {#snippet content()}
        <header class="flex justify-between items-center mb-2">
            <h3>{getTitle()}</h3>
        </header>
        <div>
            <p class="text-sm text-gray-500">
                Are you sure you want to delete the '{getObjectName()}' {objectType}?
            </p>
            {#if errorMessage}
                <p class="dialog-error-message mt-2">{errorMessage}</p>
            {/if}
        </div>
        <footer class="flex justify-end gap-2 mt-4">
            <button type="button" class="standard-button red inverted" onclick={handleDelete} disabled={isDeleting || !!errorMessage}>
                <IconCircleCheck size="16" />
                {isDeleting ? "Deleting..." : "Yes, I'm sure"}
            </button>
            <button type="button" class="standard-button green inverted" onclick={handleCancel} disabled={isDeleting}>
                <IconCircleX size="16" />No, cancel
            </button>
        </footer>
    {/snippet}
</Modal>
