# Clinical Trial Timeline Data Guide

## What This Data Represents

This is a **clinical trial timeline visualization** using the vis-timeline library. The data tracks:
- **Patients (P1, P2, P3)** - Individual patients in the study
- **Study Phases** - Screening and Treatment periods
- **Scheduled Events/Visits** - Planned medical visits (Randomizations, Run-Ins)
- **Time Windows** - Allowable time ranges before/after scheduled events
- **Actual Patient Visits** - When patients actually came in (can be on-time, within window, or out-of-window)
- **Patient Availability** - Periods when patients are unavailable

## Data Structure Overview

### 1. Groups (Lines 28-33)
```javascript
var groups = new vis.DataSet([
    { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
    { "content": "P1", "id": "P1" },
    { "content": "P2", "id": "P2" },
    { "content": "P3", "id": "P3" }
]);
```
- **Groups** = Rows on the timeline (one per patient)
- To add a new patient: Add a new entry with a unique `id` (e.g., `"P4"`)

### 2. Items (Lines 35-267)
Each item represents an event, window, phase, or visit on the timeline.

## Understanding Item Properties

### Required Properties:
- **`start`**: Start date/time - `new Date(year, month-1, day, hour, minute, second)`
  - ⚠️ **JavaScript months are 0-indexed!** January = 0, December = 11
- **`end`**: End date/time (same format)
- **`group`**: Which patient/group this belongs to (`"P1"`, `"P2"`, etc.)
- **`id`**: Unique identifier (must be unique across all items)
- **`className`**: CSS class for styling (determines appearance)

### Important Properties:
- **`title`**: Tooltip text when hovering over the item
- **`content`**: Text displayed on the timeline (use `"&nbsp;"` for invisible items)

## Date Format Explanation

```javascript
new Date(2024, 00, 01, 00, 00, 00)
//            ↑   ↑   ↑   ↑   ↑   ↑
//          year|month|day|hour|min|sec
```

**Month Index Reference:**
- `00` = January
- `01` = February
- `02` = March
- `03` = April
- `04` = May
- `05` = June
- `06` = July
- `07` = August
- `08` = September
- `09` = October
- `10` = November
- `11` = December

**Example:** `new Date(2024, 04, 15, 00, 00, 00)` = May 15, 2024 at midnight

## Item Types (by className)

### 1. Study Phases
```javascript
{ start: new Date(2024, 0, 1), end: new Date(2024, 0, 28, 23, 59, 59), 
  group: "P1", className: "screening-phase", title: "Day: -28", 
  content: "<b>Screening</b>", id: "Screening0" }
```
- Shows major study periods
- Long duration spans

### 2. Scheduled Events
```javascript
{ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), 
  group: "P1", className: "scheduled-event", 
  title: "V1 Randomization: on the start day of the study - 4 weeks", 
  content: "&nbsp;", id: "V1 Randomization3" }
```
- Planned visit dates (usually single day events)
- `className: "scheduled-event"`

### 3. Time Windows
```javascript
{ start: new Date(2024, 0, 2), end: new Date(2024, 0, 3, 23, 59, 59), 
  group: "P1", className: "window", title: "Window before Event", 
  content: "&nbsp;", id: "before-V1 Run In4" }
```
- Allowable time ranges before/after scheduled events
- `className: "window"`

### 4. Actual Patient Visits
```javascript
{ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), 
  group: "P1", className: "on-scheduled-date", 
  title: "Patient visit:V1 Randomization'", content: "&nbsp;", 
  id: "V1 Randomization116" }
```

Visit status classes:
- **`on-scheduled-date`**: Patient visited exactly on schedule
- **`in-window`**: Patient visited within the time window
- **`out-of-window`**: Patient visited outside the allowed window

### 5. Patient Unavailable
```javascript
{ start: new Date(2024, 9, 6), end: new Date(2024, 9, 6, 23, 59, 59), 
  group: "P1", className: "not-available", title: "Patient Unavailable", 
  content: "&nbsp;", id: "Patient Not Available126" }
```
- Periods when patient cannot participate

## How to Change Dates

### Example: Change a scheduled event date

**Before:**
```javascript
{ start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), 
  group: "P1", className: "scheduled-event", 
  title: "V1 Randomization", id: "V1 Randomization3" }
```

**After (move to January 15, 2024):**
```javascript
{ start: new Date(2024, 0, 15), end: new Date(2024, 0, 15, 23, 59, 59), 
  group: "P1", className: "scheduled-event", 
  title: "V1 Randomization", id: "V1 Randomization3" }
```

### Adjusting Related Dates

When you change a scheduled event, you typically need to update:
1. **Window before** - Usually 1-2 days before the event
2. **Window after** - Usually 1-2 days after the event
3. **Next scheduled event** - If it's relative (e.g., "3 days after previous")

## How to Change Timing/Intervals

### Example: Change visit frequency

**Current pattern:** Visit every 2 weeks
```javascript
// Visit 1: Jan 1
{ start: new Date(2024, 0, 1), ... }
// Visit 2: Jan 15 (14 days later)
{ start: new Date(2024, 0, 15), ... }
```

