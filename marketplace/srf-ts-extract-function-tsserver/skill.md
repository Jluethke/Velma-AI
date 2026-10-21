# TypeScript Extract Function with the Language Service Refactor

**One-line description:** Extracts a statement range in a TypeScript file into a new function by calling the TypeScript language service's built-in "Extract Symbol" refactor through ts-morph, so parameters, return values and types are computed by the compiler, then renames the generated `newFunction`, typechecks, tests and commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root with `tsconfig.json`.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-node-characterization-tests`; must cover the range.
- `extract_file` (string, required): File relative to `repo_path`, for example `src/pricing/quote.ts`.
- `extract_lines` (string, required): Inclusive line range of whole statements, for example `40-52`.
- `new_function_name` (string, required): camelCase name, for example `applyTierDiscount`.

---

## Outputs

- `step_commits` (string[]): SHAs of the commits made by this step.
- `step_log` (object[]): Refactor name, chosen extract action, files changed, typecheck and test results, commit SHA.

---

## Phase 1: List Applicable Extract Actions

### Entry Criteria
- `git status --porcelain` is empty; `npx tsc --noEmit -p tsconfig.json` exits 0.
- `npm ls ts-morph` shows it installed, or the user approves `npm install --save-dev ts-morph`.

### Actions
1. Write `/tmp/ts-extract.mjs` outside the repo (Windows: the system temp folder). Run it from `repo_path` so `ts-morph` resolves from the project's `node_modules`; if Node cannot resolve it from the temp path, copy the script into an ignored folder such as `.refactor/` listed in `.git/info/exclude`.
```js
import { Project } from "ts-morph";
const [file, first, last, mode, actionName] = process.argv.slice(2);
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const sf = project.getSourceFileOrThrow(file);
const pos = sf.compilerNode.getPositionOfLineAndCharacter(Number(first) - 1, 0);
const endLine = sf.compilerNode.getLineEndOfPosition(sf.compilerNode.getPositionOfLineAndCharacter(Number(last) - 1, 0));
const range = { pos: pos + (sf.getFullText().slice(pos).match(/^\s*/)[0].length), end: endLine };
const ls = project.getLanguageService();
if (mode === "list") {
  for (const r of ls.compilerObject.getApplicableRefactors(sf.getFilePath(), range, {}))
    for (const a of r.actions) console.log(r.name, "|", a.name, "|", a.description, a.notApplicableReason ?? "");
} else {
  const edit = ls.getEditsForRefactor(sf, {}, range, "Extract Symbol", actionName, {});
  if (!edit) throw new Error("refactor not applicable");
  edit.applyChanges();
  await project.save();
  console.log("renameLocation", edit.getRenameLocation());
}
```
2. Run `node /tmp/ts-extract.mjs src/pricing/quote.ts 40 52 list`.
3. Choose from the printed actions with this table:

| Printed action name | Meaning | Choose when |
|---|---|---|
| `function_scope_0` | Function in the innermost enclosing scope (inner function or method) | The block uses `this` or closure variables you want kept as closure |
| `function_scope_1`, `function_scope_2`, ... | Higher scopes, last one is module scope | You want a module-level function; pick the highest number described as "in module scope" |
| `constant_scope_N` | Extract to constant | Only for a single expression; not this flow |
| No `Extract Symbol` lines, or a `notApplicableReason` | Range is invalid | Fix the range (whole statements only) and rerun |

4. Do NOT invent action names; use one exactly as printed.

### Output
Chosen action name.

### Quality Gate
- The list output contains an `Extract Symbol | function_scope_N` line with no not-applicable reason, and that exact name is recorded.

---

## Phase 2: Apply, Rename, Typecheck

### Entry Criteria
- Action chosen.

### Actions
1. Apply: `node /tmp/ts-extract.mjs src/pricing/quote.ts 40 52 apply function_scope_1`.
2. The language service names the function `newFunction` (or `newFunction_1` if taken). Rename it with ts-morph or your editor's rename, never with find-and-replace: `sf.getFunctionOrThrow("newFunction").rename("applyTierDiscount")` followed by `await project.save()`.
3. `git diff --stat` must list only `extract_file`. If not, `git checkout -- .` and stop.
4. `npx tsc --noEmit -p tsconfig.json` must exit 0.
5. Read the new function signature. If the language service inferred a parameter type as `any`, add the explicit type the original variables had; this is a type annotation, not a logic change.
6. Run the project formatter only on the changed file if the project has one (`npx prettier --write src/pricing/quote.ts`), so formatting does not leak into other files.

### Output
One-file diff with `applyTierDiscount` and its call site.

### Quality Gate
- `grep -n "newFunction" src/pricing/quote.ts` prints nothing.
- `tsc --noEmit` exits 0.
- `git diff --stat` lists one file.

---

## Phase 3: Test and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization command from `characterization_tests` with `--ci` (Jest) or `run` (Vitest), then `test_command`.
2. If an API Extractor setup exists (`api-extractor.json`), run its check command; a module-scope function that is not exported does not change the report.
3. Green: `git commit -am "refactor: extract applyTierDiscount from buildQuote"`. Red: `git checkout -- src/pricing/quote.ts`, read the failure, retry with a smaller range. Never update snapshots (`-u`) in this flow.
4. Record SHA and `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Test summary shows zero failures and `Snapshots: N passed` with nothing written or updated.
- `git show --stat HEAD` lists one source file; `git status --porcelain` is empty.

---

## Worked Example

Illustrative only.
```
$ node /tmp/ts-extract.mjs src/pricing/quote.ts 40 52 list
Extract Symbol | function_scope_0 | Extract to inner function in function 'buildQuote'
Extract Symbol | function_scope_1 | Extract to function in module scope
Extract Symbol | constant_scope_0 | Extract to constant in enclosing scope
$ node /tmp/ts-extract.mjs src/pricing/quote.ts 40 52 apply function_scope_1
renameLocation 1287
$ npx tsc --noEmit -p tsconfig.json
$ npx jest --ci
Tests:       61 passed, 61 total
Snapshots:   3 passed, 3 total
```

---

## Exit Criteria

DONE when the range is a named module or inner function chosen from the compiler's own action list, `tsc` passes, tests pass without snapshot updates, and one commit holds the step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Cannot find package 'ts-morph'` | **Adjust**: run the script from an ignored folder inside the repo so Node resolves the project's `node_modules`. |
| Phase 1 | Only `constant_scope` actions listed | **Adjust**: the range is a single expression; widen to statements. |
| Phase 2 | `getEditsForRefactor` returns undefined | **Retry**: rerun list mode; use an action name exactly as printed. |
| Phase 2 | `tsc` errors after extraction | **Retry**: revert and choose a lower scope number, which keeps closure variables. |
| Phase 3 | Snapshot mismatch | **Retry**: revert; the extraction changed evaluation order. Never run `-u`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
