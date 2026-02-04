<script lang="ts">
    import { Popover } from '@skeletonlabs/skeleton-svelte';
    import { objectDrawerStore, closeObjectDrawer } from '../../services/stores/object-drawer-store.js';
    import StudyMutation from '../mutations/StudyMutation.svelte';
    import PatientMutation from '../mutations/PatientMutation.svelte';
    import OrganizationMutation from '../mutations/OrganizationMutation.svelte';
    import PersonMutation from '../mutations/PersonMutation.svelte';
    import IconX from '@lucide/svelte/icons/x';
    import { dataStore } from '../../services/data/data-store.js';
    import { navigateTo } from '../../services/routing/route-action.js';

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
    onOpenChange={(e) => {
        if (!e.open) {
            handleClose();
        }
    }}
    positioning={{
        placement: 'left',
        strategy: 'fixed',
        offset: { mainAxis: 0, crossAxis: 0 },
        gutter: 0
    }}
    zIndex="900"
    contentBackground="object-drawer"
    contentBase="fixed inset-y-0 left-0 w-full max-w-md shadow-xl object-drawer-slide"
    triggerBase=""
>
    {#snippet content()}
        <header class="drawer-header">
            <div class="drawer-title-container">
            <h2>
                {action === 'add' ? 'Add' : action === 'edit' ? 'Edit' : 'Copy'} {type === 'study' ? 'Study' : type === 'patient' ? 'Patient' : type === 'organization' ? 'Organization' : type === 'person' ? 'Person' : ''}
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
                            await dataStore.addStudyWithSite(study as any);
                        } else if (action === 'edit') {
                            await dataStore.updateStudy(study);
                        } else if (action === 'copy') {
                            const copiedStudy = await dataStore.copyStudy(study as any);
                            if (copiedStudy?.id) {
                                handleClose();
                                navigateTo('study', copiedStudy.id);
                                return;
                            }
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
                            // Refresh study patients from server to ensure store is fully synced
                            if (patient.studyId) {
                                await dataStore.getStudyPatients(patient.studyId);
                            }
                        } else if (action === 'edit') {
                            await dataStore.updatePatient(patient);
                        }
                        handleClose();
                    }} 
                    onclose={() => { handleClose(); }} 
                />
            {:else if type === 'organization'}
                <OrganizationMutation 
                    organization={data} 
                    {action} 
                    onsave={async (organization) => {
                        if (action === 'add') {
                            await dataStore.addOrganization(organization);
                        } else if (action === 'edit') {
                            await dataStore.updateOrganization(organization.id, organization);
                        }
                        handleClose();
                    }} 
                    onclose={() => { handleClose(); }} 
                />
            {:else if type === 'person'}
                <PersonMutation 
                    person={data} 
                    {action} 
                    onsave={async (person) => {
                        if (action === 'add') {
                            await dataStore.addPerson(person);
                        } else if (action === 'edit') {
                            await dataStore.updatePerson(person.id, person);
                        }
                        handleClose();
                    }} 
                    onclose={() => { handleClose(); }} 
                />
            {/if}
        </div>
    {/snippet}
</Popover>
