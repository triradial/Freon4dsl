<script lang="ts">
    import { Modal, Button } from "flowbite-svelte";
    import { createEventDispatcher } from "svelte";
    import { deleteStudy, deletePatient } from "../../services/dataStore";

    export let open = false;
    export let objectType: "study" | "patient";
    export let object: any;

    const dispatch = createEventDispatcher();

    $: title = "Delete " + toProperCase(objectType);
    $: if (open) {
        console.log("Dialog opened for", objectType, object);
    }

    function handleDelete() {
        if (objectType === "study") {
            deleteStudy(object.id);
        } else if (objectType === "patient") {
            deletePatient(object.id);
        }
        dispatch("delete");
        open = false;
    }

    function handleCancel() {
        open = false;
        dispatch("cancel");
    }
    
    function toProperCase(str: string) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
</script>

<Modal title="{title}" bind:open={open} class="dialog" backdropClass="dialog-backdrop fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80" dialogClass="dialog-content fixed top-0 start-0 end-0 h-modal md:inset-0 md:h-full p-2 flex" size="xs" autofocus placement="center">
    <div class="text-left">
        <div class="mb-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this {objectType}?
        </div>
    </div>
    <svelte:fragment slot="footer">
        <Button class="primary-button" on:click={handleDelete}>Yes, I'm sure</Button>
        <Button class="secondary-button" on:click={handleCancel}>No, cancel</Button>
    </svelte:fragment>
</Modal>