# Go Race Detector Run for a PR

**One-line description:** Runs the changed packages' tests under `go test -race` with the cache disabled and repeated runs, reads each "WARNING: DATA RACE" report's two stacks and goroutine creation sites, and maps every race to the PR's changed lines or to pre-existing code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.
- `race_count` (integer, optional): How many times to run each test (`-count`). If absent, use 1; races are timing dependent, so a clean run proves nothing about absence.

---

## Outputs

- `race_findings` (object[]): Data races with both access stacks, written to `<findings_dir>/prr-go-race-detector.json`.

---

## Phase 1: Prepare the Race Run

### Entry Criteria
- At least one changed `.go` file. `go version` succeeds.

### Actions
1. List changed packages: the directory of each changed `.go` file, deduplicated, as `./<dir>`. Add packages that import them if the PR changed exported concurrency behavior: `go list -f '{{.ImportPath}} {{join .Imports " "}}' ./... | grep <changed import path>`.
2. The race detector needs a supported platform (linux, darwin, windows, freebsd on amd64 and arm64 are listed in the Go docs). On some platforms it needs cgo: if the run reports that `-race requires cgo`, set `CGO_ENABLED=1` and make sure a C compiler (`gcc` or `clang`) is on PATH.
3. Copy build tags and environment from CI (`-tags`, env vars).
4. Check whether the changed packages have tests that exercise concurrent paths: `rg -n 't\.Parallel\(\)|go func|sync\.WaitGroup|errgroup' <dirs> --glob '*_test.go'`. If no test runs the changed code concurrently, the race detector cannot see races there; record that as a question finding ("add a test that calls X from multiple goroutines").

### Output
Package list, environment, concurrent-test inventory.

### Quality Gate
- `go vet ./<dirs>` exits 0 (it compiles test files, so the race build will not fail on syntax).
- The concurrent-test inventory is recorded per package.

---

## Phase 2: Run with -race

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run, disabling the test cache so tests really execute:
   `go test -race -count=<race_count or 1> ./<dir1>/ ./<dir2>/ 2>&1 | tee ../race.txt`
2. To focus on the changed tests: add `-run '^(TestA|TestB)$'`.
3. Read the exit status: a race makes the test binary fail (by default the race runtime exits with status 66 when it reported races; `go test` reports the package as FAIL). Search the output: `grep -c 'WARNING: DATA RACE' ../race.txt`.
4. Do not add `time.Sleep` or remove `t.Parallel()` to make the race report disappear. That hides the race; it does not fix it.

### Output
`../race.txt` and the race count.

### Quality Gate
- `../race.txt` contains `ok` or `FAIL` lines for every listed package (proof the tests ran, not cached: lines must not say `(cached)`).
- The `WARNING: DATA RACE` count is recorded.

---

## Phase 3: Read Each Report and Record Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. Each report has this structure:
   ```
   WARNING: DATA RACE
   Write at 0x00c0001a4018 by goroutine 8:
     <pkg>.(*Cache).Set()
         /src/cache/cache.go:41 +0x84
   Previous read at 0x00c0001a4018 by goroutine 7:
     <pkg>.(*Cache).Get()
         /src/cache/cache.go:33 +0x5c
   Goroutine 8 (running) created at:
     <pkg>.TestCacheConcurrent()
         /src/cache/cache_test.go:20 +0x9c
   ```
   Record: the two accesses (file:line and read or write), and where each goroutine was created.
2. Decide ownership: if either access line is on a line the PR changed (from `git diff -U0` hunk headers), the PR introduced or exposed the race: blocking. If both are on untouched lines, it is pre-existing: question ("pre-existing race found while reviewing; file a ticket?").
3. Name the fix from the access pattern: map or struct field accessed from goroutines: `sync.Mutex`/`sync.RWMutex` around both accesses, or `sync.Map` for append-only caches; counter: `sync/atomic` (`atomic.Int64`); handoff of ownership: a channel.
4. Write `<findings_dir>/prr-go-race-detector.json` (fields `flow`, `category`="concurrency", `file`, `line`, `evidence` = both access lines and the goroutine creation line, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`race_findings`.

### Quality Gate
- Every `WARNING: DATA RACE` block maps to exactly one finding (duplicate reports of the same two lines are merged).
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. PR adds an in-memory cache `internal/cache/cache.go` with `Get` and `Set` and a test calling them from goroutines. `race_count=5`.

- Phase 1: package `./internal/cache/`; `cache_test.go` uses `go func` and `sync.WaitGroup`.
- Phase 2: `go test -race -count=5 ./internal/cache/` prints `FAIL github.com/acme/shop/internal/cache` and `grep -c 'WARNING: DATA RACE'` prints 1.
- Phase 3: write at `cache.go:41` (`c.items[k] = v`) and previous read at `cache.go:33` (`v, ok := c.items[k]`), both changed lines: blocking, fix "add `mu sync.RWMutex` to `Cache`; `RLock` in `Get`, `Lock` in `Set`".

---

## Exit Criteria

DONE when the changed packages' tests ran uncached under `-race`, every race report is mapped to PR-changed or pre-existing lines with both stacks recorded, and packages with no concurrent test are flagged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Platform unsupported by the race detector | **Adjust**: run in a Linux container (`docker run --rm -v "$PWD":/src -w /src golang:<version> go test -race ...`) with the version from `go.mod`. |
| Phase 2 | Tests fail for non-race reasons | **Return**: report the failure output as a blocking test finding; rerun after the author fixes it. |
| Phase 2 | Output shows `(cached)` | **Retry**: rerun with `-count=1` or higher. |
| Phase 3 | Race stack points into a dependency | **Adjust**: find the first frame in this repository and attribute the race there. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
