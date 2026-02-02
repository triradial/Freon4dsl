<script lang="ts">
    import MarkdownIt from "markdown-it";
    import ContentLoader from "../../components/drawers/ContentLoader.svelte";
    import { simulationService } from "../../services/simulation/simulation-service.js";

    const md = new MarkdownIt({ html: true });

    let { studyId } = $props<{ studyId: string }>();

    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let tableHtml = $state<string>("");
    let error = $state<string | null>(null);
    let showHeadingNumbers = $state(true);
    let hasRenderedBefore = $state(false);
    let lastSuccessfulContent = $state<string>("");
    let lastSuccessfulTableHtml = $state<string>("");

    export function refresh(forceRefresh: boolean = false) {
        loadChecklist(forceRefresh);
    }

    $effect(() => {
        if (studyId) {
            loadChecklist(false);
        }
    });

    async function loadChecklist(forceRefresh: boolean = false) {
        const startTime = performance.now();
        console.log(`[StudyChecklist] Loading checklist for ${studyId}, forceRefresh=${forceRefresh}`);
        
        isLoading = true;
        error = null;
        
        try {
            const simulationData = await simulationService.getSimulationData(studyId, forceRefresh);
            
            if (simulationData) {
                // Get the table HTML from simulation service (shared with TimelineTable)
                tableHtml = simulationData.tableHtml;
                lastSuccessfulTableHtml = tableHtml;
                
                // Process markdown to HTML
                const markdown = simulationData.checklistMarkdown;
                
                // Use markdown-it to parse for headings
                const tokens = md.parse(markdown, {});
                const toc: { level: number; text: string; id: string }[] = [];
                
                // Use markdown-it's default ID generation algorithm for consistency
                const generateId = (text: string) => {
                    return text.toLowerCase()
                        .replace(/[^\w\- ]/g, '') // Remove special characters except hyphens and spaces
                        .replace(/\s+/g, '-')     // Replace spaces with hyphens
                        .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
                        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
                };

                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token.type === 'heading_open') {
                        const text = tokens[i + 1].content;
                        const level = parseInt(token.tag.slice(1));
                        const id = generateId(text);
                        toc.push({ level, text, id });
                        i++; // skip inline content token
                    }
                }
                
                // Use markdown-it for rendering
                let bodyHtml = md.render(markdown);
                
                // Wrap the content in the limited-width container
                bodyHtml = `<div class="limited-width-container">${bodyHtml}</div>`;
                
                // Manually add IDs to headings in the rendered HTML using DOM manipulation
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bodyHtml;
                
                // Replace the first table (Timeline Table) with the HTML table from simulation service
                // This ensures both components use the same table rendering code
                const firstTable = tempDiv.querySelector('table');
                if (firstTable && tableHtml) {
                    // Replace the markdown-rendered table with the HTML table from simulation service
                    const tableContainer = document.createElement('div');
                    tableContainer.innerHTML = tableHtml;
                    firstTable.replaceWith(...Array.from(tableContainer.childNodes));
                }
                
                // Add proper CSS classes to remaining tables
                const tables = tempDiv.querySelectorAll('table');
                tables.forEach(table => {
                    table.classList.add('table_component');
                });

                // Open external links in a new tab
                const links = tempDiv.querySelectorAll('a[href]');
                links.forEach(link => {
                    const href = link.getAttribute('href')?.trim() ?? "";
                    if (href.startsWith("http://") || href.startsWith("https://")) {
                        link.setAttribute("target", "_blank");
                        link.setAttribute("rel", "noopener noreferrer");
                    }
                });
                
                toc.forEach(item => {
                    const headings = tempDiv.querySelectorAll(`h${item.level}`);
                    headings.forEach(heading => {
                        if (heading.textContent?.trim() === item.text) {
                            heading.id = item.id;
                        }
                    });
                });
                
                bodyHtml = tempDiv.innerHTML;

                // Store successful content
                checklistHtml = bodyHtml;
                lastSuccessfulContent = bodyHtml;
                hasRenderedBefore = true;
                error = null;
                
                const elapsed = performance.now() - startTime;
                console.log(`[StudyChecklist] Checklist loaded in ${elapsed.toFixed(2)}ms`);
            } else {
                throw new Error("Failed to generate simulation data");
            }

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorStack = err instanceof Error ? err.stack : undefined;
            console.error(`[StudyChecklist] Error loading checklist:`, {
                error: err,
                message: errorMessage,
                stack: errorStack,
                studyId,
                hasRenderedBefore
            });
            
            if (hasRenderedBefore) {
                error = "Current design has issues that prevent this checklist from updating";
                checklistHtml = lastSuccessfulContent;
                tableHtml = lastSuccessfulTableHtml;
            } else {
                error = "Current design has issues that prevent this checklist from showing";
                checklistHtml = "";
                tableHtml = "";
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="checklist-container">
    {#if error}
        <div class="checklist-error-toast checklist-error">{error}</div>
    {/if}
    <div class="checklist-content">
        {#if isLoading}
            <ContentLoader />
        {:else if checklistHtml}
            <div class="study-checklist-content">
                {@html checklistHtml}
            </div>
        {/if}
    </div>
</div>

<style>
    /* Heading hierarchy: h1 > h2 > h3 > h4 > h5 > h6 so nested sections are visually smaller (content is injected via {@html}) */
    .study-checklist-content :global(h1) {
        font-size: 1.75rem;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 1rem;
        padding-bottom: 0.3em;
        border-bottom: 1px solid var(--borderColor-muted, currentColor);
    }
    .study-checklist-content :global(h2) {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        padding-bottom: 0.3em;
        border-bottom: 1px solid var(--borderColor-muted, currentColor);
    }
    .study-checklist-content :global(h3) {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
    }
    .study-checklist-content :global(h4) {
        font-size: 1.1rem;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }
    .study-checklist-content :global(h5) {
        font-size: 1rem;
        font-weight: 600;
        margin-top: 0.75rem;
        margin-bottom: 0.5rem;
    }
    .study-checklist-content :global(h6) {
        font-size: 0.95rem;
        font-weight: 600;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        color: var(--fgColor-muted, inherit);
    }
    .study-checklist-content :global(p) {
        margin-top: 0;
        margin-bottom: 0.75rem;
    }
    .study-checklist-content :global(ul),
    .study-checklist-content :global(ol) {
        margin-top: 0;
        margin-bottom: 0.75rem;
        padding-left: 1.5rem;
    }
    .study-checklist-content :global(li),
    .study-checklist-content :global(li p) {
        font-size: var(--standard-font-size);
        color: var(--checklist-text);
    }
</style>
