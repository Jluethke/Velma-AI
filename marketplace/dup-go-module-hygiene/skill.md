# Go Module Hygiene

**One-line description:** Makes a Go module reproducible before any upgrade: `go.mod` and `go.sum` tidy and verified, `go` and `toolchain` directives understood, no stale `replace` directives, and a recorded vendor policy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `repo_path`, `runtime_version`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `pre_existing_failures`, `flaky_tests`.

---

## Outputs

- `lockfile_status` (object): `tool` (`go`), `go_directive`, `toolchain_directive`, `tidy_clean` (bool), `verify_ok` (bool), `replace_directives`, `vendored` (bool), `workspace` (bool), `fixes_committed`, `new_baseline_sha`, `notes`. Also written to `<work_dir>/lockfile.json`.

---

## Phase 1: Read The Module State

### Entry Criteria
- `upgrade_scope.stack == "go"` and `go.mod` exists.

### Actions
1. List every module in the repo: `git ls-files '*go.mod'`. If there is more than one, run every later command once per module directory. Check for `go.work`: if tracked, record `workspace=true` (commands then act on all workspace modules; `go work sync` updates them together).
2. Read the directives: `go mod edit -json | grep -E '"(Go|Toolchain)"'`. Since Go 1.21 the `go` line is a minimum requirement and the `toolchain` line names the preferred toolchain; `GOTOOLCHAIN=auto` (the default) may download a newer toolchain when a dependency requires it.
3. List replace directives: `go mod edit -json | python -c "import json,sys; print(json.load(sys.stdin).get('Replace'))"`. Local path replaces (`=> ../foo`) break for anyone without that path.
4. Vendor check: `test -d vendor && echo vendored`. If vendored, every dependency change needs `go mod vendor` in the same commit, and builds use `-mod=vendor` automatically when the `go` directive is 1.14 or later.
5. Tidy check:
   - Go 1.23 and later: `go mod tidy -diff` (exits non-zero and prints a diff when not tidy).
   - Older: `cp go.mod go.sum <work_dir>/ && go mod tidy && git diff --exit-code go.mod go.sum`; restore with `git checkout -- go.mod go.sum` afterward.
6. Verify module cache integrity: `go mod verify` (prints `all modules verified`).

### Output
`go_directive`, `toolchain_directive`, `tidy_clean`, `verify_ok`, `replace_directives`, `vendored`, `workspace`.

### Quality Gate
- `go mod verify` output is saved and reads `all modules verified`, or the failing module is recorded.
- The tidy check exit code is saved.

---

## Phase 2: Tidy Without Upgrading

### Entry Criteria
- `tidy_clean == false`.

### Actions
1. Run `go mod tidy`. It adds missing requirements and removes unused ones. It can raise a version only when an import requires a module not yet listed; it never moves an existing requirement to latest.
2. Inspect: `git diff go.mod`. Classify each changed `require` line:

| Diff line | Meaning | Action |
|---|---|---|
| `+ example.com/x v1.2.3` added | import was missing from go.mod | keep |
| `- example.com/y v0.4.0` removed | module no longer imported | keep; grep to confirm: `git grep -n 'example.com/y'` prints nothing in .go files |
| `// indirect` comment moved | requirement now direct or indirect | keep |
| existing version changed | tidy needed a newer version for a new import | keep, but record it in `notes` as an upgrade |

3. If vendored: `go mod vendor`.
4. Build and test: `go build ./... && go test ./...`. Results must equal the baseline.
5. Commit alone: `git commit -am "deps: go mod tidy (no upgrades)"`; record `new_baseline_sha`.

### Output
Tidy `go.mod`/`go.sum`, `fixes_committed`.

### Quality Gate
- The tidy check from Phase 1 step 5 now exits 0.
- `go build ./...` exits 0 and test failures equal the baseline.

---

## Phase 3: Rules For The Rest Of The Run

### Entry Criteria
- Module is tidy and verified.

### Actions
1. Write into `notes`:
   - Bump one module: `go get example.com/x@v1.4.0`, then `go mod tidy`, then `go mod vendor` if vendored.
   - Patch-only refresh of all deps: `go get -u=patch ./...` (one commit, test before commit).
   - Never `go get -u ./...` in one shot for a large module; it moves every dependency including indirect ones and makes failures impossible to attribute.
   - Major versions v2+ are different module paths (`example.com/x/v2`); `go get -u` never crosses them. Moving to v2 changes import paths in code.
   - Commit `go.mod`, `go.sum` (and `vendor/`) together.
2. Record `replace_directives` that point to forks: each one pins a dependency the upgrade tools cannot move; list them for the order plan.

### Output
`lockfile_status`.

### Quality Gate
- `<work_dir>/lockfile.json` parses with `python -m json.tool`.

---

## Worked Example

Illustrative only. Single module, Go 1.23 installed.

- Phase 1: `go.mod` says `go 1.21` and `toolchain go1.22.5`. `go mod tidy -diff` prints a diff removing `github.com/pkg/errors v0.9.1`. `go mod verify`: `all modules verified`. One replace: `github.com/foo/bar => ../bar` (local path).
- Phase 2: `go mod tidy`; `git grep -n 'github.com/pkg/errors' -- '*.go'` prints nothing. `go test ./...` matches baseline. Commit `e17a0c4`.
- Phase 3: notes flag the local replace as a blocker for CI and for any upgrade of `github.com/foo/bar`.

---

## Exit Criteria

DONE when every module is tidy and verified, replaces and vendor policy are recorded, and bump rules are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go mod verify` reports `dir has been modified` | **Retry**: `go clean -modcache` then `go mod download`; if it repeats, **Stop** and report a possible tampered cache. |
| Phase 1 | `go: go.mod requires go >= 1.xx` and toolchain download is disabled | **Return**: record the required toolchain; the user must install it or allow `GOTOOLCHAIN=auto`. |
| Phase 2 | Tidy fails with `missing go.sum entry` | **Adjust**: run `go mod download` then tidy again. |
| Phase 2 | Tests differ after tidy | **Stop**: revert and report the moved requirement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
