# Go Dead Code Removal with deadcode and staticcheck U1000

**One-line description:** Removes unreachable Go functions using `golang.org/x/tools/cmd/deadcode` (whole-program reachability from `main` via Rapid Type Analysis) for binaries and `staticcheck -checks U1000` for unexported unused identifiers in libraries, confirming each with `-whylive`, reflection and build-tag searches and coverage, one deletion per commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-go-golden-master-tests`.
- `dead_code_scope` (string, required): Package pattern to act on, for example `./internal/...`.

---

## Outputs

- `step_commits` (string[]): One SHA per deletion.
- `step_log` (object[]): Per function: tool report line, evidence, decision, SHA.

---

## Phase 1: Choose the Tool and Run It

### Entry Criteria
- `git status --porcelain` empty; `go build ./...` and `go vet ./...` exit 0.

### Actions
1. Choose with this table:

| Module contains | Tool | Command |
|---|---|---|
| One or more `package main` | deadcode | `go install golang.org/x/tools/cmd/deadcode@latest` then `deadcode ./...` |
| Library only (no `main`) | staticcheck U1000 | `go install honnef.co/go/tools/cmd/staticcheck@latest` then `staticcheck -checks U1000 ./...` |
| Both | Both; deadcode for functions reachable only from tests or nowhere, U1000 for unused unexported fields, types and constants | |

2. deadcode output lines look like `internal/report/csv.go:41:6: unreachable func: writeLegacyCSV`. By default the roots are `main` functions of the listed packages; run `deadcode -test ./...` as well, which also treats tests as roots. A function listed without `-test` but not with `-test` is used only by tests.
3. staticcheck output lines look like `internal/report/csv.go:12:2: field legacyHeader is unused (U1000)`.
4. Run `deadcode -h` to confirm flags (`-test`, `-whylive`, `-filter`, `-tags`) in your version.
5. Keep only findings inside `dead_code_scope`.

### Output
Candidate list with tool lines.

### Quality Gate
- Both the default and `-test` deadcode runs (or the staticcheck run) are recorded.

---

## Phase 2: Confirm Each Candidate

### Entry Criteria
- Candidate list exists.

### Actions
1. Run each check:

| Check | Command | Live if |
|---|---|---|
| Explain liveness (for a function you think is dead but is not listed, or to double-check) | `deadcode -whylive=example.com/app/internal/report.writeLegacyCSV ./...` | Prints a call path from `main` |
| Build tags or other GOOS/GOARCH | `git grep -n "//go:build" -- "*.go"`; rerun `deadcode -tags=<tag> ./...` per tag set | Reachable under some tag |
| Reflection and `go:linkname` | `git grep -n -e "reflect\." -e "MethodByName" -e "go:linkname" -- "*.go"`; method names called by string | Called by name |
| Exported and imported by other modules | Listed in `apidiff` baseline (`.refactor/api/`) or documented public API | Public |
| Interface satisfaction | Method required by an interface used via type assertion in another module | Removing breaks `var _ I = (*T)(nil)` or callers |
| Coverage | `go test ./... -count=1 -coverpkg=./... -coverprofile=/tmp/c.out`, then read the function's row in `go tool cover -func=/tmp/c.out` | Above 0.0% from non-test-only paths |

2. Decide:

| Evidence | Decision |
|---|---|
| Unreachable in default and `-test` runs, no reflection, not public, 0.0% coverage | Delete. |
| Unreachable in default run, reachable with `-test` only | Keep unless the user confirms retirement; then delete function and its tests together. |
| Reachable under any build tag, by reflection, or public | Keep; record why. |

### Output
Decision per candidate.

### Quality Gate
- Every Delete has the deadcode or U1000 line, all checks negative, and 0.0% coverage recorded.

---

## Phase 3: Delete One per Commit

### Entry Criteria
- At least one Delete decision.

### Actions
1. Delete the function (or field, type, constant). Then run `goimports -l .` or `go build ./...`; remove imports that became unused (`go build` reports `"strings" imported and not used`).
2. Run `gofmt -l .` (prints nothing), `go vet ./...`, the golden test command, `test_command`, and the `apidiff` check.
3. Green: `git commit -am "refactor: remove unreachable writeLegacyCSV (deadcode, 0% coverage)"`. Red: `git checkout -- .`, mark Keep.
4. Rerun deadcode after each deletion; removing one function can make its callees unreachable. Add new findings to Phase 2 and repeat.

### Output
`step_commits`, `step_log`.

### Quality Gate
- After each commit, build, vet and tests exit 0; `apidiff` silent.
- The next deadcode run no longer lists the deleted function.

---

## Worked Example

Illustrative only.
```
$ deadcode ./...
internal/report/csv.go:41:6: unreachable func: writeLegacyCSV
internal/report/csv.go:77:6: unreachable func: quoteField
$ deadcode -test ./...
internal/report/csv.go:41:6: unreachable func: writeLegacyCSV
```
`quoteField` is used only by tests: Keep. `writeLegacyCSV`: no reflection, no build tags, 0.0% coverage, not in the apidiff baseline: delete. After the commit, `deadcode ./...` still lists `quoteField` only.

---

## Exit Criteria

DONE when every deletion is backed by the tool report plus negative liveness checks, each is one green commit, and kept candidates have reasons.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | deadcode reports "no main packages" | **Adjust**: use staticcheck U1000 for the library. |
| Phase 2 | Function reachable only on another OS | **Adjust**: rerun with `GOOS=windows deadcode ./...` (or the relevant GOOS); keep if live there. |
| Phase 3 | Build breaks in a file with build tags | **Retry**: revert; the function is live under that tag. |
| Phase 3 | `apidiff` reports removal | **Stop**: public; keep. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
