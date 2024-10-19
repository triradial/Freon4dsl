<script lang="ts">
    import { Card, Badge, Button } from "flowbite-svelte";
    import { type Study } from "../../services/dataStore";
    import { editObject } from "../../services/objectDrawerStore";
    import type { ColorVariant } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faPencil } from "@fortawesome/free-solid-svg-icons";
    import { getStatusColor } from '../../services/utils';

    export let study: Study;

    let statusColor = getStatusColor(study.status) as ColorVariant;

    function onEditClick() {
        editObject("study", study.id);
    }
</script>

<Card class="crc-card-area max-w-sm h-full">
    <div class="flex items-center justify-left mb-4">
        <h3 class="text-base font-bold">Study</h3>
        <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={onEditClick}>
            <FontAwesomeIcon icon={faPencil} />
        </Button>
    </div>
    <div class="space-y-2">
        <div>
            <h4 class="card-label-text">Name</h4>
            <p class="text-sm">{study.name}</p>
        </div>
        <div>
            <h4 class="card-label-text">Title</h4>
            <p class="text-xs">{study.title}</p>
        </div>
        <div>
            <h4 class="card-label-text">Status</h4>
            <Badge color={statusColor} class="text-xs">{study.status}</Badge>
        </div>
        <div>
            <h4 class="card-label-text">Phase</h4>
            <p class="text-sm">{study.phase}</p>
        </div>
        <div>
            <h4 class="card-label-text">Therapeutic Area</h4>
            <p class="text-sm">{study.therapeuticArea}</p>
        </div>
        <div>
            <h4 class="card-label-text text-gray-700">Current Protocol</h4>
            <p class="text-sm">{study.currentProtocol}</p>
        </div>
    </div>
</Card>

<style>
    :global(.card) {
        border-radius: 0;
        box-shadow: none;
        border: 1px solid #e5e7eb;
    }
</style>
