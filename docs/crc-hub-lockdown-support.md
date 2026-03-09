## 6. Freon4dsl project location and suggestions for adding lockdown support

### 6.1 Loading the Freon project

The Freon editor source can be inspected and modified in the **Freon4dsl** project, located **one level up from the CRC-Hub repo root**:

- **Path:** `../Freon4dsl` relative to CRC-Hub, or  
`\\wsl.localhost\Ubuntu\home\gmcgibbon64\projects\Freon4dsl` (WSL) /  
`/home/gmcgibbon64/projects/Freon4dsl` (Linux).
- CRC-Hub consumes Freon via the triradial fork tarballs (`@freon4dsl/core`, `@freon4dsl/core-svelte` from GitHub releases); the local Freon4dsl folder is the canonical source for that fork. You can open it in the same workspace or use `npm link` (see CRC-Hub `package.json` script `link-freon`) to develop against local Freon.

### 6.2 What exists in Freon today (from direct inspection)

- **FreEditor** ([Freon4dsl/packages/core/src/editor/FreEditor.ts](\wsl.localhost\Ubuntu\home\gmcgibbon64\projects\Freon4dsl\packages\core\src\editor\FreEditor.ts)): No `readOnly` or `editable` property. Has `NOSELECT` (used to block selection during undo). Methods like `deleteBox`, `deleteTextBox`, `selectElementForBox` do not check any read-only flag.
- **Box** ([Freon4dsl/packages/core/src/editor/boxes/Box.ts](\wsl.localhost\Ubuntu\home\gmcgibbon64\projects\Freon4dsl\packages\core\src\editor\boxes\Box.ts)): Has `selectable: boolean` and `isEditable(): boolean` (default `false`; overridden in leaf boxes like TextBox). No runtime-settable “editable” or “readOnly” that the app can flip when the user doesn’t have the lock.
- **FreonComponent** ([Freon4dsl/packages/core-svelte/src/lib/components/FreonComponent.svelte](\wsl.localhost\Ubuntu\home\gmcgibbon64\projects\Freon4dsl\packages\core-svelte\src\lib\components\FreonComponent.svelte)): Props come from `MainComponentProps` (only `editor`). All key handlers (Delete, Backspace, Ctrl-X/C/V/Z/Y, arrows, etc.) run unconditionally; there is no `readOnly` prop or guard.
- **RenderComponent**: Passes `editor` and `box` to children; no read-only context or prop.
- **TextComponent** ([Freon4dsl/packages/core-svelte/src/lib/components/TextComponent.svelte](\wsl.localhost\Ubuntu\home\gmcgibbon64\projects\Freon4dsl\packages\core-svelte\src\lib\components\TextComponent.svelte)): Uses `<input>` and `<span>`; no binding to a global “readOnly” or “editable” state.
- **FreComponentProps** ([Freon4dsl/packages/core-svelte/src/lib/components/svelte-utils/FreComponentProps.ts](\wsl.localhost\Ubuntu\home\gmcgibbon64\projects\Freon4dsl\packages\core-svelte\src\lib\components\svelte-utils\FreComponentProps.ts)): `MainComponentProps` is `{ editor: FreEditor }`; `FreComponentProps<T>` adds `box: T`. No `readOnly` or `editable`.

So lockdown cannot be implemented purely by “turning on” an existing Freon flag; it requires either app-only measures (custom components + overlay) or adding support in Freon as below.

### 6.3 Suggestions for adding lockdown support in Freon4dsl

If you want the editor to be fully lockable from a single switch (no overlay, no per-custom-component logic for built-in parts), the following additions in the **Freon4dsl** repo are suggested.

**1. Core – FreEditor**  

- **File:** `packages/core/src/editor/FreEditor.ts`  
- **Change:** Add an optional property, e.g. `readOnly: boolean = false`.  
- **Behavior:** When `readOnly` is true, mutation methods should no-op or skip: e.g. in `deleteBox`, `deleteTextBox`, and any other methods that modify the AST, add `if (this.readOnly) return;` at the start. Optionally, `selectElementForBox` could still work so that view-only users can navigate and expand/collapse (expand/collapse is view state only).  
- **Alternative:** Put `readOnly` on `FreEnvironment` instead of `FreEditor`, and have the editor read it from `this.environment` so that the same flag is available everywhere that has access to the environment.

**2. Core-svelte – FreonComponent**  

