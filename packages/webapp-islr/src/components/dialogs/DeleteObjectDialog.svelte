<script lang="ts">
    import { Modal } from '@skeletonlabs/skeleton-svelte';
    import { createEventDispatcher } from "svelte";
    import { dataStore } from "../../services/data/data-store.js";
    // @ts-ignore
    import { CircleCheck as IconCircleCheck, CircleX as IconCircleX } from '@lucide/svelte';

    const { open = false, objectType, object } = $props<{ 
        open?: boolean; 
        objectType: "project" | "patient"; 
        object: { id: string; [key: string]: any } 
    }>();

    const dispatch = createEventDispatcher<{
        delete: void;
        cancel: void;
    }>();

    function getTitle() {
        return "Delete " + toProperCase(objectType);
    }

    function handleDelete() {
        if (objectType === "project") {
            dataStore.deleteStudy(object.id);
        } else if (objectType === "patient") {
            dataStore.deletePatient(object.id);
        }
        dispatch("delete");
    }

    function handleCancel() {
        dispatch("cancel");
    }

    function toProperCase(str: string) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
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
                Are you sure you want to delete this {objectType}?
            </p>
        </div>
        <footer class="flex justify-end gap-2 mt-4">
            <button type="button" class="standard-button primary" onclick={handleDelete}><IconCircleCheck size="16" />Yes, I'm sure</button>
            <button type="button" class="standard-button secondary" onclick={handleCancel}><IconCircleX size="16" />No, cancel</button>
        </footer>
    {/snippet}
</Modal>
