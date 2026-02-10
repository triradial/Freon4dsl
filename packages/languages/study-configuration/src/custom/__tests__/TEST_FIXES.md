# Timeline Test Fixes

This document summarizes the changes made to fix tests after updating the timeline to use dynamic start dates.

## Code Changes Made

### 1. ScheduledEvent.ts (line 215)
Fixed bug in `numberOfRepeats()` method:
- Changed `let n = 1` to `let n = 0`
- This was causing non-repeating events to incorrectly show instance numbers like `(1 of 2)`

### 2. Simulator.test.ts
Updated inline expected visualization HTML in several tests to match new format:
- `majorLabels` day format changed from `'w'` to `'MMM YYYY'`
- Added `vertical: 5` to margin
- Added `stack: true, stackSubgroups: true` options
- Updated `end` and `max` dates to match `getInitialWindowEnd()` output

### 3. Expected Data Files Updated
Window titles changed from `"Window before Event"` / `"Window after Event"` to new format:
- Non-repeating: `"Window of N days before EventName"`
- Repeating: `"Window of N days before EventName (X of Y)"`

Files updated:
- `expected-timeline-TwoVisitOnePeriod.txt`
- `expected-timeline-TwoPeriods.txt`
- `expected-timeline-TwoVisitsPatientCompleted.txt`
- `expected-timeline-VisitDay1PatientCompleted.txt`
- `expected-timeline-VisitDay1StaffLevel.txt`
- `expected-timeline-ThreeVisitRepeatsTwice.txt`

## Remaining Failing Tests

The following tests still need their expected data files updated:

### Chart Tests
- `generates chart for example study 1` - update `expected-timeline-ScheduleExample1.txt`
- `generates chart for example study 2` - update `expected-timeline-ScheduleExample2.txt`
- `generates chart for example study 3` - update `expected-timeline-ScheduleExample3.txt`

### Patient Timeline Tests
- `generates chart for example study ScheduleExample2 with the first 10 visits completed` - update `expected-timeline-ScheduleExample2-10visits.txt`
- `generates chart for example study ScheduleExample2 with patient unavailable times` - update `expected-timeline-ScheduleExample2-PatientUnavailable.txt`
- `generates chart for example study ScheduleExample2 with changing staff levels` - update `expected-timeline-ScheduleExample2-ChangingStaff.txt`

### Table Tests
- `generates a TABLE for a three visit timeline for a visit that repeats twice`
- `generates a TABLE that has a special alternative name for a three visit timeline for a visit that repeats twice`

### Document Generation Test
- `generate a document for a one visit,one checklist, one task study` - update `StudyChecklistOneVisitOneChecklist.md`

## How to Fix Remaining Tests

1. Run the specific test:
   ```bash
   cd packages/languages/study-configuration
   npx vitest run -c ./vitest.config.ts -t "test name here"
   ```

2. Compare the "Expected" vs "Received" output in the error message

3. The key changes to look for:
   - Window titles: `"Window before Event"` → `"Window of N days before EventName"`
   - For repeating events: titles include `(X of Y)` instance numbers
   - Event titles may include instance numbers for repeating events

4. Update the expected data file in `src/custom/__tests__/data/` with the new format
