# Plan: Replace EventCard Checkbox List with VisitChecklistDrawer Format

## Summary

Replace the custom Svelte checkbox markup for tasks/steps in `EventCard.svelte` with the markdown-based rendering approach used in `VisitChecklistDrawer.svelte`. This will provide a consistent user experience between the event card view and the checklist drawer.

## Current Implementation Analysis

### EventCard.svelte (Current - Lines 720-845)
- **Approach**: Custom Svelte markup with nested loops
- **Features**:
  - Checkboxes for tasks and steps (bind:checked)
  - Expand/collapse functionality for tasks (expandedTasks Set)
  - Expand/collapse for step details (expandedSteps Set)
  - Detail sections: PEOPLE, SYSTEMS, REFERENCES
  - Manual data extraction from StudyConfiguration via `loadChecklist()`
- **Data Source**: Manually extracts tasks from `StudyConfiguration` by searching periods and events

### VisitChecklistDrawer.svelte (Target)
- **Approach**: Markdown-based rendering via `markdown-it`
- **Features**:
  - Generates markdown using `getVisitChecklistAsMarkdown()` from TimelineUtils
  - HTML checkboxes embedded in markdown (`.checklist-item`, `.checklist-task`, `.checklist-step`)
  - CSS styling for headings, lists, and checklist items
  - PDF/Word export buttons
- **Data Source**: Uses `getVisitChecklistAsMarkdown(studyConfig, targetDate, referenceDate)`

## Implementation Approach

### Option A: Import and use getVisitChecklistAsMarkdown (Recommended)
Replace the custom checkbox rendering with the same markdown-based approach from VisitChecklistDrawer:

1. Import required utilities
2. Replace `loadChecklist()` to generate markdown instead of extracting Task[] array
3. Replace the checkbox template with `{@html checklistHtml}`
4. Copy relevant CSS styles from VisitChecklistDrawer

### Option B: Create a reusable VisitChecklist component
Extract the checklist rendering from VisitChecklistDrawer into a shared component used by both.

**Recommendation**: Option A is simpler and achieves the goal directly.

## Required Changes

### 1. Add Imports to EventCard.svelte
```typescript
import { getVisitChecklistAsMarkdown, type StudyConfiguration } from "@freon4dsl/study-configuration";
import MarkdownIt from "markdown-it";
```

### 2. Add New State Variables
```typescript
const md = new MarkdownIt({ html: true });
let checklistHtml = $state<string>("");
```

### 3. Replace loadChecklist() Function
Replace the current implementation (lines 297-381) that manually extracts tasks with:
```typescript
async function loadChecklist() {
    if (mode !== 'scheduled' || !event || !studyId) {
        checklistHtml = "";
        isLoadingChecklist = false;
        return;
    }

    isLoadingChecklist = true;
    try {
        const modelManager = ModelManager.getInstance();
        const studyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;

        if (!studyConfig) {
            checklistHtml = "";
            return;
        }

        // Normalize date to local midnight
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

        // Parse patientReferenceDate if provided
        let refDate = normalizedDate;
        if (patientReferenceDate) {
            const parsedRef = new Date(patientReferenceDate);
            if (!isNaN(parsedRef.getTime())) {
                refDate = new Date(parsedRef.getFullYear(), parsedRef.getMonth(), parsedRef.getDate(), 0, 0, 0);
            }
        }

        // Generate markdown using the same function as VisitChecklistDrawer
        const markdown = getVisitChecklistAsMarkdown(studyConfig, normalizedDate, refDate);

        // Render markdown to HTML
        let bodyHtml = md.render(markdown);

        // Post-process HTML (add CSS classes to tables, external links)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = bodyHtml;

        const tables = tempDiv.querySelectorAll('table');
        tables.forEach(table => table.classList.add('table_component'));

        const links = tempDiv.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href')?.trim() ?? "";
            if (href.startsWith("http://") || href.startsWith("https://")) {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        });

        checklistHtml = tempDiv.innerHTML;

    } catch (err) {
        console.error('[EventCard] Error loading checklist:', err);
        checklistHtml = "";
    } finally {
        isLoadingChecklist = false;
    }
}
```

### 4. Remove Unused Code
- Remove `tasks` state variable and `Task`, `Step`, `Person`, `System`, `Reference` interfaces (if only used for checklist)
- Remove `expandedTasks`, `expandedSteps` state variables
- Remove `toggleTask()`, `toggleStep()` functions
- Remove `extractTask()` function
- Remove `hasChecklist` derived (or update to check `checklistHtml`)

### 5. Replace Template (Lines 720-845)
Replace the nested Svelte each loops with:
```svelte
<!-- Checklist (hidden during calendar view) -->
{#if !showMoveCalendar}
    <div class="checklist-section">
        {#if isLoadingChecklist}
            <div class="loading-checklist">Loading checklist...</div>
        {:else if !checklistHtml}
            <div class="empty-checklist">No tasks defined for this event.</div>
        {:else}
            <div class="study-checklist-content">
                {@html checklistHtml}
            </div>
        {/if}
    </div>
{/if}
```

### 6. Copy CSS Styles
Copy the `.study-checklist-content` styles from VisitChecklistDrawer.svelte (lines 473-575) to EventCard.svelte's `<style>` section. Key styles include:
- Heading styles (h1-h6)
- List styles (ul, ol, li)
- Checklist item styles (.checklist-item, .checklist-task, .checklist-step)
- Checkbox styling

## Files to Modify

1. **`/packages/webapp-crchub/src/components/content/patient/EventCard.svelte`**
   - Add imports
   - Replace `loadChecklist()` function
   - Replace template markup
   - Add CSS styles
   - Remove unused interfaces/functions

## Files to Reference (read-only)

- `VisitChecklistDrawer.svelte` (`/packages/webapp-crchub/src/components/drawers/VisitChecklistDrawer.svelte`) - Template for markdown rendering approach
- `TimelineUtils.ts` (`/packages/languages/study-configuration/src/custom/timeline/TimelineUtils.ts`) - `getVisitChecklistAsMarkdown()` function (lines 263-282)

## Verification

1. Navigate to a patient page with scheduled visits
2. Click on an event card to expand it
3. Verify the checklist displays in the same format as the VisitChecklistDrawer
4. Check that:
   - Tasks are rendered with checkboxes
   - Steps are rendered with checkboxes
   - People, Systems, References sections are displayed
   - External links open in new tabs
   - Styling matches the drawer
5. Test with different events (scheduled, unscheduled, initial)
6. Verify the drawer still works correctly (no regressions)

## Notes

- The checkbox state (checked/unchecked) in the markdown format is not persistent - it's purely visual. If checkbox state persistence is needed, additional work would be required.
- The expand/collapse functionality will be removed - everything will show expanded (confirmed as acceptable).
