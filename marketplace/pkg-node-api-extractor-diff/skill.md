# TypeScript API Diff With API Extractor

**One-line description:** Classifies a TypeScript package release as major, minor or patch by generating API Extractor `.api.md` reports for the previous release tag and the working tree and reading the diff line by line.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `exports_map` (object, required): From `pkg-node-exports-map`; the entry points and their `.d.ts` files.
- `previous_release_ref` (string, optional): Git tag of the last release, for example `v2.3.0`. Absent means first release.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `node_change_class` (string): One of `initial`, `major`, `minor`, `patch`, `none`.
- `node_api_diff` (object): Removed or changed declarations, added declarations, the `.api.md` diff, and the pasted tool output.

---

## Phase 1: Configure API Extractor

### Entry Criteria
- The package builds `.d.ts` files (`npm run build` exits 0 and `exports_map` types paths exist).

### Actions
1. Install as a dev dependency: `npm install -D @microsoft/api-extractor`.
2. Create config: `npx api-extractor init`. This writes `api-extractor.json`.
3. Set in `api-extractor.json`: `"mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts"` (the ESM types file for `"."`), `"apiReport": { "enabled": true, "reportFolder": "<projectFolder>/etc/" }`. API Extractor analyzes one entry point per config; for each extra subpath, add another config file with its own entry point and a distinct report file name (see the `reportFileName` setting in the docs).
4. Run `npx api-extractor run --local --verbose`. `--local` writes or updates `etc/<package>.api.md` instead of failing when it changes.
5. Read warnings such as `ae-forgotten-export` (a public signature uses a type that is not exported; callers cannot name it). Each is either an export to add or a leak to fix.

### Output
`etc/<package>.api.md` for the working tree.

### Quality Gate
- `npx api-extractor run --local` exits 0.
- `etc/<package>.api.md` exists and is non-empty.

---

## Phase 2: Generate the Baseline Report

### Entry Criteria
- `previous_release_ref` given and `git rev-parse --verify <ref>` exits 0. If absent, set `node_change_class = initial` and skip to Phase 3.

### Actions
1. If `etc/<package>.api.md` was committed at the ref, use it: `git show <ref>:etc/<package>.api.md > /tmp/api-base.md`.
2. Otherwise build the old version in a separate worktree:
   ```
   git worktree add /tmp/pkg-base <ref>
   cd /tmp/pkg-base && npm ci && npm run build
   cp <project_dir>/api-extractor.json /tmp/pkg-base/
   npm install -D @microsoft/api-extractor && npx api-extractor run --local
   cp etc/<package>.api.md /tmp/api-base.md
   ```
3. Remove the worktree after: `git worktree remove /tmp/pkg-base`.
4. Diff: `diff -u /tmp/api-base.md etc/<package>.api.md > /tmp/api.diff`.

### Output
`/tmp/api.diff`.

### Quality Gate
- Both report files exist and the diff command ran (exit 0 means identical, 1 means differences).

---

## Phase 3: Classify the Diff

### Entry Criteria
- Diff exists (or first release).

### Actions
1. Read every `-` line in the diff (a declaration removed or changed) and every `+` line (added or changed). A changed signature shows as one `-` and one `+`.
2. Mark each `-` line as breaking unless its `+` partner only widens what callers may pass (a new optional parameter, a parameter type widened from `string` to `string | number`) or narrows what the function returns. Anything else (removed export, required parameter added, return type widened, property made required, interface member added to an interface users implement) is breaking.
3. Read the behavior: list commits `git log --oneline <ref>..HEAD -- src` and ask the user to classify behavior changes the types cannot show.
4. Decide:

   | # | Condition | `node_change_class` |
   |---|---|---|
   | 1 | No previous release | initial |
   | 2 | Any breaking line, or adding `exports` to a package that had none, or a breaking behavior change | major |
   | 3 | Any added export or non-breaking signature change | minor |
   | 4 | Source changed (`git diff --quiet <ref> -- src` exits 1) | patch |
   | 5 | No change | none |

5. Commit `etc/<package>.api.md` with the release so the next diff has a baseline.

### Output
`node_change_class`, `node_api_diff`.

### Quality Gate
- Every `-` line has a breaking or non-breaking mark with the reason.
- The class cites its table row.

---

## Worked Example

Illustrative. `@acme/qs-lite`, ref `v2.3.0`.

Phase 3 diff excerpt:
```
-export function parse(input: string, opts?: ParseOptions): Record<string, string>;
+export function parse(input: string, opts?: ParseOptions): Record<string, string | string[]>;
+export function parseStrict(input: string): Record<string, string>;
```
The return type of `parse` widened: callers that assign to `Record<string,string>` stop compiling: breaking. Table row 2: `node_change_class = major`.

---

## Exit Criteria

DONE when both reports exist, every removed or changed line is judged with a reason, and the class cites its row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ae-forgotten-export` warnings | **Adjust**: export the type or change the signature; do not suppress the message in config. |
| Phase 2 | Old ref does not build | **Adjust**: compare the published `.d.ts` instead: `npm pack <name>@<old>` then extract and run API Extractor on it. |
| Phase 3 | Unclear whether a change narrows or widens | **Return**: list it as an open question; classify as major until answered. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
