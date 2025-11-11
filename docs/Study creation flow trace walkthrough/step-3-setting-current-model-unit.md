# Step 3 — Setting the Current Model Unit

## Where `setCurrentUnit` Fires
- **Caller:** `ModelManager.createBasicModelUnit` (`packages/webapp-islr/src/services/dsl/model-manager.ts`) awaits `this.modelStore.createUnit(...)` and then passes the returned unit to `showModelUnit`.  
```110:117:packages/webapp-islr/src/services/dsl/model-manager.ts
async createBasicModelUnit(unitName: string, unitType: string) {
    LOGGER.log("model-manager.createBasicModelUnit called, unitType: " + unitType + " name: " + unitName);
    console.log("model-manager.createBasicModelUnit called, unitType: " + unitType + " name: " + unitName);
    const newUnit = await this.modelStore.createUnit(unitName, unitType);
    if (!isInMemoryError(newUnit)) {
        newUnit.name = unitName;
        this.showModelUnit(newUnit);
```
- **Direct Invocation:** `showModelUnit` sets the editor root within a synchronous `runInAction` and then calls `this.setCurrentUnit(unit)`.  
```261:272:packages/webapp-islr/src/services/dsl/model-manager.ts
private showModelUnit(unit: FreModelUnit) {
    LOGGER.log("ModelHandler.showUnitAndErrors called, unitName: " + unit?.name);
    try {
        if (!!unit) {
            updateEditorState(false, false, false);
            runInAction(() => {
                this.langEnv.editor.rootElement = unit;
            });
            this.setCurrentUnit(unit);
            WebappConfigurator.getInstance().editorEnvironment.editor.setErrors([]);
```
- **Setter Body:** `setCurrentUnit` assigns the field, updates the global undo manager, and publishes the active unit name to the MobX/Svelte store.  
```45:52:packages/webapp-islr/src/services/dsl/model-manager.ts
setCurrentUnit(unit: FreModelUnit | undefined) {
    this.currentUnit = unit;
    if (unit) {
        FreUndoManager.getInstance().currentUnit = unit;
        setCurrentUnitName(unit.name);
    } else {
        setCurrentUnitName("");
    }
}
```

## Timing vs. Folder Creation
- `setCurrentUnit` runs **after** Step 2’s folder creation completes. The `createModel` call awaited `ServerCommunication.createModel` (which wraps the `/saveModel` request), and only once that promise resolves does `createProjectConfigurationModelUnits` proceed to `await this.createBasicModelUnit(...)`. Because `createBasicModelUnit` awaits `this.modelStore.createUnit`, the server-side `saveModelUnit` call has also finished before `showModelUnit` (and thus `setCurrentUnit`) executes.

## Observable State & Side Effects
- Mutates `ModelManager.currentUnit`, updates MobX-backed undo context via `FreUndoManager`, and publishes the active unit name through `setCurrentUnitName`, which flows into UI observers that render breadcrumbs/status.
- `updateEditorState(false, false, false)` (just before the `runInAction`) also toggles editor progress watchers so the UI reflects that the primary unit is loaded.

## Instrumentation Clues
- **Client logs:**  
  - `[ModelManager] model-manager.createBasicModelUnit called, unitType: ProjectConfiguration name: ProjectConfiguration`  
  - `[ModelHandler.showUnitAndErrors] unitName: ProjectConfiguration`
- **Server logs:**  
  - `[Routes.saveModel] model={studyId}` (Step 2) precedes these.  
  - `[ModelHandler.saveModel] ensureDirectory projects/{studyId}` confirms folder creation before the unit is shown.  
  - Subsequent `/saveModelUnit` calls (when auto-save later persists) will surface as `Routes.saveModelUnit: model={studyId}/unit={unitName}`.

## `runInAction` Warning
- Notice that `runInAction` receives a synchronous arrow `() => { this.langEnv.editor.rootElement = unit; }`. Avoid patterns like `runInAction(async () => { ... await ... })` because MobX ends the action immediately; awaited work would run outside the action, leaving observers in an inconsistent state. Here, asynchronous work is completed *before* entering `runInAction`, so state changes remain atomic.

## Is the Unit Ready Before Auto-Save?
- Yes. By the time `setCurrentUnit` runs, the server has acknowledged both the model folder creation (`/saveModel`) and the initial unit creation (`createUnit → /saveModelUnit`). The editor root now points at the fully instantiated unit, `FreUndoManager` references it, and observers (e.g., auto-save timers) see a populated `currentUnitName`. Therefore, the first auto-save operates on a unit that already exists on disk, avoiding the “save before folder/unit exists” race.

