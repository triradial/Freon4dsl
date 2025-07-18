# **Itemized List of Changes Made in CRCHub**

## **CORE**

### **1. Box Types Enahanced**

**Box Types:**
  - **ItemGroupBox**: Grouped items with expand/collapse functionality
  - **ItemGroupBox2**: Enhanced ItemGroupBox with selection capabilities  
  - **ListGroupBox**: Grouped lists with add/CRUD/expand capabilities
  - **MultiLineTextBox2**: Enhanced multi-line text box implementation

**Covered:**
  - Added Caching Support
  - Added Factory Methods
  - Added Utility Methods**
  - Export Updates
  - Internal Exports
  - Added type guard functions for new box types

**Enhanced Properties**: New box types include properties for:
  - Expand/collapse functionality (`isExpanded`, `canExpand`)
  - CRUD operations (`canCRUD`, `canAdd`, `canDelete`)
  - User interaction (`canUnlink`, `canShare`, `canDuplicate`)
  - Visual state (`isDraggable`, `isRequired`)


### **2. Imports**
  - Explicitly imported types using `import type { ... }` where necessary, especially for types like `RTBoolean`, e.g. FreEditor
  - Relative Imports changed in `core` from `$lib` to relative `../` paths:
    - `import { ... } from "../ast/index.js"`
    - `import { ... } from "../../util/index.js"`
    - Consistent with ES module standards
  - Removed redundant imports

### **3. Models**
  - Standardized Endpoints: Changed endpoint names to match conventions, e.g. getUnitList → getModelUnitList, putModelUnit  → saveModelUnit in ServerCommunication.ts
  - Added parameter type and changed from folder/name to model/unit as paramater names in ServerCommunication

  ### **4. Notes**
  - Detect changes to the model and units in the editor to provide autosaving by subscribing to `FreChangeManager`

## **CORE-SVELTE** 

### **1. Enhanced New Components**

**Components:**
  - **ItemGroupComponent**: Grouped items with expand/collapse functionality
  - **ItemGroupComponent2**: Enhanced ItemGroupBox with selection capabilities  
  - **ListGroupComponent**: Grouped lists with add/CRUD/expand capabilities
  - **MultiLineTexComponent2**: Enhanced multi-line text box implementation

**Covered:**
  - Updated to use `$props()` to pass variables
  - Updated to use `$state()`, `derived()` and `$effect()`  for state management
  - Changed from `on:{event}` to `on{event}` style e.g `on:click` to `onclick`
  - Updated item group to use newest structure of text component

### **2. Existing Components**
  - Added `cssClass` as parameters extension so that the controls can be altered through an external css class
  - Added cssClass + modifiers to certain more complex components, so that they can be modified independently e.g. `{cssClass}-container`, `{cssClass}-input`, `{cssClass}-text`
  - Added new components to `renderComponent` for `MultiLineTextComponent2`, `ItemGroupComponent`, `ItemGroupComponent2`, `ListGroupComponent`
  - Added fullwidth property and logic to `renderComponent`, so that as the container of certain components, so it can be rendered full width
  - **LabelComponent**: Enforced `nowrap` styling for consistent label rendering
  - **DropdownComponent**: Removed `<style>` tags to prevent style leakage into global CSS
  - **TextComponent**: Ensured consistent class usage on multiple levels for styling consistency
  - **Reactive State**: All components now use `$state()` for local state variables
  - **Derived Values**: Computed values use `$derived()` for automatic reactivity
  - **Side Effects**: All side effects use `$effect()` for proper lifecycle management

### **3. Imports**
  - Explicitly imported types using `import type { ... }` where necessary, especially for types like `RTBoolean`.
  - Relative Imports changed in `core-svelte` from `$lib` to relative `../` paths:
    - `import { ... } from "../ast/index.js"`
    - `import { ... } from "../../util/index.js"`
    - Consistent with ES module standards
  - Removed redundant imports

### **4. Context Menu**
  - Updated `ContextMenu` to use the `viewport` for positioning
  - Added `viewport` to `allStores`

### **5. Limited Lists**
  - Added scope to the custom scoper
  - Enhanced the `UtilLimitedHelper` to handle key/name pairs

### **6. Package Configuration**
- **Svelte Version**: Updated to require Svelte 5.0.0 as peer dependency
- **Build Tools**: Updated to use Svelte 5 compatible build tools and TypeScript configuration

### **7. Type Safety Improvements**
- **Explicit Type Imports**: All types imported explicitly using `import type { ... }` syntax
- **Component Props**: Updated all component prop interfaces to use Svelte 5 compatible types

### **8. CSS + Styling
  - Local built CSS for application and freon components
  - Switched to skeleton.dev components (from Flowbite)
  - Switched to Lucide icons (from FontAwesome)

## **META**

### **1. Limited Lists**
  - Updated the template to build the lists for a limited list with key/name pairs

### **2. External Box Generator**
  - Remove comma from wrapByExternal() before initializer as it already has comma when there parameters in ExternalBoxesHelper.ts