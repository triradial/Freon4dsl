---
name: merge-upstream-freon
description: Pulls updates from upstream freon4dsl/Freon4dsl into the Freon4dsl-CRC-Hub fork using a dedicated merge branch and a refined conflict-aware process. Use when the user asks to merge upstream Freon, fetch latest Freon4dsl, sync with freon4dsl/Freon4dsl, create a merge-upstream branch, or pull upstream development into this fork.
---

# Merge Upstream Freon

Bring changes from the original Freon project into this fork without dumping them straight onto `development`.

This skill starts from the official Part 6 brief and then follows the refined process used in Freon4dsl-CRC-Hub. Add new conventions to the refined section as they are decided.

## Remotes and branches

| Name | Repo | Role |
|------|------|------|
| Working copy | `~/projects/Freon4dsl` | Local clone of Freon4dsl-CRC-Hub |
| `origin` | `https://github.com/triradial/Freon4dsl-CRC-Hub.git` | Our fork |
| `upstream` | `https://github.com/freon4dsl/Freon4dsl.git` | Original Freon |
| Integration branch | `development` | Default branch we eventually merge into |
| Merge branch | `merge-upstream-YYYY-MM-DD` | Isolated branch for the upstream merge |

Do not merge `upstream/development` directly onto local `development` unless the user explicitly asks for that.

## Official brief (Part 6)

To get updates from the original Freon project into your fork (Freon4dsl-CRC-Hub):

```bash
cd ~/projects/Freon4dsl  # This is your local Freon4dsl-CRC-Hub clone

# Fetch upstream changes from the original freon4dsl/Freon4dsl repo
git fetch upstream

# Merge into your branch
git checkout development
git merge upstream/development

# Resolve any conflicts between upstream changes and your patches
# Build and test
npm run build
npm test

# Push to your fork (triradial/Freon4dsl-CRC-Hub)
git push origin development

# If Freon packages changed significantly, create a new release
# (See Part 3: Releasing Freon Packages)
```

## Refined process (what we actually do)

Copy this checklist and track progress. Stop and talk through conflicts; do not auto-resolve CRC-Hub patches.

```
Task Progress:
- [ ] Confirm remotes and a clean working tree
- [ ] Fetch upstream
- [ ] Create merge-upstream-YYYY-MM-DD from development
- [ ] Merge upstream/development into the merge branch
- [ ] Resolve conflicts with the user (refined merge)
- [ ] Build and test
- [ ] Push merge branch to origin (only when asked)
- [ ] Open or update a PR into development (only when asked)
- [ ] Decide whether a Freon package release is needed
```

### 1. Confirm remotes and a clean working tree

Run these in the working copy:

```bash
cd ~/projects/Freon4dsl
git remote -v
git status -sb
git branch --show-current
```

Expected remotes:

- `origin` → `triradial/Freon4dsl-CRC-Hub.git`
- `upstream` → `freon4dsl/Freon4dsl.git`

If the working tree is dirty, stop and report it. Do not stash, discard, or commit unless the user asks.

### 2. Fetch upstream

```bash
git fetch upstream
```

Summarize what would come in before merging:

```bash
git log --oneline development..upstream/development
git log --oneline upstream/development..development
```

### 3. Create the merge branch

Create a dated branch from current `origin/development` (or local `development` if it matches origin):

```bash
git checkout development
git pull origin development
git checkout -b merge-upstream-YYYY-MM-DD
```

Use today's date. If that branch already exists, ask before reusing or renaming it.

### 4. Merge upstream into the merge branch

```bash
git merge upstream/development
```

Do not use `--no-ff` or squash unless the user asks. Do not abort the merge unless the user asks.

### 5. Refined conflict resolution

This fork keeps local patches. Treat conflicts as a conversation, not a mechanical "take theirs" or "take ours".

Until more conventions are added here:

- List every conflicted file and a one-line description of both sides
- Preserve CRC-Hub customizations unless the user says to drop them
- Prefer keeping both changes when they do not contradict
- Do not mark a file resolved until the user has seen the proposed resolution
- After resolving, run `git status` and show remaining conflicts

