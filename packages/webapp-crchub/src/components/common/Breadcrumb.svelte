<script lang="ts">
    import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
    import CustomBreadcrumbItem from './CustomBreadcrumbItem.svelte';
    import { LABEL } from '../../constants/labelConstants';
    import { navigateTo } from '../../services/routeAction';
    
    export let items: Array<{ label: string; href?: string }> = [];
    
    function handleClick(event: CustomEvent<{event: MouseEvent, href: string}>) {
        const { href } = event.detail;
        const routeName = href.replace('/', '');
        navigateTo(routeName);
    }
</script>

<Breadcrumb navClass="crc-breadcrumb" aria-label="Default breadcrumb example">
    <CustomBreadcrumbItem href="/" home on:click={(event) => handleClick(event)}>{LABEL.HOME}</CustomBreadcrumbItem>
    {#each items as { label, href } (href)}
        {#if href}
            <CustomBreadcrumbItem href='{href}' on:click={(event) => handleClick(event)}>{label}</CustomBreadcrumbItem>
        {:else}
            <BreadcrumbItem>{label}</BreadcrumbItem>
        {/if}
    {/each}
</Breadcrumb>