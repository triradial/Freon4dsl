# Step 6 — Opening for Editing

## Load Entry Point
- **Handler:** When a user selects the study in the grid, `initializeStudy` in `packages/webapp-crchub/src/content/Study.svelte` calls `ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration")`.
```74:79:packages/webapp-crchub/src/content/Study.svelte
console.log("initializeStudy: openModelUnit: " + study.id);
const result = await ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration") as StudyConfiguration;
if (result) {
    studyConfiguration = result;
}
```

## Model Unit Rehydration
- `ModelManager.openModelUnit` (`packages/webapp-islr/src/services/dsl/model-manager.ts`) resets editor state, loads the Freon model from disk via `this.modelStore.openModel(modelName)`, and then sets the current unit.
```142:155:packages/webapp-islr/src/services/dsl/model-manager.ts
async openModelUnit(modelName: string, unitName: string): Promise<FreModelUnit | undefined> {
    LOGGER.log("ModelHandler.openModelUnit modelName: " + modelName + " unitName: " + unitName);
    updateEditorState(true, true, false);
    this.resetGlobalVariables();
    await this.modelStore.openModel(modelName);
    const unit = this.modelStore.getUnitByName(unitName);
    if (unit) {
        this.setCurrentUnit(unit);
        BoxFactory.clearCaches();
        this.langEnv.projectionHandler.clear();
        this.showModelUnit(unit);
    }
    return unit;
}
```
- `modelStore.openModel` reads unit identifiers from the server, fetches each unit JSON (`ServerCommunication.loadModelUnit`), and hydrates them into Freon ASTs before returning.

## Observable Updates
- `updateEditorState(true, true, false)` shows the loading indicator.
- `setCurrentUnit(unit)` propagates the active unit name and updates `FreUndoManager`.
- `showModelUnit` assigns `langEnv.editor.rootElement` inside a synchronous `runInAction`, ensuring MobX observers (including the auto-save and validation flows) see the loaded unit atomically.

## Logging Strategy
- Add logs at each phase to trace latency:
```text
[12:06:12.044] [StudyView] initializeStudy openModelUnit: CardioTrial-42
[12:06:12.057] [ModelManager] openModelUnit model=CardioTrial-42 unit=StudyConfiguration (start)
[12:06:12.083] [ServerCommunication] loadModelUnit CardioTrial-42/StudyConfiguration (18.5 KB)
[12:06:12.129] [ModelManager] showModelUnit StudyConfiguration (done)
```
- Server-side, `ServerCommunication` hits `GET /getModelUnit` (see `packages/server-islr/src/server/routes.ts`), so instrument `ModelHandler.getModelUnit` to log read start/finish and file size.

## Debug Breakpoint
- Set a breakpoint in `Study.svelte` on `studyConfiguration = result;` to inspect the hydrated object and ensure key fields (`name`, identifiers, etc.) match the last saved state.

## Timing Hazards
- If Step 2’s folder creation or Step 4’s auto-save lagged or failed, `openModelUnit` may fetch stale or absent files:
  - Missing folder ⇒ `storage.readFile` fails, returning `undefined`; `result` becomes falsy, and the editor shows an empty state.
  - Silent save failure ⇒ JSON reflects the last successful write, so users edit stale data.
- Logs should be correlated with earlier steps to confirm all saves completed before opening; otherwise, consider retrying or alerting when `openModelUnit` hydrates an outdated unit.

