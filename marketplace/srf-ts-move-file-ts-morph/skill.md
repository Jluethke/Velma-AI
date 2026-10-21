# TypeScript Move File with ts-morph

**One-line description:** Moves a TypeScript source file to a new directory with ts-morph `SourceFile.move()`, which rewrites relative import and export specifiers in every file of the project, then fixes path-alias and barrel references the move does not cover, typechecks, tests, checks the API report and commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root with `tsconfig.json`.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-node-characterization-tests`.
- `move_source` (string, required): File to move, for example `src/utils/money.ts`.
- `move_destination` (string, required): New file path, for example `src/core/money.ts`.

---

## Outputs

- `step_commits` (string[]): SHA of the commit made by this step.
- `step_log` (object[]): Old and new paths, importer count, alias and barrel fixes, results, SHA.

---

## Phase 1: Map the Importers

### Entry Criteria
- `git status --porcelain` empty; `npx tsc --noEmit -p tsconfig.json` exits 0; ts-morph installed.

### Actions
1. List importers by specifier style. Run each search and record hits:

| Specifier style | Search | Updated by `move()`? |
|---|---|---|
| Relative (`../utils/money`) | `git grep -n "utils/money['\"]" -- "*.ts" "*.tsx"` | Yes |
| tsconfig `paths` alias (`@/utils/money`) | `git grep -n "@/utils/money" -- "*.ts" "*.tsx"`; read `compilerOptions.paths` for the alias prefix | Do not assume; verify each hit in Phase 2 |
| Barrel re-export (`export * from "./money"` in `index.ts`) | `git grep -n "from \"./money\"" -- "src/**/index.ts"` | Relative ones yes |
| Jest `moduleNameMapper` or `jest.mock("../utils/money")` | `git grep -n "utils/money" -- "*.test.ts" "jest.config.*"` | `jest.mock` strings: no |
| Dynamic `import("../utils/money")` | `git grep -n "import(.*utils/money" -- "*.ts"` | Check after the move |
| Package `exports`/`main` in `package.json` pointing at the file's build output | `grep -n "money" package.json` | No |

2. Destination must not exist: `ls src/core/money.ts` fails. If the directory does not exist, `move()` creates it.
3. Do NOT move with `git mv` plus manual import edits; the language-service move updates all relative specifiers consistently.

### Output
Importer table with hit counts.

### Quality Gate
- Every search in the table was run and its hit count recorded.
- Destination path is free.

---

## Phase 2: Move

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write `.refactor/move.mjs` (excluded via `.git/info/exclude`):
```js
import { Project } from "ts-morph";
const [from, to] = process.argv.slice(2);
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const sf = project.getSourceFileOrThrow(from);
const importers = sf.getReferencingSourceFiles().map((f) => f.getFilePath());
sf.move(to);
await project.save();
console.log(`importers: ${importers.length}`);
for (const p of importers) console.log(p);
```
2. Run: `node .refactor/move.mjs src/utils/money.ts src/core/money.ts`.
3. Stage so git detects the rename: `git add -A && git status --short` should show `R  src/utils/money.ts -> src/core/money.ts`.
4. Fix references the move did not update, from the Phase 1 table: alias imports (`@/utils/money` to `@/core/money`), `jest.mock` strings, dynamic imports, `package.json` fields. Edit each by hand and list it.
5. `npx tsc --noEmit -p tsconfig.json` must exit 0. `git grep -n "utils/money" -- "*.ts" "*.tsx" "*.json" "*.js"` must print nothing (or only an intended compatibility re-export, step 6).
6. If the old path is a public deep import for other packages, add `src/utils/money.ts` with `export * from "../core/money";` as a separate commit after tests pass.

### Output
File at the new path with all specifiers updated.

### Quality Gate
- `tsc --noEmit` exits 0.
- The step 5 grep prints nothing or only the planned re-export.
- The number of changed importer files is at least the `importers` count printed by the script.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization command, then `test_command`. Snapshot files keyed by test path move only if test files moved; if a `.snap` became obsolete, the runner reports it. Do not run `-u`; investigate why.
2. If `madge` is available: `npx madge --circular --extensions ts src` must report no new cycles compared with a run at `baseline_commit`.
3. Run the API Extractor check if configured.
4. Green: `git commit -m "refactor: move money.ts to src/core"`. Red: `git stash push -u -m failed-move`, report.
5. Record outputs.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Tests pass with no snapshots written, updated or obsolete.
- API check exits 0; tree clean after commit.

---

## Worked Example

Illustrative only.
```
$ node .refactor/move.mjs src/utils/money.ts src/core/money.ts
importers: 6
/work/pricing/src/pricing/quote.ts
...
$ git add -A && git status --short | head -3
R  src/utils/money.ts -> src/core/money.ts
M  src/pricing/quote.ts
M  src/pricing/tax.ts
$ git grep -n "utils/money"
src/pricing/__tests__/quote.test.ts:3:jest.mock("../../utils/money");
```
The `jest.mock` path updated by hand to `../../core/money`; `tsc` clean; `npx jest --ci` passes; committed.

---

## Exit Criteria

DONE when the file lives at the destination, every specifier including aliases and mock strings points to it, typecheck, tests and API check pass, and the move is one commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Importers outside the tsconfig `include` | **Adjust**: load the extra tsconfig with `project.addSourceFilesFromTsConfig(...)` before moving. |
| Phase 2 | Alias imports rewritten to long relative paths | **Adjust**: restore the alias style by hand if the lint config requires it; record each file. |
| Phase 2 | `tsc` reports missing module | **Retry**: grep for the old basename; a specifier style from the table was missed. |
| Phase 3 | New import cycle | **Return**: revert and run `srf-ts-break-import-cycle-madge` first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
