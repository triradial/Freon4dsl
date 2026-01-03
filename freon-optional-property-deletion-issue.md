# Issue: Optional Properties Wrapped in OptionalBox2 Cannot Be Selected/Deleted When on Same Line as Text

## Problem Description

When optional properties are projected using `[? ... ]` syntax with text labels on the same line, the generated box provider wraps them in a `horizontalLayout` with `{ selectable: false }`. This prevents users from selecting and deleting the optional property boxes, even though the properties themselves are optional and should be deletable.

## Example

Given this projection definition:
```
EventSchedule {
    [
        First scheduled ${eventStart} 
        [? ${eventWindow} ] 
        [? and then repeats ${eventRepeat} ]
        [? limited to ${eventTimeOfDay} ]
    ] 
}
```

**Observed Behavior:**
- `eventWindow` (single property on its own line) → ✅ **Can be selected and deleted**
- `eventRepeat` (property with label "and then repeats" on same line) → ❌ **Cannot be selected or deleted**
- `eventTimeOfDay` (property with label "limited to" on same line) → ❌ **Cannot be selected or deleted**

## Root Cause

In `BoxProviderTemplate.generateLine()` (line 360), when a projection line contains multiple items, they are wrapped in a `horizontalLayout` with `{ selectable: false }`:

```typescript
if (line.items.length > 1) {
    // surround with horizontal box
    result = `BoxFactory.horizontalLayout(${elementVarName}, "${boxLabel}-hlist-line-${index}", '', [ ${result} ], { selectable: false } ) `;
}
```

When optional properties are wrapped in `OptionalBox2`, the inner content (which includes the `horizontalLayout`) is created with `selectable: false`, preventing selection and deletion of the property boxes inside.

**Generated Code Example:**
```typescript
BoxFactory.optional2(
    this._node as EventSchedule,
    "optional-eventRepeat",
    () => !!(this._node as EventSchedule).eventRepeat,
    BoxFactory.horizontalLayout(  // ← This has { selectable: false }
        this._node as EventSchedule,
        "EventSchedule-optional-eventRepeat-hlist-line-0",
        "",
        [
            BoxUtil.labelBox(this._node as EventSchedule, "and then repeats", ...),
            BoxUtil.getBoxOrAction(this._node as EventSchedule, "eventRepeat", ...), // ← Cannot be selected
        ],
        { selectable: false },  // ← Problem: prevents selection
    ),
    false,
    BoxFactory.action(this._node, "optional-eventRepeat", "and then repeats"),
),
```

## Expected Behavior

Optional properties should be selectable and deletable regardless of whether they share a line with text labels. Users should be able to:
1. Select the property box (e.g., `eventRepeat`, `eventTimeOfDay`)
2. Delete it (e.g., by pressing Delete key or using a delete action)
3. The property should be set to `null`/`undefined` in the model

## Workaround

Putting the property on a separate line in the projection allows it to be selectable:

```
EventSchedule {
    [
        First scheduled ${eventStart} 
        [? ${eventWindow} ] 
        [? and then repeats 
           ${eventRepeat} ]  // ← Property on separate line
        [? limited to 
           ${eventTimeOfDay} ]  // ← Property on separate line
    ] 
}
```

However, this changes the visual layout and doesn't allow the text before the property to be deleted.

## Proposed Solution

1. **Option A**: Make property boxes inside `OptionalBox2` selectable even when wrapped in a `horizontalLayout` with `selectable: false`. The property box itself (created by `BoxUtil.getBoxOrAction`) should be selectable regardless of its parent container's selectable state.

2. **Option B**: When generating optional property projections, if the property is a single part/reference (not a list), don't wrap it in a `horizontalLayout` with `selectable: false`. Instead, make the property box directly selectable.

3. **Option C**: Add a mechanism to mark specific boxes as selectable even when inside non-selectable containers, or allow property boxes to "break out" of the selectable constraint.

## Related Code Locations

- `packages/meta/src/editordef/generator/templates/BoxProviderTemplate.ts:360` - Where `horizontalLayout` is created with `selectable: false`
- `packages/meta/src/editordef/generator/templates/boxproviderhelpers/ItemBoxHelper.ts:105-142` - Where optional projections are generated
- `packages/core/src/editor/boxes/OptionalBox2.ts` - The optional box implementation

