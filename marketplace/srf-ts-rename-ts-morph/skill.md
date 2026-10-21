# TypeScript Rename Across the Project with ts-morph

**One-line description:** Renames an exported TypeScript symbol in every file that references it using ts-morph's `rename()`, which calls the TypeScript language service's find-rename-locations so imports, re-exports, shorthand properties and destructuring are updated, then typechecks, tests, checks the API report and commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root with `tsconfig.json`.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-node-characterization-tests`.
- `rename_target` (string, required): `<file>#<kind>:<name>` where kind is `function`, `class`, `interface`, `type`, `variable`, `method` (as `Class.method`) or `property` (as `Interface.prop`), for example `src/pricing/quote.ts#function:buildQuote`.
- `new_name` (string, required): The new identifier.

---

## Outputs

- `step_commits` (string[]): SHA of the commit made by this step.
- `step_log` (object[]): Old and new names, files changed, string references, typecheck, test and API results, SHA.

---

## Phase 1: Find All References

### Entry Criteria
- `git status --porcelain` empty; `npx tsc --noEmit -p tsconfig.json` exits 0; `npm ls ts-morph` shows it installed.

### Actions
1. Check the tsconfig covers every file that imports the symbol. Files outside `include` are invisible to the language service. List them: `npx tsc -p tsconfig.json --listFilesOnly | grep -c "/src/"` and compare to `git ls-files "src/*.ts" "src/*.tsx" | wc -l`. If tests use a separate `tsconfig.test.json`, plan to load it too.
2. Find references the compiler cannot see: `git grep -n -w "<oldName>" -- "*.json" "*.md" "*.html" "*.yml"` and string uses `git grep -n -e "\"<oldName>\"" -e "'<oldName>'" -- "*.ts" "*.tsx"` (also check template literals by searching `<oldName>` inside backtick strings in the grep output).
3. Classify with this table:

| Finding | Decision |
|---|---|
| Symbol exported from the package entry and consumed by other packages | After rename, add `/** @deprecated Use newName */ export const oldName = newName;` (or `export { newName as oldName }`) in the entry file. |
| Object property that is serialized (`JSON.stringify`, HTTP payload) | Stop: renaming changes the wire format. Out of scope. |
| Name in a string (`obj["oldName"]`, mocks like `jest.spyOn(mod, "oldName")`) | Update those strings by hand in the same commit; list each. |
| Name in a `.d.ts` you do not own (node_modules) | Stop. |

### Output
Reference plan and string-reference list.

### Quality Gate
- Every file in `src` that imports the symbol is included by a loaded tsconfig.
- Every string reference is classified.

---

## Phase 2: Rename with ts-morph

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write `.refactor/rename.mjs` (add `.refactor/` to `.git/info/exclude`):
```js
import { Project } from "ts-morph";
const [file, spec, newName] = process.argv.slice(2);
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
// project.addSourceFilesFromTsConfig("tsconfig.test.json"); // uncomment if tests use their own tsconfig
const sf = project.getSourceFileOrThrow(file);
const [kind, name] = spec.split(":");
const node = {
  function: () => sf.getFunctionOrThrow(name),
  class: () => sf.getClassOrThrow(name),
  interface: () => sf.getInterfaceOrThrow(name),
  type: () => sf.getTypeAliasOrThrow(name),
  variable: () => sf.getVariableDeclarationOrThrow(name),
  method: () => { const [c, m] = name.split("."); return sf.getClassOrThrow(c).getMethodOrThrow(m); },
  property: () => { const [i, p] = name.split("."); return sf.getInterfaceOrThrow(i).getPropertyOrThrow(p); },
}[kind]();
const before = node.findReferencesAsNodes().length;
node.rename(newName, { renameInComments: false, renameInStrings: false });
await project.save();
console.log(`references renamed: ${before}`);
```
2. Run: `node .refactor/rename.mjs src/pricing/quote.ts function:buildQuote createQuote`.
3. Keep `renameInStrings: false`. String references are edited by hand from the Phase 1 list so each one is a reviewed decision.
4. Edit the string references from Phase 1 and add the deprecated alias if the table required it.
5. `npx tsc --noEmit -p tsconfig.json` (and the test tsconfig) must exit 0.
6. `git grep -n -w "<oldName>" -- "*.ts" "*.tsx"` must show only the deprecated alias line.

### Output
Renamed symbol across the project.

### Quality Gate
- Typecheck exits 0 for every tsconfig in use.
- The step 6 grep returns only the alias line or nothing.
- `git diff --stat` file count is at least the number of files reported by `findReferencesAsNodes`, with no unrelated files.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization command (no snapshot update), then `test_command`.
2. If `api-extractor.json` exists, run its check. A renamed export without an alias changes the report; add the alias or get approval.
3. Run the project linter on changed files only: `npx eslint $(git diff --name-only -- "*.ts" "*.tsx")` if ESLint is configured.
4. Green: `git commit -am "refactor: rename buildQuote to createQuote"`. Red: `git checkout -- .`, report.
5. Record `step_commits` and `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Tests exit 0 with no snapshot written or updated.
- API check exits 0.
- `git status --porcelain` empty after commit.

---

## Worked Example

Illustrative only.
```
$ git grep -n "\"buildQuote\"" -- "*.ts"
src/pricing/__tests__/api.test.ts:12:  jest.spyOn(quoteModule, "buildQuote")
$ node .refactor/rename.mjs src/pricing/quote.ts function:buildQuote createQuote
references renamed: 14
$ npx tsc --noEmit -p tsconfig.json
$ git diff --stat | tail -1
 7 files changed, 15 insertions(+), 14 deletions(-)
```
The `jest.spyOn` string edited by hand; alias `export { createQuote as buildQuote }` added to `src/index.ts`; `npx jest --ci` passes.

---

## Exit Criteria

DONE when the symbol is renamed by the language service in every included file, string references are resolved, typecheck, tests and API check pass, and one commit holds the step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Some importing files not in any tsconfig | **Adjust**: load the extra tsconfig with `addSourceFilesFromTsConfig`. |
| Phase 2 | `get...OrThrow` throws | **Adjust**: the kind is wrong (for example an arrow function is a `variable`). |
| Phase 2 | Typecheck errors in files using path aliases | **Retry**: confirm `paths` in tsconfig resolve; rerun the rename with the alias config loaded. |
| Phase 3 | Mock by string name breaks tests | **Adjust**: update the string; never delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
