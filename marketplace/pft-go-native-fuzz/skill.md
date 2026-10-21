# Go Native Fuzzing with go test -fuzz

**One-line description:** Writes a `func FuzzXxx(f *testing.F)` fuzz test with `f.Add` seeds and an `f.Fuzz` body that asserts real properties, runs `go test -run=^$ -fuzz=^FuzzXxx$ -fuzztime=<budget>` on one package, reads the `fuzz: elapsed ... execs ... new interesting` status lines, and collects the minimized failing inputs Go writes to `testdata/fuzz/FuzzXxx/`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): Go targets and harness contracts from `pft-fuzz-target-selection`.
- `seed_corpus` (object[], required): Seed locations from `pft-corpus-seeding`.
- `repo_path` (string, required): Module root containing `go.mod` (Go 1.18 or later).
- `fuzz_time` (string, required): Fuzzing budget per target as a Go duration (for example `10m`) or an exec count (`10000x`); chosen by the user.

---

## Outputs

- `go_fuzz_findings` (object[]): One row per target: fuzz test name, package, run command, final status line, and each failing input file path under `testdata/fuzz/<FuzzName>/` with its error message.

---

## Phase 1: Write the Fuzz Test

### Entry Criteria
- `go version` is 1.18 or later; `go test ./...` passes.

### Actions
1. Create the fuzz test in `<pkg>/<name>_fuzz_test.go`, in the same package as the target. One fuzz test per entry point.

```go
func FuzzParseHeader(f *testing.F) {
    f.Add([]byte("Content-Type: text/plain\r\n"))       // seeds; testdata/fuzz/FuzzParseHeader/ is read too
    f.Fuzz(func(t *testing.T, data []byte) {
        h, err := ParseHeader(data)
        if err != nil {
            if !errors.Is(err, ErrMalformed) {          // allowed errors from the harness contract
                t.Fatalf("unexpected error type: %v", err)
            }
            return
        }
        out := h.Marshal()
        h2, err := ParseHeader(out)                      // round-trip from the catalog
        if err != nil || !reflect.DeepEqual(h, h2) {
            t.Fatalf("round-trip mismatch: %q -> %q (%v)", data, out, err)
        }
    })
}
```

2. Fuzz arguments may only be these types: `[]byte`, `string`, `bool`, `byte`, `rune`, `float32`, `float64`, `int`, `int8`, `int16`, `int32`, `int64`, `uint`, `uint8`, `uint16`, `uint32`, `uint64`. Every `f.Add` call must pass the same types in the same order as the `f.Fuzz` function parameters.
3. Do not call `t.Parallel()`, `os.Exit`, network or clock functions inside `f.Fuzz`. Do not keep state in package variables between calls.
4. Run the seeds as normal tests: `go test -run=FuzzParseHeader -v ./<pkg>`. This runs `f.Add` values and `testdata/fuzz/FuzzParseHeader/*` once each without fuzzing.

### Output
Fuzz test passing on seeds.

### Quality Gate
- `go vet ./<pkg>` passes.
- `go test -run=FuzzParseHeader ./<pkg>` exits 0.

---

## Phase 2: Run the Fuzzer

### Entry Criteria
- Seeds pass.

### Actions
1. Run exactly one fuzz test in exactly one package. `-fuzz` must match one test; anchoring with `^...$` avoids matching `FuzzParseHeaderFast` too. `-run=^$` skips unit tests.

```bash
go test -run='^$' -fuzz='^FuzzParseHeader$' -fuzztime=<fuzz_time> ./internal/hdr
```

2. Optional flags (check `go help testflag`): `-parallel N` sets fuzzing workers (default `GOMAXPROCS`); `-fuzzminimizetime` limits minimization (documented default 60s). The generated corpus is not written to `testdata`; it lives under `$(go env GOCACHE)/fuzz/<module path>/<pkg>/<FuzzName>`.
3. Read the status lines printed every few seconds:

