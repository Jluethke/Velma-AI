# Go Test JSON Durations

**One-line description:** Produces ranked per-package and per-test timing for a Go module from `go test -json` events (the `Elapsed` field on `pass` and `fail` actions) with the result cache disabled, plus `gotestsum tool slowest` as a cross-check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root containing `go.mod`.
- `test_command` (string, required): The `go test` command from the baseline (for example `go test ./...` or `go test -race ./...`).
- `baseline_report` (object, required): From `tsp-baseline-lock`; confirms a green run at this commit.

---

## Outputs

- `go_duration_report` (object): Ranked packages (import path, elapsed seconds, test count), ranked tests (package, test name including subtests, elapsed seconds), parallel-marked tests, and the raw `go-test.json` path.

---

## Phase 1: Capture Events

### Entry Criteria
- `go.mod` exists; `baseline_report` is green.

### Actions
1. Run with JSON output and the cache disabled, keeping every flag from `test_command` (for example `-race`, `-tags`):
   `go test -count=1 -json <flags from test_command> ./... > go-test.json`
2. Why `-count=1`: Go caches passing package results. A cached package prints `(cached)` and reports near-zero `Elapsed`, which hides its real cost.
3. Do NOT add `-run`, `-short`, or `-failfast`. They change what runs.
4. Confirm success: `jq -r 'select(.Action=="fail")' go-test.json | head` prints nothing.

### Output
`go-test.json`.

### Quality Gate
- `go-test.json` exists and contains at least one line with `"Action":"pass"`.
- The `fail` query prints nothing.
- `grep -c '(cached)' go-test.json` prints `0`.

---

## Phase 2: Rank Packages and Tests

### Entry Criteria
- `go-test.json` exists.

### Actions
1. Package rows are `pass` events with no `Test` field:
   `jq -r 'select(.Action=="pass" and .Test==null) | [.Elapsed, .Package] | @tsv' go-test.json | sort -rn > pkgs-ranked.tsv`
2. Test rows are `pass` events with a `Test` field:
   `jq -r 'select(.Action=="pass" and .Test!=null) | [.Elapsed, .Package, .Test] | @tsv' go-test.json | sort -rn > tests-ranked.tsv`
3. Subtests appear as `TestParent/sub_case`. A parent's `Elapsed` includes its subtests; do not add parent and child seconds together.
4. Cross-check with gotestsum if available (`go install gotest.tools/gotestsum@latest`): `gotestsum tool slowest --jsonfile go-test.json`. Its list must match the top of `tests-ranked.tsv`. Check `gotestsum tool slowest --help` for the threshold flag before passing one.
5. Package `Elapsed` excludes compile time. Compile and init cost is measured separately by `tsp-go-build-init-cost`.

### Output
Ranked packages and tests.

### Quality Gate
- `wc -l < pkgs-ranked.tsv` equals the number of packages that ran tests: `jq -r 'select(.Action=="run") | .Package' go-test.json | sort -u | wc -l`.
- Every seconds value came from an `Elapsed` field.

---

## Phase 3: Tag Signals

### Entry Criteria
- Ranked lists exist.

### Actions
1. Find tests that already run in parallel: `grep -rn "t.Parallel()" --include=*_test.go .`. Mark those rows `parallel=yes`.
2. Tag each test row with one signal by grepping its file:

| Grep hit inside the test or its helpers | Signal |
|---|---|
| `time.Sleep(`, `<-time.After(` with a fixed duration | `sleep` |
| `http.Get(`, `http.Client{` against a non-`httptest` URL, cloud SDK clients | `network` |
| `sql.Open(`, `pgx.Connect(`, `pgxpool.New(`, migrations run per test | `database` |
| `TestMain` with container start (`testcontainers`), `exec.Command(` | `process` |
| none | `cpu_in_test` |

3. Record per package whether it has a `TestMain` (`grep -rln "func TestMain" --include=*_test.go .`).
4. Do NOT edit code in this flow.

### Output
`go_duration_report`.

### Quality Gate
- Every test row has exactly one signal and the `file:line` that justified it.
- `git status --porcelain` shows no edited `.go` files.

---

## Worked Example

Illustrative. `test_command=go test -race ./...`.

- Phase 1: `go test -count=1 -json -race ./... > go-test.json`; the fail query prints nothing.
- Phase 2: `pkgs-ranked.tsv` top rows: `48.211  example.com/ledger/store`, `12.004  example.com/ledger/notify`. `tests-ranked.tsv` top rows: `9.010  example.com/ledger/notify  TestRetryBackoff`, `3.122  example.com/ledger/store  TestPostEntry/duplicate_key`.
- Phase 3: `TestRetryBackoff` has `time.Sleep(3 * time.Second)` at `notify/retry_test.go:44`, signal `sleep`. `store` tests call `pgxpool.New` in each test, signal `database`, and the package has no `TestMain`.

---

## Exit Criteria

DONE when `go_duration_report` holds ranked packages and tests copied from `Elapsed`, parallel marks, `TestMain` presence, and one signal per test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A package fails to build | **Stop**: the baseline is not green; return to `tsp-baseline-lock`. |
| Phase 1 | Tests fail only with `-count=1` | **Return**: the suite depended on cached results; report the failing tests as a separate defect. |
| Phase 2 | Package row count does not match | **Adjust**: check for build tags; rerun with the same `-tags` as CI. |
| Phase 3 | Test uses a helper in another file | **Adjust**: follow the call with `grep -rn "func <helper>"` and tag from the helper body. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
