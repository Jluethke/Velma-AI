# GCC Structural Coverage With gcov and gcovr

**One-line description:** Measures statement and branch coverage, and condition coverage on GCC 14 or newer, for requirements-based unit tests using --coverage, gcov and gcovr, and reads the per-line and per-branch counts to list every uncovered line, branch and condition.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the GCC coverage profile.
- `test_command` (string, required): Command that runs the requirements-based tests, for example `ctest --test-dir build/coverage`.

---

## Outputs

- `gcov_coverage` (object): GCC and gcovr versions, flags, per-file line, branch and (if available) condition percentages, the list of uncovered lines, branches and conditions with file and line, and the report file paths (text, HTML, Cobertura XML or JSON).

---

## Phase 1: Instrumented Build and Run

### Entry Criteria
- The coverage profile is configured with `--coverage -O0` and the tests in `test_command` are the requirements-based tests, not ad-hoc tests written to raise coverage.

### Actions
1. Record `gcc --version` and `gcov --version`; they must be the same GCC release. Using a gcov from another release fails to read the data files.
2. If GCC is 14 or newer and condition coverage is wanted, add `-fcondition-coverage` to the coverage profile flags. Confirm with `gcc --help=common | grep condition-coverage`.
3. Delete old counters: `find build/coverage -name "*.gcda" -delete`. Stale `.gcda` files merge into new results.
4. Build, then run `test_command`. Each object now has a `.gcno` (from compile) and `.gcda` (from the run).

### Output
`.gcno` and `.gcda` files for every instrumented object.

### Quality Gate
- `find build/coverage -name "*.gcda" | wc -l` is greater than 0 and every production source file in scope has a matching `.gcda`.
- `test_command` exited 0.

---

## Phase 2: Generate Reports

### Entry Criteria
- `.gcda` files exist.

### Actions
1. gcovr text summary with branches: `gcovr -r . build/coverage --filter src/ --txt --txt-metric branch` (check `gcovr --help` for `--txt-metric` in your version; older versions use `--branches`).
2. Detailed HTML: `gcovr -r . build/coverage --filter src/ --html-details build/coverage/html/index.html`.
3. Machine-readable: `gcovr -r . build/coverage --filter src/ --json build/coverage/cov.json` or `--cobertura build/coverage/cov.xml`.
4. Condition coverage (GCC 14+): run `gcov --conditions -o <object dir> src/<file>.c` in a scratch directory and read the `.gcov` output, or use gcovr's condition support if your gcovr version documents it.
5. Do NOT use `--exclude-unreachable-branches` or `--exclude-throw-branches` silently. If used, record why; excluded branches still need a justification in the gap list.

### Output
Text, HTML and JSON or XML reports.

### Quality Gate
- `cov.json` (or `cov.xml`) exists and parses.
- Every source file under `src/` in scope appears in the report; a missing file means it was never linked into a test.

---

## Phase 3: Read Uncovered Items

### Entry Criteria
- Reports exist.

### Actions
1. Read the `.gcov` format for each file below 100 percent:
   - `#####:   42:` the line was never executed.
   - `    12:   43:` executed 12 times.
   - `branch  0 taken 3` / `branch  1 never executed` / `branch 1 taken 0`: the second outcome of the decision was never taken.
   - With `--conditions`: `condition outcomes covered 2/4` followed by lines naming which condition was not seen true or false.
2. Map each uncovered item to its decision in source (`if`, `while`, `?:`, `&&`, `||`, `switch`).
3. GCC branch counts include compiler-generated branches; a single `if (a && b)` produces several. Record the source decision, not only the raw branch number.
4. List each uncovered item; do not judge it here. The gap flow decides whether a requirement-based test is missing, a requirement is missing, or the code is dead.

### Output
`gcov_coverage`.

### Quality Gate
- Every line marked `#####` and every branch "never executed" or "taken 0" in scope appears in the uncovered list with file and line.

---

## Worked Example

Illustrative only. Wheel speed module, GCC 14.

```
$ gcovr -r . build/coverage --filter src/ --txt --txt-metric branch
File            Branches   Taken  Cover   Missing
src/wss.c             12      10    83%   58,71
$ gcov --conditions -o build/coverage/CMakeFiles/wss.dir/src src/wss.c
       58:   if ((raw > WSS_RAW_MAX) || (sensor_fault != 0u))
condition outcomes covered 3/4
condition  1 not covered (true)
```

No test sets `sensor_fault` true. Item recorded for the gap flow.

---

## Exit Criteria

DONE when coverage was measured from a clean counter state with the requirements-based tests, reports exist in human and machine form, and every uncovered line, branch and condition is listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `version mismatch` reading `.gcda` | **Adjust**: use the gcov from the same GCC install (`gcovr --gcov-executable gcov-<N>`). |
| Phase 1 | No `.gcda` for a source file | **Adjust**: the file is not linked into any test executable; add it to a test target and rerun. |
| Phase 2 | Cross-compiled target code needs coverage on hardware | **Return**: on-target coverage needs a way to dump counters from the MCU; record as an open question and measure on host. |
| Phase 3 | User asks to add tests that call functions just to raise numbers | **Stop**: coverage measures requirements-based tests; untraced tests hide missing requirements. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