```text
fuzz: elapsed: 0s, gathering baseline coverage: 0/12 completed
fuzz: elapsed: 0s, gathering baseline coverage: 12/12 completed, now fuzzing with 8 workers
fuzz: elapsed: 3s, execs: 210334 (70110/sec), new interesting: 14 (total: 26)
```

`new interesting` counts inputs that reached new coverage. If it stays flat for most of the budget, send the target to `pft-coverage-plateau-analysis`.
4. On a failure Go stops, minimizes and prints:

```text
--- FAIL: FuzzParseHeader (4.21s)
    --- FAIL: FuzzParseHeader (0.00s)
        hdr_fuzz_test.go:17: round-trip mismatch: "A:\x00" -> "A: \x00\r\n" (<nil>)
    Failing input written to testdata/fuzz/FuzzParseHeader/582528ddfad69eb5
    To re-run:
    go test -run=FuzzParseHeader/582528ddfad69eb5
FAIL
```

### Output
Run log and failing input files.

### Quality Gate
- The log contains a `now fuzzing with N workers` line (proves fuzzing ran, not just seeds).
- Either the run ended with `PASS` after `fuzz_time`, or every failure has a `Failing input written to` path.

---

## Phase 3: Confirm and Record Findings

### Entry Criteria
- Run finished.

### Actions
1. For each failing input, run the printed re-run command twice: `go test -run=FuzzParseHeader/582528ddfad69eb5 ./internal/hdr`. It must fail both times.
2. Open the file to read the input in Go literal form.
3. Do not delete the failing input file and do not edit the fuzz body to make it pass. That file becomes the regression test in `pft-crash-regression-test`.
4. To keep fuzzing past the first bug, the failing file stays in `testdata` and must be fixed first; Go does not continue past a failure.
5. Record each finding in `go_fuzz_findings`.

### Output
`go_fuzz_findings`.

### Quality Gate
- Each finding replays with the same error message twice.
- `git status --short testdata/fuzz` lists each finding file.

---

## Worked Example

Illustrative. `fuzz_time` = `5m` (user choice), target `ParseHeader`.

```text
$ go test -run='^$' -fuzz='^FuzzParseHeader$' -fuzztime=5m ./internal/hdr
fuzz: elapsed: 0s, gathering baseline coverage: 0/9 completed
fuzz: elapsed: 0s, gathering baseline coverage: 9/9 completed, now fuzzing with 8 workers
fuzz: elapsed: 3s, execs: 188203 (62721/sec), new interesting: 11 (total: 20)
--- FAIL: FuzzParseHeader (7.88s)
    --- FAIL: FuzzParseHeader (0.00s)
        hdr_fuzz_test.go:17: round-trip mismatch: "A:\x00" -> "A: \x00\r\n" (<nil>)
    Failing input written to testdata/fuzz/FuzzParseHeader/582528ddfad69eb5
$ go test -run=FuzzParseHeader/582528ddfad69eb5 ./internal/hdr   # fails twice
```

Finding: NUL byte in a header value survives parse but Marshal adds a space, breaking the round-trip.

---

## Exit Criteria

DONE when each Go target ran under `go test -fuzz` for `fuzz_time` with a confirmed fuzzing line, and every failure is recorded with a minimized input file that replays twice.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `mismatched types in corpus entry` | **Adjust**: make every `f.Add` and corpus file match the `f.Fuzz` parameter types and order. |
| Phase 2 | `cannot use -fuzz flag with multiple packages` | **Retry**: pass one package path, not `./...`. |
| Phase 2 | `will not fuzz, -fuzz matches more than one fuzz test` | **Retry**: anchor the regex with `^` and `$`. |
| Phase 2 | Failure is `fuzzing process hung or terminated unexpectedly` | **Return**: record it as a hang or OOM finding with the written input; triage it in `pft-crash-triage-dedup`. |
| Phase 3 | Replay passes | **Adjust**: the target reads global state or time; fix the harness per the contract and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
