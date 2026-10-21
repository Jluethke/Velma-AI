# Go Test Parallelism Flags and t.Parallel

**One-line description:** Tunes Go test parallelism at both levels, packages run concurrently by `go test -p` and tests within a package marked `t.Parallel()` and bounded by `-parallel`, after checking each candidate test for shared state, `t.Setenv` or `t.Chdir` use, and shared databases, with the choice made from measured runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `test_command` (string, required): Baseline `go test` command.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; sleep, network and database items should be `done`.

---

## Outputs

- `go_parallel_command` (object): Chosen command (for example `go test -p 8 -parallel 8 ./...`), tests newly marked `t.Parallel()` with commits, tests rejected with the reason, hyperfine results per candidate, and the race-run result.

---

## Phase 1: Find Safe t.Parallel Candidates

### Entry Criteria
- Go version recorded (`go version`).

### Actions
1. Defaults, from `go help testflag` and `go help build`: `-p` (packages built and tested concurrently) defaults to GOMAXPROCS; `-parallel` (concurrent `t.Parallel()` tests within one test binary) defaults to GOMAXPROCS. Print yours: `go env GOMAXPROCS` (empty means the CPU count).
2. Candidates are slow tests in `go_duration_report` order (from `hotspot_plan`) that do not already call `t.Parallel()`.
3. Reject a candidate if any check in this table hits:

| Check | Command or rule |
|---|---|
| Uses `t.Setenv` or `t.Chdir` (Go 1.24+) | Both panic when the test or an ancestor called `t.Parallel()`; grep the test body |
| Writes a package-level variable, or a test helper writes one | `grep -n "^var " <pkg>/*.go` then look for assignment in the test path |
| Uses a fixed port, fixed file path, or shared DB rows without per-test isolation | Read the setup; per-test DB isolation from `tsp-go-db-txdb-rollback` makes DB tests acceptable |
| Calls `flag.Set`, `log.SetOutput`, `http.DefaultClient` mutation, `time.Local` assignment | grep |
| Go older than 1.22 and the test runs subtests in a `for` loop with `t.Parallel()` capturing the loop variable | Add `tc := tc` before `t.Run`, or confirm `go.mod` `go` directive is 1.22 or newer (per-iteration loop variables) |

4. Record accepted and rejected tests with the hit.

### Output
Candidate list with decisions.

### Quality Gate
- Every rejected test names the table row that hit and the line.

---

## Phase 2: Mark and Prove

### Entry Criteria
- Accepted list exists.

### Actions
1. Add `t.Parallel()` as the first line of each accepted test (and inside subtests where they are independent). One package per commit.
2. Prove with the race detector and shuffling: `go test -count=1 -race -shuffle=on ./<pkg>`; run it twice and record both printed shuffle seeds.
3. Stress the package: `go test -count=<runs used in baseline_report> -race ./<pkg>`; every iteration must pass.
4. Do NOT add `t.Parallel()` to tests that failed a Phase 1 check. Do NOT remove `-race` from CI to make a parallel run pass.

### Output
Committed `t.Parallel()` changes.

### Quality Gate
- Both race-plus-shuffle runs print `ok` and no `WARNING: DATA RACE`.
- The `-count` stress run prints `ok`.

---

## Phase 3: Pick -p and -parallel

### Entry Criteria
- Phase 2 commits done.

### Actions
1. Packages that share an external resource (one database, one Docker daemon port) conflict under `-p` greater than 1. If `go test ./...` fails while each package passes alone, use per-package databases (`tsp-go-db-txdb-rollback`, `tsp-pg-template-clone`) rather than `-p 1`.
2. Candidates: `-p` in {CPU count, CI runner CPU count}; `-parallel` in {CPU count, twice CPU count when the parallel tests are I/O-bound}.
3. Time: `hyperfine --runs <runs used in baseline_report> --export-json goparallel.json 'go test -count=1 -p 8 -parallel 8 ./...' 'go test -count=1 -p 8 -parallel 16 ./...' ...`. Keep `-count=1` so the test cache does not short-circuit runs.
4. Pick the lowest median whose max is below every other candidate's max; if ranges overlap, choose the smaller values and record that results were not separable.
5. Record the command; set it in CI and the Makefile only after the user agrees.

### Output
`go_parallel_command`.

### Quality Gate
- `goparallel.json` contains every candidate, and the chosen one's median and max are quoted.
- Full suite with the chosen flags and `-race` passes.

---

## Worked Example

Illustrative. Go 1.23, 8 CPUs, CI runner 4.

- Phase 1: 22 candidates in `store`, `api`, `geo`. Rejected: `TestConfigFromEnv` (`t.Setenv`), `TestDefaultLogger` (writes `log.SetOutput`). Accepted: 20.
- Phase 2: `store` commit; `-race -shuffle=on` seeds `1729551902111`, `1729551915442` both `ok`; `-count=5 -race` `ok`.
- Phase 3: medians: `-p 8 -parallel 8` 41.2 s, `-p 8 -parallel 16` 39.9 s, `-p 4 -parallel 8` 52.7 s; 8/8 and 8/16 overlap, chosen `-p 8 -parallel 8`; CI uses `-p 4 -parallel 4`.

---

## Exit Criteria

DONE when accepted tests run with `t.Parallel()` and pass race and shuffle runs, rejected tests have reasons, and `-p`/`-parallel` values are chosen from recorded timings.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `panic: testing: t.Setenv called after t.Parallel` | **Adjust**: remove `t.Parallel()` from that test; record the rejection. |
| Phase 2 | Data race reported | **Return**: remove `t.Parallel()` from the test and report the race as a defect; races in tests often reveal races in code. |
| Phase 3 | `./...` fails only with `-p` above 1 | **Adjust**: isolate per-package resources; do not settle on `-p 1` without recording the shared resource. |
| Phase 3 | No speedup | **Return**: the suite is compile-bound; see `tsp-go-build-init-cost` and `tsp-ci-test-tool-cache`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
