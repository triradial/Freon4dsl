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
    import 'github-markdown-css/github-markdown.css';

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
            <div class="markdown-body">
                {@html checklistHtml}
            </div>
        {/if}
    {/if}
</div>

<style>
    :global(.markdown-body) {
        --base-size-4: 0.25rem;
        --base-size-8: 0.5rem;
        --base-size-16: 1rem;
        --base-size-24: 1.5rem;
        --base-size-40: 2.5rem;
        --base-text-weight-normal: 400;
        --base-text-weight-medium: 500;
        --base-text-weight-semibold: 600;
        --fontStack-monospace: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    }

    /* Light mode (default) */
    :global(.markdown-body) {
        color-scheme: light;
        --fgColor-accent: #0969da;
        --focus-outlineColor: #0969da;
        --fgColor-default: #1f2328;
        --fgColor-muted: #59636e;
        --fgColor-success: #1a7f37;
        --fgColor-attention: #9a6700;
        --fgColor-danger: #d1242f;
        --fgColor-done: #8250df;
        --bgColor-default: #ffffff;
        --bgColor-muted: #f6f8fa;
        --bgColor-neutral-muted: #818b981f;
        --bgColor-attention-muted: #fff8c5;
        --borderColor-default: #d1d9e0;
        --borderColor-muted: #d1d9e0b3;
        --borderColor-neutral-muted: #d1d9e0b3;
        --borderColor-accent-emphasis: #0969da;
        --borderColor-success-emphasis: #1a7f37;
        --borderColor-attention-emphasis: #9a6700;
        --borderColor-danger-emphasis: #cf222e;
        --borderColor-done-emphasis: #8250df;
        --color-prettylights-syntax-comment: #59636e;
        --color-prettylights-syntax-constant: #0550ae;
        --color-prettylights-syntax-constant-other-reference-link: #0a3069;
        --color-prettylights-syntax-entity: #6639ba;
        --color-prettylights-syntax-storage-modifier-import: #1f2328;
        --color-prettylights-syntax-entity-tag: #0550ae;
        --color-prettylights-syntax-keyword: #cf222e;
        --color-prettylights-syntax-string: #0a3069;
        --color-prettylights-syntax-variable: #953800;
        --color-prettylights-syntax-brackethighlighter-unmatched: #82071e;
        --color-prettylights-syntax-brackethighlighter-angle: #59636e;
        --color-prettylights-syntax-invalid-illegal-text: #f6f8fa;
        --color-prettylights-syntax-invalid-illegal-bg: #82071e;
        --color-prettylights-syntax-carriage-return-text: #f6f8fa;
        --color-prettylights-syntax-carriage-return-bg: #cf222e;
        --color-prettylights-syntax-string-regexp: #116329;
        --color-prettylights-syntax-markup-list: #3b2300;
        --color-prettylights-syntax-markup-heading: #0550ae;
        --color-prettylights-syntax-markup-italic: #1f2328;
        --color-prettylights-syntax-markup-bold: #1f2328;
        --color-prettylights-syntax-markup-deleted-text: #82071e;
        --color-prettylights-syntax-markup-deleted-bg: #ffebe9;
        --color-prettylights-syntax-markup-inserted-text: #116329;
        --color-prettylights-syntax-markup-inserted-bg: #dafbe1;
        --color-prettylights-syntax-markup-changed-text: #953800;
        --color-prettylights-syntax-markup-changed-bg: #ffd8b5;
        --color-prettylights-syntax-markup-ignored-text: #d1d9e0;
        --color-prettylights-syntax-markup-ignored-bg: #0550ae;
        --color-prettylights-syntax-meta-diff-range: #8250df;
        --color-prettylights-syntax-sublimelinter-gutter-mark: #818b98;
    }

    /* Dark mode */
    :global(body.dark .markdown-body) {
        color-scheme: dark;
        --fgColor-accent: #4493f8;
        --focus-outlineColor: #1f6feb;
        --fgColor-default: #f0f6fc;
        --fgColor-muted: #9198a1;
        --fgColor-success: #3fb950;
        --fgColor-attention: #d29922;
        --fgColor-danger: #f85149;
        --fgColor-done: #ab7df8;
        --bgColor-default: #0d1117;
        --bgColor-muted: #151b23;
        --bgColor-neutral-muted: #656c7633;
        --bgColor-attention-muted: #bb800926;
        --borderColor-default: #3d444d;
        --borderColor-muted: #3d444db3;
        --borderColor-neutral-muted: #3d444db3;
        --borderColor-accent-emphasis: #1f6feb;
        --borderColor-success-emphasis: #238636;
        --borderColor-attention-emphasis: #9e6a03;
        --borderColor-danger-emphasis: #da3633;
        --borderColor-done-emphasis: #8957e5;
        --color-prettylights-syntax-comment: #9198a1;
        --color-prettylights-syntax-constant: #79c0ff;
        --color-prettylights-syntax-constant-other-reference-link: #a5d6ff;
        --color-prettylights-syntax-entity: #d2a8ff;
        --color-prettylights-syntax-storage-modifier-import: #f0f6fc;
        --color-prettylights-syntax-entity-tag: #7ee787;
        --color-prettylights-syntax-keyword: #ff7b72;
        --color-prettylights-syntax-string: #a5d6ff;
        --color-prettylights-syntax-variable: #ffa657;
        --color-prettylights-syntax-brackethighlighter-unmatched: #f85149;
        --color-prettylights-syntax-brackethighlighter-angle: #9198a1;
        --color-prettylights-syntax-invalid-illegal-text: #f0f6fc;
        --color-prettylights-syntax-invalid-illegal-bg: #8e1519;
        --color-prettylights-syntax-carriage-return-text: #f0f6fc;
        --color-prettylights-syntax-carriage-return-bg: #b62324;
        --color-prettylights-syntax-string-regexp: #7ee787;
        --color-prettylights-syntax-markup-list: #f2cc60;
        --color-prettylights-syntax-markup-heading: #1f6feb;
        --color-prettylights-syntax-markup-italic: #f0f6fc;
        --color-prettylights-syntax-markup-bold: #f0f6fc;
        --color-prettylights-syntax-markup-deleted-text: #ffdcd7;
        --color-prettylights-syntax-markup-deleted-bg: #67060c;
        --color-prettylights-syntax-markup-inserted-text: #aff5b4;
        --color-prettylights-syntax-markup-inserted-bg: #033a16;
        --color-prettylights-syntax-markup-changed-text: #ffdfb6;
        --color-prettylights-syntax-markup-changed-bg: #5a1e02;
        --color-prettylights-syntax-markup-ignored-text: #f0f6fc;
        --color-prettylights-syntax-markup-ignored-bg: #1158c7;
        --color-prettylights-syntax-meta-diff-range: #d2a8ff;
        --color-prettylights-syntax-sublimelinter-gutter-mark: #3d444d;
    }

    :global(.markdown-body) {
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
        margin: 0;
        color: var(--fgColor-default);
        background-color: var(--bgColor-default);
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
        font-size: 16px;
        line-height: 1.5;
        word-wrap: break-word;
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 16px;
    }

    :global(.markdown-body p) {
        margin-top: 0;
        margin-bottom: 10px;
    }

    :global(.markdown-body h1),
    :global(.markdown-body h2),
    :global(.markdown-body h3),
    :global(.markdown-body h4),
    :global(.markdown-body h5),
    :global(.markdown-body h6) {
        margin-top: var(--base-size-24);
        margin-bottom: var(--base-size-16);
        font-weight: var(--base-text-weight-semibold, 600);
        line-height: 1.25;
    }

    :global(.markdown-body h1) {
        font-weight: var(--base-text-weight-semibold, 600);
        padding-bottom: .3em;
        font-size: 2em;
        border-bottom: 1px solid var(--borderColor-muted);
    }

    :global(.markdown-body h2) {
        font-weight: var(--base-text-weight-semibold, 600);
        padding-bottom: .3em;
        font-size: 1.5em;
        border-bottom: 1px solid var(--borderColor-muted);
    }

    :global(.markdown-body h3) {
        font-weight: var(--base-text-weight-semibold, 600);
        font-size: 1.25em;
    }

    :global(.markdown-body h4) {
        font-weight: var(--base-text-weight-semibold, 600);
        font-size: 1em;
    }

    :global(.markdown-body table) {
        border-spacing: 0;
        border-collapse: collapse;
        display: block;
        width: max-content;
        max-width: 100%;
        overflow: auto;
    }

    :global(.markdown-body table th),
    :global(.markdown-body table td) {
        padding: 6px 13px;
        border: 1px solid var(--borderColor-default);
    }

    :global(.markdown-body table tr) {
        background-color: var(--bgColor-default);
        border-top: 1px solid var(--borderColor-muted);
    }

    :global(.markdown-body table tr:nth-child(2n)) {
        background-color: var(--bgColor-muted);
    }

    :global(.markdown-body table th) {
        font-weight: var(--base-text-weight-semibold, 600);
    }

    :global(.markdown-body blockquote) {
        margin: 0;
        padding: 0 1em;
        color: var(--fgColor-muted);
        border-left: .25em solid var(--borderColor-default);
    }

    :global(.markdown-body code),
    :global(.markdown-body tt) {
        padding: .2em .4em;
        margin: 0;
        font-size: 85%;
        white-space: break-spaces;
        background-color: var(--bgColor-neutral-muted);
        border-radius: 6px;
        font-family: var(--fontStack-monospace);
    }

    :global(.markdown-body pre) {
        padding: var(--base-size-16);
        overflow: auto;
        font-size: 85%;
        line-height: 1.45;
        color: var(--fgColor-default);
        background-color: var(--bgColor-muted);
        border-radius: 6px;
        font-family: var(--fontStack-monospace);
    }

    :global(.markdown-body a) {
        color: var(--fgColor-accent);
        text-decoration: none;
    }

    :global(.markdown-body a:hover) {
        text-decoration: underline;
    }

    :global(.markdown-body ul),
    :global(.markdown-body ol) {
        margin-top: 0;
        margin-bottom: 0;
        padding-left: 2em;
    }

    :global(.markdown-body hr) {
        box-sizing: content-box;
        overflow: hidden;
        background: transparent;
        border-bottom: 1px solid var(--borderColor-muted);
        height: .25em;
        padding: 0;
        margin: var(--base-size-24) 0;
        background-color: var(--borderColor-default);
        border: 0;
    }

    :global(.limited-width-container) {
        width: 100%;
    }
</style>
