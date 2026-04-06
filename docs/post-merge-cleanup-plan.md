# Post-Merge Cleanup Plan

**Branch:** `merge-upstream-2026-03-19`
**Goal:** Remove CRC-Hub remnants so this repo is a clean Freon4dsl fork

---

## Phase 1: Delete — Safe to remove immediately

These files serve no purpose in the Freon repo. They are CRC-Hub artifacts, accidentally committed files, or stale build output.

### Cursor workspace images (12 files)
Accidentally committed Cursor IDE cache from Graham's Windows machine.
```
git rm assets/c__Users_graha_AppData_Roaming_Cursor_User_workspaceStorage_9d0d02fbdd3470fa67a88efa20c63816_images/
```

### CRC-Hub scripts (2 files)
```
git rm stop_app.sh
git rm stop_server.sh
```

### Temp/junk files (2 files)
```
git rm temp_original.svelte
git rm "hortlog -sn --all"
```

### Dead code files (2 files)
Not in upstream, not imported by anything, not exported.
```
git rm packages/core/src/ast-utils/AstActionExecutor.ts
git rm packages/core/src/editor/boxes/OptionalOLDBox.ts
```

### Stale build cache
Already in `.gitignore` but directory may have been committed earlier.
```
git rm -r --cached packages/core/.rollup.cache/ 2>/dev/null
```

---

## Phase 2: Delete — CRC-Hub-specific configs

These belong in the CRC-Hub repo, not the Freon fork.

### AI tooling configs (20+ files)
```
git rm -r .claude/commands/
git rm -r .cursor/rules/
git rm -r .specify/
```

### CRC-Hub documentation (2 files)
```
git rm docs/crc-hub-lockdown-support.md
git rm developer-documentation/author-changes-core-meta-core-svelte-diffs.md
```

---

## Phase 3: Review — Decide whether to keep

### `.github/workflows/publish-freon-packages.yml`
**What:** GitHub Actions workflow to publish `@freon4dsl/core`, `core-svelte`, and `meta` as npm packages when you push a version tag.
**Keep if:** You publish your own fork packages for CRC-Hub to consume.
**Delete if:** CRC-Hub consumes Freon via git submodule, npm link, or the official upstream packages.

### `.nvmrc`
**What:** Pins the Node.js version.
**Keep if:** You want to standardize the Node version across contributors.
**Delete if:** Upstream's `engines` field in `package.json` is sufficient.

### `babel.config.cjs` / `jest.config.js`
**What:** Legacy test configs. Upstream moved to vitest and removed these.
**Recommendation:** Delete — upstream uses vitest now and these are stale.

### `vitest.workspace.js`
**What:** Vitest workspace config.
**Check:** Upstream may configure vitest differently (per-package configs). Compare before deleting.

### `.hintrc`
**What:** webhint config for accessibility/best-practices linting.
**Keep if:** You use webhint in development.

### `.vscode/launch.json` / `.vscode/tasks.json`
**What:** VS Code debug and task configs.
**Keep if:** Useful for debugging Freon development.
**Note:** Consider adding to `.gitignore` instead if these are personal preference.

### `package-lock.json`
**What:** npm lockfile. Upstream doesn't track it.
**Recommendation:** Delete and add to `.gitignore` — upstream uses npm workspaces and doesn't commit the lockfile.

### `packages/core/src/storage/InMemoryModel.ts`
**What:** Not in upstream. Referenced only from `dist/` build output (stale). CRC-Hub's `model-manager.ts` imports `InMemoryModel` from `@freon4dsl/core`.
**Action:** Check if upstream moved or renamed this. If it was removed upstream, CRC-Hub may need to vendor its own copy. **Do not delete until CRC-Hub compatibility is verified.**

---

## Phase 4: Verify `.gitignore`

Ensure these are ignored going forward:
```
.rollup.cache/
dist/
*.tgz
package-lock.json
.build-complete
```

---

## Suggested execution

```bash
# Phase 1
git rm -r assets/
git rm stop_app.sh stop_server.sh temp_original.svelte "hortlog -sn --all"
git rm packages/core/src/ast-utils/AstActionExecutor.ts
git rm packages/core/src/editor/boxes/OptionalOLDBox.ts
git rm -r --cached packages/core/.rollup.cache/ 2>/dev/null

# Phase 2
git rm -r .claude/commands/ .cursor/rules/ .specify/
git rm docs/crc-hub-lockdown-support.md
git rm developer-documentation/author-changes-core-meta-core-svelte-diffs.md

# Phase 3 (after review)
git rm babel.config.cjs jest.config.js
# git rm vitest.workspace.js  # verify first
# git rm .hintrc .nvmrc        # your call
# git rm package-lock.json     # and add to .gitignore

git commit -m "Clean up CRC-Hub remnants from Freon fork"
```