- **File:** `packages/core-svelte/src/lib/components/FreonComponent.svelte`  
- **Change:** Extend `MainComponentProps` (or the props used by FreonComponent) with an optional `readOnly?: boolean`. When `readOnly` is true (or when `editor.readOnly` is true if the flag lives on the editor), guard all key handlers that mutate: do not call `editor.deleteBox`, `AstActionExecutor.getInstance(editor).cut()`, `paste()`, `undo()`, `redo()`, etc. Navigation (arrows, select parent/child) can remain enabled so expand/collapse and selection still work.  
- **Propagation:** Either pass `readOnly` as a prop from the app into `<FreonComponent editor={dslEditor} readOnly={!$lockStore.hasLock} />`, or have the app set `dslEditor.readOnly = !hasLock` and let FreonComponent read `editor.readOnly`.

**3. Core-svelte – MainComponentProps / FreComponentProps**  

- **File:** `packages/core-svelte/src/lib/components/svelte-utils/FreComponentProps.ts`  
- **Change:** Add optional `readOnly?: boolean` to `MainComponentProps` (or a new context type) so that any component receiving `editor` can also know if the editor is in read-only mode.  
- **Alternative:** Do not add to props; have components that need it read `editor.readOnly` (once added on FreEditor). Then no prop change is needed, but every component that should react to read-only must remember to check `editor.readOnly`.

**4. Core-svelte – RenderComponent**  

- **File:** `packages/core-svelte/src/lib/components/RenderComponent.svelte`  
- **Change:** When rendering children, pass through `readOnly` (or they read from `editor.readOnly`). No structural change needed if children use `editor.readOnly`.

**5. Core-svelte – Primitive components (TextComponent, ListComponent, etc.)**  

- **Files:** e.g. `TextComponent.svelte`, `MultiLineTextComponent.svelte`, `ListComponent.svelte`, `BooleanCheckboxComponent.svelte`, and other components that allow user input.  
- **Change:** In each component, when `editor.readOnly` (or passed `readOnly`) is true: set HTML input/control to disabled or readonly (e.g. `<input readonly>`, `contenteditable="false"`, or `disabled` on buttons), and avoid calling into the editor’s mutation API (e.g. do not update box text or list items). This gives true “view only” for built-in Freon components without an overlay.

**6. Core – Box (optional)**  

- **File:** `packages/core/src/editor/boxes/Box.ts`  
- **Optional:** Add a getter `get editable(): boolean` that consults `this.root.editor?.readOnly` (or environment) and returns `false` when the editor is read-only, so that `firstEditableChild` and `isEditable()` can reflect read-only mode. This is only needed if you want navigation (e.g. “first editable child”) to skip focusing into fields when in read-only; otherwise the primitive components disabling input is enough.

**Summary of suggested Freon changes:** Add a single `readOnly` flag (on `FreEditor` or `FreEnvironment`), guard mutations in `FreEditor` and in `FreonComponent` key handlers, and in core-svelte primitive components set inputs to readonly/disabled when `readOnly` is true. Then CRC-Hub can set `dslEditor.readOnly = !$lockStore.hasLock` (or pass `readOnly` into `FreonComponent`) and get full lockdown including built-in components, while still allowing expand/collapse (view state) and, if desired, whitelisted attribute controls that you implement in the app.

---

## Verification against Freon4dsl source (direct inspection)

Verified with direct access to the Freon4dsl repo. Conclusion: **the plan is implementable as described.** Below is what was checked and any caveats.

### 1. Core – FreEditor (`packages/core/src/editor/FreEditor.ts`)

- **Confirmed:** No `readOnly` (or `editable`) property exists. Only `NOSELECT` is present (used during undo).
- **Mutation entry points:** The only AST-mutating methods are:
  - `deleteBox(box)` (lines 383–420): performs `AST.changeNamed("deleteBox", …)` and splice/set on model.
  - `deleteTextBox(box, deleteParent)` (lines 428–446): calls `deletePropertyForNode` inside `AST.changeNamed`.
- **Verification:** Adding `readOnly: boolean = false` and an early `if (this.readOnly) return;` at the start of `deleteBox` and `deleteTextBox` is straightforward. No other public methods modify the AST. `selectElementForBox`, `selectParent`, `selectNextLeaf`, etc. only change selection/view state and can remain active in read-only mode.

### 2. Core – Box (`packages/core/src/editor/boxes/Box.ts`)

- **Confirmed:** `selectable: boolean` and `isEditable(): boolean` (default `false`; overridden in leaf boxes like TextBox). No link from box to editor.
- **Optional “editable” getter:** The doc suggests `this.root.editor?.readOnly`. Currently `root` returns the top `Box`; boxes do not hold an `editor` reference. So either:
  - **Option A:** When the editor sets `_rootBox` (in the `auto` autorun), set a ref on that root box to the editor (e.g. `(this._rootBox as any).editor = this` or a proper typed property), then in `Box` add a getter that walks to `root` and returns `root.editor?.readOnly ?? false` for “editable”. Or
  - **Option B:** Omit the Box change and rely only on Svelte components (they already receive `editor` and can check `editor.readOnly`). Then `firstEditableChild` / `isEditable()` stay as-is; disabling inputs in primitives is enough.
