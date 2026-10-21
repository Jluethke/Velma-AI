# Test Suite Baseline Lock

**One-line description:** Records a repeatable baseline for the current test suite (wall time over repeated runs with hyperfine, test count, pass state, and covered-line counts) so every later speed change is compared against measured numbers instead of memory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root, on a clean checkout of the branch to speed up.
- `stack` (string, required): One of `python`, `node`, `go`. Selects the coverage and test-count commands.
- `test_command` (string, required): The exact command that runs the full suite today, copied from CI or the README (for example `pytest`, `npx jest`, `npx vitest run`, `go test ./...`).
- `run_count` (integer, required): How many timed runs to record. Supplied by the user; this flow does not pick a number.

---

## Outputs

- `baseline_report` (object): Commit SHA, machine facts (CPU count, OS, tool versions), `test_command`, every run's wall time, the min, median and max, test count, and pass state.
- `coverage_baseline` (object): Coverage tool, exact coverage command, total statements or lines, covered statements or lines, and the path of the saved raw coverage file.

---

## Phase 1: Freeze the Environment

### Entry Criteria
- `repo_path` exists and `git -C <repo_path> status --porcelain` prints nothing (clean tree).
- `stack` is one of `python`, `node`, `go`.

### Actions
1. Record the commit: `git -C <repo_path> rev-parse HEAD`.
2. Record the machine: on Linux `nproc` and `uname -a`; on macOS `sysctl -n hw.ncpu` and `uname -a`; on Windows Git Bash `echo $NUMBER_OF_PROCESSORS`.
3. Record tool versions with the table below. Copy the printed text exactly.

| `stack` | Commands to run |
|---|---|
| python | `python --version`, `python -m pytest --version`, `python -m pip list` (save to `baseline-pip-list.txt`) |
| node | `node --version`, `npm --version`, `npx jest --version` or `npx vitest --version` (whichever the project uses) |
| go | `go version`, `go env GOMAXPROCS GOFLAGS GOCACHE` |

4. Close other heavy processes (browsers, IDE indexers, other test runs). Timing on a loaded machine is not a baseline.
5. Install `hyperfine` if missing (`cargo install hyperfine`, `brew install hyperfine`, `apt install hyperfine`, or `winget install sharkdp.hyperfine`). Check with `hyperfine --version`.

### Output
Environment block of `baseline_report`.

### Quality Gate
- `baseline_report` contains a 40-character commit SHA.
- The CPU count and every version line from the table are recorded as literal command output.
- `hyperfine --version` prints a version.

---

## Phase 2: Time the Suite

### Entry Criteria
- Environment block recorded.

### Actions
1. Run the suite once without timing to warm caches and confirm it passes: `cd <repo_path> && <test_command>`; record the exit code.
2. If the exit code is not 0, stop (see Error Handling). A failing suite has no valid baseline.
3. For Go only, disable the test result cache so every run executes: append `-count=1` to the `go test` command used for timing. Without it, the second run prints `(cached)` and finishes in near zero time.
4. Run: `hyperfine --runs <run_count> --warmup 1 --export-json baseline-hyperfine.json '<test_command>'`.
5. Read `baseline-hyperfine.json`: `results[0].times` (every run in seconds), `results[0].min`, `results[0].median`, `results[0].max`. Copy these into `baseline_report`.
6. Record the test count from one run with this table:

| `stack` | Command | Where the count is |
|---|---|---|
| python | `pytest -q` | Last line, for example `412 passed, 3 skipped in 81.20s` |
| node (Jest) | `npx jest --json --outputFile=jest-count.json` | `numTotalTests`, `numPassedTests` in the JSON |
| node (Vitest) | `npx vitest run --reporter=json --outputFile=vitest-count.json` | `numTotalTests`, `numPassedTests` |
| go | `go test -count=1 -json ./... > go-count.json` then `jq -s '[.[] | select(.Action=="pass" and .Test!=null)] | length' go-count.json` | The printed integer (subtests are counted too; record that fact) |

