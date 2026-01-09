# Step 5 — Server Save Handling & Grid Update

## Endpoint & Disk Write
- **Endpoint:** `PUT /saveModelUnit?model={studyId}&unit={unitName}` defined in `packages/server-islr/src/server/routes.ts`.
```123:129:packages/server-islr/src/server/routes.ts
router.put("/saveModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    console.log("Routes.saveModelUnit: " + model + "/" + unit);
    if (!!model && typeof model === "string" && !!unit && typeof unit === "string") {
        await ModelHandler.saveModelUnit(model, unit, ctx);
```
- **File Write:** `ModelHandler.saveModelUnit` (`packages/server-islr/src/server/model-handler.ts`) writes the serialized unit to `projects/{model}/{unit}.json` and logs any exceptions.
```137:144:packages/server-islr/src/server/model-handler.ts
public static async saveModelUnit(model: string, unit: string, ctx: IRouterContext) {
    try {
        const modelPath = this.getModelPath(model);
        const filePath = path.join(modelPath, `${unit}.json`);
        await storage.writeFile(filePath, JSON.stringify(ctx.request.body, null, 3));
    } catch (e) {
        console.log(String(e));
    }
}
```
- **Response:** The route leaves `ctx.status` at 200 on success; add logging around `storage.writeFile` to mark start/success/error:
```text
[12:05:41.760] [Routes.saveModelUnit] CardioTrial-42/ProjectConfiguration start
[12:05:41.781] [ModelHandler.saveModelUnit] wrote projects/CardioTrial-42/ProjectConfiguration.json (18.5 KB)
[12:05:41.782] [Routes.saveModelUnit] CardioTrial-42/ProjectConfiguration OK
```
On failure, `storage.writeFile` throws; the catch logs the exception, but consider setting `ctx.status = 500` to inform the client.

## Client Confirmation & Grid Refresh
- **Caller:** `dataStore.addStudy` (`packages/webapp-crchub/src/services/data/data-store.ts`) awaits `ModelManager.getInstance().createModel(addedStudy.id)` and, after success, updates the Svelte store that drives the studies grid.
```93:109:packages/webapp-crchub/src/services/data/data-store.ts
async function addStudy(newStudy: Study): Promise<boolean> {
  ...
  const addedStudy = JSON.parse(text);
  await ModelManager.getInstance().createModel(addedStudy.id);
  update(state => ({ ...state, studies: [...state.studies, addedStudy] }));
  return true;
}
```
- **Store Mutation:** The `update` call refreshes `$dataStore.studies`, which propagates to `StudyGrid.svelte`, triggering its `$effect` to rebind AG-Grid data.
- **Logging:** Instrument the client to capture lifecycle events:
```text
[12:05:35.447] [StudyMutation] calling onsave prop { id: '3f1f7e5c-...', name: 'Cardio Trial' }
[12:05:41.602] [InMemoryModel] dirtyUnits=1 → saveModelUnit CardioTrial-42/ProjectConfiguration (payload=18.5 KB)
[12:05:41.804] [DataStore] addStudy() appended CardioTrial-42 to studies (total=18)
```

## Debugging Breakpoint
- Break in `packages/webapp-crchub/src/components/content/StudyGrid.svelte` inside the `$effect` that sets `gridApi.setGridOption("rowData", studiesData);` to verify the grid updates immediately after the store mutation.

## Race & Failure Analysis
- If `/saveModelUnit` succeeds **after** the grid update, the UI shows the new study while the DSL files persist moments later; this is acceptable but make sure retries clear `dirtyUnits`.
- If the server write fails silently (exception logged but response still 200), the grid remains optimistic while disk persists stale data. To mitigate:
  - Set `ctx.status` to 500 on error so the client can notify the user.
  - Keep logging symmetrical (start/success/error) and monitor for missing “OK” lines.
- When errors occur, `dirtyUnits` stays populated, so subsequent auto-saves will retry once the filesystem issue resolves, preventing permanent divergence between grid and stored files.

