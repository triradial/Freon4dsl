<script>
    import { chartHTML, interpreterTrace } from "../stores/InfoPanelStore.js";
    import { onMount } from 'svelte';

    const tree = [
        {
            name: "This is a root node",
            children: [
                {
                    name: "And it has"
                },
                {
                    name: "two children"
                }
            ]
        },
        {
            name: "This is another root node",
            children: [
                {
                    name: "This one is alone"
                },
                {
                    name: "But this one has nested children",
                    children: [
                        {
                            name: "Like this"
                        },
                        {
                            name: "and this"
                        }
                    ]
                }
            ]
        }
    ];

    let chart = 'initial chart value';
    let container;

    const unsubscribe = chartHTML.subscribe((value) => {
        chart = value;
        executeScripts();
    });

    function loadVisLibrary() {
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js';
        script.onload = () => {
            executeScripts();
        };
        document.body.appendChild(script);
    }

    function executeScripts() {
        if (container) {
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                oldScript.replaceWith(newScript);
            });
        }
    }

    onMount(() => {
        loadVisLibrary();
    });
</script>

<div bind:this={container}>
    {@html chart}
</div>