**Change to:** Visit every 3 weeks
```javascript
// Visit 1: Jan 1
{ start: new Date(2024, 0, 1), ... }
// Visit 2: Jan 22 (21 days later)
{ start: new Date(2024, 0, 22), ... }
```

## How to Add a New Patient (P4)

### Step 1: Add the Group
In the `groups` array, add:
```javascript
{ "content": "P4", "id": "P4" }
```

### Step 2: Create Timeline Items for P4

You can copy an existing patient's structure and modify the dates. Here's a template:

```javascript
// Screening Phase
{ start: new Date(2024, 2, 1), end: new Date(2024, 2, 28, 23, 59, 59), 
  group: "P4", className: "screening-phase", title: "Day: -28", 
  content: "<b>Screening</b>", id: "Screening0-P4" },

// Treatment Phase
{ start: new Date(2024, 2, 29), end: new Date(2024, 10, 14, 23, 59, 59), 
  group: "P4", className: "treatment-phase", title: "Day: 0", 
  content: "<b>Treatment</b>", id: "Treatment1-P4" },

// First Scheduled Event
{ start: new Date(2024, 2, 1), end: new Date(2024, 2, 1, 23, 59, 59), 
  group: "P4", className: "scheduled-event", 
  title: "V1 Randomization: on the start day of the study - 4 weeks", 
  content: "&nbsp;", id: "V1 Randomization3-P4" },

// Window before first event
{ start: new Date(2024, 1, 28), end: new Date(2024, 1, 29, 23, 59, 59), 
  group: "P4", className: "window", title: "Window before Event", 
  content: "&nbsp;", id: "before-V1 Randomization2-P4" },

// ... continue with other events
```

### Step 3: Adjust All Dates
- Choose a start date for P4 (e.g., March 1, 2024)
- Calculate all subsequent dates based on your protocol intervals
- Ensure all IDs end with `-P4` for uniqueness

## Spreading Data Across a Calendar

### Strategy 1: Staggered Starts
Start each patient at different times:
- P1: January 1, 2024
- P2: February 1, 2024 (1 month later)
- P3: March 1, 2024 (2 months later)
- P4: April 1, 2024 (3 months later)

### Strategy 2: Calculate Dates from a Base Date

Create a function to calculate dates:

```javascript
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addWeeks(date, weeks) {
    return addDays(date, weeks * 7);
}

// Example: Generate P4 dates starting from a base date
const p4StartDate = new Date(2024, 3, 1); // April 1, 2024

// V1 Randomization: Start date
const v1Rand = p4StartDate;

// V1 Run In: 3 days after V1 Randomization
const v1RunIn = addDays(v1Rand, 3);

// V2 Randomization: 2 weeks after V1 Randomization
const v2Rand = addWeeks(v1Rand, 2);

// Use these calculated dates in your items
{ start: v1Rand, end: new Date(v1Rand.getFullYear(), v1Rand.getMonth(), v1Rand.getDate(), 23, 59, 59), 
  group: "P4", className: "scheduled-event", 
  title: "V1 Randomization", id: "V1 Randomization3-P4" }
```

### Strategy 3: Spread Visit Dates

Instead of clustering all visits on the same dates, spread them:

```javascript
// Week 1: P1 visits
{ start: new Date(2024, 0, 1), group: "P1", ... } // Monday

// Week 1: P2 visits
{ start: new Date(2024, 0, 3), group: "P2", ... } // Wednesday

// Week 2: P3 visits
{ start: new Date(2024, 0, 8), group: "P3", ... } // Monday

// Week 2: P4 visits
{ start: new Date(2024, 0, 10), group: "P4", ... } // Wednesday
```

## Quick Reference: Common Modifications

### Move an event forward by 1 week:
```javascript
// Find: new Date(2024, 0, 1)
// Replace: new Date(2024, 0, 8)  // 7 days later
```

### Move an event forward by 1 month:
```javascript
// Find: new Date(2024, 0, 1)  // January
// Replace: new Date(2024, 1, 1)  // February (month index increments)
```

### Change a single-day event:
```javascript
// Same start and end date, just modify the date part
{ start: new Date(2024, 0, 15), end: new Date(2024, 0, 15, 23, 59, 59), ... }
```

### Change a multi-day window:
```javascript
// Window spans 2 days
{ start: new Date(2024, 0, 14), end: new Date(2024, 0, 15, 23, 59, 59), ... }
```

## Tips for Managing Data

1. **Keep IDs unique**: Always append patient identifier (e.g., `-P1`, `-P2`) to IDs
2. **Maintain relationships**: If V2 happens "2 weeks after V1", keep that relationship
3. **Update timeline range**: If adding events beyond current range, update the `end` and `max` dates in timeline options (around line 315)
4. **Test incrementally**: Add one patient or a few events at a time to verify they appear correctly

## Timeline Configuration

To adjust the visible date range, modify:
```javascript
start: new Date(2024, 0, 1),    // January 1, 2024
end: new Date(2025, 1, 10),     // February 10, 2025
min: new Date(2024, 0, 1),      // Minimum date (can't scroll earlier)
max: new Date(2025, 1, 10),     // Maximum date (can't scroll later)
```

This ensures all your patient data is visible and accessible.
