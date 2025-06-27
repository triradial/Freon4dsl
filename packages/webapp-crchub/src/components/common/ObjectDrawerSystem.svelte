<script lang="ts">
    import { Popover } from '@skeletonlabs/skeleton-svelte';
    import { objectDrawerStore, closeObjectDrawer } from '../../services/stores/object-drawer-store.js';
    import StudyMutation from '../mutations/StudyMutation.svelte';
    import PatientMutation from '../mutations/PatientMutation.svelte';
    import IconX from '@lucide/svelte/icons/x';
    import { dataStore } from '../../services/data/data-store.js';

    let openState = $derived($objectDrawerStore.open);
    let type = $derived($objectDrawerStore.type);
    let action = $derived($objectDrawerStore.action);
    let data = $derived($objectDrawerStore.data);

    function handleClose() {
        console.log('[ObjectDrawerSystem] handleClose called');
        closeObjectDrawer();
    }
</script>

<Popover
    open={openState}
    modal={true}
    closeOnInteractOutside={false}
    onOpenChange={(e) => e.open ? null : handleClose()}
    positioning={{
        placement: 'left',
        strategy: 'fixed',
        offset: { mainAxis: 0, crossAxis: 0 },
        gutter: 0
    }}
    zIndex="50"
    contentBackground="object-drawer"
    contentBase="fixed inset-y-0 left-0 w-full max-w-md shadow-xl transition-transform duration-200 transform-gpu translate-x-0"
    triggerBase=""
>
    {#snippet content()}
        <header class="drawer-header">
            <div class="drawer-title-container">
            <h2>
                {action === 'add' ? 'Add' : 'Edit'} {type === 'study' ? 'Study' : type === 'patient' ? 'Patient' : ''}
            </h2>         
            </div>
            <button class="icon-button drawer-header-button" onclick={handleClose}><IconX size="16" /></button>
        </header>
        <div class="drawer-content">
            {#if type === 'study'}
                <StudyMutation 
                    study={data} 
                    {action} 
                    onsave={async (study) => {
                        if (action === 'add') {
                            await dataStore.addStudy(study);
                        } else if (action === 'edit') {
                            await dataStore.updateStudy(study);
                        }
                        handleClose();
                    }} 
                    onclose={() => { handleClose(); }} 
                />
            {:else if type === 'patient'}
                <PatientMutation 
                    patient={data} 
                    {action} 
                    onsave={async (patient) => {
                        if (action === 'add') {
                            await dataStore.addPatient(patient);
                        } else if (action === 'edit') {
                            await dataStore.updatePatient(patient);
                        }
                        handleClose();
                    }} 
                    onclose={() => { handleClose(); }} 
                />
            {/if}
        </div>
    {/snippet}
</Popover>
