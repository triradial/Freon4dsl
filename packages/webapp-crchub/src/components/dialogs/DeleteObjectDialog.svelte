<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { dataStore } from "../../services/data/data-store.js";
    // @ts-ignore
    import { CircleCheck as IconCircleCheck, CircleX as IconCircleX } from '@lucide/svelte';

    const { open = false, objectType, object } = $props<{ 
        open?: boolean; 
        objectType: "study" | "patient"; 
        object: { id: string; [key: string]: any } 
    }>();

    const dispatch = createEventDispatcher<{
        delete: void;
        cancel: void;
    }>();

    let title = $derived(() => "Delete " + toProperCase(objectType));

    function handleDelete() {
        if (objectType === "study") {
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

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            handleCancel();
        }
    }
</script>

<div class="fixed inset-0 z-50 overflow-y-auto" class:hidden={!open}>
    <div class="flex min-h-screen items-center justify-center p-4 text-center">
        <button
            type="button"
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onclick={handleCancel}
            onkeydown={handleKeydown}
            aria-label="Close dialog"
        ></button>
        
        <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 class="text-lg font-semibold leading-6 text-gray-900">
                            {title}
                        </h3>
                        <div class="mt-2">
                            <p class="text-sm text-gray-500">
                                Are you sure you want to delete this {objectType}?
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onclick={handleDelete}
                ><IconCircleCheck color="green" />Yes, I'm sure
                </button>
                <button
                    type="button"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onclick={handleCancel}
                ><IconCircleX color="red" />No, cancel
                </button>
            </div>
        </div>
    </div>
</div>
