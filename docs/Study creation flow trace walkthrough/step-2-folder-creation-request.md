# Step 2 — Folder Creation Request

## Trigger & Client Call Stack
- **Initiator:** `ModelManager.createModel` (`packages/webapp-islr/src/services/dsl/model-manager.ts`) invokes `this.modelStore.createModel(modelName)` immediately after `dataStore.addStudy` resolves.  
```59:64:packages/webapp-islr/src/services/dsl/model-manager.ts
async createModel(modelName: string) {
    try {
        LOGGER.log("ModelHandler.createModel name: " + modelName);
        this.resetGlobalVariables();
        await this.modelStore.createModel(modelName);
```
- **Delegated Call:** `InMemoryModel.createModel` (`packages/core/src/storage/InMemoryModel.ts`) seeds the Freon model locally and forwards the creation request to the server adapter.  
```68:75:packages/core/src/storage/InMemoryModel.ts
async createModel(name: string): Promise<FreModel | InMemoryError> {
    LOGGER.log(`createModel ${name}`)
    runInAction(() => {
        this.model = this.languageEnvironment.newModel(name)
    })
    const response = await this.server.createModel(name)
    FreUndoManager.getInstance().cleanAllStacks()
```
- **Transport Handler:** `ServerCommunication.createModel` (`packages/core/src/storage/server/ServerCommunication.ts`) issues the network call, wrapping it in a 2 s AbortController timeout.  
```325:333:packages/core/src/storage/server/ServerCommunication.ts
async createModel(modelName: string): Promise<VoidServerResponse> {
    LOGGER.log(`ServerCommunication.createModel ${modelName}`)
    const language = FreLanguage.getInstance().name
    const version = FreLanguage.getInstance().languageVersion
    const response = await this.saveWithTimeout(`saveModel`, {}, { model: modelName, language: language, version: version });
    if (response.errors.length > 0) {
        response.errors[0] = `Server cannot create model '${modelName}' (${response.errors[0]})`
    }
    return response
}
```

## HTTP Exchange
- **Request:** `PUT /saveModel?model={studyId}&language=ProjectConfiguration&version={dslVersion}` with an empty JSON body.
- **Server Endpoint:** `router.put("/saveModel"...` (`packages/server-islr/src/server/routes.ts`) logs the parameters and delegates to the model handler.  
```109:116:packages/server-islr/src/server/routes.ts
router.put("/saveModel", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const language = ctx.query["language"];
    const version = ctx.query["version"];
    console.log("Routes.saveModel: " + model + " language=" + language + " version=" + version);
    if (!!model && typeof model === "string") {
        await ModelHandler.saveModel(model, language as string, version as string, ctx);
```
- **Filesystem Action:** `ModelHandler.saveModel` (`packages/server-islr/src/server/model-handler.ts`) resolves `projects/{model}` and creates the directory if missing.  
```114:128:packages/server-islr/src/server/model-handler.ts
public static async saveModel(model: string, language: string, version: string, ctx: IRouterContext) {
    try {
        const modelPath = this.getModelPath(model);
        console.log("ModelHandler.saveModel: modelPath=", modelPath, "language=", language, "version=", version);
        if (!await storage.directoryExists(modelPath)) {
            console.log("ModelHandler.saveModel: directory does not exist, creating");
            await storage.ensureDirectory(modelPath);
        }
        ctx.status = 200;
        ctx.response.type = 'application/json';
        ctx.response.body = { errors: [] };
```
- **Response:** Success yields `200 { "errors": [] }`; exceptions propagate as `500 { errors: ["Error saving model"] }` and bubble back through the client adapter.

## Console Trace Example
```text
[12:05:36.118] [ModelManager] createModel CardioTrial-42
[12:05:36.121] [InMemoryModel] createModel CardioTrial-42
[12:05:36.123] [ServerCommunication] PUT /saveModel?model=CardioTrial-42&language=ProjectConfiguration&version=1.0
[12:05:36.140] [Routes.saveModel] model=CardioTrial-42 language=ProjectConfiguration version=1.0
[12:05:36.141] [ModelHandler.saveModel] modelPath=projects/CardioTrial-42 language=ProjectConfiguration version=1.0
[12:05:36.142] [ModelHandler.saveModel] ensureDirectory projects/CardioTrial-42
[12:05:36.153] [ServerCommunication] createModel response.errors=[]
```

## Debugging Tip
- Break on `await storage.ensureDirectory(modelPath);` in `packages/server-islr/src/server/model-handler.ts` to inspect the resolved path and filesystem abstraction before the directory is created.

## Failure & Latency Considerations
- **Slow folder creation:** the AbortController inside `saveWithTimeout` cancels the request after ~2 s, logging `Time out: no response from {SERVER_URL}`; the in-memory model persists, but subsequent saves must retry once the folder is available.
- **Creation failure:** any `ensureDirectory` exception returns `500` to the client; `ServerCommunication.handleError` surfaces the message to MobX observers, blocking follow-up `saveModelUnit` calls until the directory exists.

How this timing could cause the save to start before the folder exists.

