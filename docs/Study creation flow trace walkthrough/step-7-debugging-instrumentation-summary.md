# Step 7 — Debugging Instrumentation Summary

## Consolidated Log Reference

| Log Label | When It Fires | Expected Order | Timing Verification |
|-----------|---------------|----------------|---------------------|
| `[UI] addObject('study')` | User clicks Create Study button in `StudyGrid.svelte` (Step 1) | 1 | Timestamps confirm initial user intent |
| `[ObjectDrawerStore] Drawer opened` | `objectDrawerStore.set` seeds the temporary study (Step 1) | 2 | Should trail the click by \<50 ms |
| `[StudyMutation] calling onsave prop` | User submits the drawer form (Step 1) | 3 | Marks transition from temp object to server save |
| `[DataStore] addStudy POST /addStudy responded` | REST response for study creation (Step 1) | 4 | Start of backend persistence window |
| `[ModelManager] createModel name={id}` | `createModel` invoked before folder creation (Step 2) | 5 | Timestamp aligns with server `/saveModel` |
| `[Routes.saveModel] model={id}` | Server route receives folder-create request (Step 2) | 6 | Should follow client call by \<100 ms locally |
| `[ModelHandler.saveModel] ensureDirectory ...` | Server writes/ensures project folder (Step 2) | 7 | Investigate long gaps (>200 ms) for FS latency |
| `[InMemoryModel] dirtyUnits=1 → saveModelUnit ...` | Auto-save about to serialize the unit (Step 4) | 8 | Occurs after unit becomes dirty; correlate with edits |
| `[ServerCommunication] PUT /saveModelUnit` | Client dispatches unit save (Step 4) | 9 | Should closely follow dirty-unit log |
| `[Routes.saveModelUnit] model/unit` | Server receives unit save (Step 5) | 10 | Confirms arrival; compare with client send time |
| `[ModelHandler.saveModelUnit] wrote ...` | Server writes unit JSON to disk (Step 5) | 11 | Absence indicates failure; large gaps suggest FS issues |
| `[DataStore] addStudy() appended ...` | Client updates studies store/grid (Step 5) | 12 | Appears once server responds; ensures UI sync |
| `[StudyView] initializeStudy openModelUnit ...` | User opens the study for editing (Step 6) | 13 | Should happen after grid shows the new study |
| `[ServerCommunication] loadModelUnit ...` | Client fetches persisted unit JSON (Step 6) | 14 | Timing validates data freshness |
| `[ModelManager] showModelUnit ...` | Editor root updates to loaded unit (Step 6) | 15 | Wraps up the flow; subsequent auto-saves should follow |

> **Tip:** For each log, include high-resolution timestamps (HH:MM:SS.mmm) so you can measure deltas between steps; consistent progression without large gaps indicates healthy timing.

## Example Timelines

### Successful Flow
```text
[12:05:14.102] [UI] addObject('study') click dispatched
[12:05:14.128] [ObjectDrawerStore] Drawer opened with temp id=3f1f...
[12:05:35.447] [StudyMutation] calling onsave prop { id: '3f1f...' }
[12:05:36.012] [DataStore] addStudy → POST /addStudy responded (200)
[12:05:36.098] [ModelManager] createModel CardioTrial-42
[12:05:36.104] [Routes.saveModel] CardioTrial-42 language=ProjectConfiguration version=1.0
[12:05:36.142] [ModelHandler.saveModel] ensureDirectory projects/CardioTrial-42
[12:05:41.602] [InMemoryModel] dirtyUnits=1 → saveModelUnit CardioTrial-42/ProjectConfiguration (payload=18.5 KB)
[12:05:41.754] [ServerCommunication] PUT /saveModelUnit?model=CardioTrial-42&unit=ProjectConfiguration
[12:05:41.760] [Routes.saveModelUnit] CardioTrial-42/ProjectConfiguration
[12:05:41.781] [ModelHandler.saveModelUnit] wrote projects/CardioTrial-42/ProjectConfiguration.json (18.5 KB)
[12:05:41.804] [DataStore] addStudy() appended CardioTrial-42 to studies (total=18)
[12:06:12.044] [StudyView] initializeStudy openModelUnit: CardioTrial-42
[12:06:12.083] [ServerCommunication] loadModelUnit CardioTrial-42/StudyConfiguration (18.5 KB)
[12:06:12.129] [ModelManager] showModelUnit StudyConfiguration (done)
```

### Buggy Flow (Folder Delay Causes Save Failure)
```text
[12:05:14.102] [UI] addObject('study') click dispatched
...
[12:05:36.104] [Routes.saveModel] CardioTrial-42 language=ProjectConfiguration version=1.0
[12:05:38.950] [ModelHandler.saveModel] ERROR: ENOENT: no such file or directory, mkdir 'projects/CardioTrial-42'
[12:05:41.602] [InMemoryModel] dirtyUnits=1 → saveModelUnit CardioTrial-42/ProjectConfiguration (payload=18.5 KB)
[12:05:41.760] [Routes.saveModelUnit] CardioTrial-42/ProjectConfiguration
[12:05:41.761] [ModelHandler.saveModelUnit] ERROR: ENOENT: no such file or directory, open 'projects/CardioTrial-42/ProjectConfiguration.json'
[12:05:41.804] [DataStore] addStudy() appended CardioTrial-42 to studies (total=18)
[12:06:12.083] [ServerCommunication] loadModelUnit CardioTrial-42/StudyConfiguration (18.5 KB)
[12:06:12.120] [ModelManager] showModelUnit StudyConfiguration (stale data warning: dirtyUnits still set)
```

In the buggy sequence, missing “ensureDirectory” success and repeated directory errors signal that Step 2 failed; the final log warns that the editor is working with stale data. Use the consolidated table to pinpoint which events slipped or arrived out of order.

