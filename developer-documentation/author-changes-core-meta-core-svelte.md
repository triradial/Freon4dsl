# Author code changes (narrowed)
Baseline commit: `b959a781fafc7e6e2b16e8579e218101e3d422c1` (2025-11-25 14:33:49 -0500)

Filters applied:
- exclude merge commits
- exclude commits that look like upstream syncs (merge/update from freon4dsl)
- exclude tests, snapshots, generated, build/dist output, rollup cache, and d.ts

## Commits
- e3c5bba7 Enhance study configuration and UI components. Added support for hiding drag handles in ListComponent and SelectableListItemComponent. Updated StudyConfigLanguage to include showSteps option. Improved display options in DSLFooter and refined checkbox styles. Adjusted visibility logic for nested components and enhanced user experience with better handling of item visibility and indentation.
  - packages/core-svelte/src/lib/components/ListComponent.svelte
  - packages/core/src/ast/index.ts
  - packages/core/src/editor/actions/index.ts
  - packages/core/src/editor/boxes/Box.ts
  - packages/core/src/editor/index.ts
  - packages/core/src/index.ts
  - packages/core/src/interpreter/index.ts
  - packages/core/src/language/index.ts
  - packages/core/src/util/index.ts
- 50d091d5 Implement firstLeaf and lastLeaf methods in AbstractPropertyWrapperBox for improved keyboard navigation. Remove AbbreviationComponent and update StudyConfigLanguage to use MultilineTextComponent. Enhance MultilineTextComponent with better focus handling and TinyMCE toolbar adjustments. Update styles for consistent appearance and accessibility improvements across components.
  - packages/core/src/editor/boxes/externalBoxes/AbstractPropertyWrapperBox.ts
- 70473e6a Refactor InMemoryModel save logic to enhance logging and handle dirty unit checks. Introduce direct server save method in ModelManager to bypass dirty checks when necessary. Update Svelte components for improved accessibility and user experience, including role attributes for splitters and enhanced save handling in SchemaMismatchDialog.
  - packages/core-svelte/src/lib/components/LayoutComponent.svelte
  - packages/core/src/storage/InMemoryModel.ts
  - packages/meta/src/interpretergen/generator/templates/InterpreterBaseTemplate.ts
- bc196e49 wip on checklist
  - packages/core/src/editor/boxes/externalBoxes/StringReplacerBox.ts
- 982a0812 1.29 implement All Patients Timeline with real data and stable rendering
  - packages/core/src/logging/FreLogger.ts
- 217fe792 home page update
  - packages/core/src/ast/index.ts
  - packages/core/src/editor/actions/index.ts
  - packages/core/src/editor/index.ts
  - packages/core/src/index.ts
  - packages/core/src/interpreter/index.ts
  - packages/core/src/language/index.ts
  - packages/core/src/util/index.ts
- ff6858fb updated UI wip
  - packages/core/src/editor/projections/FreProjectionHandler.ts
- 759ca3b7 wip on optional properties; parser is broken
  - packages/meta/src/utils/file-utils/FileUtil.ts
- b3d4eebe new custom external components
  - packages/meta/src/editordef/generator/templates/boxproviderhelpers/ExternalBoxesHelper.ts
  - packages/meta/src/editordef/generator/templates/boxproviderhelpers/ItemBoxHelper.ts
- cef42c6c major update - DB + AD
  - packages/core/src/storage/InMemoryModel.ts
- 3419682c text dsl in test works
  - packages/meta/src/parsergen/parserTemplates/grammarModel/GrammarModel.ts
- a845c099 added timeline showing all patients
  - packages/meta/src/parsergen/parserTemplates/grammarModel/GrammarModel.ts

## Unique files
- packages/core-svelte/src/lib/components/LayoutComponent.svelte
- packages/core-svelte/src/lib/components/ListComponent.svelte
- packages/core/src/ast/index.ts
- packages/core/src/editor/actions/index.ts
- packages/core/src/editor/boxes/Box.ts
- packages/core/src/editor/boxes/externalBoxes/AbstractPropertyWrapperBox.ts
- packages/core/src/editor/boxes/externalBoxes/StringReplacerBox.ts
- packages/core/src/editor/index.ts
- packages/core/src/editor/projections/FreProjectionHandler.ts
- packages/core/src/index.ts
- packages/core/src/interpreter/index.ts
- packages/core/src/language/index.ts
- packages/core/src/logging/FreLogger.ts
- packages/core/src/storage/InMemoryModel.ts
- packages/core/src/util/index.ts
- packages/meta/src/editordef/generator/templates/boxproviderhelpers/ExternalBoxesHelper.ts
- packages/meta/src/editordef/generator/templates/boxproviderhelpers/ItemBoxHelper.ts
- packages/meta/src/interpretergen/generator/templates/InterpreterBaseTemplate.ts
- packages/meta/src/parsergen/parserTemplates/grammarModel/GrammarModel.ts
- packages/meta/src/utils/file-utils/FileUtil.ts