- **Verification:** Optional step is possible with Option A; Option B is simpler and sufficient.

### 3. Core-svelte – FreonComponent (`packages/core-svelte/src/lib/components/FreonComponent.svelte`)

- **Confirmed:** Props from `MainComponentProps`: only `editor`. No `readOnly` prop or guard.
- **Key handler mutations:** All of the following are invoked unconditionally and must be guarded when read-only:
  - `editor.deleteBox(editor.selectedBox)` (Delete/Backspace)
  - `AstActionExecutor.getInstance(editor).undo()` / `redo()` (Ctrl-Z, Ctrl-Y, Alt-Backspace, etc.)
  - `AstActionExecutor.getInstance(editor).cut()` / `copy()` / `paste()` (Ctrl-X/C/V)
- **Navigation (keep enabled):** `editor.selectParent()`, `selectFirstLeafChildBox()`, `selectPreviousLeafIncludingExpressionPreOrPost()`, `selectNextLeafIncludingExpressionPreOrPost()`, `selectBoxBelow()`, `selectBoxAbove()` — all selection-only.
- **Verification:** Adding `readOnly` (from prop or `editor.readOnly`) and wrapping the mutation branches in `if (!readOnly)` (or `if (!editor.readOnly)`) is straightforward. Copy can remain enabled in read-only if desired (view-only copy).

### 4. MainComponentProps / FreComponentProps (`packages/core-svelte/src/lib/components/svelte-utils/FreComponentProps.ts`)

- **Confirmed:** `MainComponentProps` is `{ editor: FreEditor }`; `FreComponentProps<T>` adds `box: T`. No `readOnly`.
- **Verification:** Adding optional `readOnly?: boolean` to `MainComponentProps` is trivial. Alternatively, components can use `editor.readOnly` only (no prop change).

### 5. RenderComponent (`packages/core-svelte/src/lib/components/RenderComponent.svelte`)

- **Confirmed:** Receives `editor` and `box`; passes `{ editor, box }` to all child components (ElementComponent, BooleanCheckboxComponent, ListComponent, TextComponent, etc.). No `readOnly` passed.
- **Verification:** If primitives use `editor.readOnly`, no change needed. If you add `readOnly` to props, you can pass it through here for consistency.

### 6. Primitive / input components

- **TextComponent.svelte:** Uses `<input>` and `<span contenteditable="true">`. Mutations: `box.setText(text)` in `endEditing()`, `editor.deleteTextBox(box, box.deleteWhenEmpty)` in `onInput()`, plus paste/cut/delete in input and `insertAtSelection` / `deleteSelection`. When `editor.readOnly` is true: disable the `<input>` (e.g. `readonly` or `disabled`) and the span (e.g. `contenteditable="false"`), and in `startEditing` / `onMousedown` / `onInput` / `endEditing` / paste/cut/delete, skip any path that calls `box.setText`, `editor.deleteTextBox`, or modifies text. **Verified:** Possible; component already has `editor` in props.
- **MultiLineTextComponent.svelte:** Calls `box.setText(text)`; same pattern: when read-only, set text control to readonly/disabled and skip `setText`. **Verified:** Possible.
- **ListComponent.svelte:** Uses `AST.changeNamed("ListComponent.Enter", () => { action.execute(…) })` and provides context menu items (which invoke `item.handler(…, editor)`). When read-only: do not execute list actions (e.g. add/remove items) and optionally hide or disable context menu. **Verified:** Possible; need to guard action execution and/or context menu by `editor.readOnly`.
- **BooleanCheckboxComponent, BooleanRadioComponent, SwitchComponent, InnerSwitchComponent, NumericSliderComponent, LimitedCheckboxComponent, LimitedRadioComponent:** Toggle/set value and call `editor.selectElementForBox(box)`. When read-only: set control to `disabled` and skip any handler that updates the model (e.g. checkbox toggle). **Verified:** Possible.
- **ButtonComponent:** Calls `box.executeAction(editor)`; when read-only this should no-op or be disabled. **Verified:** Possible.
- **TextDropdownComponent:** Calls `box.textHelper.setText(text)`, `box.executeOption(editor, selected)`, `box.tryToMatchRegExpAndExecuteAction(text, editor)`. When read-only: disable dropdown editing and option execution. **Verified:** Possible.
- **TableCellComponent / GridCellComponent:** Use `AST.changeNamed` and custom keyboard shortcuts; guard execution when read-only. **Verified:** Possible.

### 7. Context menu (`packages/core-svelte/src/lib/components/ContextMenu.svelte`)

