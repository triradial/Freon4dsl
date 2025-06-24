<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ListPlaceholder } from "flowbite-svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
    import { getChecklistAsMarkdown } from "../../services/app/study-timeline.js";

    // PDFMake and Markdown-it imports
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";
    import MarkdownIt from "markdown-it";

    pdfMake.vfs = pdfFonts as any;
    const md = new MarkdownIt();

    export let studyId: string;
    let isLoading = true;
    let checklistHtml: string = "";
    let error: string | null = null;
    let showHeadingNumbers: boolean = true;

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadChecklistAsMarkdown();
    }

    $: {
        if (studyId) {
            loadChecklistAsMarkdown();
        }
    }

    async function loadChecklistAsMarkdown() {
        isLoading = true;
        error = null;
        try {
            const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
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
            
            // Manually add IDs to headings in the rendered HTML using DOM manipulation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = bodyHtml;
            
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
    {#if isLoading}
        <ListPlaceholder divClass="mb-4" />
    {:else if error}
        <div class="text-red-500 p-4">{error}</div>
    {:else}
        <div class="markdown-body">
            {@html checklistHtml}
        </div>
    {/if}
</div>

<style>
    div.drawer-content-area div.markdown-body .markdown-body {
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
