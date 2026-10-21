# TypeScript Error Baseline

**One-line description:** Captures the exact tsc error count per file and per TS error code, first under the current config and then under a throwaway strict config, so the migration has a measured starting point and a measured size for every strict flag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): From `tsm-migration-intake`; supplies `check_command`, `config_file` and `source_roots`.

---

## Outputs

- `ts_error_baseline` (object): `current` (total error count, counts by TS code, counts by file under the existing config), `per_flag` (for each of `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`: the error count with only that flag added), `strict_total` (count with `strict: true`), and the path of each saved raw log.

---

## Phase 1: Baseline Under the Current Config

### Entry Criteria
- `migration_profile.checker` is `tsc` and `migration_profile.config_file` is not `none`. If it is `none`, skip this phase and record `current` as not applicable; `tsm-ts-allowjs-checkjs` creates the config first.

### Actions
1. Create a log directory outside the source tree that git ignores, for example `.typecheck-logs/`, and add it to `.git/info/exclude` (local only, no commit needed).
2. Run the check exactly as recorded, with plain output:
   `npx tsc --noEmit -p tsconfig.json --pretty false > .typecheck-logs/current.txt 2>&1; echo "exit=$?"`
   Do not pass `--skipLibCheck` or any other flag that is not already in the config; the baseline must be what CI sees.
3. Each error line has the shape `src/billing/invoice.ts(42,17): error TS2532: Object is possibly 'undefined'.` Count them:
   - Total: `grep -c "error TS" .typecheck-logs/current.txt`
   - By code: `grep -o "error TS[0-9]*" .typecheck-logs/current.txt | sort | uniq -c | sort -rn`
   - By file: `grep "error TS" .typecheck-logs/current.txt | cut -d"(" -f1 | sort | uniq -c | sort -rn`
4. Lines that do not start with a file path (for example `error TS5023: Unknown compiler option`) are config errors. If any exist, stop: a broken config hides every other error.
5. Record the three counts under `current`.

### Output
`current` counts and `.typecheck-logs/current.txt`.

### Quality Gate
- The total from `grep -c` equals the sum of the by-code counts.
- Zero config-level errors (no `error TS5xxx` or `error TS6xxx` lines without a file path).
- The exit code was recorded: 0 means zero errors; any non-zero code with zero `error TS` lines means tsc crashed or was not found, which is a failure, not a clean baseline.

---

## Phase 2: Measure Each Strict Flag Separately

### Entry Criteria
- Phase 1 complete with zero config errors, or skipped.

### Actions
1. Create a throwaway config next to the real one, named `tsconfig.strict-probe.json`, and never commit it:
   ```json
   { "extends": "./tsconfig.json", "compilerOptions": { "noEmit": true } }
   ```
2. For each flag in this list, set only that flag to `true` in the probe, run the check, and save the log:
   `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`.
   Command per flag: `npx tsc -p tsconfig.strict-probe.json --pretty false > .typecheck-logs/flag-<flag>.txt 2>&1`
   `strictPropertyInitialization` requires `strictNullChecks`; for that run set both and subtract the `strictNullChecks` count.
3. Run once more with `"strict": true` and save `.typecheck-logs/strict.txt`. On TypeScript 5.6 or newer `strict` also turns on `strictBuiltinIteratorReturn`, so `strict_total` can exceed the sum of the per-flag counts; check `npx tsc --help --all` for the strict members of the installed version.
4. Subtract the `current` total from each run to get the errors that flag adds. Record under `per_flag`.
5. Delete `tsconfig.strict-probe.json`. Run `git status --porcelain` and confirm only expected files (none in the source tree) changed.

### Output
`ts_error_baseline` complete.

### Quality Gate
- One saved log exists per flag plus `strict.txt`.
- `tsconfig.strict-probe.json` no longer exists and `tsconfig.json` is byte-identical to `git show HEAD:tsconfig.json`.
- Every `per_flag` number is a difference of two counted logs, not an estimate.

---

## Worked Example

Illustrative only. A 180-file Express service already in TypeScript with `"strict": false`.

Phase 1: `npx tsc --noEmit -p tsconfig.json --pretty false` exits 0 with an empty log, so `current.total=0`.

Phase 2 probe results:
```
noImplicitAny                 +311   (TS7006 x 204, TS7031 x 58, TS7053 x 31, TS7005 x 18)
strictNullChecks              +477   (TS18048 x 190, TS2532 x 121, TS2322 x 88, TS2345 x 78)
strictFunctionTypes           +6
strictBindCallApply           +2
strictPropertyInitialization  +23    (TS2564)
noImplicitThis                +4     (TS2683)
useUnknownInCatchVariables    +39    (TS18046)
alwaysStrict                  +0
strict: true                  +862
```
These numbers tell `tsm-ts-noimplicitany` and `tsm-ts-strictnullchecks` their scope, and the by-file lists tell them where to start.

---

## Exit Criteria

DONE when every count in `ts_error_baseline` comes from a saved log, the probe config is deleted, and the real config is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `error TS5xxx` unknown or invalid compiler option | **Stop**: fix the config with the user first; counts under a broken config are wrong. |
| Phase 1 | tsc runs out of memory | **Retry**: rerun with `NODE_OPTIONS=--max-old-space-size=8192`; record that the gate needs the same setting. |
| Phase 1 | Project uses references (`"references"` in tsconfig) | **Adjust**: use `npx tsc -b --pretty false` per referenced project and record counts per project. |
| Phase 2 | Probe changed tracked files | **Return**: restore with `git checkout -- <file>` and rerun; the baseline must not modify the repo. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
