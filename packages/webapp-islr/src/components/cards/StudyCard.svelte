<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    const { studyId } = $props<{ studyId: string }>();

    let project = $derived($dataStore.studies.find(s => s.id === studyId));
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil } from '@lucide/svelte';

    let statusColor = $derived(project ? getStatusColor(project.status) : "");

    function onEditClick() {
        if (project) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("project", project.id));
        }
    }
</script>

{#if project}
<div class="card card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="main-label-text mr-2">Project</h3>
        <button type="button" class="icon-button primary inverted" onclick={onEditClick}><IconPencil /></button>
    </div>
    <div class="space-y-4">
        <div>
            <div class="small-label-text">Name</div>
            <p class="standard-text">{project.name}</p>
        </div>
        <div>
            <div class="small-label-text">Title</div>
            <p class="standard-text">{project.title || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Status</div>
            <span class="badge {statusColor} standard-text">{project.status || "None"}</span>
        </div>
    </div>
</div>
{:else}
<div>Project not found.</div>
{/if}
