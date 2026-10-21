# Go Race Detector Run

**One-line description:** Runs a flaky Go test under `-race` at the derived count and higher GOMAXPROCS, and reads each `WARNING: DATA RACE` report down to the two conflicting accesses, the goroutines' creation sites, and the variable they share.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Supplies package, test name, CI flags.
- `go_flake_rate_report` (object, required): From `flk-go-count-measure`.
- `repeat_count` (integer, required): Run count.
- `repo_path` (string, required): Module root.

---

## Outputs

- `go_race_report` (object): `{races_found, races[{access_a: {op, file_line, goroutine}, access_b: {op, file_line, goroutine}, goroutine_created_at[], shared_variable, in_test_code_or_product_code}], race_run_command, goleak_findings}`.

---

## Phase 1: Run Under The Race Detector

### Entry Criteria
- `flake_evidence.stack` is `go`.
- `go env CGO_ENABLED` prints `1`, or the platform's race detector does not need cgo. If `go test -race` fails with `-race requires cgo`, set `CGO_ENABLED=1` and install a C toolchain (gcc or clang).

### Actions
1. Run:
   `GORACE="halt_on_error=1" go test ./internal/billing -run '^TestInvoiceRounding$' -race -count=<repeat_count> -cpu 4 2>&1 | tee flk-race.log`
   `halt_on_error=1` stops at the first race so the report is not buried. `GORACE` options are documented on the Go "Data Race Detector" page; check there before adding others.
2. Also run without `-run` for the whole package once: races are often between the victim and a goroutine started by an earlier test.
3. Search the log: `grep -n "WARNING: DATA RACE" flk-race.log` and `grep -n "race detected during execution of test" flk-race.log`.
4. Know the limits: the race detector finds only races that actually happen during the run, so zero reports is not proof of no race. It does not find deadlocks or logical ordering bugs (two correctly locked steps in the wrong order). It slows execution several times, which can hide timing flakes; never use a `-race` pass as the verification of a timing fix.

### Output
`flk-race.log` with reports, or a clean run.

### Quality Gate
- The exact command and the count of `WARNING: DATA RACE` lines are recorded.

---

## Phase 2: Read Each Report

### Entry Criteria
- At least one report, or skip to Phase 3.

### Actions
1. A report has four blocks. Copy each into `races[]`:
   - `Read at 0x00c0001a2b38 by goroutine 9:` (or `Write at`) with a stack. The first frame inside your module is `access_a.file_line`.
   - `Previous write at 0x00c0001a2b38 by goroutine 7:` with a stack: `access_b`.
   - `Goroutine 9 (running) created at:` with the `go` statement's location.
   - `Goroutine 7 (finished) created at:` with its `go` statement.
2. Identify the shared variable: open both file lines. The same address in both blocks means the same memory: a struct field, a map, a slice element, a captured loop variable, or a package global.
3. Set `in_test_code_or_product_code`. A race inside product code is a product bug the test exposed; report it as such, do not suppress it in the test.
4. Common shapes, to name the race precisely:

| Shape | Typical lines |
|---|---|
| Unsynchronized counter or flag | `x++` in a goroutine, `if x == ...` in the test |
| Map written from two goroutines | `m[k] = v`; the runtime may also crash with `fatal error: concurrent map writes` |
| Closure captures loop variable (Go before 1.22) | `for _, tc := range cases { go func(){ use(tc) }() }` |
| Test reads result before goroutine finishes | assertion reads a field the handler goroutine writes |
| `t.Parallel()` subtests share a parent's variable | parent mutates a slice the subtests read |
| Logger or `bytes.Buffer` shared by goroutines | `buf.WriteString` in two goroutines |

### Output
`races[]` filled.

### Quality Gate
- Every race lists two file:line accesses and both creation sites, copied from the report.

---

## Phase 3: Check Goroutine Leaks

### Entry Criteria
- Phase 1 or 2 complete.

### Actions
1. If `go.uber.org/goleak` is already a dependency, run with it; otherwise add it only to the test module: `go get go.uber.org/goleak@latest` (this changes `go.mod` and `go.sum`; keep that change in the fix branch, not in the measurement).
2. Add in a temporary test file in the package: `func TestMain(m *testing.M) { goleak.VerifyTestMain(m) }`. If the package already has a `TestMain`, add `defer goleak.VerifyNone(t)` at the top of the victim test instead.
3. Run `go test ./internal/billing -run '^TestInvoiceRounding$' -count=1`. A leak prints `found unexpected goroutines:` followed by each goroutine's stack. Record the top project frame of each as `goleak_findings`.
4. Leaked goroutines from one test mutate state while later tests run; this links races to order failures.
5. Remove the temporary file after recording; the permanent check is added by `flk-go-sync-wait-fix`.

### Output
`go_race_report`.

### Quality Gate
- `goleak_findings` is either a list of stacks or "none", with the command that produced it.
- `git -C <repo_path> status --porcelain` shows no leftover temporary test file.

---

## Worked Example

Illustrative. `TestInvoiceRounding`, `repeat_count` = 299.

- Phase 1: `GORACE="halt_on_error=1" go test ./internal/billing -run '^TestInvoiceRounding$' -race -count=299 -cpu 4` exits after run 37 with `WARNING: DATA RACE`.
- Phase 2: `Write at ... by goroutine 23: billing.(*Invoice).addLine() invoice.go:54`; `Previous read at ... by goroutine 8: billing.TestInvoiceRounding() invoice_test.go:86`; goroutine 23 created at `invoice.go:41` (`go inv.addLine(l)`). Shared variable: `Invoice.total`. Product code race.
- Phase 3: goleak reports none.

---

## Exit Criteria

DONE when `go_race_report` lists every race with both accesses and creation sites, and the goleak result, each with its command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-race requires cgo` | **Adjust**: `CGO_ENABLED=1` with a C toolchain installed, then rerun. |
| Phase 1 | `race: limit on <n> simultaneously alive goroutines is exceeded, dying` | **Adjust**: run the single test, not the package; record the message. |
| Phase 2 | Report frames are all in the standard library | **Adjust**: read further down each stack to the first frame in your module. |
| Phase 3 | goleak flags runtime or library goroutines that are expected | **Adjust**: add `goleak.IgnoreTopFunction("<func>")` with a comment naming why; never ignore your own package's functions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
