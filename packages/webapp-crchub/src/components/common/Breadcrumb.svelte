<script lang="ts">
    import { LABEL } from "../../constants/label-constants.js";
    import { goto } from '$app/navigation';
    import { breadcrumbStore } from "../../services/stores/breadcrumb-store.js";
    // @ts-ignore
    import { Home as IconHome, ChevronRight as IconChevronRight } from '@lucide/svelte';

    let items = $derived($breadcrumbStore);

    function handleClick(event: MouseEvent, href: string) {
        event.preventDefault();
        goto(href, { invalidateAll: true });
    }

    // $effect(() => {
    //     console.log("Breadcrumb items updated:", items);
    // });
</script>

<ol class="breadcrumb" aria-label="breadcrumb">
    <li><a class="opacity-90 hover:underline" href="/"><IconHome size={16} />{LABEL.HOME}</a></li>
    {#each items as { label, href }, i (href ?? label ?? i)}
        <li class="opacity-50" aria-hidden="true"><IconChevronRight size={16} /></li>
        {#if href}
            <li><a class="opacity-60 hover:underline" href={href} onclick={(event) => handleClick(event, href)}>{label}</a></li>
        {:else}
            <li>{label}</li>
        {/if}
    {/each}
</ol>
