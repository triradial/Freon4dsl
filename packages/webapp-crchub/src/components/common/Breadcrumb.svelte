<script lang="ts">
    import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';

    export let items: Array<{ label: string; href?: string }> = [];

</script>

<Breadcrumb navClass="crc-breadcrumb" aria-label="Default breadcrumb example">
    <BreadcrumbItem href="/" home>Home</BreadcrumbItem>
    {#each items as { label, href } (href)}
        {#if href}
            <BreadcrumbItem {href}>{label}</BreadcrumbItem>
        {:else}
            <BreadcrumbItem>{label}</BreadcrumbItem>
        {/if}
    {/each}
</Breadcrumb>