<script lang="ts">
    import { dataStore } from "../../services/data/data-store.js";
    const { studyId } = $props<{ studyId: string }>();

    let study = $derived($dataStore.studies.find(s => s.id === studyId));
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil } from '@lucide/svelte';

    let statusColor = $derived(study ? getStatusColor(study.status) : "");

    function onEditClick() {
        if (study) {
            import("../../services/stores/object-drawer-store.js").then(m => m.editObject("study", study.id));
        }
    }
</script>

{#if study}
<div class="card card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="main-label-text mr-2">Study</h3>
        <button type="button" class="icon-button primary inverted" onclick={onEditClick}><IconPencil /></button>
    </div>
    <div class="space-y-2">
        <div>
            <div class="small-label-text">Name</div>
            <p class="standard-text">{study.name}</p>
        </div>
        <div>
            <div class="small-label-text">Title</div>
            <p class="standard-text">{study.title || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Status</div>
            <span class="badge {statusColor} standard-text">{study.status || "None"}</span>
        </div>
        <div>
            <div class="small-label-text">Phase</div>
            <p class="standard-text">{study.phase || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Therapeutic Area</div>
            <p class="standard-text">{study.therapeuticArea || "-"}</p>
        </div>
        <div>
            <div class="small-label-text">Current Protocol</div>
            <p class="standard-text">{study.currentProtocol || "-"}</p>
        </div>
    </div>
</div>
{:else}
<div>Study not found.</div>
{/if}
