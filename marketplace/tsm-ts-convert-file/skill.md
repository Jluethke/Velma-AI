# Convert One JavaScript File to TypeScript

**One-line description:** Renames JavaScript files to `.ts` or `.tsx` one unit per commit in leaf-first order with `git mv`, replaces CommonJS with typed ES module syntax where safe, adds explicit types at the file's exported surface, and proves zero new tsc errors and an unchanged test result after every file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_conversion_order` (object[], required): From `tsm-ts-conversion-order`; units to convert, in order.
- `ts_declarations` (object[], required): From `tsm-ts-declaration-files`; confirms third-party imports are typed.
- `migration_profile` (object, required): Supplies `check_command`, `test_command` and `test_baseline`.

---

## Outputs

- `ts_converted_files` (object[]): One row per converted unit: old and new paths, commit hash, tsc error count before and after, test result after, and any `@ts-expect-error -- BUG:` lines added.

---

## Phase 1: Prepare One Unit

### Entry Criteria
- The working tree is clean (`git status --porcelain` prints nothing).
- Every unit earlier in `ts_conversion_order` is already `status: ts`. If not, convert those first; converting out of order forces `any` at the imports.

### Actions
1. Take the first unit with `status: js`. Convert only this unit. Do not touch any other file except the import specifiers that must change because of the rename (see Phase 2).
2. Record the current total: run `check_command` and count `error TS` lines.
3. Choose the extension: `.tsx` if the file contains JSX (`grep -c "<[A-Z][A-Za-z]*" <file>` is a hint; confirm by reading), otherwise `.ts`. `.mjs` becomes `.mts`, `.cjs` becomes `.cts`.
4. Rename with history kept: `git mv src/lib/money.js src/lib/money.ts`. Commit the rename alone with message `types: rename money.js to money.ts`. A rename-only commit keeps `git log --follow` and `git blame` working.

### Output
Renamed file committed alone.

### Quality Gate
- `git show --stat HEAD` lists one rename with 100 percent similarity (`R100`), or one rename per file in a cycle unit.
- No other file changed in that commit.

---

## Phase 2: Type the File

### Entry Criteria
- Rename committed.

### Actions
1. Run `check_command` and filter to this file: `npx tsc --noEmit -p tsconfig.json --pretty false | grep "^src/lib/money.ts("`.
2. Fix module syntax with this table. Only change syntax that tsc reports or that the table lists:

   | JavaScript | TypeScript | Note |
   |---|---|---|
   | `const x = require('./a')` | `import x from './a'` or `import * as x from './a'` | Pick by how `./a` exports: `export default` or `module.exports =` with `esModuleInterop` takes default import. |
   | `module.exports = fn` | `export = fn` | Keeps the CommonJS shape for existing `require` callers. Use `export default fn` only if every importer is converted in the same unit. |
   | `module.exports.a = a` / `exports.a = a` | `export const a = ...` / `export function a` | Same name, same value. |
   | `require('./a')` inside a function (lazy) | Leave as is; add `import type` for its type | Moving it to the top changes load order. |

3. With `moduleResolution: nodenext`, relative imports in ESM must include the runtime extension: `import { a } from "./a.js"` even though the source file is `a.ts`. Do not write `./a.ts` unless the config sets `allowImportingTsExtensions`.
4. Add explicit types at the exported surface only: every exported function's parameters and return type, every exported constant whose inferred type is wider than intended, and an `interface` or `type` for every object shape that crosses the file boundary. Inside function bodies, let inference work.
5. Types for values from outside the program (parsed JSON, request bodies, environment variables) are `unknown`, not a hand-written interface. Mark each with `// TODO(tsm-ts-zod-boundaries)` so the boundary flow validates them. Do not write `as SomeType` on them.
6. Never add `any`. When a type cannot be written yet, use `unknown` and narrow, or record the line as an open question.
7. If tsc reveals a real bug, do not change behavior. Add `// @ts-expect-error -- BUG: <description>` and record it.
8. Update importers only where tsc now fails because of the rename (for example an import that named `./money.js` under a bundler that resolves extensions differently). List each changed importer.
9. Run `check_command` for the whole project and `test_command`.

### Output
Typed file with zero errors in it and no new errors elsewhere.

### Quality Gate
- `grep -c "^src/lib/money.ts("` on the tsc output prints 0.
- Project total `error TS` count is less than or equal to the count recorded in Phase 1 step 2.
- `test_command` result equals `migration_profile.test_baseline` (same passes, same pre-existing failures, no new failures).
- `git diff HEAD --stat` shows the converted file plus only the importers listed in step 8.
- `grep -n ": any\b\|<any>\|as any" src/lib/money.ts` prints nothing.

---

## Phase 3: Commit and Record

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Commit with message `types: convert money.ts`.
2. Append a row to `ts_converted_files` and mark the unit `status: ts` in `ts_conversion_order`.
3. Return to Phase 1 for the next unit. Never batch several units into one commit.

### Output
`ts_converted_files`.

### Quality Gate
- One commit per unit after the rename commit; `git log --oneline` shows the pair for each unit.

---

## Worked Example

Illustrative only. Unit `src/lib/money.js` (CommonJS, 3 importers).

Phase 1: total before = 0. `git mv src/lib/money.js src/lib/money.ts`; commit shows `R100`.

Phase 2:
```
src/lib/money.ts(1,1): error TS2580: Cannot find name 'module'. Do you need to install type definitions for node?
src/lib/money.ts(3,19): error TS7006: Parameter 'cents' implicitly has an 'any' type.
```
(The second line appears only if `noImplicitAny` is on.) Replace `module.exports = { format }` with `export function format(cents: number, currency: string): string`. Importers use `const { format } = require('./money')`; under `esModuleInterop` with a bundler this still resolves, tsc total stays 0, `npm test` prints `412 passed`. Commit `types: convert money.ts`.

---

## Exit Criteria

DONE when every unit in `ts_conversion_order` is `status: ts`, each with a rename commit and a typing commit, zero new tsc errors, and the test result equal to the baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An earlier unit is still JavaScript | **Stop**: convert it first; out-of-order conversion forces `any` at the boundary. |
| Phase 2 | New errors appear in other files after the rename | **Adjust**: they are importers seeing real types for the first time; fix only the import shape or record `@ts-expect-error -- BUG:`; do not widen the new types to make them pass. |
| Phase 2 | A test fails that passed in the baseline | **Retry**: the syntax change altered runtime behavior (default vs named export is the usual cause); revert the change and use the table row that keeps the CommonJS shape. |
| Phase 2 | Tempted to delete or skip a failing test | **Stop**: never weaken tests; restore and fix the conversion. |
| Phase 3 | Unit too large to type in one commit | **Return**: ask the user to approve splitting the file first as a separate refactor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
