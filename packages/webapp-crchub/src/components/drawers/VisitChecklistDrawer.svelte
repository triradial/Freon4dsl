<script lang="ts">
    import { findAppropriateVisitDate, getVisitChecklistAsMarkdown as getEventChecklistAsMarkdown, type PatientInfo, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import MarkdownIt from "markdown-it";
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { setDrawerTitle } from "../../services/stores/side-drawer-store.js";
    import ContentLoader from "./ContentLoader.svelte";

    const md = new MarkdownIt({ html: true });

    let { patientId, studyId, selectedDate, hasEvents, patientReferenceDate } = $props<{ patientId?: string; studyId?: string; selectedDate?: Date | string; hasEvents?: boolean; patientReferenceDate?: Date | string }>();
    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let patientInfo = $state<PatientInfo | null>(null);
    let determinedVisitDate = $state<Date | null>(null);
    
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
</script>

<div class="drawer-content-area p-2">
    {#if error}
        <div class="drawer-error p-4">{error}</div>
    {:else if hasEvents === false}
        <div class="no-events-message p-4">
            <p>No scheduled events on this day.</p>
        </div>
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

