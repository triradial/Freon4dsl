<script lang="ts">
    import MarkdownIt from "markdown-it";
    import ContentLoader from "../../components/drawers/ContentLoader.svelte";
    import { simulationService } from "../../services/simulation/simulation-service.js";
    import StudyTimelineTableContent from "./StudyTimelineTableContent.svelte";

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
