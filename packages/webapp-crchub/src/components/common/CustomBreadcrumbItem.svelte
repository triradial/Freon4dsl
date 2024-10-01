<script lang="ts">
    import { BreadcrumbItem } from 'flowbite-svelte';
    import { createEventDispatcher } from 'svelte';

    export let href: string = '#';
    export let home: boolean = false;

    const dispatch = createEventDispatcher();

    function handleClick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        dispatch('click', { event, href });
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span on:click={handleClick} class="h-full inline-flex items-center">
    <BreadcrumbItem {href} {home}>
        <slot></slot>
    </BreadcrumbItem>
</span>