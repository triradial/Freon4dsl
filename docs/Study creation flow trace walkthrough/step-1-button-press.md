# Step 1 — Button Press → Temporary Object Creation

## Flow Overview
- **Trigger:** The Create Study button in the grid header raises `addObject("study")`, wiring UI intent to the drawer workflow.  
```665:671:packages/webapp-crchub/src/components/content/StudyGrid.svelte
    <div class="flex items-center gap-2">
        <h3 class="main-label-text mr-2">Studies</h3>
        <button type="button" class="icon-button primary inverted" onclick={() => addObject("study")}><IconPlus size="16" /></button>
```
- **Click Handler:** `addObject` constructs a temporary study-shaped object (including a generated UUID) and opens the drawer via the shared store.  
```21:33:packages/webapp-crchub/src/services/stores/object-drawer-store.ts
export async function addObject(type: 'study' | 'patient', parentId?: string) {
    let parentName = '';
    if (parentId && type === 'patient') {
        const parentObject: Study | undefined = await dataStore.getStudy(parentId);
        if (parentObject) {
            parentName = parentObject.name;
        }
    }
    const object = type === 'study'
        ? { id: uuidv4(), name: '', title: '', status: '', phase: '', therapeuticArea: '', currentProtocol: '' }
        : { id: uuidv4(), patientNumber: '', displayName: '', name: '', initials: '', dob: '', gender: '', studyId: parentId, study: parentName };
    objectDrawerStore.set({ open: true, type, action: 'add', data: object });
}
```
- **Drawer Reaction:** The `ObjectDrawerSystem` subscribes to `objectDrawerStore`, rendering the `StudyMutation` form with the in-memory study and keeping the drawer open until saved or closed.  
```9:58:packages/webapp-crchub/src/components/common/ObjectDrawerSystem.svelte
let openState = $derived($objectDrawerStore.open);
let type = $derived($objectDrawerStore.type);
let action = $derived($objectDrawerStore.action);
let data = $derived($objectDrawerStore.data);
...
{#if type === 'study'}
    <StudyMutation 
        study={data} 
        {action} 
        onsave={async (study) => {
            if (action === 'add') {
                await dataStore.addStudy(study);
            } else if (action === 'edit') {
                await dataStore.updateStudy(study);
            }
            handleClose();
        }} 
```
- **Persist + Model Sync:** When the user clicks Save in the drawer, `StudyMutation` propagates the mutated object to `dataStore.addStudy`, which posts to the backend, updates local state, and triggers the DSL model creation.  
```45:108:packages/webapp-crchub/src/components/mutations/StudyMutation.svelte
function handleSave() {
    validateAllFields();
    if (Object.values(errorState).every((error) => error === "")) {
        console.log("[StudyMutation] calling onsave prop", mutatedStudy);
        onsave?.(mutatedStudy);
    }
}
```
```93:109:packages/webapp-crchub/src/services/data/data-store.ts
async function addStudy(newStudy: Study): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    const response = await fetch(`${env.serverUrl}/addStudy?uid=${currentUser.userid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudy)
    });
    if (!response.ok) throw new Error('Failed to add study');
    const text = await response.text();
    const addedStudy = JSON.parse(text);
    await ModelManager.getInstance().createModel(addedStudy.id);
```
- **First `runInAction`:** During `ModelManager.createModel`, the newly created unit is shown by setting `editor.rootElement` inside `runInAction`, ensuring MobX observers react to the change.  
```261:269:packages/webapp-islr/src/services/dsl/model-manager.ts
if (!!unit) {
    updateEditorState(false, false, false);
    runInAction(() => {
        this.langEnv.editor.rootElement = unit;
    });
    this.setCurrentUnit(unit);
```

## Observable Updates & MobX Touchpoints
- Svelte store emission from `objectDrawerStore.set` immediately updates derived values (`openState`, `type`, `data`) in `ObjectDrawerSystem`, causing the Popover to open with populated fields.
- After persistence, the first MobX-managed observable mutation appears in `ModelManager.showModelUnit` via `runInAction`, broadcasting the new root unit to Freon’s editor state and any linked observers.

## Example Console Timeline
```text
[12:05:14.102] [UI] addObject('study') click dispatched
[12:05:14.128] [ObjectDrawerStore] Drawer opened with temp study id=3f1f7e5c-9a2d-4e36-9bc1-5c4b26f8d421
[12:05:35.447] [StudyMutation] calling onsave prop { id: '3f1f7e5c-...', name: 'Cardio Trial', ... }
[12:05:36.012] [DataStore] addStudy → POST /addStudy responded
[12:05:36.098] [ModelManager] model-manager.createModelUnits START name: ProjectConfiguration
[12:05:36.204] [ModelManager] runInAction set editor.rootElement=ProjectConfiguration
```

## Debugging Tip
- Set a breakpoint on `const addedStudy = JSON.parse(text);` in `packages/webapp-crchub/src/services/data/data-store.ts` to inspect the fully resolved study object immediately before it is handed to `ModelManager.createModel`.

