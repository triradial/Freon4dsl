# Step 4 — Auto-Save Mutation Trigger

## What Fires the Auto-Save?
- **Watcher:** `InMemoryModel` from `packages/core/src/storage/InMemoryModel.ts` subscribes to editor deltas (`primChanged`, `partChanged`, `listElementChanged`) and adds the touched unit to `dirtyUnits`.  
```320:338:packages/core/src/storage/InMemoryModel.ts
primChanged = (delta: FrePrimDelta) => {
    if (this.getUnits().includes(delta.unit)) {
        this.dirtyUnits.add(delta.unit)
        if (delta.owner.freIsUnit() && delta.propertyName === "name" && typeof(delta.oldValue === "string")) {
            this.renameUnit(delta.oldValue as string, delta.newValue as string, delta.unit)
            this.currentModelChanged()
        }
    }
}
partChanged = (delta: FrePartDelta) => {
    if (this.getUnits().includes(delta.unit)) {
        this.dirtyUnits.add(delta.unit)
    }
}
listElementChanged = (delta: FrePartDelta | FrePrimDelta) => {
    if (this.getUnits().includes(delta.unit)) {
        this.dirtyUnits.add(delta.unit)
    }
}
```
- **Auto-Save Loop:** Whenever Freon’s change manager notifies `InMemoryModel`, the unit enters `dirtyUnits`. Subsequent triggers (timer/undo flush) call `saveUnit`, which in turn delegates to the shared `ServerCommunication.saveModelUnit`.
```280:303:packages/core/src/storage/InMemoryModel.ts
async saveUnit(unit: FreModelUnit): Promise<void | InMemoryError> {
    LOGGER.log(`saveModelUnit`)
    if (this.dirtyUnits.has(unit)) {
        const serverResponse = await this.server.saveModelUnit(
            this.model.name,
            {
                name: unit.name,
                id: unit.freId(),
                type: unit.freLanguageConcept(),
            },
            unit,
        )
        if (serverResponse.errors.length === 0) {
            this.dirtyUnits.delete(unit)
        } else {
            this.onInMemoryError(serverResponse.errors[0])
            return new InMemoryError(`${serverResponse.errors[0]})`)
        }
    }
}
```

## Timing & Payload
- `saveModelUnit` runs **after** the unit is active (Step 3). It serializes the entire LionWeb node graph and sends it to `PUT /saveModelUnit?model={studyId}&unit={unitName}` with body `{ serializationFormatVersion, languages, nodes }`.
- The call uses the same 2 s `saveWithTimeout` wrapper as Step 2. Payload size depends on the unit’s AST; log `nodes.length` or `JSON.stringify(...).length` before dispatch.

## Client Instrumentation
- Add logging around dirty-unit flushes:
```text
[12:05:41.602] [InMemoryModel] dirtyUnits=1 → saveModelUnit CardioTrial-42/ProjectConfiguration (payload=18.5 KB)
[12:05:41.754] [ServerCommunication] saveWithTimeout PUT /saveModelUnit?model=CardioTrial-42&unit=ProjectConfiguration
```
- Place a breakpoint on `await this.server.saveModelUnit(...)` inside `InMemoryModel.saveUnit` to inspect the payload just before it leaves the client.

## Server Handler & Logs
- **Endpoint:** `router.put("/saveModelUnit"...` in `packages/server-islr/src/server/routes.ts` logs inbound requests and invokes `ModelHandler.saveModelUnit`.
```123:129:packages/server-islr/src/server/routes.ts
router.put("/saveModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    console.log("Routes.saveModelUnit: " + model + "/" + unit);
    if (!!model && typeof model === "string" && !!unit && typeof unit === "string") {
        await ModelHandler.saveModelUnit(model, unit, ctx);
```
- **Persistence:** `ModelHandler.saveModelUnit` writes to `projects/{model}/{unit}.json`. Instrument start/finish with `console.log` before and after `storage.writeFile`.
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
- Example logs:
```text
[12:05:41.760] [Routes.saveModelUnit] CardioTrial-42/ProjectConfiguration start
[12:05:41.781] [ModelHandler.saveModelUnit] wrote projects/CardioTrial-42/ProjectConfiguration.json (18.5 KB)
```

## Conflict Considerations
- Auto-save depends on the folder established in Step 2; however, if the `/saveModel` call was delayed or failed, the first `saveModelUnit` will return an error, leaving `dirtyUnits` uncleared and triggering retries.
- Because `saveUnit` serializes current editor state, overlapping async operations (e.g., long-running validation) should avoid mutating the unit during serialization. Ensure no `runInAction(async () => {})` wraps the auto-save; actions must stay synchronous so observers see consistent snapshots.
- If an earlier async call (like additional unit creation) is still pending, double-check logs to confirm sequencing: auto-save should only fire once `setCurrentUnit` has completed, otherwise payloads may reference stale or undefined unit IDs.

How this might conflict: prolonged folder creation, aborted `/saveModel` requests, or deferred MobX actions can cause the auto-save mutation to attempt writing before the target path exists, resulting in transient failures that keep the unit marked dirty until the filesystem catches up.

