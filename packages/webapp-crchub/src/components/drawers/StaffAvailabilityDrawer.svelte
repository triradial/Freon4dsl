<script lang="ts">
    import { getChecklistAsMarkdown, type StudyConfigurationModel } from "@freon4dsl/study-configuration";
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
// PDFMake and Markdown-it imports
    import MarkdownIt from "markdown-it";
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";

    pdfMake.vfs = pdfFonts as any;
    const md = new MarkdownIt();

    let { studyId } = $props<{ studyId: string }>();
    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let showHeadingNumbers = $state(true);

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
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
            const model = ModelManager.getInstance().getModelUnit("StudyConfigurationModel") as StudyConfigurationModel;
            if (!model) {
                error = "Model not loaded.";
                isLoading = false;
                return;
            }
            const markdown = getChecklistAsMarkdown(model.configuration, showHeadingNumbers);

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

            // Generate TOC HTML from the captured headings
            let tocHtml = '<h2>Table of Contents</h2><ul class="toc-list">';
            toc.forEach(item => {
                tocHtml += `<li style="margin-left: ${(item.level - 1) * 20}px;"><a href="#${item.id}" style="color: #cfcfcf;">${item.text}</a></li>`;
            });
            tocHtml += "</ul><hr/>";

            // Replace the <!--TOC--> marker with the generated TOC, or prepend if no marker found
            if (bodyHtml.includes('<!--TOC-->')) {
                checklistHtml = bodyHtml.replace('<!--TOC-->', tocHtml);
            } else {
                checklistHtml = tocHtml + bodyHtml;
            }

        } catch (err: unknown) {
            console.error(`Error fetching data for study: ${studyId}`, err);
            error = err instanceof Error ? err.message : "An error occurred";
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="drawer-content-area p-2">
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {:else if isLoading}
        <div class="placeholder animate-pulse mb-4"></div>    
    {:else}
        <div class="markdown-body">
            {@html checklistHtml}
        </div>
    {/if}
</div>

<style>
    div.drawer-content-area .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
        min-height: 100% !important;
    }

    @media (max-width: 767px) {
        .markdown-body {
            padding: 15px;
        }
    }
</style>