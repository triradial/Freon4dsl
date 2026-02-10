# Patient Timeline Chart Data Flow

This document describes the complete data flow for displaying patient timeline charts in the CRCHub webapp.

## Overview

The patient timeline system converts a study configuration (DSL model) into interactive vis-timeline visualizations. The flow involves multiple layers:

1. **UI Layer** - User-facing Svelte components
2. **Orchestration Layer** - Coordinates data loading and timeline creation
3. **Simulation Layer** - Generates complete study schedule
4. **Data Layer** - In-memory timeline representation
5. **Rendering Layer** - Converts to HTML/Markdown
6. **Display Layer** - vis-timeline library visualization

---

## Entry Points

### VisitChecklistDrawer.svelte
**Path:** `src/components/drawers/VisitChecklistDrawer.svelte`

Displays a markdown checklist for a specific visit date.

**Props:**
- `patientId` - Patient identifier
- `studyId` - Study identifier
- `selectedDate` - Optional visit date override

**Flow:**
```
User opens drawer with props
    ↓
$effect triggers loadPatientInfoAndDetermineVisitDate()
    ↓
Load PatientInfo via ModelManager
    ↓
Find appropriate visit date (selectedDate or from patient visits)
    ↓
Call loadVisitChecklist()
    ↓
getVisitChecklistAsMarkdown(studyConfig, normalizedDate)
    ↓
MarkdownIt renders to HTML
    ↓
Display in drawer
```

### PatientTimelineChartDrawer.svelte
**Path:** `src/components/drawers/PatientTimelineChartDrawer.svelte`

Displays interactive timeline charts for one or all patients.

**Single Patient Flow:**
```
1. Load patient data from store
2. Get PatientInfo + StudyConfiguration units
3. Find matching patient history
4. Copy patient history (fills date concepts)
5. Determine reference date (earliest visit or today)
6. getTimelineAsOfADate(studyConfig, refDate, patientHistory, patientId)
7. getTimelineChartHtml(timeline)
8. Inject HTML and execute vis-timeline scripts
```

**All Patients Flow:**
```
1. Fetch all patients for study
2. Get PatientInfo + StudyConfiguration
3. Find first patient with visits (for reference date)
4. Create timeline with study schedule only
5. For each patient:
   - Find patient history
   - Copy with filled dates
   - Add patient events via timeline.addPatientEvents()
6. getTimelineChartHtml(timeline) → multi-patient view
7. Render with group rows for each patient
```

---

## Core Functions

### TimelineUtils.ts
**Path:** `packages/languages/study-configuration/src/custom/timeline/TimelineUtils.ts`

#### getVisitChecklistAsMarkdown()
```typescript
function getVisitChecklistAsMarkdown(
    studyConfigurationUnit: StudyConfiguration,
    targetDate: Date,
    referenceDate?: Date
): string
```

1. Creates Timeline via `getTimelineAsOfADate()`
2. Calls `StudyChecklistDocumentTemplate.getVisitForDateAsMarkdown()`
3. Returns markdown for visit checklist

#### getTimelineAsOfADate()
```typescript
function getTimelineAsOfADate(
    node: StudyConfiguration,
    referenceDate: Date,
    patientHistory?: PatientHistory,
    patientIdentifier?: string
): Timeline
```

1. Initializes `Sim.Sim()` (simulation engine)
2. Creates `ScheduledStudyConfiguration` from study config
3. Creates `Simulator` instance
4. Sets reference date and organizes by reference date
5. Optionally adds patient events from PatientHistory
6. Runs simulation via `simulator.run()`
7. Returns populated `Timeline` object

---

## Data Structures

### Timeline
**Path:** `packages/languages/study-configuration/src/custom/timeline/Timeline.ts`

```typescript
class Timeline {
    days: TimelineDay[] = [];        // Array of days with events
    referenceDate: Date;             // Baseline date
    organizeByStudyDay: boolean;     // Study day vs actual date
    currentDay: number = 0;

    getDays(): TimelineDay[]
    getScheduledEventInstancessForDay(day: number): ScheduledEventInstance[]
    getUniqueEventInstanceNames(): string[]
    getUniquePatientIdentifiers(): string[]
    getDayOnTimeline(date: Date): number
    addPatientEvents(patientHistory, patientIdentifier)
}
```

### TimelineDay
```typescript
class TimelineDay {
    day: number;
    events: TimelineEventInstance[] = [];

    getEventInstances(): ScheduledEventInstance[]
    getPatientEventInstances(): PatientVisitEventInstance[]
    getPeriodInstances(): PeriodEventInstance[]
    getStaffAvailabilityEventInstances()
}
```

### ScheduledEventInstance
**Path:** `packages/languages/study-configuration/src/custom/timeline/ScheduledEventInstance.ts`

```typescript
class ScheduledEventInstance extends TimelineEventInstance {
    scheduledEvent: ScheduledEvent;
    state: TimelineInstanceState;    // Ready, Scheduled, Active, Completed
    instanceNumber: number;          // For repeating events (1 of 3)

    getStartDayOfWindow(): number    // Days before event
    getEndDayOfWindow(): number      // Days after event
    getNameWithInstanceNumber(timeline): string
    getStartDayAsDateString(timeline): string
}
```

### PatientEventInstance
**Path:** `packages/languages/study-configuration/src/custom/timeline/PatientEventInstance.ts`

```typescript
class PatientVisitEventInstance extends PatientEventInstance {
    visitInstanceNumber: number;
    patientVisitStatus: PatientVisitStatus;  // planned, missed, canceled
    patientIdentifier: string;

    getClassForDisplay(timeline): string  // CSS class for styling
    getTitle(): string                    // Hover text
}
```

