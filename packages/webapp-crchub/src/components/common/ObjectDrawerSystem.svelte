<script lang="ts">
    import { Drawer, Button } from "flowbite-svelte";
    import StudyMutation from "../mutations/StudyMutation.svelte";
    import PatientMutation from "../mutations/PatientMutation.svelte";
    import { drawerStore, closeDrawer, saveObject } from "../../services/objectDrawerStore";
    import { sineIn } from "svelte/easing";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faTimes } from "@fortawesome/free-solid-svg-icons";

    let activeDrawerInstance: any;
    let currentInstanceId: string | null = null;
    $: title = $drawerStore.action === "add" 
        ? `Add ${toProperCase($drawerStore.objectType ?? '')}`
        : `Edit ${toProperCase($drawerStore.objectType ?? '')}`;
    $: hidden = !$drawerStore.open;
    $: {
        if ($drawerStore.instanceId !== currentInstanceId) {
            currentInstanceId = $drawerStore.instanceId;
            if ($drawerStore.open) {
                activeDrawerInstance = $drawerStore.objectType === "study" ? StudyMutation : PatientMutation;
            } else {
                activeDrawerInstance = null;
            }
        }
    }

    let transitionParams = {
        x: 320,
        duration: 200,
        easing: sineIn,
    };

    function handleSave(event: CustomEvent) {
        saveObject(event.detail);
    }

    function handleClose() {
        closeDrawer();
    }

    function toProperCase(str: string) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
</script>

<Drawer id="generic-drawer" class="object-drawer" transitionType="fly" {transitionParams} placement="right" backdrop={true} bind:hidden>
    <div class="drawer-header">
        <div class="drawer-title-container">
            <h5 class="text-lg font-bold">{title}</h5>
        </div>
        <Button class="drawer-header-button" on:click={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
        </Button>
    </div>
    {#if activeDrawerInstance}
        <svelte:component
            this={activeDrawerInstance}
            {...$drawerStore.objectType === "study" ? { study: $drawerStore.object } : { patient: $drawerStore.object }}
            isEditing={true}
            on:save={handleSave}
            on:close={handleClose}
        />
    {/if}
</Drawer>
