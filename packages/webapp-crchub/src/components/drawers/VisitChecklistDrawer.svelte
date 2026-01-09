<script lang="ts">
    import { StudyConfiguration, getVisitChecklistAsMarkdown } from "@freon4dsl/study-configuration";
    import MarkdownIt from "markdown-it";
    import { createEventDispatcher } from "svelte";
    import { ModelManager } from "../../services/dsl/model-manager.js";
    import { setDrawerTitle } from "../../services/stores/side-drawer-store.js";
    import ContentLoader from "./ContentLoader.svelte";

    const md = new MarkdownIt({ html: true });

    let { patientId, studyId, selectedDate } = $props<{ patientId?: string; studyId?: string; selectedDate?: Date | string }>();
    let isLoading = $state(true);
    let checklistHtml = $state<string>("");
    let error = $state<string | null>(null);
    let patientInfo = $state<PatientInfo | null>(null);
    let determinedVisitDate = $state<Date | null>(null);
    
    // Convert selectedDate to Date if it's a string (from serialization)
    let normalizedSelectedDate = $derived(() => {
        if (!selectedDate) return undefined;
        if (selectedDate instanceof Date) return selectedDate;
        if (typeof selectedDate === 'string') {
            const date = new Date(selectedDate);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });
    
    // Determine the visit date to use: selectedDate if provided, otherwise find from patient visits
    let visitDateToUse = $derived(() => {
        const selected = normalizedSelectedDate();
        if (selected) {
            return selected;
        }
        return determinedVisitDate;
    });

    const dispatch = createEventDispatcher();

    function closeDrawer() {
        dispatch("close");
    }

    export function refresh() {
        dispatch("refresh");
        loadVisitChecklist();
    }

    // Update drawer title with the visit date
    $effect(() => {
        const date = visitDateToUse();
        if (date) {
            const dateStr = date.toLocaleDateString();
            setDrawerTitle("visitChecklist", `Visit Checklist - ${dateStr}`);
        } else {
            setDrawerTitle("visitChecklist", "Visit Checklist");
        }
    });

    $effect(() => {
        console.log("[VisitChecklistDrawer] $effect patientId:", patientId, "studyId:", studyId, "selectedDate:", selectedDate);
        
        // Don't try to load if we don't have the required props yet
        if (!studyId || studyId === "") {
            // Only show error if we've been rendered (props have been passed but are empty)
            // If props are completely undefined, they might not be set yet
            if (patientId !== undefined || selectedDate !== undefined) {
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
                
                // Find the appropriate visit date from patient visits
                const foundDate = findAppropriateVisitDate(patientInfo, patientId);
                if (foundDate) {
                    determinedVisitDate = foundDate;
                }
            }
            
            // Check if we have a date to use (either selectedDate or determined from visits)
            const dateToUse = visitDateToUse();
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
            await loadVisitChecklist();
        } catch (err: unknown) {
            console.error(`Error loading patient info for study: ${studyId}`, err);
            error = err instanceof Error ? err.message : "An error occurred";
            isLoading = false;
        }
    }

    async function loadVisitChecklist() {
        try {
            const date = visitDateToUse();
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
            
            const markdown = getVisitChecklistAsMarkdown(unit, normalizedDate);
            
            // Use markdown-it for rendering
            let bodyHtml = md.render(markdown);
            
            // Wrap the content in the limited-width container
            bodyHtml = `<div class="limited-width-container">${bodyHtml}</div>`;
            
            checklistHtml = bodyHtml;

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
    {:else}
        {#if isLoading}
            <ContentLoader />
        {:else}
            <div class="visit-checklist-content">
                {@html checklistHtml}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* Consistent UI styling for visit checklist content */
    .visit-checklist-content {
        color: var(--text-primary-500);
        font-family: var(--font-family-sans);
        line-height: 1.6;
    }
    
    /* .visit-checklist-content h1,
    .visit-checklist-content h2,
    .visit-checklist-content h3,
    .visit-checklist-content h4 {
        color: var(--text-primary-500);
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
    }
    
    .visit-checklist-content h1 {
        font-size: 1.5rem;
        border-bottom: 1px solid var(--white-20t);
        padding-bottom: 0.5rem;
    }
    
    .visit-checklist-content h2 {
        font-size: 1.25rem;
    }
    
    .visit-checklist-content h3 {
        font-size: 1.1rem;
    }
    
    .visit-checklist-content h4 {
        font-size: 1rem;
    }
    
    .visit-checklist-content p {
        margin-bottom: 1rem;
        color: var(--text-primary-500);
    }
    
    .visit-checklist-content ul,
    .visit-checklist-content ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
        color: var(--text-primary-500);
    }
    
    .visit-checklist-content li {
        margin-bottom: 0.5rem;
    }
    
    .visit-checklist-content a {
        color: var(--primary-color);
        text-decoration: none;
    } */
</style>

