<script lang="ts">
    import { BreadcrumbItem } from "flowbite-svelte";
    import { createEventDispatcher } from 'svelte';

    const { href = '#', home = false } = $props<{
        href?: string;
        home?: boolean;
    }>();

    const dispatch = createEventDispatcher();

    function handleClick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        dispatch('click', { event, href });
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span onclick={handleClick} class="h-full inline-flex items-center" role="button" tabindex="0">
    <BreadcrumbItem {href} {home}>
        <slot></slot>
    </BreadcrumbItem>
</span>