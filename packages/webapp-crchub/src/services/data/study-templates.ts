/**
 * Study templates for "Create from Template" in the Add Study flow.
 *
 * For now returns a hard-coded list. Structure the code so this can later
 * be replaced with an API (e.g. getStudyTemplates(): Promise<StudyTemplate[]>).
 */

export interface StudyTemplate {
    /** Unique id for the template (e.g. for routing or API). */
    id: string;
    /** Display label in the Add Study dropdown. */
    label: string;
    /**
     * Study id to use as copy source. If empty, the UI may resolve it
     * temporarily from an existing study until real templates exist.
     */
    sourceStudyId: string;
    /** Optional group for categorization in the template list (e.g. "Trial Phase"). */
    group?: string;
}

/**
 * Returns the list of study templates.
 * TODO: Replace with async API when templates are stored in the database.
 */
export function getStudyTemplates(): StudyTemplate[] {
    return [
        { id: "template-phase2", label: "Phase 2 Trial Template", sourceStudyId: "", group: "Trial Phase" },
        { id: "template-phase3", label: "Phase 3 Trial Template", sourceStudyId: "", group: "Trial Phase" },
    ];
}
