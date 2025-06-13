<script lang="ts">
    import { type Study } from "../../services/data/data-store.js";
    import { editObject } from "../../services/stores/object-drawer-store.js";
    import { getStatusColor } from "../../services/utils.js";
    // @ts-ignore
    import { Pencil as IconPencil } from '@lucide/svelte';

    const { study } = $props<{ study: Study }>();

    let statusColor = getStatusColor(study.status);

    function onEditClick() {
        editObject("study", study.id);
    }
</script>

<div class="card crc-card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="main-label-text mr-2">Study</h3>
        <button type="button" class="icon-button primary inverted" onclick={onEditClick}><IconPencil /></button>
    </div>
    <div class="space-y-4">
        <div>
            <div class="small-label-text">Name</div>
            <p class="standard-text">{study.name}</p>
        </div>
        <div>
            <div class="small-label-text">Title</div>
            <p class="standard-text">{study.title}</p>
        </div>
        <div>
            <div class="small-label-text">Status</div>
            <span class="badge {statusColor} text-xs">{study.status}</span>
        </div>
        <div>
            <div class="small-label-text">Phase</div>
            <p class="standard-text">{study.phase}</p>
        </div>
        <div>
            <div class="small-label-text">Therapeutic Area</div>
            <p class="standard-text">{study.therapeuticArea}</p>
        </div>
        <div>
            <div class="small-label-text">Current Protocol</div>
            <p class="standard-text">{study.currentProtocol}</p>
        </div>
    </div>
</div>
