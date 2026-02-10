# TextComponent Dynamic Width Expansion Issue

## Problem Summary

Text input fields (both Freon's core `TextComponent` and custom components like `CustomNumericComponent`) were not dynamically expanding as users typed. The field would remain at its initial width while typing, and only resize correctly after the field lost focus (blur).

## Symptoms

1. **Field doesn't expand while typing**: When entering text/numbers, the input field stays the same width, causing text to scroll horizontally within the field
2. **Correct width on blur**: After tabbing out or clicking away, the field resizes to fit the content
3. **Multi-digit values not saved**: In some cases, only the first character typed was being saved to the model

## Root Causes

### Issues 1-3: CSS Issues (Affects Both Freon TextComponent and CustomNumericComponent)

These CSS issues affect both components since they share the same CSS classes.

### Issue 1: CSS Width Measurement Failure

The `TextComponent` uses a hidden `<span class="text-component-width">` element to measure text width. The technique:
1. Copy the input text to the hidden span
2. Read `span.offsetWidth` to get the rendered width
3. Apply that width to the input element

**Problem**: The CSS for `.text-component-width` used `left: -9999px` to position it off-screen. Some browsers optimize away layout calculations for elements positioned far off-screen, causing `offsetWidth` to return 0 or incorrect values.

**Solution**: Change the CSS to use `visibility: hidden` instead, which keeps the element in the layout flow for accurate measurement:

```css
.text-component-width {
  position: absolute;
  visibility: hidden;  /* Changed from left: -9999px */
  white-space: pre;    /* Preserve spaces for accurate measurement */
  /* ... other properties ... */
}
```

### Issue 2: CSS Property Mismatch

The `.text-component-width` span had different padding, margin, and line-height than `.text-component-input`, causing the width measurement to be inaccurate even when it worked.

**Solution**: Ensure the width-measuring span has identical styling to the input:

```css
.text-component-width {
  /* Match these exactly with .text-component-input */
  padding: 0.125rem 0.15rem 0 0.2rem;
  margin: 0px 1px 0px 2px;
  line-height: 20px;
  font-family: var(--font-family-sans);
  font-size: var(--standard-font-size);
  /* ... */
}
```

### Issue 3: Missing `position: relative` on Wrapper

The `.text-component-input-wrapper` element was missing `position: relative`, which is needed as the containing block for the absolutely positioned width span.

**Solution**: Add to CSS:

```css
.text-component-input-wrapper {
  position: relative;
}
```

### Issue 4: State Refresh During Editing (CustomNumericComponent Only)

This issue is specific to `CustomNumericComponent` and does NOT affect the Freon core `TextComponent`.

The Freon `TextComponent` uses a different mechanism - it only refreshes via `box.refreshComponent` which is called by the editor, not triggered by model changes during editing. The `CustomNumericComponent` added a `FreChangeManager` subscription to support undo/redo, which introduced this race condition.

When a custom component subscribes to `FreChangeManager` to react to model changes (for undo/redo support), the callback was firing during active editing. This caused the component to refresh its state from the model mid-keystroke, losing characters.

**Scenario**:
1. User types "1" → model updated → `changeCallback` fires → `refresh()` resets value to "1"
2. User types "2" (making "12") → but the state was just reset, so only "1" exists

**Solution**: Skip refresh callbacks while actively editing:

```typescript
const changeCallback = (delta: FrePrimDelta) => {
    // Skip refresh if we're actively editing
    if (isEditing) {
        return;
    }
    // ... handle external changes like undo/redo
};
```

## Files Changed

### `packages/webapp-crchub/src/styles/_dsl-app.css`

```css
.text-component-width {
  position: absolute;
  visibility: hidden;  /* Was: left: -9999px */
  white-space: pre;
  display: inline-block;
  margin: 0px 1px 0px 2px;
  padding: 0.125rem 0.15rem 0 0.2rem;  /* Match input padding */
  border: none;
  box-sizing: border-box;
  font-family: var(--font-family-sans);
  font-size: var(--standard-font-size);
  font-weight: normal;
  font-style: normal;
  line-height: 20px;  /* Match input line-height */
}

.text-component-input-wrapper {
  margin-left: 0.125rem;
  margin-right: 0.125rem;
  position: relative;  /* Added */
}
```

### `packages/webapp-crchub/src/components/custom/freon/CustomNumericComponent.svelte`

1. Updated `setInputWidth()` to use `textContent` instead of `innerHTML` and force layout:

```typescript
function setInputWidth() {
    if (widthSpan && inputElement) {
        let displayValue = inputElement.value;
        if (!displayValue || displayValue.length === 0) {
            displayValue = getPlaceholder() || "0";
        }
        widthSpan.textContent = displayValue;
        void widthSpan.offsetHeight;  // Force layout calculation
        const measuredWidth = widthSpan.offsetWidth;
        const newWidth = Math.max(measuredWidth + 4, 20) + 'px';
        inputElement.style.width = newWidth;
    }
}
```

2. Added `isEditing` guard in the `FreChangeManager` callback to prevent state reset during editing.

## Recommendations for Freon Core

Consider applying similar fixes to the core `TextComponent.svelte`:

1. Update `freon.css` to use `visibility: hidden` instead of `left: -9999px` for `.text-component-width`
2. Ensure padding/margin/font properties match between `.text-component-width` and `.text-component-input`
3. Add `position: relative` to the input wrapper element

## Testing

After applying fixes, verify:
- [ ] Input fields expand dynamically as characters are typed
- [ ] Multi-character values are saved correctly to the model
- [ ] Undo/redo still works correctly when not actively editing
- [ ] Field displays correct width after page reload