---

## Template Generation

### TimelineChartTemplate.ts
**Path:** `packages/languages/study-configuration/src/custom/templates/TimelineChartTemplate.ts`

Converts Timeline object to HTML/JavaScript for vis-timeline.

#### getTimelineDataHTML(timeline)
Generates vis-timeline data structures:
```javascript
var groups = new vis.DataSet([
    { id: "Phase", content: "Phase" },
    { id: "Event1", content: "Event1" },
    { id: "Patient-001", content: "Patient: 001" }
]);

var items = new vis.DataSet([
    { start: Date(...), end: Date(...), group: "Phase", className: "screening-phase" },
    { start: Date(...), end: Date(...), group: "Event1", className: "scheduled-event" },
    { start: Date(...), end: Date(...), group: "Event1", className: "window" },
    { start: Date(...), end: Date(...), group: "Patient-001", className: "on-scheduled-date" }
]);
```

#### getTimelineVisualizationHTML(timeline)
Creates vis-timeline options including:
- Date format (study days vs calendar dates)
- Zoom/pan settings
- Stacking options
- Margin settings

#### getTimelineAsHTMLBlock(...)
Generates complete HTML with:
- vis-timeline library scripts and CSS
- Timeline data and configuration
- Event handlers for patient selection
- Stacking preservation logic
- Legend/key information

### StudyChecklistDocumentTemplate.ts
**Path:** `packages/languages/study-configuration/src/custom/templates/StudyChecklistDocumentTemplate.ts`

Converts Timeline + target date into markdown.

#### getVisitForDateAsMarkdown(timeline, targetDate, studyConfig)
1. Normalizes target date to midnight
2. Finds matching day in timeline
3. Gets ScheduledEventInstances for that day
4. Renders each event with:
   - Event name and title
   - Task details
   - Contact info (people, systems, references)

---

## Simulation Engine

### Simulator.ts
**Path:** `packages/languages/study-configuration/src/custom/timeline/Simulator.ts`

```typescript
class Simulator {
    sim: Sim.Sim;
    timeline: Timeline;
    studyConfiguration: StudyConfiguration;
    scheduledStudyConfiguration: ScheduledStudyConfiguration;

    run() {
        this.sim = new Sim.Sim();
        this.sim.addEntity(Scheduler, "Scheduler", this);
        this.sim.simulate(3650);  // 10 years max
    }
}
```

### Scheduler (JavaScript)
**Path:** `packages/languages/study-configuration/src/custom/simjs/Scheduler.js`

- Processes study configuration events
- Calculates scheduled dates based on periods, rules, and conditions
- Populates Timeline with ScheduledEventInstance objects
- Handles event dependencies and windows

---

## Complete Data Flow Diagram

```
User Opens Drawer
    ↓
props: patientId, studyId, selectedDate
    ↓
ModelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration")
    ↓
getVisitChecklistAsMarkdown(studyConfig, normalizedDate)
    │
    ├─→ getTimelineAsOfADate(studyConfig, refDate)
    │       ├─→ new Simulator(studyConfig)
    │       ├─→ simulator.setReferenceDate(refDate)
    │       ├─→ simulator.run()
    │       │   └─→ Scheduler schedules all events
    │       └─→ returns Timeline with ScheduledEventInstances
    │
    ├─→ Find matching day in timeline for targetDate
    │
    └─→ StudyChecklistDocumentTemplate.getVisitForDateAsMarkdown()
        ├─→ Get ScheduledEventInstances for that day
        └─→ Render each event as markdown

            ↓

        Returns markdown string

            ↓

        MarkdownIt.render() → HTML

            ↓

        Display in drawer


For Timeline Charts:

    User Opens PatientTimelineChartDrawer
        ↓
    Get PatientInfo + StudyConfiguration units
        ↓
    For each patient:
        Find + copy PatientHistory
        Determine reference date

        ↓

    Create Timeline via getTimelineAsOfADate()
        ├─→ Run scheduler for study events
        └─→ Add patient events (actual visits)

        ↓

    TimelineChartTemplate.getTimelineDataHTML(timeline)
    TimelineChartTemplate.getTimelineVisualizationHTML(timeline)
    TimelineChartTemplate.getTimelineAsHTMLBlock(...)

        ↓

    Returns complete HTML with embedded vis-timeline
        ├─→ vis-timeline library imports
        ├─→ JavaScript data structures (groups, items)
        ├─→ Timeline options (zoom, pan, display format)
        └─→ Event handlers + CSS stacking fix

        ↓

    Inject into DOM + execute scripts

        ↓

    vis-timeline renders interactive chart
```

---

## Multi-Patient Timeline Handling

TimelineChartTemplate detects single vs multi-patient:

**Single Patient:**
- Group rows by event name
- Each event gets its own row

**Multiple Patients:**
- All events shown in each patient's row
- Smaller fonts for space efficiency
- Click handlers to open individual patient timeline

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `VisitChecklistDrawer.svelte` | Visit checklist UI component |
| `PatientTimelineChartDrawer.svelte` | Timeline chart UI component |
| `TimelineUtils.ts` | Orchestration and helper functions |
| `Timeline.ts` | Core timeline data structure |
| `Simulator.ts` | Simulation engine bridge |
| `Scheduler.js` | Event scheduling logic |
| `ScheduledEventInstance.ts` | Study event instances |
| `PatientEventInstance.ts` | Patient visit instances |
| `TimelineChartTemplate.ts` | vis-timeline HTML generation |
| `StudyChecklistDocumentTemplate.ts` | Markdown generation |
