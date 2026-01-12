# DSL File Comparison - EventWindow Refactoring

This folder contains the DSL definition files before and after the EventWindow refactoring that broke tests.

## Files

### Old Versions (Working State - Commit d37a842c3 "all tests pass")
- `Scheduling.ast.old` - Old AST with concrete EventWindow
- `Scheduling.edit.old` - Old editor definition
- `SchedulingParser.edit.old` - Old parser definition

### New Versions (Breaking Changes - HEAD before revert)
- `Scheduling.ast.new` - New AST with abstract EventWindow and subclasses
- `Scheduling.edit.new` - New editor definition
- `SchedulingParser.edit.new` - New parser definition

## Key Differences

### EventWindow Changes
**Old (working):**
```typescript
concept EventWindow {
    daysBefore: Days;
    daysAfter: Days;
    complianceWindow?: ComplianceWindow;
}
```

**New (breaking):**
```typescript
abstract concept EventWindow {
}

concept NoRecommendedWindow base EventWindow {
}

concept RecommendedWindowOf base EventWindow {
    daysBefore: Days;
    daysAfter: Days;
}

concept RecommendedBeforeOf base EventWindow {
    daysBefore: Days;
}

concept RecommendedAfterOf base EventWindow {
    daysAfter: Days;
}
```

### TimeAmount Changes
**Old (working):**
```typescript
concept TimeAmountPart {
    operator: SimpleOperators = SimpleOperators:plus;
    timeAmount: TimeAmount;
}

concept TimeAmount {
    value: number;
    unit: TimeUnit = TimeUnit:days;
}
```

**New (breaking):**
```typescript
abstract concept TimeAmount {
    value: number;
    unit: TimeUnit = TimeUnit:days;
}

concept PlusTimeAmount base TimeAmount {
}

concept MinusTimeAmount base TimeAmount {
}
```

### EventSchedule Changes
**Old (working):**
```typescript
concept EventSchedule {
    eventStart?: EventStart;
    eventWindow?: EventWindow;
    eventRepeat?: RepeatExpression;
    eventTimeOfDay?: EventTimeOfDay;
}
```

**New (breaking):**
```typescript
concept EventSchedule {
    eventStart: EventStart;        // Now REQUIRED
    eventWindow: EventWindow;       // Now REQUIRED (and abstract)
    complianceWindow: ComplianceWindow;  // Moved from EventWindow
    eventTimeOfDay: EventTimeOfDay;
    eventRepeat: RepeatExpression;
}
```

## Why These Changes Broke Tests

1. **Abstract Concepts Cannot Deserialize from JSON**
   - Freon's `FreLionwebSerializer` cannot instantiate abstract concepts
   - Old JSON files have `EventWindow` instances that can't be created

2. **Required vs Optional Properties Changed**
   - Old data has optional `eventWindow`, new schema requires it
   - Old data has optional `eventStart`, new schema requires it

3. **Structure Changes**
   - `ComplianceWindow` moved from `EventWindow` to `EventSchedule`
   - `TimeAmountPart` wrapper removed, operator embedded in type name

## Migration Path

To reintroduce these changes safely, use the dual-schema migration approach documented in `DSL_REVERT_AND_MIGRATION_PLAN.md`.

## Date Created
2026-01-12

## Purpose
Preserve the refactored DSL for future migration implementation while maintaining a working baseline.
