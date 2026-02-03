# CRCHub changes to upstream Freon4dsl packages

Baseline commit: `b959a781fafc7e6e2b16e8579e218101e3d422c1`
(mode/whitespace-only changes excluded)

## Re-applying changes after an upstream merge

When merging with the upstream Freon4dsl `development` branch — accepting all
remote changes for `packages/core`, `packages/core-svelte`, and `packages/meta`
— use these patch files to re-apply the CRCHub-specific modifications:

| Patch file | Scope |
|:-----------|:------|
| `author-changes-core-meta-core-svelte.patch` | All three packages combined |
| `author-changes-core-svelte.patch` | `packages/core-svelte` only |
| `author-changes-core.patch` | `packages/core` only |
| `author-changes-meta.patch` | `packages/meta` only |

### Workflow

```bash
# 1. Start from the crchub-svelte5 branch
git checkout crchub-svelte5

# 2. Merge upstream, accepting all remote changes for the three packages
git merge development

# During merge, accept all "theirs" (upstream) changes for:
#   packages/core/
#   packages/core-svelte/
#   packages/meta/

# 3. After the merge commit, re-apply the CRCHub changes
#    Option A — all at once:
git apply developer-documentation/author-changes-core-meta-core-svelte.patch

#    Option B — one package at a time (useful if some patches conflict):
git apply developer-documentation/author-changes-core.patch
git apply developer-documentation/author-changes-core-svelte.patch
git apply developer-documentation/author-changes-meta.patch

# 4. If a patch does not apply cleanly, use --3way for conflict markers:
git apply --3way developer-documentation/author-changes-core.patch

# 5. Review and commit
git diff
git add -A && git commit -m "Re-apply CRCHub changes to upstream packages"
```

### Comparing instead of applying

To preview what the patch would change without modifying files:

```bash
# Dry run — reports errors but changes nothing
git apply --check developer-documentation/author-changes-core-meta-core-svelte.patch

# Show a stat summary of what would change
git apply --stat developer-documentation/author-changes-core-meta-core-svelte.patch
```

### Regenerating patches

If additional changes are made to these packages before the next upstream merge,
regenerate the patches from the baseline:

```bash
git diff b959a781fafc7e6e2b16e8579e218101e3d422c1..HEAD -- packages/core/ packages/core-svelte/ packages/meta/ \
  > developer-documentation/author-changes-core-meta-core-svelte.patch
```

---

## Changed files

### packages/core-svelte (Svelte UI components)

