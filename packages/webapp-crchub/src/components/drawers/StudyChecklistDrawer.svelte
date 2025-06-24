<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { ListPlaceholder } from "flowbite-svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
    import { getChecklistAsMarkdown } from "../../services/app/study-timeline.js";

    // PDFMake and Markdown-it imports
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";
    import type { TDocumentDefinitions } from "pdfmake/interfaces.js";
    import MarkdownIt from "markdown-it";
    import { dataStore } from "services/data/data-store.js";

    pdfMake.vfs = pdfFonts as any;
    const md = new MarkdownIt();

    export let studyId: string;
    let studyName: string = "";
    let isLoading = true;
    let checklistHtml: string = "";
    let error: string | null = null;
    let showHeadingNumbers: boolean = true;

    const dispatch = createEventDispatcher();

    onMount(async () => {
        const study = await dataStore.getStudy(studyId);
        studyName = study!.name;
    });

    function closeDrawer() {
        dispatch("close");
    }

    function openPdf() {

        const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;

        if (!model) {
            error = "Model not loaded, cannot generate PDF.";
            return;
        }
        const markdown = getChecklistAsMarkdown(model.configuration, showHeadingNumbers);
        const tokens = md.parse(markdown, {});

        const content: any[] = [];
        const tocItems: { text: string; level: number; id: string }[] = [];
        let headingCounter = 0;

        // First pass: build content and collect headings for TOC
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === "heading_open") {
                const text = tokens[i + 1].content;
                const level = parseInt(token.tag.slice(1));
                const id = `heading-${headingCounter++}`;
                tocItems.push({ text, level, id });
                
                // Add page break before heading level 1 (h1)
                const style = `h${level}`;
                const contentItem: any = { text, style, id };
                if (level === 1) {
                    contentItem.pageBreak = 'before';
                }
                content.push(contentItem);
                i++; // Skip content token
            } else if (token.type === "paragraph_open") {
                const inline = tokens[i + 1];
                if (inline.type === "inline" && inline.children?.length) {
                    content.push({ text: inline.content, margin: [0, 5, 0, 15] });
                }
                i++; // Skip content token
            } else if (token.type === "bullet_list_open") {
                const items = [];
                let j = i + 1;
                while (tokens[j] && tokens[j].type !== "bullet_list_close") {
                    if (tokens[j].type === "list_item_open") {
                        const contentToken = tokens[j + 1];
                        if (contentToken && contentToken.type === "inline") {
                            items.push(contentToken.content);
                        }
                    }
                    j++;
                }
                content.push({ ul: items, margin: [0, 5, 0, 15] });
                i = j; // Move index past the list
            } else if (token.type === "table_open") {
                // Handle markdown tables
                const tableBody = [];
                let j = i + 1;
                
                // Skip table header row
                while (tokens[j] && tokens[j].type !== "thead_close") {
                    j++;
                }
                j++; // Move past thead_close
                
                // Process table body
                while (tokens[j] && tokens[j].type !== "table_close") {
                    if (tokens[j].type === "tr_open") {
                        const row = [];
                        let k = j + 1;
                        while (tokens[k] && tokens[k].type !== "tr_close") {
                            if (tokens[k].type === "td_open" || tokens[k].type === "th_open") {
                                const cellContent = tokens[k + 1].content;
                                row.push(cellContent);
                            }
                            k++;
                        }
                        if (row.length > 0) {
                            tableBody.push(row);
                        }
                        j = k; // Move past tr_close
                    }
                    j++;
                }
                
                if (tableBody.length > 0) {
                    content.push({
                        table: {
                            headerRows: 1,
                            body: tableBody
                        },
                        margin: [0, 10, 0, 15]
                    });
                }
                i = j; // Move index past the table
            } else if (token.type === "hr") {
                content.push({ canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#cccccc" }], margin: [0, 10] });
            }
        }

        // Build the TOC part of the document definition
        const tocContent = tocItems.map(item => ({
            text: item.text,
            linkToDestination: item.id,
            margin: [(item.level - 1) * 15, 5, 0, 5], // Indent based on heading level
            style: "tocLink"
        }));

        const finalContent = [
            { text: "Table of Contents", style: "h2" },
            ...tocContent,
            ...content
        ];

        const docDefinition: TDocumentDefinitions = {
            content: finalContent,
            info: {
                title: `${studyName} - ${new Date().toLocaleDateString()}`,
                author: "CRCHub",
                subject: "Study Checklist"
            },
            header: function(currentPage: number, pageCount: number) {
                const model = ModelManager.getInstance().modelStore.model as StudyConfigurationModel;
                // const studyName = model.name || "Study Checklist";
                return {
                    text: `${studyName} - ${new Date().toLocaleDateString()}`,
                    alignment: 'center',
                    style: 'header',
                    margin: [0, 10, 0, 0]
                };
            },
            footer: function(currentPage: number, pageCount: number) {
                return {
                    text: `Page ${currentPage.toString()} of ${pageCount}`,
                    alignment: "center",
                    style: "footer"
                };
            },
            styles: {
                h1: { fontSize: 24, bold: true, margin: [0, 0, 0, 20], pageBreak: "before" } as any,
                h2: { fontSize: 20, bold: true, margin: [0, 15, 0, 10] },
                h3: { fontSize: 16, bold: true, margin: [0, 15, 0, 5] },
                footer: { fontSize: 10, color: "#444" },
                header: { fontSize: 10, color: "#666", bold: true },
                tocLink: { color: "blue" }
            },
            defaultStyle: {
                fontSize: 12,
                lineHeight: 1.15
            }
        };
        
        // pdfMake.createPdf(docDefinition).download(`Study-Checklist.pdf`);
        // pdfMake.createPdf(docDefinition).open(); // Opens in new tab
        // pdfMake.createPdf(docDefinition).print(); // Opens print dialog
        // pdfMake.createPdf(docDefinition).getBlob((blob) => { /* handle blob */ });
        
        const fileName = `study-checklist-${studyName}.pdf`;
        // pdfMake.createPdf(docDefinition).open();
        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            const url = URL.createObjectURL(blob);
            
            // Open in new tab
            window.open(url);
            
            // Also download
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(url);
        });
    }

    export function refresh() {
        dispatch("refresh");
        loadChecklistAsMarkdown();
    }

    export function print() {
        openPdf();
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
    <!-- <div class="flex items-center mb-4">
        <input id="heading-checkbox" type="checkbox" bind:checked={showHeadingNumbers} on:change={loadChecklistAsMarkdown} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
        <label for="heading-checkbox" class="ml-2 text-sm font-medium text-gray-900">Show Heading Numbers</label>
    </div> -->

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