- **Not in original plan:** Context menu calls `item.handler(editor.selectedBox.node, elementIndex, editor)`. Handlers can perform arbitrary mutations (e.g. delete, add sibling).
- **Verification:** To get full lockdown, either: (a) hide or disable the context menu when `editor.readOnly` is true, or (b) have each menu item’s handler check `editor.readOnly` and no-op. Option (a) in ContextMenu is a single place and is straightforward.

### 8. Other call sites

- **TextComponentHelper.ts:** Calls `editor.deleteTextBox(this._myBox, true)` (e.g. backspace in text). Once `deleteTextBox` is guarded in FreEditor, this path is automatically safe; optionally add an early return in the helper when `editor.readOnly` to avoid unnecessary work.
- **Drag-and-drop:** If list/table drag-drop or similar calls editor or AST mutations, those need to be guarded or disabled when read-only (same pattern as above).

### Summary

| Item | Plan | Verified |
|------|------|----------|
| FreEditor `readOnly` + guard `deleteBox` / `deleteTextBox` | Yes | Yes; only two mutation methods, clean to guard. |
| FreonComponent key handlers | Guard mutations, keep navigation | Yes; single `onKeyDown`, clear split between mutation and selection. |
| MainComponentProps / FreComponentProps | Optional `readOnly` or use `editor.readOnly` | Yes; trivial. |
| RenderComponent | Pass through or use `editor.readOnly` | Yes; no structural change needed. |
| TextComponent, MultiLine, List, Boolean*, etc. | readonly/disabled + skip mutation calls | Yes; all have `editor` (or can get it); inputs can be disabled. |
| Box optional `editable` getter | Optional; may need editor ref on root | Possible with one-time wiring of editor on root box; optional. |
| Context menu | Not in plan | Should be disabled or no-op when read-only; easy to add. |

**Conclusion:** The lockdown plan is **possible and accurate** with direct access to the source. No structural blockers were found. The only addition suggested beyond the plan is handling the **context menu** (hide or no-op when read-only).

---

## readOnly support and debugging (for CRC-Hub)

### API summary

- **FreEditor** (`packages/core`): Public property `readOnly: boolean = false`. Set by the app (e.g. `dslEditor.readOnly = !hasLock`). Mutation methods (`deleteBox`, `deleteTextBox`) no-op when `readOnly` is true.
- **FreonComponent**: Accepts optional prop **`readOnly?: boolean`** (from `MainComponentProps`). Effective read-only is `readOnlyProp === true || editor.readOnly === true`. Passes **`readOnly={isReadOnly}`** into **RenderComponent**.
- **RenderComponent**: Accepts optional **`readOnly`** from `FreComponentProps`, passes it to **ElementComponent** and to **TextComponent** (and uses `editor?.readOnly` when prop is not set).
- **ElementComponent**: Accepts optional **`readOnly`**, passes it to child **RenderComponent**.
- **TextComponent** (TextBox / single-line text): Accepts optional **`readOnly`** from `MainComponentProps`. Effective value is **prop if provided, else `editor?.readOnly`**. When true: no focus-to-edit (click only selects), `<input readonly>`, `<span contenteditable="false">`, no `box.setText` / `editor.deleteTextBox` / paste/cut that mutate.
- **TextDropdownComponent**: Passes **`readOnly={isReadOnly}`** into its inner **TextComponent**.

CRC-Hub should continue to pass **`readOnly={!hasLock}`** to **`<FreonComponent>`** and set **`editor.readOnly = !hasLock`**. Both paths are supported; the value flows from FreonComponent → RenderComponent → ElementComponent (for nested boxes) and → TextComponent.

### Dev-only console logging

All logs use the prefix **`[Freon readOnly]`** so you can filter in the browser console. Logs run only when **`import.meta.env?.DEV`** is true (Vite/SvelteKit development).

| Location | When it logs | What it logs |
|----------|----------------|--------------|
| **FreonComponent.svelte** | `$effect` when props/editor change | `readOnlyProp`, `editor.readOnly`, `effective isReadOnly` |
| **TextComponent.svelte** | `$effect` when box/readOnly state is available | `boxId`, `readOnlyProp`, `editor.readOnly`, `effective isReadOnly`, and whether it is **blocking editing** or **allowing editing** |

### What to expect in the browser (study design open, without edit lock)

- **FreonComponent**: e.g. `[Freon readOnly] FreonComponent: readOnlyProp= true editor.readOnly= true effective isReadOnly= true`
- **TextComponent** (for each TextBox): e.g. `[Freon readOnly] TextComponent (TextBox): boxId= ... readOnlyProp= true editor.readOnly= true effective isReadOnly= true → blocking editing (no focus-to-edit, input readonly, no setText/delete)`

If you see `effective isReadOnly= false` at FreonComponent or TextComponent while the lock is not held, align CRC-Hub so that `hasLock` is false and both `readOnly={!hasLock}` and `editor.readOnly = !hasLock` are set accordingly.