# Enable strictNullChecks

**One-line description:** Turns on `strictNullChecks` file by file with `typescript-strict-plugin` (or globally when the error count allows), and fixes every possibly-null error (TS2531, TS2532, TS18047, TS18048, TS18049, TS2322, TS2345, TS2722) by narrowing, defaults or honest optional types instead of the `!` non-null assertion.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_noimplicitany_result` (object, required): From `tsm-ts-noimplicitany`; confirms `noImplicitAny` is on, which this flow requires so new `null`-related types are not silently `any`.

---

## Outputs

- `ts_strictnull_result` (object): Rollout mode chosen, error counts by code before and after, files still carrying `//@ts-strict-ignore` (must reach zero before the flag goes global), count of `!` non-null assertions before and after, and every `@ts-expect-error -- BUG:` added.

---

## Phase 1: Choose the Rollout Mode

### Entry Criteria
- `npx tsc --noEmit -p tsconfig.json` exits 0 with `noImplicitAny` on.

### Actions
1. Probe: create `tsconfig.snc.json` with `{ "extends": "./tsconfig.json", "compilerOptions": { "strictNullChecks": true } }` and run `npx tsc -p tsconfig.snc.json --noEmit --pretty false > .typecheck-logs/snc.txt`.
2. Count: `grep -c "error TS" .typecheck-logs/snc.txt`, by code, and by file (`cut -d"(" -f1 | sort | uniq -c`).
3. Count existing non-null assertions for the record: `grep -rnE "[A-Za-z0-9_)\]]!\.|[A-Za-z0-9_)\]]!\[|[A-Za-z0-9_)\]]!;|[A-Za-z0-9_)\]]!\)" src --include=*.ts --include=*.tsx | grep -v "!=" | wc -l`. This regex is a heuristic; the authoritative count comes from the lint rule in `tsm-ts-eliminate-any`.
4. Choose the mode:

   | Situation | Mode |
   |---|---|
   | Error count is 0 | Global: set `"strictNullChecks": true` in `tsconfig.json`, commit, done. |
   | The user accepts a long-lived branch | Global on the branch: set the flag, fix file by file. |
   | Main must stay green and the team wants new files strict immediately | Per-file with `typescript-strict-plugin` (Phase 2). |

### Output
Counts and mode.

### Quality Gate
- Probe config deleted after the run; `git status --porcelain` shows no tracked change from the probe.
- Mode recorded with its table row.

---

## Phase 2: Per-File Rollout With typescript-strict-plugin

### Entry Criteria
- Mode is per-file.

### Actions
1. Install pinned: `npm install --save-dev --save-exact typescript-strict-plugin`. Read the package README in `node_modules/typescript-strict-plugin/README.md` and confirm the plugin name, the CLI name (`tsc-strict`) and the comment-update command (`update-strict-comments`) for the installed version before using them.
2. Add to `tsconfig.json`:
   ```json
   "compilerOptions": {
     "strict": false,
     "plugins": [{ "name": "typescript-strict-plugin" }]
   }
   ```
   The plugin applies `strict` checks (which include `strictNullChecks`) to every file that does NOT carry `//@ts-strict-ignore`. Plain `tsc` ignores plugins; the editor and `npx tsc-strict` enforce them.
3. Run `npx update-strict-comments`. It adds `//@ts-strict-ignore` to every file that currently fails strict checks. Commit that alone: `types: add ts-strict-ignore to failing files`.
4. Add a script `"typecheck:strict": "tsc-strict"` and run it; it must exit 0 now.
5. Note: strict mode here means every `strict` member flag, not only null checks. The fixes table in Phase 3 covers null errors; other strict errors in the same file are handled by `tsm-ts-strict-family-flags`.

### Output
Plugin installed, failing files marked, strict check green.

### Quality Gate
- `npx tsc-strict` exits 0.
- `grep -rl "@ts-strict-ignore" src | wc -l` is recorded as the starting count.
- New files created after this commit carry no ignore comment (enforced in review and by the count never rising).

---

## Phase 3: Fix Files and Remove the Ignores

### Entry Criteria
- Global mode with the flag set, or Phase 2 complete.

