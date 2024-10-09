<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    let helpHtml: string = "";
    let container: HTMLDivElement;
    let shadowRoot: ShadowRoot;

    const dispatch = createEventDispatcher();

    onMount(async () => {
        try {
            const response = await fetch('/assets/help/help.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            helpHtml = await response.text();
        } catch (error) {
            console.error("Failed to load help content:", error);
            helpHtml = "<p>Failed to load help content. Please try again later.</p>";
        }
        shadowRoot = container.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = helpHtml;
        shadowRoot.addEventListener('click', (event: Event) => {
            if (event instanceof MouseEvent) {
                handleAnchorClick(event);
            }
        });
    });

    function closeDrawer() {
        dispatch('close');
    }

    export function refresh() {
        dispatch("refresh");
        console.log("refresh help");
    }

    function handleAnchorClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const anchorElement = target.closest('a');
        if (anchorElement instanceof HTMLAnchorElement) {
            const href = anchorElement.getAttribute('href');
            if (href?.startsWith('#')) {
                event.preventDefault();
                const id = href.slice(1);
                const element = shadowRoot.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }
</script>

<div class="drawer-content-area help-drawer">
    <div bind:this={container}></div>
</div>
