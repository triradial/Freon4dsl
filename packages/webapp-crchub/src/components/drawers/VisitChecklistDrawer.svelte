<script lang="ts">
    import { findAppropriateVisitDate, getVisitChecklistAsMarkdown as getEventChecklistAsMarkdown, getVisitChecklistAsMarkdownForPdf, type PatientInfo, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import MarkdownIt from "markdown-it";
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";
    import IconPdf from '@lucide/svelte/icons/file-text';
    import IconWord from '@lucide/svelte/icons/file-spreadsheet';
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { setDrawerTitle } from "../../services/stores/side-drawer-store.js";
    import { dataStore } from "../../services/data/data-store.js";
    import { generateWordChecklist } from "../../services/document/word-checklist-generator.js";
    import ContentLoader from "./ContentLoader.svelte";

    pdfMake.vfs = pdfFonts as any;
    const md = new MarkdownIt({ html: true });

    let { patientId, studyId, selectedDate, hasEvents, patientReferenceDate } = $props<{ patientId?: string; studyId?: string; selectedDate?: Date | string; hasEvents?: boolean; patientReferenceDate?: Date | string }>();
    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let patientInfo = $state<PatientInfo | null>(null);
    let determinedVisitDate = $state<Date | null>(null);
    let lastChecklistMarkdown = $state<string>("");
    let isGeneratingPdf = $state(false);
    let isGeneratingWord = $state(false);
    
    // Convert selectedDate to Date if it's a string (from serialization)
    let normalizedSelectedDate = $derived.by(() => {
        if (!selectedDate) return undefined;
        if (selectedDate instanceof Date) return selectedDate;
        if (typeof selectedDate === 'string') {
            const date = new Date(selectedDate);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });

    // Convert patientReferenceDate to Date if it's a string (from serialization)
    let normalizedPatientReferenceDate = $derived.by(() => {
        if (!patientReferenceDate) return undefined;
        if (patientReferenceDate instanceof Date) return patientReferenceDate;
        if (typeof patientReferenceDate === 'string') {
            const date = new Date(patientReferenceDate);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });

    // Determine the visit date to use: selectedDate if provided, otherwise find from patient visits
    let eventDateToUse = $derived.by(() => {
        if (normalizedSelectedDate) {
            return normalizedSelectedDate;
        }
        return determinedVisitDate;
    });

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadEventChecklist();
    }

    // Update drawer title with the visit date
    $effect(() => {
        const date = eventDateToUse;
        if (date) {
            const dateStr = date.toLocaleDateString();
            setDrawerTitle("visitChecklist", `Visit Checklist - ${dateStr}`);
        } else {
            setDrawerTitle("visitChecklist", "Visit Checklist");
        }
    });

    $effect(() => {
        // Track all props that should trigger a reload
        // Reading these values here ensures the effect re-runs when they change
        const currentStudyId = studyId;
        const currentPatientId = patientId;
        const currentSelectedDate = selectedDate;
        const currentHasEvents = hasEvents;
        const currentPatientReferenceDate = patientReferenceDate;

        // Don't try to load if we don't have the required props yet
        if (!currentStudyId || currentStudyId === "") {
            // Only show error if we've been rendered (props have been passed but are empty)
            // If props are completely undefined, they might not be set yet
            if (currentPatientId !== undefined || currentSelectedDate !== undefined) {
                error = "Study ID is required. Please wait for the page to load.";
                isLoading = false;
            }
            return;
        }

        // Load PatientInfo and determine visit date
        loadPatientInfoAndDetermineVisitDate();
    });
    
    async function loadPatientInfoAndDetermineVisitDate() {
        isLoading = true;
        error = null;
        determinedVisitDate = null;
        
        try {
            if (!studyId) {
                error = "Study ID is required.";
                isLoading = false;
                return;
            }
            
            const modelManager = ModelManager.getInstance();
            
            // Load PatientInfo if we have a patientId
            if (patientId) {
                patientInfo = await modelManager.getModelUnitWithoutOpening(studyId, "PatientInfo") as PatientInfo | null;
                
                // Find the appropriate visit date from patient visits (for checklist for that date/event)
                const foundDate = findAppropriateVisitDate(patientInfo, patientId);
                if (foundDate) {
                    determinedVisitDate = foundDate;
                }
            }
            
            // Use selected date if provided, otherwise the date we just determined from patient visits
            const dateToUse = normalizedSelectedDate ?? determinedVisitDate ?? undefined;
            if (!dateToUse) {
                if (patientId) {
                    error = "No visit found for this patient. Please select a date or ensure the patient has visits scheduled.";
                } else {
                    error = "Please select a date to view the visit checklist.";
                }
                isLoading = false;
                return;
            }
            
            // Load the checklist with the determined date
            await loadEventChecklist();
        } catch (err: unknown) {
            console.error(`Error loading patient info for study: ${studyId}`, err);
            error = err instanceof Error ? err.message : "An error occurred";
            isLoading = false;
        }
    }

    async function loadEventChecklist() {
        try {
            const date = eventDateToUse;
            if (!date) {
                error = "Invalid date selected.";
                isLoading = false;
                return;
            }
            
            if (!studyId) {
                error = "Study ID is required.";
                isLoading = false;
                return;
            }
            
            const modelManager = ModelManager.getInstance();
            const unit = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
            if (!unit) {
                error = "Configuration unit not loaded.";
                isLoading = false;
                return;
            }
            
            // Normalize date to local midnight to avoid timezone issues
            const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

            // Use patient reference date if available, otherwise use the selected date as reference
            const refDate = normalizedPatientReferenceDate ?? normalizedDate;

            const markdown = getEventChecklistAsMarkdown(unit, normalizedDate, refDate);
            lastChecklistMarkdown = markdown;

            // Use markdown-it for rendering
            let bodyHtml = md.render(markdown);

            // Wrap the content in the limited-width container
            bodyHtml = `<div class="limited-width-container">${bodyHtml}</div>`;

            // Post-process HTML for consistency with StudyChecklistDrawer
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = bodyHtml;

            // Add proper CSS classes to tables
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

            checklistHtml = tempDiv.innerHTML;

        } catch (err: unknown) {
            console.error(`Error fetching visit checklist for study: ${studyId}`, err);
            error = err instanceof Error ? err.message : "An error occurred";
        } finally {
            isLoading = false;
        }
    }

    /**
     * Generate markdown for PDF/Word using the heading-based format (same as Study Checklist).
     * This is called fresh for each PDF/Word generation to get clean markdown without HTML checkboxes.
     */
    async function getMarkdownForPdf(): Promise<string | null> {
        const date = eventDateToUse;
        if (!date || !studyId) {
            return null;
        }

        const modelManager = ModelManager.getInstance();
        const unit = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
        if (!unit) {
            return null;
        }

        // Normalize date to local midnight to avoid timezone issues
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

        // Use patient reference date if available, otherwise use the selected date as reference
        const refDate = normalizedPatientReferenceDate ?? normalizedDate;

        // Get markdown using the PDF-friendly format (heading-based, same as Study Checklist)
        return getVisitChecklistAsMarkdownForPdf(unit, normalizedDate, refDate);
    }

    async function openPdf() {
        isGeneratingPdf = true;
        error = null;

        try {
            // Generate fresh markdown using the PDF-friendly format
            const markdown = await getMarkdownForPdf();
            if (!markdown) {
                error = "Unable to generate checklist content for PDF.";
                isGeneratingPdf = false;
                return;
            }

            const study = await dataStore.getStudy(studyId!);
            const studyName = study?.name ?? "Study";
            const visitDate = eventDateToUse;
            const dateStr = visitDate ? visitDate.toLocaleDateString() : "Visit";
            const tokens = md.parse(markdown, {});

            const content: any[] = [];
            let headingCounter = 0;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token.type === "heading_open") {
                    const text = tokens[i + 1].content;
                    const level = parseInt(token.tag.slice(1));
                    const id = `heading-${headingCounter++}`;

                    const style = `h${level}`;
                    const contentItem: any = { text, style, id };
                    // Only add page break before h1 if it's not the first content item
                    if (level === 1 && content.length > 0) {
                        contentItem.pageBreak = 'before';
                    }
                    content.push(contentItem);
                    i++;
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
                            let k = j + 1;
                            while (tokens[k] && tokens[k].type !== "list_item_close") {
                                if (tokens[k].type === "inline" && tokens[k].children?.length) {
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
                } else if (token.type === "hr") {
                    content.push({ canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#cccccc" }], margin: [0, 10] });
                } else if (token.type === "html_block") {
                    // Handle HTML blocks (group labels like PEOPLE, SYSTEMS, REFERENCES)
                    const htmlContent = token.content || "";
                    const labelMatch = htmlContent.match(/<p\s+class="checklist-group-label"[^>]*>([^<]+)<\/p>/i);
                    if (labelMatch) {
                        content.push({
                            text: labelMatch[1].trim(),
                            bold: true,
                            fontSize: 10,
                            color: "#666666",
                            margin: [10, 10, 0, 5]
                        });
                    }
                }
            }

            const docDefinition: any = {
                content: content,
                info: {
                    title: `${studyName} - Visit Checklist - ${dateStr}`,
                    author: "CRCHub",
                    subject: "Visit Checklist"
                },
                header: function(_currentPage: number, _pageCount: number) {
                    return {
                        text: `${studyName} - Visit Checklist - ${dateStr}`,
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
                    header: { fontSize: 10, color: "#666", bold: true }
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
            console.error('[VisitChecklistDrawer] Error generating PDF:', err);
            error = err instanceof Error ? err.message : "An error occurred while generating PDF";
        } finally {
            isGeneratingPdf = false;
        }
    }

    async function openWord() {
        isGeneratingWord = true;
        error = null;

        try {
            // Generate fresh markdown using the PDF-friendly format
            const markdown = await getMarkdownForPdf();
            if (!markdown) {
                error = "Unable to generate checklist content for Word document.";
                isGeneratingWord = false;
                return;
            }

            const study = await dataStore.getStudy(studyId!);
            const studyName = study?.name ?? "Study";
            const visitDate = eventDateToUse;
            const dateStr = visitDate ? visitDate.toLocaleDateString().replace(/\//g, '-') : "Visit";

            // Generate Word document from markdown
            const blob = await generateWordChecklist(
                markdown,
                `${studyName} - ${dateStr}`
            );

            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${studyName.replace(/[^a-zA-Z0-9]/g, '_')}_Visit_Checklist_${dateStr}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err: unknown) {
            console.error('[VisitChecklistDrawer] Error generating Word document:', err);
            error = err instanceof Error ? err.message : "An error occurred while generating Word document";
        } finally {
            isGeneratingWord = false;
        }
    }
</script>

<div class="drawer-content-area p-2">
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {:else if hasEvents === false}
        <div class="no-events-message p-4">
            <p>No scheduled events on this day.</p>
        </div>
    {:else}
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
            <button
                type="button"
                class="standard2-button primary inverted"
                onclick={openWord}
                disabled={isLoading || isGeneratingWord || !checklistHtml}
                title={isGeneratingWord ? "Generating Word document..." : "Download checklist as Word document with checkboxes"}
            >
                <IconWord size="16" />
                {#if isGeneratingWord}
                    Generating...
                {:else}
                    Word
                {/if}
            </button>
        </div>
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
    .no-events-message {
        color: var(--text-secondary-500);
        font-style: italic;
    }

    /* Match StudyChecklist tab's heading styles for consistency */
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

    /* Checklist item styles */
    .study-checklist-content :global(.checklist-item) {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.5rem;
    }
    .study-checklist-content :global(.checklist-item label) {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
    }
    .study-checklist-content :global(.checklist-item input[type="checkbox"]) {
        margin-top: 0.25rem;
        width: 1.1rem;
        height: 1.1rem;
        cursor: pointer;
        accent-color: var(--primary-color);
    }
    .study-checklist-content :global(.checklist-task) {
        font-size: 1.1rem;
        font-weight: 600;
        margin-top: 1rem;
    }
    .study-checklist-content :global(.checklist-step) {
        font-size: 1rem;
        margin-left: 1.5rem;
    }
    .study-checklist-content :global(.checklist-task-content) {
        margin-left: 1.6rem;
        margin-bottom: 0.5rem;
        color: var(--checklist-text);
    }
    .study-checklist-content :global(.checklist-step-content) {
        margin-left: 3.1rem;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
        color: var(--checklist-text);
    }
</style>

