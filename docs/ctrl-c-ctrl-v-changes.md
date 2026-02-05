# Ctrl+C / Ctrl+V for List Items — What Changed

## Summary

A single file was changed to make Ctrl+C and Ctrl+V work for copying and pasting AST-level list items (Events, Tasks, Steps, etc.) when focus is inside a text field within a list item.

**File changed:** `packages/core/src/ast-utils/AstActionExecutor.ts`

No changes were needed to `FreonComponent.svelte` or `TextComponent.svelte`.

## How the Existing Keyboard Flow Works

Freon already had Ctrl+C/V/X wired up. Two components cooperate:

1. **TextComponent.svelte** — handles keydown when focus is in a text input field.
   When Ctrl+C/V/X is pressed inside a text field, it sets `shouldBeHandledByBrowser = true`
   and returns, allowing the browser's native clipboard events (oncopy/onpaste/oncut) to
   handle text-level copy/paste within that field.

2. **FreonComponent.svelte** — handles keydown events that bubble up from child components.
   When Ctrl+C/V/X arrives here, it checks `shouldBeHandledByBrowser`. If `false`, it calls
   `AstActionExecutor.copy()` / `.paste()` / `.cut()` for AST-level copy/paste. If `true`,
   it skips (the browser handles it as text).

The key gate: when focus is in a text field, `shouldBeHandledByBrowser` is set to `true`,
so FreonComponent's AST copy/paste is skipped. When focus is NOT in a text field (e.g.,
clicking on a non-text part of a list item), `shouldBeHandledByBrowser` stays `false` and
AST copy/paste fires.

## The Problem with paste()

`AstActionExecutor.paste()` needed to figure out WHERE to paste the copied element. It did
this by checking the type of `editor.selectedBox.parent`:

- If `selectedBox` is an `ActionTextBox` inside an `ActionBox` → paste into that action's property
- If `selectedBox.parent` is a `ListBox` → paste into the list after the current item

The problem: when focus is on a non-text box inside a list item, the `selectedBox`'s
**immediate parent** is often a layout box (HorizontalListBox, VerticalListBox, etc.),
NOT the ListBox itself. The ListBox is further up the box tree. So the paste would fall
through to the "cannot paste here" error message.

## What Was Changed

### Added: `findListBoxAncestor()` method

```typescript
private findListBoxAncestor(box: Box): Box | null {
    let current: Box | null = box.parent;
    while (current) {
        if (isListBox(current)) {
            return current;
        }
        current = current.parent;
    }
    return null;
}
```

This walks up the box parent chain until it finds a ListBox, or returns null if there isn't one.

### Changed: `paste()` method

The original code had two branches:

```
if (isActionTextBox(selectedBox))       → paste into action
else if (isListBox(selectedBox.parent)) → paste into list
else                                    → "cannot paste here"
```

The second branch only checked the immediate parent. It was replaced with:

```
if (isActionTextBox(selectedBox))       → paste into action
else
    listBox = findListBoxAncestor(selectedBox)
    if (listBox)                        → paste into list
    else                                → "cannot paste here"
```

Now any box that is a descendant of a ListBox (at any depth) can be the paste target.

## How Copy/Paste Works End-to-End

### Copy (Ctrl+C)

1. User clicks on a list item (e.g., an Event name field)
2. `editor.selectedElement` is set to the Event node (FreNode)
3. User presses Ctrl+C while NOT in a text field (or focus leaves the text field first)
4. `shouldBeHandledByBrowser` is `false`
5. FreonComponent calls `AstActionExecutor.copy()`
6. `copy()` deep-clones the Event via `selectedElement.copy()` and stores it in `editor.copiedElement`

### Paste (Ctrl+V)

1. User clicks on another list item (e.g., a different Event)
2. User presses Ctrl+V
3. FreonComponent calls `AstActionExecutor.paste()`
4. `paste()` gets `editor.copiedElement` (the cloned Event)
5. `paste()` gets `editor.selectedBox` and its associated `node`
6. `findListBoxAncestor(selectedBox)` walks up the box tree to find the ListBox
7. Type conformance check: does the copied element's type match the list's expected type?
8. If yes: splices the copied element into the list after the current item's index
9. A fresh copy of the pasted element is stored in `editor.copiedElement` for subsequent pastes

### Cut (Ctrl+X)

Same as copy, but also removes the element from its parent list via `deleteElement()`.

## Important Notes

- **Text copy/paste still works**: When focus is in a text input field, `shouldBeHandledByBrowser`
  is `true`, so the browser handles Ctrl+C/V as normal text operations. AST copy/paste only
  fires when NOT inside a text field.

- **Right-click context menu still works**: The context menu copy/paste in `ListUtil.ts` is
  unchanged. It operates independently via `copyListElement()` / `pasteListElement()` but
  uses the same `editor.copiedElement` storage, so items copied via context menu can be
  pasted via Ctrl+V and vice versa.

- **Type checking**: Paste enforces type conformance. You can only paste an Event into an
  events list, a Task into a tasks list, etc. Subtypes are allowed.

- **Mac Cmd key**: Only Ctrl+C/V is supported (not Cmd+C/V). The existing Freon framework
  checks `event.ctrlKey` only. Mac Cmd key support would require additional changes to both
  `FreonComponent.svelte` and `TextComponent.svelte` to handle the different event flow
  (Cmd triggers native ClipboardEvents rather than just keydown events).
