# Go Test Build and Init Cost

**One-line description:** Separates a Go suite's compile, package init and `TestMain` cost from test-body time using `go test -run '^$'`, `go test -c`, `GODEBUG=inittrace=1` and the `-json` timings, so build and setup overhead per package is measured before anything is changed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `go_duration_report` (object, required): From `tsp-go-test-json-durations`; per-package elapsed time and `TestMain` presence.

---

## Outputs

- `go_setup_cost` (object): Per package: compile seconds, init plus `TestMain` seconds (no tests run), test-body seconds from `go_duration_report`, the slowest `init` functions from `inittrace`, and whether `-race` or `-cover` is in use and its measured cost.

---

## Phase 1: Compile Cost

### Entry Criteria
- `go_duration_report` exists.

### Actions
1. Clear only the build cache for an honest cold number, and only if the user agrees, because it slows the next builds: `go clean -cache`. Otherwise record that the measurement is warm.
2. Time compile of all test binaries without running them: `time go test -count=1 -run '^$' -exec /bin/true ./...` on Linux or macOS. `-exec /bin/true` makes `go test` build each test binary and call `/bin/true` instead of the binary. On Windows use `go test -c -o NUL <pkg>` per package (step 3).
3. Per package for the top packages in `go_duration_report`: `time go test -c -o /dev/null <import/path>` (Windows: `-o NUL`). Record `real`.
4. If the command recorded in `go_duration_report` used `-race`, repeat step 3 with `-race`. Race builds are slower to compile and run; record both.

### Output
Compile seconds per package.

### Quality Gate
- Each package row has a `real` value copied from `time` output, and the row says warm or cold.

---

## Phase 2: Init and TestMain Cost

### Entry Criteria
- Compile cost recorded.

### Actions
1. Run each top package with no tests selected so only init and `TestMain` execute: `go test -count=1 -run '^$' -v <import/path>`. The binary still runs `TestMain` and every package `init`. Subtract the compile seconds from Phase 1 to get init plus `TestMain` seconds. Better: build once with `go test -c -o pkg.test <import/path>` and time only the run: `time ./pkg.test -test.run '^$'`.
2. Trace init cost: `GODEBUG=inittrace=1 ./pkg.test -test.run '^$' 2> inittrace.txt`. Lines look like `init example.com/ledger/geo @1.2 ms, 412 ms clock, 81234 bytes, 902 allocs`. Rank by the `ms clock` value.
3. Read the `TestMain` body for each package that has one. Record each expensive step (container start, migration run, fixture load, binary build with `exec.Command("go", "build", ...)`).
4. Delete the built `pkg.test` binaries after measuring.

### Output
Init and `TestMain` seconds per package, ranked init functions.

### Quality Gate
- `inittrace.txt` rows quoted for the slowest inits.
- No `*.test` binaries remain in the repo (`git status --porcelain` clean).

---

## Phase 3: Classify Package Cost

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. For each package compute: total = compile + init/`TestMain` + test-body seconds. Apply this table to name the dominant cost:

| Largest part | Record | Route to |
|---|---|---|
| compile | `build_bound` | `tsp-ci-test-tool-cache` (persist `GOCACHE`), `tsp-go-parallel-flags` (`-p`) |
| init or `TestMain` | `setup_bound` | `tsp-go-db-txdb-rollback` or `tsp-pg-template-clone` when DB setup; otherwise a once-per-package fixture in `TestMain` |
| test body | `test_bound` | Signal from `go_duration_report` (sleep, network, database) |

2. Expensive package `init()` work (loading files, compiling large regex tables, connecting to services) runs in every test binary that imports the package. Record such inits as candidates for lazy initialization with `sync.OnceValue` (Go 1.21+) or `sync.Once`.
3. Do NOT edit code in this flow.

### Output
`go_setup_cost`.

### Quality Gate
- Every package row has three numbers and one dominant-cost label from the table.

---

## Worked Example

Illustrative. Warm cache.

- Phase 1: `go test -c -o /dev/null example.com/ledger/store` `real 6.8s`; with `-race` `real 14.2s`.
- Phase 2: `time ./store.test -test.run '^$'` `real 9.4s`. `TestMain` runs `testcontainers` Postgres and all migrations. `inittrace.txt` slowest: `init example.com/ledger/geo @3.1 ms, 412 ms clock`.
- Phase 3: `store` total = 14.2 + 9.4 + 48.2; dominant `test_bound` (database signal), with `setup_bound` second. `geo` init loads a 30 MB shapefile at import: lazy-init candidate.

---

## Exit Criteria

DONE when `go_setup_cost` holds compile, init and test-body seconds per top package from recorded command output, ranked inits, and a dominant-cost label per package.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-exec /bin/true` not available on Windows | **Adjust**: use per-package `go test -c -o NUL` timing. |
| Phase 2 | `TestMain` calls `os.Exit` before `m.Run()` when no tests match | **Adjust**: time it anyway; record that `TestMain` short-circuits. |
| Phase 2 | `inittrace` prints nothing | **Adjust**: confirm Go 1.16 or newer (`go version`) and that stderr was redirected. |
| Phase 3 | Numbers do not add up to the `-json` package elapsed | **Return**: record both; `Elapsed` excludes compile, which is expected. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
