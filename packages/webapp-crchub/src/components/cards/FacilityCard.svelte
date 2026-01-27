<script lang="ts">
    import { onMount } from "svelte";
    import { dataStore } from "../../services/data/data-store.js";
    // @ts-ignore
    import { Pencil as IconPencil, Trash2 as IconTrash } from '@lucide/svelte';
    import DeleteObjectDialog from "../dialogs/DeleteObjectDialog.svelte";

    let organization = $state<any>(null);
    let isLoading = $state(true);
    let deleteDialogOpen = $state(false);

    // Format date for display (YYYY-MM-DD to readable format)
    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "-";
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    async function loadOrganization() {
        isLoading = true;
        try {
            organization = await dataStore.getUserOrganization();
            console.log('[FacilityCard] Organization loaded:', organization);
        } catch (error) {
            console.error('[FacilityCard] Error loading organization:', error);
        } finally {
            isLoading = false;
        }
    }

    function onEditClick() {
        if (organization) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("organization", organization));
        }
    }

    function onDeleteClick() {
        if (organization) {
            deleteDialogOpen = true;
        }
    }

    function onOrganizationChanged() {
        // Refresh organization data after delete
        loadOrganization();
    }

    onMount(() => {
        loadOrganization();
    });
</script>

{#if isLoading}
    <div class="card card-area max-w-sm h-full">
        <div class="flex items-center justify-center h-32">
            <div class="spinner"></div>
        </div>
    </div>
{:else if organization}
    <div class="card card-area max-w-sm h-full">
        <div class="flex items-center mb-4">
            <h3 class="main-label-text mr-2">Facility</h3>
            <div class="flex items-center gap-2">
                <button type="button" class="grid-button general-button" onclick={onEditClick} title="Edit Facility" aria-label="Edit Facility">
                    <IconPencil size={16} />
                </button>
                <button type="button" class="grid-button delete-button" onclick={onDeleteClick} title="Delete Facility" aria-label="Delete Facility">
                    <IconTrash size={16} />
                </button>
            </div>
        </div>
        <div class="space-y-4">
            <div>
                <div class="small-label-text">NAME</div>
                <p class="standard-text">{organization.name || "-"}</p>
            </div>
            <div>
                <div class="small-label-text">TYPE</div>
                <p class="standard-text">{organization.orgTypeName || "-"}</p>
            </div>
            <div>
                <div class="small-label-text">SUBTYPE</div>
                <p class="standard-text">{organization.orgSubtypeName || "-"}</p>
            </div>
            <div>
                <div class="small-label-text">START DATE</div>
                <p class="standard-text">{formatDate(organization.startDate)}</p>
            </div>
            <div>
                <div class="small-label-text">END DATE</div>
                <p class="standard-text">{formatDate(organization.endDate)}</p>
            </div>
            <div>
                <div class="small-label-text">STAFF COUNT</div>
                <p class="standard-text">{organization.personCount ?? 0}</p>
            </div>
        </div>
    </div>

    <DeleteObjectDialog
        open={deleteDialogOpen}
        objectType="organization"
        object={organization}
        on:delete={() => {
            onOrganizationChanged();
            deleteDialogOpen = false;
        }}
        on:cancel={() => {
            deleteDialogOpen = false;
        }}
    />
{:else}
    <div class="card card-area max-w-sm h-full">
        <p class="standard-text">Facility not found.</p>
    </div>
{/if}
