# Plan: Add Reference Support to CustomActionsComponent

**Status: IMPLEMENTED**

## Summary

CustomActionsComponent currently handles `ActionBox` and `PartReplacerBox` for creating new concept instances (parts/owned children). To support Freon references, it needs to also handle `RefReplacerBox` which works with `FreNodeReference` objects pointing to existing elements.

## Key Differences: Parts vs References

| Aspect | Parts (Current) | References (To Add) |
|--------|----------------|-------------------|
| Box Type | `PartReplacerBox` | `RefReplacerBox` |
| Type Check Function | `isPartReplacerBox(box)` | `isRefReplacerBox(box)` |
| Value Type | `FreNode` subclass | `FreNodeReference<T>` |
| Creation Action | `FreCreatePartAction` (creates new instance) | `FreCustomAction` (creates reference to existing) |
| Options Source | Concept subtypes | Scoper's visible nodes |
| Property Kind | `propertyKind === "part"` | `propertyKind === "reference"` |
| Value Check | `val.freLanguageConcept() === type` | `val.typeName === type` |

## Required Changes

### 1. Add Imports
```typescript
import {
    // Existing imports...
    isRefReplacerBox,
    RefReplacerBox,
    FreNodeReference,
    FreCustomAction,
} from "@freon4dsl/core";
```

### 2. Add Reference Box Detection
```typescript
// Line ~38, add alongside isPartReplacer
let isPartReplacer = $derived(isPartReplacerBox(box));
let isRefReplacer = $derived(isRefReplacerBox(box));
let isAnyReplacer = $derived(isPartReplacer || isRefReplacer);
```

### 3. Modify Value Detection (around line 47-60)
```typescript
let currentPropertyValue = $derived.by(() => {
    propertyValueVersion;
    if (isPartReplacerBox(box) && box.propertyName) {
        // Existing part logic...
        const directValue = box.node[box.propertyName];
        if (directValue && typeof directValue === 'object' && 'freLanguageConcept' in directValue) {
            return directValue;
        }
        return box.getPropertyValue();
    }
    // NEW: Handle references
    if (isRefReplacerBox(box) && box.propertyName) {
        const refValue = box.getPropertyValue();
        // For references, check if it's a FreNodeReference
        if (refValue && typeof refValue === 'object' && 'referred' in refValue) {
            return refValue; // FreNodeReference
        }
        return refValue;
    }
    return null;
});
```

### 4. Modify ActionBox Creation for References (around line 171-303)
For references, instead of creating `FreCreatePartAction` options, get options from the scoper:

```typescript
$effect(() => {
    propertyValueVersion;
    if (isActionBox(box)) {
        actionBox = box;
    } else if (isPartReplacerBox(box)) {
        // Existing part logic...
    } else if (isRefReplacerBox(box)) {
        // NEW: Reference logic
        const propertyName = box.propertyName;
        const node = box.node;
        const hasValueNow = box.getPropertyValue() !== null && box.getPropertyValue() !== undefined;

        if (hasValueNow) {
            actionBox = null;
            return;
        }

        // Create ActionBox with reference options from scoper
        actionBox = BoxFactory.action(
            node,
            `${propertyName}-ref-action`,
            box.findParam("placeholder") || `+ ${propertyName}`,
            {
                propertyName: propertyName
                // NOTE: No conceptName - this tells ActionBox.getOptions() to use addReferences()
            }
        );
    }
    // ...
});
```

### 5. Handle Reference Selection (modify selectItem around line 502-596)
For references, the action creates `FreNodeReference` instead of new concept instance:

```typescript
function selectItem(item: typeof listboxData[0]) {
    if (item && item.option) {
        if (actionBox) {
            if (isRefReplacerBox(box)) {
                // Reference selection - action is FreCustomAction that creates FreNodeReference
                AST.changeNamed(`CustomActionsComponent: Set reference to ${item.label}`, () => {
                    // Execute the FreCustomAction which sets the reference
                    actionBox.executeOption(editor, item.option);
                });
            } else {
                // Existing part creation logic...
                AST.changeNamed(`CustomActionsComponent: Create ${item.label}`, () => {
                    actionBox.executeOption(editor, item.option);
                });
            }
            // ... rest of existing logic
        }
    }
}
```

### 6. Update Template Conditions (around line 1057-1289)
Add reference boxes to the condition checks:

```typescript
{#if actionBox || (isPartReplacerBox(box) && ...) || (isRefReplacerBox(box) && ...)}
```

### 7. Value Display for References
When showing a selected reference value, display the referred element's name:

```typescript
{#if shouldShowValue}
    {#if isRefReplacerBox(box) && nodeValueToUse}
        <!-- Reference value: show referred element name -->
        <SelectableWrapperComponent {box} {editor}>
            <span class="custom-select-text">
                {nodeValueToUse.name || nodeValueToUse.referred?.name || 'Unknown reference'}
            </span>
        </SelectableWrapperComponent>
    {:else if isPartReplacerBox(box) ...}
        <!-- Existing part display logic -->
    {/if}
{/if}
```

## Critical Files to Modify

1. **`/packages/webapp-crchub/src/components/custom/freon/CustomActionsComponent.svelte`** - Main component

## Files to Reference (read-only)

- `@freon4dsl/core` - ActionBox.ts (lines 71-78, 164-200 for addReferences)
- `@freon4dsl/core` - RefReplacerBox.ts
- `@freon4dsl/core` - FreNodeReference.ts
- `@freon4dsl/core` - BoxFactory.ts (reference() method)

## Verification

1. Find or create a property that uses a reference type (not part type)
2. Test that the dropdown shows existing elements from the scoper (not concept creation options)
3. Test selecting a reference creates `FreNodeReference` pointing to selected element
4. Test that the selected reference displays the referred element's name
5. Test clearing/changing a reference works correctly

## Scope Decision

**Single references only** - Start with `RefReplacerBox` support. `RefListReplacerBox` support can be added later if needed.

## Implementation Summary

The changes enable CustomActionsComponent to:
1. Detect when it receives a `RefReplacerBox` (single reference property)
2. Generate options from the scoper (existing elements to reference) instead of concept subtypes
3. Create `FreNodeReference` objects instead of new concept instances
4. Display the referred element's name when a reference is selected

## Implementation Completed

All changes have been implemented in `/packages/webapp-crchub/src/components/custom/freon/CustomActionsComponent.svelte`:

1. **Import added**: `isRefReplacerBox` from `@freon4dsl/core`
2. **Reference detection**: Added `isRefReplacer` derived state
3. **Value detection**: Updated `currentPropertyValue`, `directNodeValue`, and `hasDirectValue` to handle `FreNodeReference` objects (check for `'referred'` property)
4. **ActionBox creation**: Added `else if (isRefReplacerBox(box))` branch that creates ActionBox with only `propertyName` (no `conceptName`) to trigger `addReferences()` for scoper-based options
5. **Selection handling**: Updated `selectItem` to use appropriate action description for references
6. **Template conditions**: Updated main `{#if}` condition to include `isRefReplacerBox(box)`
7. **Value display**: Added template branch to display reference value using `nodeValueToUse.name || nodeValueToUse.referred?.name`
8. **Refresh/clear**: Updated `refresh()` and `onMouseDown()` to handle reference clearing

The implementation compiles without errors. Testing with actual reference properties is needed to verify full functionality.
