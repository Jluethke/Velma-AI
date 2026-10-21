# TypeScript Public API Snapshot with API Extractor

**One-line description:** Generates a committed `etc/<package>.api.md` report of a TypeScript package's exported surface with Microsoft API Extractor, so every later refactoring step is checked by `api-extractor run` failing when the exported types, signatures or names change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root containing `package.json` and `tsconfig.json`.
- `package_entry_dts` (string, required): Path of the compiled declaration entry point, for example `dist/index.d.ts`.
- `baseline_commit` (string, required): SHA from `srf-baseline-green-check`.

---

## Outputs

- `api_snapshot` (string): Path of the API report, for example `etc/pricing.api.md`.
- `api_check_command` (string): Command that rebuilds declarations and fails on any API change, for example `npx tsc -p tsconfig.json && npx api-extractor run`.

---

## Phase 1: Produce Declarations

### Entry Criteria
- `git rev-parse HEAD` equals `baseline_commit`.

### Actions
1. Open `tsconfig.json`. API Extractor reads `.d.ts` files, not `.ts` sources. Use this table:

| `compilerOptions` state | Action |
|---|---|
| `"declaration": true` and an `outDir` | Continue. |
| `declaration` missing or false | Do not edit the main tsconfig. Create `tsconfig.api.json` with `{"extends": "./tsconfig.json", "compilerOptions": {"declaration": true, "emitDeclarationOnly": true, "outDir": "dist"}}`. |
| `"noEmit": true` | Same as above, and set `"noEmit": false` in `tsconfig.api.json` only. |

2. Build declarations: `npx tsc -p tsconfig.json` (or `-p tsconfig.api.json`).
3. Confirm `package_entry_dts` exists: `ls dist/index.d.ts`.

### Output
Declaration files for the baseline.

### Quality Gate
- `tsc` exits 0.
- The file at `package_entry_dts` exists.

---

## Phase 2: Configure and Record the Report

### Entry Criteria
- Phase 1 complete.

### Actions
1. Install if missing: `npm install --save-dev @microsoft/api-extractor`. Record the version from `npx api-extractor --help` header.
2. If `api-extractor.json` does not exist, run `npx api-extractor init`. It writes a commented template.
3. Edit `api-extractor.json`: set `"mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts"` (match `package_entry_dts`). Keep `"apiReport": { "enabled": true }`. Leave `reportFolder` at its default `<projectFolder>/etc/` unless the repo already uses another folder. Set `"docModel": { "enabled": false }` and `"dtsRollup": { "enabled": false }` unless the project already uses them; this flow needs only the report.
4. Record the baseline report: `npx api-extractor run --local --verbose`. The `--local` flag tells the tool to write or update `etc/<unscopedPackageName>.api.md` instead of failing.
5. Open the `.api.md` file. It lists every exported declaration in a fenced `ts` block. Confirm a known export is present: `grep -n "export function buildQuote" etc/*.api.md`.
6. Run `npx api-extractor run` without `--local`. It must exit 0, since the report now matches.
7. Commit the configuration and report as their own commit: `git add api-extractor.json etc/ tsconfig.api.json && git commit -m "build: API Extractor baseline report"` (omit `tsconfig.api.json` if not created).

### Output
`api_snapshot`, `api_check_command`.

### Quality Gate
- `npx api-extractor run` (no `--local`) exits 0.
- The grep in step 5 prints at least one line.
- `git show --stat HEAD` lists only the config and report files.

---

## Phase 3: Prove the Check Fires

### Entry Criteria
- Phase 2 committed.

### Actions
1. Mutation: add an optional parameter to one exported function, run `api_check_command`.
2. Expect a failure with text like `Warning: You have changed the public API signature for this project. Please copy the file "temp/pricing.api.md" to "etc/pricing.api.md"`. The new report is written to `temp/`; `diff etc/pricing.api.md temp/pricing.api.md` shows the change.
3. Restore: `git checkout -- src/` and delete the generated `temp/` folder only (`rm -rf temp`, after confirming it is untracked with `git status --porcelain temp`).
4. Rules for later steps:

| Check result | Action |
|---|---|
| Exit 0 | API unchanged; commit the step. |
| Signature warning, change was unintended | Revert the step. |
| Signature warning, change intended and user-approved | Rerun with `--local`, commit the updated `.api.md` in the same commit as the code, with the approval noted in the message. |
| `ae-forgotten-export` or other `ae-*` message | Read the message ID in the API Extractor docs; do not suppress it in `api-extractor.json` to get green. |

5. Never run `--local` in a step to silence an unintended change.

### Output
Verified check and decision rules.

### Quality Gate
- The mutation produced a non-zero exit and a non-empty `diff` between `etc/` and `temp/`.
- After restore, `api_check_command` exits 0 and `git status --porcelain` is empty.

---

## Worked Example

Illustrative only. Package `pricing`, entry `dist/index.d.ts`.
```
$ npx tsc -p tsconfig.api.json
$ npx api-extractor run --local --verbose
Writing: /work/pricing/etc/pricing.api.md
API Extractor completed successfully
$ npx api-extractor run
API Extractor completed successfully
```
Mutation `buildQuote(req: QuoteRequest, opts?: QuoteOptions)`:
```
Warning: You have changed the public API signature for this project. ...
-export function buildQuote(req: QuoteRequest): Quote;
+export function buildQuote(req: QuoteRequest, opts?: QuoteOptions): Quote;
```
Restored; `api_check_command = "npx tsc -p tsconfig.api.json && npx api-extractor run"`.

---

## Exit Criteria

DONE when the report is committed, the check passes on the unchanged tree, and a deliberate signature change is caught.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `tsc` errors on the baseline | **Stop**: the baseline does not compile; return to `srf-baseline-green-check`. |
| Phase 2 | `ae-missing-release-tag` warnings flood the output | **Adjust**: these concern TSDoc release tags, not the report; record them and leave the message settings unchanged unless the user decides. |
| Phase 2 | Entry point not found | **Adjust**: point `mainEntryPointFilePath` at the real `.d.ts` path printed by `tsc --listEmittedFiles`. |
| Phase 3 | Mutation not detected | **Stop**: the entry point does not export the mutated function; fix `mainEntryPointFilePath`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
