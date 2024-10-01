<script lang="ts">
    import { Button } from "flowbite-svelte";
    import { Card } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faPlus } from "@fortawesome/free-solid-svg-icons";

    export let title: string;

    const addItem = () => {
        console.log("add item");
    }
</script>

<Card class="crc-grid-header w-full">
    <div class="flex items-center justify-left">
        <h3 class="text-base font-bold mr-2">{title}</h3>
        <Button pill={true} outline={true} class="grid-header-button" size="sm" on:click={addItem}>
                <FontAwesomeIcon icon={faPlus} />
        </Button>
    </div>
</Card>