Add new file-specific or package-specific rules under [Conflict conventions](#conflict-conventions) as they are decided.

### 6. Build and test

After the merge (or after a batch of conflict resolutions), build **this Freon fork only** when the user asks. Do not build, publish, or deploy into CRC-Hub until persisted-model compatibility is accepted.

```bash
npm run build
npm test
```

Report failures with the command that failed and the relevant error. Do not "fix" test snapshots or generated output unless the user agrees that the change is expected.

### 7. Push and PR (only when asked)

```bash
git push -u origin merge-upstream-YYYY-MM-DD
```

Do not push `development` directly. Do not force-push. Do not open a PR unless the user asks.

### 8. Package release check

If Freon packages changed significantly, a new release may be needed. See Part 3: Releasing Freon Packages. Do not cut a release unless the user asks.

Only these published packages matter for CRC-Hub: `@freon4dsl/core`, `@freon4dsl/core-svelte`, and `@freon4dsl/meta`. Version those three together. Other workspace packages (server, samples, webapp, tools, test) follow upstream unless a CRC-Hub path or patch is involved.

## Conflict conventions

Add durable rules here as refined merges teach them. Keep each rule specific (file, package, or pattern).

- **Published packages:** only `core`, `core-svelte`, and `meta` matter. Talk through version and CRC patches in those three. For other packages, take upstream unless a CRC-Hub customization is present.
- **`tsconfig-base.json`:** keep the CRC `@freon4dsl/server-crchub/*` path and take any new upstream path aliases / `allowJs`.
- **`FreLionwebSerializer.ts` rename:** upstream split this into `FreLionWebSerializer.ts` + `FreLionWebDeserializer.ts`. Accept the rename. Port the CRC deserialize patch: after `createFromLionWeb`, if `nodesFromJson` has the LionWeb target id, set `freonRef.referred` so path-local name collisions (e.g. Events) do not resolve the wrong node.
- **CRC-Hub persistence:** CRC-Hub stores Freon models as LionWeb JSON in a database field (`study_design_version` / `study_template`). An upstream merge does not change the database schema. ADR-0006 adds parallel `new_*` columns selected by `STUDY_CONFIGURATION_STORE=current|new` (default `current`) so an experimental Freon can save/load without overwriting the live blob. Still do not publish packages or deploy CRC-Hub to production from an upstream 3.x merge until a saved development-model JSON unit loads and re-saves correctly on the `new` store.
- **CRC-Hub local links (no GitHub release yet):** after building `core`, `core-svelte`, and `meta`, run `~/projects/CRC-Hub/scripts/use-local-freon.sh` so package.json uses `file:` URLs, then `npm install`. Do not change `packages/mobile-crchub` — it does not import Freon or persist models. Do not run `scripts/update-freon-deps.sh` until a `v*` tag has produced GitHub Release tarballs.
- **CRC-Hub serializer API:** Freon 3 renamed `FreLionwebSerializer` to `FreLionWebSerializer` / `FreLionWebDeserializer` and replaced `convertToJSON` / `toTypeScriptInstance` with `serializeFreNode` / `deserializeFreNode`. Keep `FreLionwebCompatSerializer.ts` (exports class `FreLionwebSerializer`) as a CRC compatibility wrapper — do not name the file `FreLionwebSerializer.ts` (TS casing clash with `FreLionWebSerializer.ts`) and re-export `collectUsedLanguages` from `storage/index.ts` so CRC-Hub can run against v3 before call sites are rewritten.

## Agent rules

- Never update git config
- Never force-push, hard-reset, or skip hooks
- Never commit or push unless the user explicitly asks
- Never merge the finished work into `development` unless the user explicitly asks
- Never publish Freon packages or deploy CRC-Hub from an upstream-merge branch unless the user explicitly asks after persistence compatibility is accepted
- Always explain why a conflict resolution keeps or drops a side
- When expanding this skill, add the new convention in the refined process or conflict conventions — do not rewrite the official Part 6 brief
