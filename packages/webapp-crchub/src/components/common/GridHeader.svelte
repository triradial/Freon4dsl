<script lang="ts">
    import { addObject } from "../../services/objectDrawerStore";  
    import { Button } from "flowbite-svelte";
    import { Card } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faPlus } from "@fortawesome/free-solid-svg-icons";

    export let objectType: string;
    export let title: string;
    const onAddObject = () => {
        addObject(objectType as "study" | "patient");
    }
</script>

<Card class="crc-grid-header w-full">
    <div class="flex items-center justify-left">
        <h3 class="text-base font-bold mr-1">{title}</h3>
        <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={onAddObject}>
                <FontAwesomeIcon icon={faPlus} />
        </Button>
    </div>
</Card>