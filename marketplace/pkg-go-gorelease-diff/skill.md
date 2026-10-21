# Go API Diff With gorelease

**One-line description:** Classifies a Go module release as major, minor or patch by running `gorelease` against the previous tag and reading its incompatible-change list and suggested version, with `apidiff` as the per-package fallback.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `go_export_surface` (object, required): From `pkg-go-internal-packages`.
- `previous_release_ref` (string, optional): Previous semver tag, for example `v1.4.2`. Absent means first release.
- `project_dir` (string, required): Module root.

---

## Outputs

- `go_change_class` (string): One of `initial`, `major`, `minor`, `patch`, `none`.
- `go_api_diff` (object): Incompatible changes, compatible additions, the gorelease suggested version, other diagnostics (for example go.mod problems), and pasted output.

---

## Phase 1: Run gorelease

### Entry Criteria
- `previous_release_ref` is a tag reachable in git (`git tag --list <ref>` prints it). If absent, set `go_change_class = initial` and skip to Phase 3.
- Working tree committed (`git status --porcelain` empty); gorelease compares the committed state.

### Actions
1. Install: `go install golang.org/x/exp/cmd/gorelease@latest`. It is an experimental tool; run `gorelease -h` to confirm flags.
2. Run from the module root: `gorelease -base=<previous_release_ref>`.
3. Read the output sections:
   - `## incompatible changes` under a package heading: each line is a breaking change.
   - `## compatible changes`: additions.
   - Diagnostics about `go.mod` (for example a module path that does not match the major version, or missing requirements).
   - `Suggested version: vX.Y.Z` at the end.
4. Copy every line into `go_api_diff`.

### Output
Raw gorelease report.

### Quality Gate
- The command and full output are in the report.
- Exit code recorded (non-zero when the report found a problem for the proposed version).

---

## Phase 2: Fallback per Package With apidiff

### Entry Criteria
- gorelease failed to run (for example the base version cannot be downloaded); otherwise skip this phase and record "not needed".

### Actions
1. Install: `go install golang.org/x/exp/cmd/apidiff@latest`.
2. Export the old API of each public package from a worktree: `git worktree add /tmp/base <ref>`, then in `/tmp/base` run `apidiff -w /tmp/<pkg>.base <import path>`.
3. In the current tree: `apidiff /tmp/<pkg>.base <import path>`. Output has `Incompatible changes:` and `Compatible changes:` sections.
4. Repeat for every package in `go_export_surface`, then `git worktree remove /tmp/base`.

### Output
Per-package incompatible and compatible lists.

### Quality Gate
- One apidiff output per public package is in the report.

---

## Phase 3: Decide the Class

### Entry Criteria
- Phase 1 or Phase 2 produced lists (or first release).

### Actions
1. Ask the user about behavior changes not visible in signatures: `git log --oneline <ref>..HEAD`.
2. Decide:

   | # | Condition | `go_change_class` |
   |---|---|---|
   | 1 | No previous tag | initial |
   | 2 | Any incompatible change or breaking behavior change | major |
   | 3 | Any compatible change (new exported identifier, new package) | minor |
   | 4 | Code changed (`git diff --quiet <ref> -- . ':!*_test.go'` exits 1) | patch |
   | 5 | Nothing changed | none |

3. If the class is `major` and the current major is v1 or higher, `pkg-go-module-major-path` must change the module path to `/vN`. Record this in `go_api_diff`.
4. If gorelease's suggested version disagrees with the table, report both; the table plus behavior answers decide.

### Output
`go_change_class`, `go_api_diff`.

### Quality Gate
- The class cites its table row and the incompatible list (or its emptiness) as evidence.

---

## Worked Example

Illustrative. `github.com/acme/ratelimit`, base `v1.4.2`.

Phase 1:
```
$ gorelease -base=v1.4.2
# github.com/acme/ratelimit
## incompatible changes
New: changed from func(int) *Limiter to func(int, ...Option) *Limiter
## compatible changes
WithClock: added
Suggested version: v2.0.0
```
A variadic parameter added to a function is incompatible because function values of the old type no longer match.

Phase 3: table row 2: `go_change_class = major`; module path must become `github.com/acme/ratelimit/v2`.

---

## Exit Criteria

DONE when the incompatible and compatible lists are captured from gorelease or apidiff, behavior changes are classified, and the class cites its row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `gorelease` reports uncommitted changes | **Adjust**: commit or stash, then rerun. |
| Phase 1 | Base version not found | **Adjust**: run Phase 2 with apidiff on a worktree of the tag. |
| Phase 3 | Incompatible change was unintended | **Return**: hand back to the developer to restore the old signature; a new function name is a minor change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
