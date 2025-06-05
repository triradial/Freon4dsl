<script lang="ts">
    import { addObject } from "../../services/stores/object-drawer-store.js";
    import { Button, Card } from "flowbite-svelte";
    import FontAwesomeIcon from "./FontAwesomeIcon.svelte";
    import { faPlus } from "@fortawesome/free-solid-svg-icons";

    const { parentId = null, objectType, title } = $props<{ parentId?: string | null; objectType: string; title: string }>();
    const onAddObject = () => {
        addObject(objectType as "study" | "patient", parentId ?? undefined);
    };
</script>

<Card class="crc-grid-header w-full">
    <div class="flex items-center justify-left">
        <h3 class="text-base font-bold mr-1">{title}</h3>
        <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={onAddObject}>
            <FontAwesomeIcon icon={faPlus} />
        </Button>
    </div>
</Card>
