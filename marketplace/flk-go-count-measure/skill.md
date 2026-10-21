# Go Test Flake Rate Measurement

**One-line description:** Measures one Go test's failure rate at the derived run count with `go test -run '^Name$' -count=N -json`, counting `fail` events per test from the JSON stream, in serial, parallel and CI-selection modes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): From `flk-flake-evidence-intake`; supplies the package, test name and CI command.
- `repeat_count` (integer, required): N from `flk-run-count-derive`.
- `repo_path` (string, required): Module root (directory with `go.mod`).

---

## Outputs

- `go_flake_rate_report` (object): `{serial: {command, pass, fail}, parallel_cpu: {command, pass, fail}, ci_selection: {command, pass, fail}, go_version, uses_t_parallel, failure_signatures_seen[]}`.

---

## Phase 1: Prepare

### Entry Criteria
- `flake_evidence.stack` is `go`.

### Actions
1. Record `go version` and `go env GOOS GOARCH CGO_ENABLED`.
2. Build the anchored run pattern. `-run` takes a regular expression per slash-separated level: `-run '^TestInvoiceRounding$'` for a top-level test, `-run '^TestInvoiceRounding$/^negative_amount$'` for one subtest. Without `^...$`, `TestInvoice` also matches `TestInvoiceRounding`.
3. Confirm it selects exactly one test: `go test ./internal/billing -list '^TestInvoiceRounding$'` must print that one name followed by `ok`. `-list` shows top-level tests only; subtests are confirmed by a `-v` run that prints `=== RUN   TestInvoiceRounding/negative_amount`.
4. Check whether the test or its parent calls `t.Parallel()`: `grep -n "t.Parallel()" internal/billing/*_test.go`. Record `uses_t_parallel`.
5. Know the cache rule: `go test` caches passing results for package-list mode; any `-count` value disables caching for that run. Never read a line ending in `(cached)` as a new sample.

### Output
Anchored pattern, version facts.

### Quality Gate
- `-list` prints exactly the target test name.

---

## Phase 2: Count Runs

### Entry Criteria
- Pattern confirmed.

### Actions
1. Serial mode:
   `go test ./internal/billing -run '^TestInvoiceRounding$' -count=<repeat_count> -json > flk-serial.json`
2. Count with jq (top-level test only):
   `jq -r 'select(.Test=="TestInvoiceRounding" and (.Action=="pass" or .Action=="fail")) | .Action' flk-serial.json | sort | uniq -c`
   If jq is not installed, install it (`apt-get install jq`, `brew install jq`, `winget install jqlang.jq`). Do not count with a plain text grep of the JSON: field order inside each event is not something to rely on.
3. Parallel scheduling mode: rerun the serial command once per GOMAXPROCS value with a separate output file, `-cpu 1` into `flk-cpu1.json`, then `-cpu 4` into `flk-cpu4.json` (use the runner's CPU count from `flake_evidence.runner_facts` as the upper value). Run them separately because in `-json` output the `Test` name is identical for every `-cpu` value, so a combined run cannot be split. Leave `-parallel` at its default.
4. CI selection mode: the CI command from `flake_evidence` (often `go test ./... -race -count=1`) wrapped in a loop of `repeat_count` iterations, counting only the target test's `fail` events.
5. Do NOT add `-failfast` while measuring. It stops at the first failure.
6. Copy the `Output` lines that precede each `fail` event (assertion text, file:line) into `failure_signatures_seen`.
7. Delete `flk-*.json` after recording.

### Output
Counts per mode.

### Quality Gate
- pass + fail == `repeat_count` for serial mode, from the jq count.
- No mode's output contains `(cached)` for the target package.

---

## Phase 3: Read The Pattern

### Entry Criteria
- Counts recorded.

### Actions
1. Apply:

| Serial | -cpu varied | CI selection | Reading |
|---|---|---|---|
| > 0 | > 0 | any | Intrinsic: goroutine timing, time, randomness, map order, network. Run `flk-go-race-detect`. |
| 0 | > 0 at higher GOMAXPROCS | any | Scheduling-dependent: data race or missing synchronization. Run `flk-go-race-detect`. |
| 0 | 0 | > 0 | Interaction with other tests or packages: package globals, shared DB, ports, `-p` package parallelism. Run `flk-go-shuffle-order-detect`. |
| 0 | 0 | 0 | Not reproduced; rerun with the CI Go version and `GOFLAGS` from the CI log. |

2. Record the highest-rate command as the baseline.

### Output
`go_flake_rate_report`.

### Quality Gate
- The reading names its table row and cites the counts.

---

## Worked Example

Illustrative. `./internal/billing`, `TestInvoiceRounding`, `repeat_count` = 299, Go 1.22.5.

- Phase 1: `go test ./internal/billing -list '^TestInvoiceRounding$'` prints `TestInvoiceRounding` and `ok`. `uses_t_parallel` = true.
- Phase 2: serial jq count prints `299 pass` (the laptop default GOMAXPROCS is 1 inside the dev container). `-cpu 1` shows 0 failures; `-cpu 4` shows `294 pass` and `5 fail`. Output before a fail: `invoice_test.go:88: total = 1999, want 2000`.
- Phase 3: row 2, scheduling-dependent. Baseline = `go test ./internal/billing -run '^TestInvoiceRounding$' -count=299 -cpu 4 -json`.

---

## Exit Criteria

DONE when `go_flake_rate_report` holds counts for three modes from `-json` events and a table reading.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-list` prints nothing | **Adjust**: wrong package path or name; run `go test ./... -list '.*' 2>/dev/null` and search. |
| Phase 2 | Package fails to build | **Stop**: not a flake; fix the build first. |
| Phase 2 | Test panics with `test timed out after` | **Adjust**: record as failure with signature "timeout"; keep the default `-timeout` unless CI sets another, and copy CI's value. |
| Phase 3 | All zero | **Return**: to `flk-flake-evidence-intake` to rerun with CI's exact environment. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