### Output
Timing and count block of `baseline_report`.

### Quality Gate
- `baseline-hyperfine.json` exists and `results[0].times` has exactly `run_count` entries.
- The warm-up run exit code is 0.
- The test count is copied from the named field or line, not estimated.

---

## Phase 3: Record Coverage

### Entry Criteria
- Timing block recorded.

### Actions
1. Run the coverage command for the stack and save the raw file:

| `stack` | Command | Totals command |
|---|---|---|
| python | `pytest --cov=<package> --cov-report=xml:coverage-baseline.xml --cov-report=term` | `coverage report` last line `TOTAL  <stmts> <miss> <pct>%` |
| node (Jest) | `npx jest --coverage --coverageReporters=json-summary --coverageReporters=json` | `coverage/coverage-summary.json` field `total.lines.total` and `total.lines.covered` |
| node (Vitest) | `npx vitest run --coverage.enabled --coverage.reporter=json-summary --coverage.reporter=json` | same JSON fields |
| go | `go test -count=1 -covermode=atomic -coverpkg=./... -coverprofile=coverage-baseline.out ./...` | `go tool cover -func=coverage-baseline.out \| tail -1` |

2. Copy the coverage file to a path outside the tree that later flows will not overwrite, for example `../tsp-baseline/`.
3. Record total and covered counts (not only the percent). Later flows compare covered counts.
4. Do NOT change coverage configuration (`.coveragerc`, `[tool.coverage]`, `coveragePathIgnorePatterns`, `-coverpkg`) to make numbers look better. The baseline records the project as it is.

### Output
`coverage_baseline` and the completed `baseline_report`.

### Quality Gate
- The saved coverage file exists at the recorded path.
- `coverage_baseline` has both total and covered counts copied from the totals command output.
- `git status --porcelain` still prints nothing except ignored output files (no source or config edits).

---

## Worked Example

Illustrative. Input: `repo_path=/work/shop-api`, `stack=python`, `test_command=pytest`, `run_count=5`.

- Phase 1: `git rev-parse HEAD` prints `9c1e4f2...`; `nproc` prints `8`; `pytest 8.3.2`.
- Phase 2: `hyperfine --runs 5 --warmup 1 --export-json baseline-hyperfine.json 'pytest'` prints `Time (mean ± σ): 84.112 s ± 1.903 s` and `Range (min … max): 81.950 s … 86.701 s`. The JSON median is `83.874`. `pytest -q` ends with `412 passed, 3 skipped in 81.20s`.
- Phase 3: `coverage report` ends with `TOTAL  6120  712  88%`, so total 6120, covered 5408. The XML is copied to `/work/tsp-baseline/coverage-baseline.xml`.

---

## Exit Criteria

DONE when `baseline_report` holds the commit, machine facts, `run_count` timed runs with min, median and max, the test count and a green pass state, and `coverage_baseline` holds total and covered counts with a saved raw file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree is dirty | **Stop**: commit or stash first; a baseline must map to one commit. |
| Phase 1 | hyperfine cannot be installed | **Adjust**: time `run_count` runs with `/usr/bin/time -p <test_command>` (prints `real`), record every `real` value, compute min, median and max by sorting. |
| Phase 2 | Suite fails on the warm-up run | **Stop**: report the failing tests; speed work starts from a green suite. |
| Phase 2 | hyperfine prints `Warning: Statistical outliers were detected` | **Retry**: close background load and rerun once; if the warning repeats, keep the numbers and record the warning text in `baseline_report`. |
| Phase 3 | Coverage plugin not installed (`pytest-cov`, `@vitest/coverage-v8`) | **Adjust**: install it as a dev dependency only, record the install command in `baseline_report`. |
| Phase 3 | Coverage run fails while the plain run passes | **Return**: record the error; later coverage parity uses the same failing command, so fix the coverage run first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
