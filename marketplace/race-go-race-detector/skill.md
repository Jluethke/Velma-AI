# Go Race Detector Run and Report Reading

**One-line description:** Runs the Go stress test under `-race` with GORACE options set for full history, then turns each `WARNING: DATA RACE` report into a pair of conflicting accesses with file, line, goroutine and creation site, plus `go vet` lock-copy findings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Go module root (the directory holding `go.mod`).
- `stress_command` (string, required): From `race-stress-harness`; a `go test` command for the harness.

---

## Outputs

- `go_race_reports` (object[]): One row per distinct race: `current_access` (read or write, file:line, function, goroutine id), `previous_access` (same fields), `goroutine_origins` (file:line where each goroutine was created), `vet_findings` (copylocks or other `go vet` lines for the same package), `raw_report_file`.

---

## Phase 1: Run Under the Race Detector

### Entry Criteria
- `go version` prints a version. The race detector supports a fixed list of OS/architecture pairs (for example linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/amd64); confirm yours in the official `go help build` text under `-race`.
- `stress_command` runs without `-race`.

### Actions
1. Add `-race` to `stress_command`. Keep `-count` and `-cpu`. Example: `go test -race -run '^TestReserveStress$' -count=200 -cpu 1,2,4 ./inventory`.
2. Set GORACE options in the same command line. These option names are documented in the Go race detector article:
   `GORACE="halt_on_error=1 history_size=7 log_path=/tmp/gorace" go test -race ...`
   - `halt_on_error=1` stops at the first race so the report is not buried.
   - `history_size` ranges 0 to 7; each step doubles the per-goroutine memory history. Raising it fixes `failed to restore the stack` in reports.
   - `log_path=/tmp/gorace` writes reports to `/tmp/gorace.<pid>` instead of stderr.
3. If the build fails with a message that `-race requires cgo`, set `CGO_ENABLED=1` and install a C toolchain (`gcc` or `clang`). Do not drop `-race`.
4. Also run the whole package tree once: `go test -race -count=1 ./...` and save the output. Races outside the harness are still races.
5. Run `go vet ./...` and save the output. Look for `passes lock by value`, `assignment copies lock value`, `range var ... copies lock`. These are the `copylocks` analyzer and point at a copied `sync.Mutex`, which guards nothing.
6. Expect slowdown: the Go documentation states memory use can grow 5 to 10 times and execution time 2 to 20 times under `-race`. Adjust `-timeout` on `go test` if the harness times out only under `-race`.

### Output
Saved race output (stderr or `/tmp/gorace.*` files) and saved `go vet` output.

### Quality Gate
- The command actually ran with `-race`: the saved command line contains `-race`, and on a race the output contains `WARNING: DATA RACE` and a test line `race detected during execution of test`.
- The exit status is recorded. A race makes the test binary exit with code 66 by default (`exitcode` GORACE option).

---

## Phase 2: Read Each Report

### Entry Criteria
- At least one `WARNING: DATA RACE` in the saved output, or zero races recorded with the run evidence.

### Actions
1. Split the output into reports. Each report runs from `WARNING: DATA RACE` to the line `==================`.
2. Read the blocks in this fixed order:
   - `Write at 0x... by goroutine 8:` or `Read at 0x... by goroutine 8:`: the current access. The first frame under it that is inside `repo_path` is the line to record.
   - `Previous write at 0x... by goroutine 7:` or `Previous read at ...`: the other side of the race.
   - `Goroutine 8 (running) created at:` and `Goroutine 7 (finished) created at:`: the `go` statement that started each goroutine.
3. Record frames by file:line inside the module. Skip frames in `runtime/`, `testing/` and the standard library unless no module frame exists.
4. Deduplicate: two reports with the same pair of module file:line values (order ignored) are one race.
5. Pair `go vet` copylocks findings with races in the same struct: a copied mutex near a reported race usually is the cause.
6. Map the report to a cause with this table:

| Pattern in report | Usual cause |
|---|---|
| Both accesses inside a closure body after `go func()`, on a loop variable | Loop variable captured by reference (before Go 1.22 loop semantics); check `go` directive in `go.mod` |
| Access in `runtime.mapassign` / `runtime.mapaccess` | Map written without a lock |
| One side holds `mu.Lock()`, other side does not | Missing lock on one path |
| Access inside `append` on a shared slice | Slice header shared between goroutines |
| Access on a field of a struct passed by value that contains a mutex | Copied lock (`go vet` copylocks) |

### Output
`go_race_reports`.

### Quality Gate
- Every row has both `current_access` and `previous_access` with a module file:line, or a written note that only standard library frames exist.
- The number of rows equals the number of distinct file:line pairs counted from the raw output.

---

## Worked Example

Illustrative only.

Command: `GORACE="halt_on_error=1 history_size=7" go test -race -run '^TestReserveStress$' -count=50 ./inventory`

Representative output:
```
WARNING: DATA RACE
Write at 0x00c0000a4060 by goroutine 9:
  runtime.mapassign_faststr()
  example.com/shop/inventory.(*Store).Reserve()
      /src/shop/inventory/reserve.go:51 +0x1a4
Previous read at 0x00c0000a4060 by goroutine 8:
  runtime.mapaccess1_faststr()
  example.com/shop/inventory.(*Store).Reserve()
      /src/shop/inventory/reserve.go:47 +0x88
Goroutine 9 (running) created at:
  example.com/shop/inventory.TestReserveStress()
      /src/shop/inventory/reserve_stress_test.go:30 +0x15c
==================
--- FAIL: TestReserveStress (0.01s)
    testing.go:1465: race detected during execution of test
```

Phase 2 row: current write `reserve.go:51`, previous read `reserve.go:47`, both in `(*Store).Reserve`, origin `reserve_stress_test.go:30`; table row "Map written without a lock". `go vet ./inventory` prints nothing.

---

## Exit Criteria

DONE when the harness and the full package tree were run with `-race`, every distinct race is a row with both accesses and origins, and `go vet` output is attached.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-race is not supported on <os>/<arch>` | **Stop**: run on a supported platform (a Linux amd64 container works: `docker run --rm -v "$PWD":/src -w /src golang:<version> go test -race ./...`). |
| Phase 1 | Test times out only under `-race` | **Adjust**: raise `go test -timeout`; never remove `-race`. |
| Phase 1 | No race reported but the stress test fails | **Return**: hand to `race-go-goroutine-dump` for hangs, or to the database flows if the state lives in a database; the race detector only sees memory accesses in this process. |
| Phase 2 | `failed to restore the stack` in a report | **Retry**: rerun with `history_size=7`. |
| Phase 2 | Race only in test code | **Adjust**: record it; a racy test is a defect too, and fix it before trusting the harness. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
