Now I have a thorough understanding of the implementation. Here's the explanation:

---

## How the "Selectable Wrapper" Feature Works

### The Problem Being Solved

In Freon4DSL, when a `PartReplacerBox` has been populated with a value, the editor replaces the action/placeholder UI with the **projection of the child concept** (e.g., the "First schedule..." text visible in your screenshot). At that point, the original `PartReplacerBox` is no longer directly visible or interactive -- the user only sees the rendered child content. This creates two usability problems:

1. **No visual boundary**: There is no indication of where the replaceable property's content begins and ends within the surrounding language text.
2. **No way to delete**: The user has no mechanism to clear the property value and return to the selection/action state.

### The Solution: Two Components Working Together

The solution wraps the rendered child content in a custom **`SelectableWrapperComponent`** that provides hover/focus/selection highlighting and a delete button, while **`CustomActionsComponent`** orchestrates the lifecycle between "empty property" (action/dropdown mode) and "populated property" (wrapped view mode).

---

### Component 1: `CustomActionsComponent` -- The State Machine

This component replaces Freon's built-in `ActionComponent`. It handles a `PartReplacerBox` (or plain `ActionBox`) and operates in two modes:

**Mode A -- No value exists (action/dropdown mode):**
When the `PartReplacerBox` property is `null`/`undefined`, it creates an `ActionBox` using `BoxFactory.action()`, gathers the list of valid concept options via `actionBox.getOptions(editor)`, and presents them in a searchable dropdown. When the user selects an option, it executes `actionBox.executeOption(editor, option)`, which invokes `FreCreatePartAction` to instantiate the chosen concept and assign it to the property on the AST node.

**Mode B -- Value exists (view mode with selectable wrapper):**
When the property has a value, the component renders the value's projection (the child boxes) and **wraps them in `SelectableWrapperComponent`**. The key rendering logic is in the template:

```1119:1125:packages/webapp-crchub/src/components/custom/freon/CustomActionsComponent.svelte
            {#if isPartReplacerBox(box) && box.children && box.children.length > 0}
                <!-- First: Render children if they exist (Freon's default behavior) -->
                <SelectableWrapperComponent {box} {editor}>
                    {#each box.children as childBox}
                        <RenderComponentRecursive box={childBox} {editor} />
                    {/each}
                </SelectableWrapperComponent>
```

It tries multiple strategies to get the projection (children from the box, `editor.projection.getBox()`, or `getBoxProvider()`), and in every case, the rendered content is wrapped inside `<SelectableWrapperComponent>`.

The component also registers a `refresh` function on `box.refreshComponent`, so that when the wrapper deletes the value, the `CustomActionsComponent` can re-evaluate its state and switch back to Mode A (the dropdown).

---

### Component 2: `SelectableWrapperComponent` -- The Visual Wrapper

This is a generic wrapper `<div>` that goes **around** the rendered child projection. It provides:

#### 1. Visual Highlight on Hover/Focus/Selection

The wrapper tracks three states: `isHovered`, `isFocused`, and `isSelected`. A combined `showWrapper` derived value controls whether the highlight (a blue `outline`) and delete button are visible:

```126:126:packages/webapp-crchub/src/components/custom/freon/SelectableWrapperComponent.svelte
    let showWrapper = $derived((isSelected || isHovered || isFocused) && !hasActiveChild && !hasSelectedChild);
```

The CSS applies a visible outline when the `.selected` class is present:

```1424:1427:packages/webapp-crchub/src/styles/_dsl-app.css
.custom-selectable-wrapper.selected {
  outline: 4px solid var(--custom-wrapper-bg);
  outline-offset: 1px;
}
```

When the wrapper is **not** active, a dotted underline is shown on the content instead (via the `.with-underline` class), giving a subtle visual hint that the region is interactive.

#### 2. Nested Wrapper Awareness (Context API)

Since properties can be nested (e.g., a Schedule contains an EventStart which contains sub-properties), wrappers can be nested inside each other. To ensure only the **innermost** hovered/focused wrapper shows its highlight, the component uses Svelte's `setContext`/`getContext` API:

- Each wrapper **registers itself** with its parent wrapper via `parentContext.registerChild(wrapperId)`.
- When a child becomes active (hovered/focused), it notifies the parent via `parentContext.setChildActive(wrapperId, true)`.
- The parent suppresses its own highlight when `hasActiveChild` is true.

This is also reinforced with a CSS `:has()` selector as a fallback:

```1461:1463:packages/webapp-crchub/src/styles/_dsl-app.css
.custom-selectable-wrapper.selected:has(.custom-selectable-wrapper.selected) {
  outline: none;
}
```

#### 3. Delete Button (the "x" in your screenshot)

When `showWrapper` is true and the box is deletable (i.e., it's a `PartReplacerBox` or has a custom `onDelete` handler), a small "x" button is absolutely positioned to the left of the wrapper:

```301:312:packages/webapp-crchub/src/components/custom/freon/SelectableWrapperComponent.svelte
    {#if showDeleteButton}
        <button
            class="custom-selectable-wrapper-delete"
            onclick={handleDeleteClick}
            type="button"
            aria-label="Delete"
            title="Delete"
            tabindex="-1"
        >
            ×
        </button>
    {/if}
```

Clicking it (or pressing Delete/Backspace while the wrapper is focused) calls `deleteValue()`, which:
1. Calls `partReplacerBox.setPropertyValue(null)` inside `AST.changeNamed()` to clear the property on the AST node.
2. Calls `partReplacerBox.refreshComponent()` (which is the `refresh` function registered by `CustomActionsComponent`), causing the parent to detect the property is now empty and switch back to the dropdown/action mode.

#### 4. Selection Tracking

The wrapper also checks Freon's `editor.selectedBox` to determine if this box (or an ancestor in the box tree) is selected, using a parent-chain walk:

```107:114:packages/webapp-crchub/src/components/custom/freon/SelectableWrapperComponent.svelte
    function checkIfSelected(selected: Box, target: Box): boolean {
        let current: Box | null = selected;
        while (current) {
            if (current === target) return true;
            current = current.parent;
        }
        return false;
    }
```

---

### Summary for the Freon4DSL Team

The core idea is:

> **When a `PartReplacerBox` has a value, instead of simply rendering the child projection inline (which loses all visual association with the original replaceable property), we wrap the rendered children in a `SelectableWrapperComponent` that provides hover/focus/selection highlighting (outline border), a dotted underline hint when inactive, and a delete button to clear the value. This gives the user a visual boundary around the replaced content and a way to interact with (select, delete) the property even after it has been populated. A Svelte context-based parent/child registration system ensures that when wrappers are nested, only the innermost active one shows its highlight.**

This is entirely implemented at the **custom component layer** (external to Freon's core), using:
- Freon's `PartReplacerBox` API (`getPropertyValue`, `setPropertyValue`, `refreshComponent`, `propertyName`, `node`, `children`)
- Freon's `BoxFactory.action()` and `ActionBox.executeOption()` for creating the dropdown
- Freon's `RenderComponent` for recursively rendering child boxes
- Freon's `AST.changeNamed()` for undo/redo-safe mutations
- Svelte 5's `$state`, `$derived`, `$effect`, `setContext`/`getContext`, and Snippets (`{@render children()}`)