<script lang="ts">
    import { type StudyConfigurationModel } from "@freon4dsl/study-configuration";
    import MarkdownIt from "markdown-it";
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";
    import { createEventDispatcher, onMount } from "svelte";
    import { getChecklistAsMarkdown } from "../../services/app/study-timeline.js";
    import { dataStore } from "../../services/data/data-store.js";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import ContentLoader from "./ContentLoader.svelte";
    // Removed GitHub markdown CSS to use consistent UI styling

    pdfMake.vfs = pdfFonts as any;
    const md = new MarkdownIt({ html: true });

    let { studyId } = $props<{ studyId: string }>();

    let studyName = $state<string>("");
    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let showHeadingNumbers = $state(true);

    const dispatch = createEventDispatcher();

    onMount(async () => {
        const study = await dataStore.getStudy(studyId);
        studyName = study!.name;
    });

    function closeDrawer() {
        dispatch("close");
    }

    async function openPdf() {
        try {
            const modelManager = ModelManager.getInstance();
            await modelManager.openModel(studyId);
            const model = modelManager.currentModel as StudyConfigurationModel;
            
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

        const docDefinition: any = {
            content: finalContent,
            info: {
                title: `${studyName} - ${new Date().toLocaleDateString()}`,
                author: "CRCHub",
                subject: "Study Checklist"
            },
            header: function(currentPage: number, pageCount: number) {
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
        } catch (err: unknown) {
            console.error('Error generating PDF:', err);
            error = err instanceof Error ? err.message : "An error occurred while generating PDF";
        }
    }

    export function refresh() {
        dispatch("refresh");
        loadChecklistAsMarkdown();
    }

    export function print() {
        openPdf();
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
            await modelManager.openModel(studyId);
            const model = modelManager.currentModel as StudyConfigurationModel;
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

            // Generate TOC HTML from the captured headings
            let tocHtml = '<h2>Table of Contents</h2><ul class="toc-list">';
            toc.forEach(item => {
                tocHtml += `<li style="margin-left: ${(item.level - 1) * 20}px;"><a href="#${item.id}">${item.text}</a></li>`;
            });
            tocHtml += "</ul>";

            // Replace the <!--TOC--> marker with the generated TOC, or prepend if no marker found
      //      if (bodyHtml.includes('<!--TOC-->')) {
         //       checklistHtml = bodyHtml.replace('<!--TOC-->', tocHtml);
       //     } else {
       //         checklistHtml = tocHtml + bodyHtml;
     //       }

            checklistHtml = bodyHtml;

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
    
    /* .study-checklist-content h1,
    .study-checklist-content h2,
    .study-checklist-content h3,
    .study-checklist-content h4,
    .study-checklist-content h5,
    .study-checklist-content h6 {
        color: var(--text-primary-500);
        font-weight: 600;
        margin-top: 3rem;
        margin-bottom: 1rem;
    }
    
    .study-checklist-content h1 {
        font-size: 1.5rem;
        border-bottom: 1px solid var(--white-20t);
        padding-bottom: 0.5rem;
    }
    
    .study-checklist-content h2 {
        font-size: 1.25rem;
    }
    
    .study-checklist-content h3 {
        font-size: 1.1rem;
    }
    
    .study-checklist-content p {
        margin-bottom: 1rem;
        color: var(--text-primary-500);
    }
    
    .study-checklist-content ul,
    .study-checklist-content ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
        color: var(--text-primary-500);
    }
    
    .study-checklist-content li {
        margin-bottom: 2rem;
    }
    
    .study-checklist-content a {
        color: var(--primary-color);
        text-decoration: none;
    }
    
    .study-checklist-content a:hover {
        color: var(--text-hover);
        text-decoration: underline;
    }
    
    .study-checklist-content blockquote {
        border-left: 4px solid var(--primary-color);
        padding-left: 1rem;
        margin: 1rem 0;
        color: var(--text-primary-400);
        font-style: italic;
    }
    
    .study-checklist-content code {
        background-color: var(--white-10t);
        color: var(--text-primary-600);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: var(--font-family-mono);
        font-size: 0.875rem;
    }
    
    .study-checklist-content pre {
        background-color: var(--white-10t);
        color: var(--text-primary-600);
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1rem 0;
    }
    
    .study-checklist-content pre code {
        background: none;
        padding: 0;
    }
    
    .study-checklist-content table {
        border: 1px solid var(--white-30t);
        border-collapse: collapse;
        width: 100%;
        margin: 2rem 0 4rem 0;
    }
    
    .study-checklist-content .table_component table {
        border: 1px solid var(--white-30t);
        border-collapse: collapse;
        width: 100%;
        margin: 2rem 0 4rem 0;
    }
    
    .study-checklist-content .table_component caption {
        color: var(--white-70t);
        font-weight: 600;
        margin-bottom: 0.5rem;
        text-align: left;
    }
    
    .study-checklist-content .table_component th {
        border: 1px solid var(--white-40t);
        background-color: var(--black-10t);
        color: var(--white);
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
    }
    
    .study-checklist-content .table_component td {
        border: 1px solid var(--white-20t);
        color: var(--white-90t);
        padding: 0.75rem;
    }
    
    .study-checklist-content .table_component tbody tr:nth-child(even) td {
        background-color: var(--white-10t);
    }
    
    .study-checklist-content .table_component tbody tr:nth-child(odd) td {
        background-color: var(--white-5t);
    }
    
    .study-checklist-content .table_component td.text-center {
        text-align: center;
    }
    
    .study-checklist-content .table_component th.stretch {
        width: auto;
    }
    
    .study-checklist-content .table_component th.fit {
        width: 1%;
        white-space: nowrap;
    } */
</style>
