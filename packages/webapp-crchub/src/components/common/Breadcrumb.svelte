<script lang="ts">
    import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
    import { LABEL } from '../../constants/labelConstants';
    import { navigateTo } from '../../services/routeAction';
    
    export let items: Array<{ label: string; href?: string }> = [];
    
    function handleClick(event: Event, href: string) {
        event.preventDefault();
        const routeName = href.replace('/', '');
        navigateTo(routeName);
    }
    </script>

<Breadcrumb navClass="crc-breadcrumb" aria-label="Default breadcrumb example">
    <BreadcrumbItem href="/" home on:click={(event) => handleClick(event, 'home')}>{LABEL.HOME}</BreadcrumbItem>
    {#each items as { label, href } (href)}
        {#if href}
            <BreadcrumbItem href='{href}' on:click={(event) => handleClick(event, href.replace('/', ''))}>{label}</BreadcrumbItem>
        {:else}
            <BreadcrumbItem>{label}</BreadcrumbItem>
        {/if}
    {/each}
</Breadcrumb>