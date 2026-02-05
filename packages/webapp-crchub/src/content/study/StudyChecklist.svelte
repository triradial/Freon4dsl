<script lang="ts">
    import MarkdownIt from "markdown-it";
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";
    import { FileText as IconPdf } from '@lucide/svelte';
    import ContentLoader from "../../components/drawers/ContentLoader.svelte";
    import { simulationService } from "../../services/simulation/simulation-service.js";
    import { dataStore } from "../../services/data/data-store.js";

    pdfMake.vfs = pdfFonts as any;
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
    let lastChecklistMarkdown = $state<string>("");
    let isGeneratingPdf = $state(false);

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
                lastChecklistMarkdown = markdown;

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

    async function openPdf() {
        if (!lastChecklistMarkdown) {
            error = "No checklist content available to generate PDF.";
            return;
        }

        isGeneratingPdf = true;
        try {
            const study = await dataStore.getStudy(studyId);
            const studyName = study?.name ?? "Study";
            const markdown = lastChecklistMarkdown;
            const tokens = md.parse(markdown, {});

            const content: any[] = [];
            const tocItems: { text: string; level: number; id: string }[] = [];
            let headingCounter = 0;

            let skipUntilNextHeading = false;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token.type === "heading_open") {
                    const text = tokens[i + 1].content;
                    const level = parseInt(token.tag.slice(1));

                    // Skip the markdown-generated "Table of Contents" heading — the PDF builds its own TOC
                    if (text === "Table of Contents") {
                        skipUntilNextHeading = true;
                        i++;
                        continue;
                    }
                    skipUntilNextHeading = false;

                    const id = `heading-${headingCounter++}`;
                    tocItems.push({ text, level, id });

                    const style = `h${level}`;
                    const contentItem: any = { text, style, id };
                    if (level === 1) {
                        contentItem.pageBreak = 'before';
                    }
                    content.push(contentItem);
                    i++;
                } else if (skipUntilNextHeading) {
                    // Skip all tokens that belong to the markdown TOC section
                    continue;
                } else if (token.type === "paragraph_open") {
                    const inline = tokens[i + 1];
                    if (inline.type === "inline" && inline.children?.length) {
                        content.push({ text: inline.content, margin: [0, 5, 0, 15] });
                    }
                    i++;
                } else if (token.type === "bullet_list_open" || token.type === "ordered_list_open") {
                    const closeType = token.type === "bullet_list_open" ? "bullet_list_close" : "ordered_list_close";
                    const items: string[] = [];
                    let j = i + 1;
                    while (tokens[j] && tokens[j].type !== closeType) {
                        if (tokens[j].type === "list_item_open") {
                            // Look for the inline content inside the list item (may be nested in a paragraph)
                            let k = j + 1;
                            while (tokens[k] && tokens[k].type !== "list_item_close") {
                                if (tokens[k].type === "inline" && tokens[k].children?.length) {
                                    // Extract plain text from inline children, stripping link markup
                                    const plainText = tokens[k].children
                                        .filter((c: any) => c.type === "text")
                                        .map((c: any) => c.content)
                                        .join("");
                                    if (plainText) items.push(plainText);
                                    break;
                                }
                                k++;
                            }
                        }
                        j++;
                    }
                    if (items.length > 0) {
                        content.push(token.type === "bullet_list_open"
                            ? { ul: items, margin: [0, 5, 0, 15] }
                            : { ol: items, margin: [0, 5, 0, 15] }
                        );
                    }
                    i = j;
                } else if (token.type === "table_open") {
                    const tableBody: string[][] = [];
                    let j = i + 1;

                    while (tokens[j] && tokens[j].type !== "thead_close") {
                        j++;
                    }
                    j++;

                    while (tokens[j] && tokens[j].type !== "table_close") {
                        if (tokens[j].type === "tr_open") {
                            const row: string[] = [];
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
                            j = k;
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
                    i = j;
                } else if (token.type === "hr") {
                    content.push({ canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#cccccc" }], margin: [0, 10] });
                }
            }

            const tocContent = tocItems.map(item => ({
                text: item.text,
                linkToDestination: item.id,
                margin: [(item.level - 1) * 15, 5, 0, 5],
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
                header: function(_currentPage: number, _pageCount: number) {
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
                    h4: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
                    h5: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
                    footer: { fontSize: 10, color: "#444" },
                    header: { fontSize: 10, color: "#666", bold: true },
                    tocLink: { color: "blue" }
                },
                defaultStyle: {
                    fontSize: 12,
                    lineHeight: 1.15
                }
            };

            pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url);
            });
        } catch (err: unknown) {
            console.error('[StudyChecklist] Error generating PDF:', err);
            error = err instanceof Error ? err.message : "An error occurred while generating PDF";
        } finally {
            isGeneratingPdf = false;
        }
    }
</script>

<div class="checklist-container">
    {#if error}
        <div class="checklist-error-toast checklist-error">{error}</div>
    {/if}
    <div class="flex gap-2 mb-2 items-center">
        <button
            type="button"
            class="standard2-button primary inverted"
            onclick={openPdf}
            disabled={isLoading || isGeneratingPdf || !checklistHtml}
            title={isGeneratingPdf ? "Generating PDF..." : "Open checklist as PDF"}
        >
            <IconPdf size="16" />
            {#if isGeneratingPdf}
                Generating...
            {:else}
                PDF
            {/if}
        </button>
    </div>
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