| File | What changed |
|:-----|:-------------|
| [`LayoutComponent.svelte`](#packagescore-sveltesrclibcomponentslayoutcomponentsvelte) | Fix Svelte 5 `state_unsafe_mutation` error by deferring refresh via `untrack()` / `tick()` |
| [`ListComponent.svelte`](#packagescore-sveltesrclibcomponentslistcomponentsvelte) | Hide drag handles for specific concept types (Person, Reference, SystemAccess, etc.) |

### packages/core (editor framework)

| File | What changed |
|:-----|:-------------|
| [`Box.ts`](#packagescoresrceditorboxesboxts) | Add `hideDragHandle` boolean property to the base `Box` class |
| [`AbstractPropertyWrapperBox.ts`](#packagescoresrceditorboxesexternalboxesabstractpropertywrapperboxts) | Add `firstLeaf` / `lastLeaf` overrides so external components can receive keyboard focus |
| [`StringReplacerBox.ts`](#packagescoresrceditorboxesexternalboxesstringreplacerboxts) | Throw an error (instead of silently logging) on property-type mismatch |
| [`FreProjectionHandler.ts`](#packagescoresrceditorprojectionsfreprojectionhandlerts) | Guard against missing constructor in `getKnownTableProjectionsFor()` |
| [`FreLogger.ts`](#packagescoresrcloggingfreloggerts) | Fix crash when `tagOrTags` is not a string and not an array (use `Array.isArray` check) |
| [`InMemoryModel.ts`](#packagescoresrcstorageinmemorymodelts) | Add debug tracing to `openModel()` and `saveUnit()`; handle unit-load errors gracefully |

### packages/meta (code-generation templates)

| File | What changed |
|:-----|:-------------|
| [`ExternalBoxesHelper.ts`](#packagesmetasrceditordefgeneratortemplatesboxproviderhelpersexternalboxeshelperts) | Change `replaceSingleByExternal()` from `private` to `public` |
| [`ItemBoxHelper.ts`](#packagesmetasrceditordefgeneratortemplatesboxproviderhelpersitemboxhelperts) | Allow external components to replace limited-concept boxes (both list and single-element cases) |
| [`InterpreterBaseTemplate.ts`](#packagesmetasrcinterpretergengeneratortemplatesinterpreterbasetemplatets) | Add `EvaluateFunction` type cast to fix TypeScript strictness; remove stray `// DONE` comment |
| [`GrammarModel.ts`](#packagesmetasrcparsergenparsertemplatesgrammarmodelgrammarmodelts) | Allow spaces inside backtick-delimited identifiers |
| [`FileUtil.ts`](#packagesmetasrcutilsfile-utilsfileutilts) | Pass `{ recursive: true }` to `fs.rmSync()` to fix empty-folder deletion |

---

## `packages/core-svelte/src/lib/components/LayoutComponent.svelte`

**Svelte 5 migration fix.** Splits `refresh()` into an internal function (called with `untrack()` inside `$effect`) and a public function (deferred via `tick()`) to prevent `state_unsafe_mutation` errors during reactive cycles. Also adds `type` keyword to type-only imports per Svelte 5 convention.

### Change 1 — New import added

```ts
import { untrack, tick } from 'svelte';
```

### Change 2 — Type-only import syntax

Before:
```ts
import { Box, FreLogger, ListDirection, LayoutBox, notNullOrUndefined } from '@freon4dsl/core';
```

After:
```ts
import { type Box, FreLogger, ListDirection, type LayoutBox, notNullOrUndefined } from '@freon4dsl/core';
```

### Change 3 — Effect body: wrap refresh in `untrack()`

Before:
```ts
refresh('Refresh Layout box changed ' + box?.id);
```

After:
```ts
// Use untrack to avoid triggering state_unsafe_mutation error in Svelte 5
untrack(() => {
    refreshInternal('Refresh Layout box changed ' + box?.id);
});
```

### Change 4 — Rename original function to `refreshInternal`

Before:
```ts
const refresh = (why?: string): void => {
    LOGGER.log('REFRESH LayoutComponent ...');
    // ... state mutations ...
};
```

After — the original is renamed and a new deferred wrapper is added:
```ts
/** Internal refresh function. Should be wrapped in untrack() when called from effects. */
const refreshInternal = (why?: string): void => {
    LOGGER.log('REFRESH LayoutComponent ...');
    // ... state mutations (unchanged) ...
};

/** External refresh function exposed to box.refreshComponent.
 *  Defers state mutations to after the current reactive cycle. */
const refresh = (why?: string): void => {
    tick().then(() => {
        refreshInternal(why);
    });
};
```

---

## `packages/core-svelte/src/lib/components/ListComponent.svelte`

**UI improvement.** Hides drag handles for certain concept types (Reference, Person, PersonReference, SystemAccess, SystemAccessReference) so they don't show a grab handle in the editor list. Uses a new `shouldHideDragHandle()` helper that checks the box property, concept type, and external-box params.

### Change 1 — New helper function added

```ts
const HIDE_DRAG_HANDLE_CONCEPTS = new Set([
    'Reference',
    'Person',
    'PersonReference',
    'SystemAccess',
    'SystemAccessReference'
]);

function shouldHideDragHandle(b: Box): boolean {
    if (b.hideDragHandle) return true;

    const conceptType = b.node?.freLanguageConcept();
    if (conceptType && HIDE_DRAG_HANDLE_CONCEPTS.has(conceptType)) return true;

    if ('findParam' in b && typeof (b as any).findParam === 'function') {
        if ((b as any).findParam("hideDragHandle") === "true") return true;
    }
    return false;
}
```

### Change 2 — Template condition updated

Before:
```svelte
{#if !isActionBox(box)}
    <span class="drag-handle" ...>
```

After:
```svelte
{#if !isActionBox(box) && !shouldHideDragHandle(box)}
    <span class="drag-handle" ...>
```

---

## `packages/core/src/editor/boxes/Box.ts`

**New property.** Adds `hideDragHandle` to the abstract `Box` class so that individual boxes can opt out of showing a drag handle in lists.

### Change — New property added after `isVisible`

```ts
// Is this box currently not shown in the editor?
isVisible: boolean = true;
// Should the drag handle be hidden for this box in a list?   <-- NEW
hideDragHandle: boolean = false;                               // <-- NEW
parent: Box = null;
```

---

## `packages/core/src/editor/boxes/externalBoxes/AbstractPropertyWrapperBox.ts`

**Keyboard navigation fix.** Adds `firstLeaf` and `lastLeaf` getter overrides so that external (wrapped) components can receive keyboard focus. Without these, Tab/Shift-Tab navigation would skip over external components.

### Change — Two new getters added at end of class

```ts
get firstLeaf(): Box | null {
    if (!this.isVisible) return null;
    if (this.selectable) return this;
    return this._childBox?.firstLeaf ?? null;
}

get lastLeaf(): Box | null {
    if (!this.isVisible) return null;
    if (this.selectable) return this;
    return this._childBox?.lastLeaf ?? null;
}
```

---

## `packages/core/src/editor/boxes/externalBoxes/StringReplacerBox.ts`

**Bug fix — fail loud instead of silent.** When `setPropertyValue` receives a value whose type doesn't match the property type, the old code just logged a message to the console. Now it throws an error with a clear diagnostic message.

### Change — `console.log` replaced with `throw new Error`

Before:
```ts
console.log(
    "StringReplacerBox.setPropertyValue type error: trying to set property of type " +
        this.getPropertyType() +
        " to a value of type " +
        typeof newValue,
);
```

After:
```ts
throw new Error(
    "StringReplacerBox.setPropertyValue: type mismatch — property type is '" +
        this.getPropertyType() +
        "' but value type is '" +
        typeof newValue +
        "'. Check that the box is bound to a string property (e.g. correct node and propertyName).",
);
```

---

## `packages/core/src/editor/projections/FreProjectionHandler.ts`

**Null-safety fix.** `getKnownTableProjectionsFor()` previously called the result of a `Map.get()` directly without checking for `undefined`, which would crash if the concept name was not in the map.

### Change — Add null guard before calling constructor

Before:
```ts
getKnownTableProjectionsFor(conceptName: string): string[] {
    const providerConstructor = this.conceptNameToProviderConstructor.get(conceptName)(this);
    if (!!providerConstructor) {
        return providerConstructor.knownTableProjections;
    } ...
```

After:
```ts
getKnownTableProjectionsFor(conceptName: string): string[] {
    const constructorFunction = this.conceptNameToProviderConstructor.get(conceptName);
    if (!constructorFunction) {
        return [];
    }
    const providerConstructor = constructorFunction(this);
    if (!!providerConstructor) {
        return providerConstructor.knownTableProjections;
    } ...
```

---

## `packages/core/src/logging/FreLogger.ts`

**Runtime crash fix.** The `tagOrTags` parameter was cast directly to `string[]` without checking if it was actually an array. If a non-string, non-array value was passed, this would crash when iterating.

### Change — Safe array coercion

Before:
```ts
const tags: string[] = typeof tagOrTags === "string" ? [tagOrTags] : (tagOrTags as string[]);
```

After:
```ts
const tags: string[] = typeof tagOrTags === "string" ? [tagOrTags] : (Array.isArray(tagOrTags) ? tagOrTags : []);
```

---

## `packages/core/src/storage/InMemoryModel.ts`

**Debug logging + error handling.** Adds `console.log` / `console.error` / `console.warn` tracing throughout `openModel()` and `saveUnit()` for diagnosing model-loading issues. Also adds per-unit error handling — previously a failed unit load would crash; now it logs the error and continues loading the remaining units.

### Change 1 — `openModel()`: add console tracing and per-unit error handling

Before:
```ts
async openModel(name: string): Promise<FreModel | InMemoryError> {
    LOGGER.log("openModel(" + name + ")")
    AST.change(() => { this.model = this.languageEnvironment.newModel(name) })
    const response = await this.server.loadUnitList(name)
    if (response.errors.length > 0) {
        this.onInMemoryError(response.errors[0])
        return new InMemoryError(response.errors[0])
    }
    for (const unitId of response.result) {
        LOGGER.log("openModel: load model-unit: " + unitId.name)
        const unit = await this.server.loadModelUnit(this.model.name, unitId)
        AST.change(() => {
            this.model.addUnit(unit.result as FreModelUnit)
        })
    }
    FreUndoManager.getInstance().cleanAllStacks()
    return this.model
}
```

After:
```ts
async openModel(name: string): Promise<FreModel | InMemoryError> {
    console.log(`[InMemoryModel] openModel: name=${name}`)
    LOGGER.log("openModel(" + name + ")")
    AST.change(() => { this.model = this.languageEnvironment.newModel(name) })

    console.log(`[InMemoryModel] Loading unit list for model: ${name}`)
    const response = await this.server.loadUnitList(name)
    if (response.errors.length > 0) {
        console.error(`[InMemoryModel] Error loading unit list:`, response.errors[0])
        this.onInMemoryError(response.errors[0])
        return new InMemoryError(response.errors[0])
    }

    console.log(`[InMemoryModel] Unit list loaded, found ${response.result.length} units:`,
        response.result.map(u => u.name))

    for (const unitId of response.result) {
        console.log(`[InMemoryModel] Loading model unit: ${unitId.name}`)
        LOGGER.log("openModel: load model-unit: " + unitId.name)
        const unit = await this.server.loadModelUnit(this.model.name, unitId)

        if (unit.errors.length > 0) {
            console.error(`[InMemoryModel] Error loading unit ${unitId.name}:`, unit.errors)
        } else if (unit.result) {
            console.log(`[InMemoryModel] Unit ${unitId.name} loaded successfully, adding to model`)
            AST.change(() => { this.model.addUnit(unit.result as FreModelUnit) })
        } else {
            console.warn(`[InMemoryModel] Unit ${unitId.name} loaded but result is null/undefined`)
        }
    }

    console.log(`[InMemoryModel] openModel complete, model has ${this.model.getUnits().length} units`)
    FreUndoManager.getInstance().cleanAllStacks()
    return this.model
}
```

### Change 2 — `saveUnit()`: add console tracing

Before:
```ts
async saveUnit(unit: FreModelUnit): Promise<void | InMemoryError> {
    LOGGER.log(`saveModelUnit`)
    if (this.dirtyUnits.has(unit)) {
        const serverResponse = await this.server.saveModelUnit(
            this.model.name,
            { name: unit.name, id: unit.freId(), type: unit.freLanguageConcept() },
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

After:
```ts
async saveUnit(unit: FreModelUnit): Promise<void | InMemoryError> {
    LOGGER.log(`saveModelUnit`)
    const unitInDirty = this.dirtyUnits.has(unit)
    console.log(`[InMemoryModel] saveUnit called for "${unit?.name}", isDirty=${unitInDirty}`)

    if (unitInDirty) {
        console.log(`[InMemoryModel] saveUnit - calling server.saveModelUnit for "${unit.name}"`)
        const serverResponse = await this.server.saveModelUnit(
            this.model.name,
            { name: unit.name, id: unit.freId(), type: unit.freLanguageConcept() },
            unit,
        )
        if (serverResponse.errors.length === 0) {
            console.log(`[InMemoryModel] saveUnit - server save successful for "${unit.name}"`)
            this.dirtyUnits.delete(unit)
        } else {
            console.error(`[InMemoryModel] saveUnit - server save failed for "${unit.name}"`)
            this.onInMemoryError(serverResponse.errors[0])
            return new InMemoryError(`${serverResponse.errors[0]})`)
        }
    } else {
        console.log(`[InMemoryModel] saveUnit - skipping save for "${unit?.name}" (not dirty)`)
    }
}
```

---

## `packages/meta/src/editordef/generator/templates/boxproviderhelpers/ExternalBoxesHelper.ts`

**Visibility change.** `replaceSingleByExternal()` was `private` but needs to be called from `ItemBoxHelper` to support external-component replacement of limited-concept boxes.

### Change — One keyword

Before:
```ts
private replaceSingleByExternal(
```

After:
```ts
public replaceSingleByExternal(
```

---

## `packages/meta/src/editordef/generator/templates/boxproviderhelpers/ItemBoxHelper.ts`

**Feature — external component replacement for limited concepts.** In two places (list properties and single-element properties), adds a check: if the property type is a `FreMetaLimitedConcept` and the editor definition specifies `externalInfo.replaceBy`, use the external component instead of the standard limited-concept box. This enables custom Svelte components to replace built-in dropdowns.

### Change 1 — List property branch (around line 182)

Before:
```ts
if (property.type instanceof FreMetaLimitedConcept) {
    result += this._myLimitedHelper.generateLimited(property, elementVarName, language, item.listInfo, item.displayType);
}
```

After:
```ts
if (property.type instanceof FreMetaLimitedConcept) {
    if (item.externalInfo?.replaceBy?.length > 0) {
        // Use external component to replace the limited concept box
        result += this._myExternalHelper.replaceSingleByExternal(item, property, elementVarName);
    } else {
        // Use standard limited concept box
        result += this._myLimitedHelper.generateLimited(property, elementVarName, language, item.listInfo, item.displayType);
    }
}
```

### Change 2 — Single-element branch (around line 280)

Before:
```ts
// single element
this._myTemplate.imports.core.add("BoxUtil");
let innerResult: string = `BoxUtil.getBoxOrAction(${elementVarName}, "${property.name}", "${property.type.name}", this.mainHandler) `;
if (item.externalInfo) {
    result += this._myExternalHelper.generateSingleAsExternal(item, property, elementVarName, innerResult);
} else {
    result += innerResult;
}
```

After:
```ts
// single element
if (property.type instanceof FreMetaLimitedConcept && item.externalInfo?.replaceBy?.length > 0) {
    // Use external component to replace the limited concept box directly
    result += this._myExternalHelper.replaceSingleByExternal(item, property, elementVarName);
} else {
    this._myTemplate.imports.core.add("BoxUtil");
    let innerResult: string = `BoxUtil.getBoxOrAction(${elementVarName}, "${property.name}", "${property.type.name}", this.mainHandler) `;
    if (item.externalInfo) {
        result += this._myExternalHelper.generateSingleAsExternal(item, property, elementVarName, innerResult);
    } else {
        result += innerResult;
    }
}
```

---

## `packages/meta/src/interpretergen/generator/templates/InterpreterBaseTemplate.ts`

**TypeScript strictness fix.** The generated interpreter init code was missing a type annotation, causing errors under strict TypeScript. Also removes a stray `// DONE` comment from the generated output.

### Change 1 — Add `EvaluateFunction` import to generated code

Before:
```ts
import { type IMainInterpreter } from "@freon4dsl/core";
```

After:
```ts
import { type IMainInterpreter, type EvaluateFunction } from "@freon4dsl/core";
```

### Change 2 — Add type cast to `registerFunction` calls

Before:
```ts
main.registerFunction("Task", interpreter.evalTask);
```

After:
```ts
main.registerFunction("Task", interpreter.evalTask as EvaluateFunction);
```

### Change 3 — Remove stray comment

Before:
```ts
.join("\n")} // DONE
```

After:
```ts
.join("\n")}
```

---

## `packages/meta/src/parsergen/parserTemplates/grammarModel/GrammarModel.ts`

We kept the new regex under the assumption that Freon fixed the issue with spaces in IDs

**Parser grammar fix — allow spaces in identifiers.** Adds a space character to the allowed character set in backtick-delimited identifiers. This means identifiers like `` `My Identifier` `` are now valid in the DSL.

### Change — Space added to identifier character class

Before (simplified — the actual regex is heavily escaped):
```
leaf identifier = "`[a-zA-Z0-9-_~!@#$%^&*...?/][a-zA-Z0-9-_~!@#$%^&*...?/]*`"
```

After — note the space before the closing `]`:
```
leaf identifier = "`[a-zA-Z0-9-_~!@#$%^&*...?/ ][a-zA-Z0-9-_~!@#$%^&*...?/ ]*`"
                                             ^^^                           ^^^
```

---

## `packages/meta/src/utils/file-utils/FileUtil.ts`

We didn't do this one because the file is gone.

**Bug fix — empty folder deletion.** `fs.rmSync(folder)` without `{ recursive: true }` can fail on some platforms/Node versions when removing directories. Adding the flag ensures reliable cleanup.

### Change — Add `recursive` option

Before:
```ts
fs.rmSync(folder);
```

After:
```ts
fs.rmSync(folder, { recursive: true });
```