### Actions
1. Take one file (per-file mode: remove its `//@ts-strict-ignore` line; global mode: next file in the by-file list). Leaf files first, following `ts_conversion_order` when available.
2. Run the check (`npx tsc-strict` or `npx tsc --noEmit`) and fix each error with this table. The `!` operator is never the fix.

   | Error | Typical cause | Fix |
   |---|---|---|
   | TS18048 / TS2532 `'x' is possibly 'undefined'` | `array.find()`, `map.get()`, optional property, `arr[i]` under `noUncheckedIndexedAccess` | Narrow: `const u = users.find(f); if (u === undefined) { return notFound(); }` |
   | TS18047 / TS2531 `'x' is possibly 'null'` | `document.querySelector`, `RegExp.exec`, DB lookups typed `T \| null` | Narrow with `if (x === null)` and handle; or `?.` when absence is a valid no-op. |
   | TS2322 / TS2345 `Type 'string \| undefined' is not assignable to type 'string'` | Passing an optional value to a required parameter | Decide which side is wrong: if absence is valid, widen the parameter to `T \| undefined`; if it is not, narrow at the call site and handle the missing case. |
   | TS2722 `Cannot invoke an object which is possibly 'undefined'` | Optional callback | `onDone?.()` |
   | TS2454 `Variable 'x' is used before being assigned` | `let x;` assigned in branches | Initialize, or restructure so every branch assigns. |
   | TS2564 `Property has no initializer` | Class field set in a method, not the constructor (only with `strictPropertyInitialization`) | Handled in `tsm-ts-strict-family-flags`. |

3. Defaults: `??` only when the default is a correct business value (`page ?? 1`). Never `?? ""` or `?? 0` just to silence the checker; that hides missing data.
4. `!` is allowed only immediately after a check the compiler cannot see (for example after `map.has(k)`, `map.get(k)!`) and must carry a comment naming the check. Prefer restructuring: `const v = map.get(k); if (v !== undefined) { ... }`.
5. Run `test_command`; commit `types(strictNullChecks): <file>`.
6. Per-file mode: when `grep -rl "@ts-strict-ignore" src` is empty, set `"strictNullChecks": true` (or move on to full `strict` in the next flow), remove the plugin only if the user agrees, and commit.

### Output
`ts_strictnull_result`.

### Quality Gate
- `npx tsc --noEmit -p tsconfig.snc.json` style probe (or the committed flag) reports 0 errors of codes TS2531, TS2532, TS18047, TS18048, TS18049, TS2722.
- Non-null assertion count did not rise: rerun the Phase 1 step 3 count and compare.
- Test results equal the intake baseline.

---

## Worked Example

Illustrative only. 477 probe errors across 96 files; main must stay green, so per-file mode.

Phase 2: `npx update-strict-comments` marks 96 files; `npx tsc-strict` exits 0; commit.

Phase 3, `src/services/billing.ts` (ignore removed):
```
src/services/billing.ts(41,18): error TS18048: 'customer' is possibly 'undefined'.
```
Line 40 is `const customer = customers.find(c => c.id === id);`. Fix:
```ts
const customer = customers.find(c => c.id === id);
if (customer === undefined) {
  throw new NotFoundError(`customer ${id}`);
}
```
The old code would have thrown `TypeError: Cannot read properties of undefined`; the new code throws the domain error the route already maps to 404. Behavior on the happy path is unchanged; `npm test` passes; commit. Ignore count: 95.

---

## Exit Criteria

DONE when `strictNullChecks` is on for every file (zero `//@ts-strict-ignore` lines, or the flag set globally), tsc exits 0, and the non-null assertion count did not grow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Plugin CLI or comment command name differs in the installed version | **Adjust**: use the names in the installed README; do not guess. |
| Phase 3 | A narrowing changes behavior on an error path that tests cover | **Adjust**: keep the old observable behavior (same exception type or same return) and record the improvement for the user. |
| Phase 3 | The fix would need `!` without a visible preceding check | **Stop**: restructure, or record an open question; do not add the assertion. |
| Phase 3 | Ignore count rises in a later commit | **Return**: a new file was added with an ignore comment; fix it before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
