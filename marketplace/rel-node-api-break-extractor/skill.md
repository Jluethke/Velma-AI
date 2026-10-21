# TypeScript and npm Package API Break Detection

**One-line description:** Generates API Extractor reports for the last release tag and HEAD in two worktrees and diffs them, then checks the package.json `exports`, `engines` and type resolution with `@arethetypeswrong/cli` and `publint`, so removed exports, changed signatures and broken entry points are found before the version is chosen.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the package root (the directory with `package.json`).
- `last_tag` (string, optional): Release tag to compare against. Defaults to `git describe --tags --abbrev=0`.
- `package_name` (string, required): The npm package name as in `package.json` `name`.

---

## Outputs

- `node_api_breaks` (object[]): One entry per break: `symbol` or `entry_point`, `kind` (`removed`, `signature-changed`, `exports-removed`, `engines-raised`, `types-resolution`), `old`, `new`, `source` tool. Empty when none.

---

## Phase 1: Build Both Versions

### Entry Criteria
- The package builds `.d.ts` files (`tsc --declaration` or bundler equivalent). If it ships plain JavaScript without types, skip to Phase 3 and record that symbol-level diff is not available.

### Actions
1. Create a baseline worktree: `git worktree add ../baseline <last_tag>`.
2. In both `../baseline` and the current tree, run `npm ci` then the build script exactly as CI runs it (read `package.json` `scripts.build`). Do not substitute a different build command.
3. Locate the main declaration entry: the `types` field or the `exports["."].types` condition in `package.json`, for example `dist/index.d.ts`.

### Output
Two built trees with declaration files.

### Quality Gate
- `ls ../baseline/<types path>` and `ls <types path>` both succeed.
- Both `npm ci` runs exit 0.

---

## Phase 2: Diff API Extractor Reports

### Entry Criteria
- Both trees built.

### Actions
1. Install once in the current tree: `npm install --save-dev @microsoft/api-extractor` (skip if present). Create the config with `npx api-extractor init` if `api-extractor.json` does not exist.
2. In `api-extractor.json` set `"mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts"` (your types path) and `"apiReport": {"enabled": true}`. The report is written to the `reportFolder` (default `<projectFolder>/etc/`) as `<unscopedPackageName>.api.md`.
3. Copy the same `api-extractor.json` into `../baseline` (temporary; do not commit it there), install api-extractor there with `npm install --no-save @microsoft/api-extractor`, and run `npx api-extractor run --local` in both trees. `--local` writes the report instead of failing on a changed report.
4. Diff: `git diff --no-index ../baseline/etc/<name>.api.md etc/<name>.api.md`.
5. Classify every `-` line (removed or changed declaration) with this table:

   | Diff shape | `kind` | Breaking? |
   |---|---|---|
   | `-export function f(...)` with no `+` replacement | `removed` | yes |
   | Parameter removed, parameter made required, or parameter type narrowed | `signature-changed` | yes |
   | Return type widened (for example `string` to `string \| undefined`) | `signature-changed` | yes (callers must handle the new case) |
   | New optional parameter, new export, new optional interface property | none | no (MINOR) |
   | New required property on an interface that callers implement or construct | `signature-changed` | yes |

6. Remove the baseline worktree when done: `git worktree remove ../baseline`.

### Output
Symbol-level entries in `node_api_breaks`.

### Quality Gate
- The diff command output is saved and every removed line is either classified or marked "not breaking" with the table row.
- `git worktree list` no longer shows `../baseline`.

---

## Phase 3: Entry Points, Engines and Types Resolution

### Entry Criteria
- Phase 2 done or skipped for plain JavaScript.

### Actions
1. `git diff <last_tag> HEAD -- package.json` and record:
   - Any key removed from `exports` (for example `"./utils"`): `exports-removed`, breaking, because deep imports fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
   - Adding an `exports` field where none existed: breaking, because every previously reachable deep path is now blocked.
   - `engines.node` lower bound raised: `engines-raised`; whether MAJOR or MINOR is project policy, flag it.
   - `type` changed between `commonjs` and `module`: breaking for `require()` users of `.js` files.
2. Run `npx --yes @arethetypeswrong/cli --pack .` and record each problem it prints (for example "Resolution failed", "Masquerading as CJS", "Missing types") as `types-resolution`. Compare with the same command run at `<last_tag>`; only problems new at HEAD are breaks.
3. Run `npx --yes publint` and record errors (not suggestions) that are new since the tag.

### Output
Final `node_api_breaks`.

### Quality Gate
- `attw` and `publint` were run on both the tag and HEAD, and their outputs are saved.
- Every new problem has an entry; problems present at both versions are not reported as breaks.

---

## Worked Example

Illustrative. `package_name` = `@acme/fetcher`, `last_tag` = `v3.2.0`.

- Phase 1: both trees build `dist/index.d.ts`.
- Phase 2: `git diff --no-index ../baseline/etc/fetcher.api.md etc/fetcher.api.md` shows:
  ```
  -export function fetchJson<T>(url: string, opts?: FetchOptions): Promise<T>;
  +export function fetchJson<T>(url: URL, opts?: FetchOptions): Promise<T>;
  +export function fetchText(url: URL): Promise<string>;
  ```
  One `signature-changed` (parameter type narrowed from `string` to `URL`); `fetchText` is a MINOR addition.
- Phase 3: `exports` lost `"./node"`: one `exports-removed`. `attw --pack .` at HEAD reports `Masquerading as ESM` for `node10` resolution, absent at the tag: one `types-resolution`.

---

## Exit Criteria

DONE when `node_api_breaks` contains every new removal, signature change, exports removal and type resolution problem, each traced to a tool output, or is empty with all three tools showing no new problems.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline build fails (old toolchain) | **Adjust**: use the Node version from the tag's `.nvmrc` or `engines`; `npx -y node@<major> --version` confirms availability. |
| Phase 2 | API Extractor error `ae-missing-release-tag` or similar | **Adjust**: these are messages, not breaks; set them to `"logLevel": "none"` in the temporary config only. |
| Phase 2 | Package has several entry points | **Adjust**: run API Extractor once per entry point with a separate config file per entry. |
| Phase 3 | `attw` cannot pack | **Retry**: run `npm pack` first, then `npx @arethetypeswrong/cli <tarball>`. |
| Any | Tempted to edit `etc/*.api.md` to hide a diff | **Stop**: reports are evidence; never hand-edit them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
