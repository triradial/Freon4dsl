<script lang="ts">
    import { Drawer } from 'flowbite-svelte';
    import StudyCard from '../cards/StudyCard.svelte';
    import PatientCard from '../cards/PatientCard.svelte';
    import { drawerStore, closeDrawer, saveObject } from '../../services/objectDrawerStore';
    import { sineIn } from 'svelte/easing';

    let activeDrawerInstance: any;
    let currentInstanceId: string | null = null;

    $: title = $drawerStore.action === 'add' ? `Add ${$drawerStore.objectType}` : `Edit ${$drawerStore.objectType}`;
    $: hidden = !$drawerStore.open;
    $: {
        if ($drawerStore.instanceId !== currentInstanceId) {
            currentInstanceId = $drawerStore.instanceId;
            if ($drawerStore.open) {
                activeDrawerInstance = $drawerStore.objectType === 'study' ? StudyCard : PatientCard;
            } else {
                activeDrawerInstance = null;
            }
        }
    }

    let transitionParams = {
        x: 320,
        duration: 200,
        easing: sineIn
    };

    function handleSave(event: CustomEvent) {
        saveObject(event.detail);
    }

    function handleClose() {
        closeDrawer();
    }
</script>

<Drawer transitionType="fly" {transitionParams} placement="right" backdrop={false} width="16rem" bind:hidden={hidden} id="generic-drawer" style="z-index: 1000;">
    <div class="flex items-center justify-between p-4">
        <h5 class="text-lg font-bold">{title}</h5>
        <button on:click={handleClose}>Close</button>
    </div>
    {#if activeDrawerInstance}
        <svelte:component 
            this={activeDrawerInstance}
            {...($drawerStore.objectType === 'study' ? { study: $drawerStore.object } : { patient: $drawerStore.object })}
            isEditing={true}
            on:save={handleSave}
            on:close={handleClose}
        />
    {/if}
</Drawer>