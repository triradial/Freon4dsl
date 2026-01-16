<script lang="ts">
    import { getChecklistAsMarkdown, StudyConfiguration } from "@freon4dsl/study-configuration";
    import MarkdownIt from "markdown-it";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import ContentLoader from "../../components/drawers/ContentLoader.svelte";

    const md = new MarkdownIt({ html: true });

    let { studyId } = $props<{ studyId: string }>();

    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let showHeadingNumbers = $state(true);

    export function refresh() {
        loadChecklistAsMarkdown();
    }

    $effect(() => {
        if (studyId) {
            loadChecklistAsMarkdown();
        }
    });

    async function loadChecklistAsMarkdown() {
        isLoading = true;
        error = null;
        try {          
            const modelManager = ModelManager.getInstance();
            const unit = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
            if (!unit) {
                error = "Configuration unit not loaded.";
                isLoading = false;
                return;
            }
            const markdown = getChecklistAsMarkdown(unit, showHeadingNumbers);
 
            // Use markdown-it to parse for headings, which is more reliable than a custom marked renderer
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
            console.log("Markdown: " + markdown);
            
            // Debug: Log the rendered HTML to check if markdown is being converted properly
            console.log("🔍 [Markdown Debug] Rendered HTML:", bodyHtml.substring(0, 500) + "...");
            
            // Wrap the content in the limited-width container
            bodyHtml = `<div class="limited-width-container">${bodyHtml}</div>`;
            
            // Manually add IDs to headings in the rendered HTML using DOM manipulation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = bodyHtml;
            
            // Add proper CSS classes to tables
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

            checklistHtml = bodyHtml;

        } catch (err: unknown) {
            console.error(`Error fetching data for study: ${studyId}`, err);
            error = err instanceof Error ? err.message : "An error occurred";
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="p-2">
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {:else}
        {#if isLoading}
            <ContentLoader />
        {:else}
            <div class="study-checklist-content">
                {@html checklistHtml}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* Consistent UI styling for study checklist content */
    .study-checklist-content {
        color: var(--text-primary-500);
        font-family: var(--font-family-sans);
        line-height: 1.6;
    }
</style>
