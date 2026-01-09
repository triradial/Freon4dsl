Search files...
```bash
git log --oneline --decorate --graph --all -n 20 | cat
```
```bash
git log -p -n 10 | cat
```
Here’s a consolidated and improved summary of the recent changes, combining your notes and the actual commit history:

---

## **Summary of Recent Changes**

### **General/Structural**
- **Imports & Types**
  - Changed imports in `core` from `$lib` to relative `../` paths.
  - Explicitly imported types using `import type { ... }` where necessary, especially for types like `RTBoolean`.
  - Ensured all types in core are imported as types, as required by Svelte 5 and TypeScript best practices.

- **Event Handling**
  - Updated all Svelte event handlers from `on:click` to `onclick` to comply with Svelte 5 runes mode [[memory:586128]].

- **Component/Style Adjustments**
  - Removed `<style>` tags from `dropdown-component-container` to prevent style leakage into `main.css`.
  - Added a `fullwidth` attribute to `RenderComponent` for layout flexibility.
  - In `LabelComponent`, enforced `nowrap` for consistent label rendering.
  - In `TextComponent`, ensured the same class is used on two levels for styling consistency.

- **Unused Imports**
  - Cleaned up unused imports, especially in `core-svelte`.

### **Functional/Logic**
- **Patient History & Selectable Logic**
  - Refactored the patient history UI logic:
    - Patient history is now only displayed under a single patient.
    - Entire histories are added by adding a patient.
    - Added delete icons to Patient History items.
    - Updated logic to ensure boxes and lists are not selectable if not intended (e.g., `selectable: false` on certain boxes).
    - Enhanced logic to ignore "selected" state if a box is not selectable.
    - Fixed issues where the first component would not re-render the value in the input after `setFocus`.

- **Undo/Redo**
  - Fixed undo-redo logic in the study configuration editor.

- **Menu & Layout**
  - Fixed menu positioning by exposing viewport and recalculating as needed.
  - Updated layout and grid logic for better UI consistency.

- **Endpoint & Naming**
  - Standardized endpoint names (e.g., `getUnitList` → `getModelUnitList`).

- **JSON/Serialization**
  - In JSON output, removed `-default` from key names for fields.
  - Updated patient and study data files to match new model structure.

### **Other Notable Fixes**
- **Expand/Collapse**
  - Added `cssClass="w-full"` to `RenderComponent` in `ExpandCollapseWrapperComponent.svelte` for full-width rendering.
- **Tabs**
  - Changed tab label from "schedule" to "Patient Info" for clarity.
- **Singleton Pattern**
  - Fixed singleton instance check in `EditorRequestsHandler` to handle both `null` and `undefined`.

---

## **Key Technical Upgrades**
- **Svelte 5 Runes Mode**
  - All reactive statements now use `$derived` or `$effect` instead of `$:`.
  - All event handlers use `onclick` instead of `on:click`.

- **TypeScript**
  - All types are explicitly imported as types to avoid runtime import issues.

---

## **Summary Table (from your notes, updated)**

| Area/Component                | Change/Improvement                                                                 |
|-------------------------------|------------------------------------------------------------------------------------|
| Imports                       | Use relative paths, explicit type imports                                          |
| Event Handlers                | `on:click` → `onclick` (Svelte 5 runes)                                           |
| Dropdown Component            | Removed `<style>` to prevent global leakage                                        |
| RTObject                      | Explicitly imported as type                                                        |
| Accessibility (ally)          | All should be changed to `_` (underscore)                                          |
| Endpoint Names                | Standardized (e.g., `getUnitList` → `getModelUnitList`)                            |
| Unused Imports                | Cleaned up in core-svelte                                                          |
| Patient History UI            | Refactored for single-patient display, added delete icons, improved selectable     |
| Undo/Redo                     | Fixed logic                                                                        |
| Menu Positioning              | Fixed viewport exposure and recalculation                                          |
| RenderComponent               | Added `fullwidth` attribute, ignore selected if not selectable                     |
| LabelComponent                | Enforced `nowrap`                                                                 |
| TextComponent                 | Consistent class usage on two levels                                               |
| Singleton Pattern             | Fixed instance check for `null` and `undefined`                                    |
| JSON Serialization            | Removed `-default` from field keys                                                 |

---
