# Neighbor Regression Sweep

**One-line description:** Proves the fix breaks nothing nearby by running the tests that exercise the changed code first (selected with stack tools such as `pytest --testmon`, `jest --findRelatedTests`, `go test` on reverse dependencies, Gradle/Maven module tests, `cargo test -p`), then the full suite, and comparing failures against the same suite on the base commit so pre-existing failures are not blamed on the fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_diff` (object, required): Output of `repro-minimal-fix`.
- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.
- `base_ref` (string, required): The commit the fix branch started from (for example `main` or the merge base).

---

## Outputs

- `neighbor_report` (object): The list of callers of the changed functions, the targeted test selection and its results, the full-suite results on base and on the fix, the set difference (new failures, newly passing, unchanged failures), and a verdict `CLEAN` or `REGRESSED`.

---

## Phase 1: Map the Neighbors

### Entry Criteria
- `fix_diff` committed; working tree clean.

### Actions
1. List changed functions from the diff hunks: `git diff <base_ref>..HEAD -U0 -- <source paths>`; the `@@ ... @@ <function>` header names the enclosing function for most languages.
2. Find callers of each changed function: `git grep -n "<function name>("` across source and tests. For typed languages, prefer the language server "find references" if available, since grep misses calls through interfaces.
3. For Go, list packages that import the changed package: `go list -f '{{.ImportPath}} {{join .Imports " "}}' ./... | grep "<changed import path>"`.
4. Record every caller and every test file that references a changed function.

### Output
Caller and test map.

### Quality Gate
- Each changed function has a recorded caller list (possibly empty) produced by a command whose output is pasted.

---

## Phase 2: Targeted Run

### Entry Criteria
- Map exists.

### Actions
1. Run the tests nearest to the change:

| `stack` | Targeted command |
|---|---|
| python | `python -m pytest <test files from the map> -q`; or `python -m pytest --testmon` if `pytest-testmon` is already installed and its database exists |
| node | `npx jest --findRelatedTests <changed source files>` or `npx vitest related <changed source files> --run` |
| go | `go test -count=1 ./<changed pkg>/... <importing pkgs>` |
| java | `./mvnw -q test -pl <module> -amd` (module plus modules that depend on it) or `./gradlew :<module>:test` and dependents |
| rust | `cargo test --locked -p <crate>` plus crates in the workspace that depend on it (`cargo tree -i <crate> --workspace`) |
| cpp | `ctest --test-dir build-repro -R '<test name pattern for the unit>' --output-on-failure` |

2. Any failure here: check whether it also fails on `base_ref` (Phase 3 method) before blaming the fix.

### Output
Targeted results.

### Quality Gate
- Targeted run summary line is pasted (for example pytest `N passed`, Jest `Tests: N passed`, Go `ok` per package).

---

## Phase 3: Full Suite Against the Base

### Entry Criteria
- Targeted run complete.

### Actions
1. Run the full suite on the fix with machine-readable output where the runner supports it:

| `stack` | Full-suite command with a results file |
|---|---|
| python | `python -m pytest -q -p no:randomly --junitxml=.repro/fix.xml` |
| node | `npx jest --ci --json --outputFile=.repro/fix.json` or `npx vitest run --reporter=junit --outputFile=.repro/fix.xml` |
| go | `go test -count=1 -json ./... > .repro/fix.jsonl` |
| java | `./mvnw test` (reports in `target/surefire-reports/`) or `./gradlew test` (reports in `build/test-results/test/`) |
| rust | `cargo test --locked --workspace 2>&1 \| tee .repro/fix.txt` |
| cpp | `ctest --test-dir build-repro --output-junit fix.xml` (CMake 3.21+) |

2. Check out the base in a separate worktree so the fix branch is untouched: `git worktree add ../repro-base <base_ref>`; run the same command there, writing `base.*`. Remove after: `git worktree remove ../repro-base`.
3. Compute the difference by test ID:
   - new failures = failed on fix and passed on base;
   - newly passing = passed on fix and failed on base (should include only the regression test, which does not exist on base, so it appears as new and passing);
   - unchanged failures = failed on both (pre-existing; report, do not fix here).
4. Any intermittent test in new failures: rerun it alone on both trees several times; if it also fails on base at least once, move it to unchanged and flag it as flaky.
5. Verdict: `CLEAN` when new failures is empty; else `REGRESSED` with the failing test IDs and their messages.

### Output
`neighbor_report`.

### Quality Gate
- Both full-suite runs have results files or pasted summaries with pass/fail counts.
- `git worktree list` shows no leftover `repro-base` worktree.
- The verdict is derived from the new-failures set, which is listed explicitly (even if empty).

---

## Worked Example

Illustrative only. `stack` = python, `base_ref` = `main`.

- Phase 1: changed function `detect_encoding`; callers: `csv_reader.py:64`, `json_reader.py:31`, `cli/sniff.py:12`; tests referencing it: `test_encoding.py`, `test_csv_reader.py`, `test_json_reader.py`.
- Phase 2: `python -m pytest tests/importer -q` prints `142 passed`.
- Phase 3: fix full suite `1318 passed, 2 failed`; base `1317 passed, 2 failed`. Same two failures on both (`test_s3_upload` needs network). New failures: none. Newly passing: the regression test. Verdict `CLEAN`.

---

## Exit Criteria

DONE when targeted and full-suite runs are complete on the fix and the base, the new-failures set is computed by test ID, and the verdict is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Targeted test fails on fix and passes on base | **Return**: to `repro-minimal-fix`; a caller relied on the old behavior. Check whether that caller's expectation is documented before changing it. |
| Phase 3 | Full suite too slow to run twice | **Adjust**: run the base suite only for the tests that fail on the fix; never skip the comparison. |
| Phase 3 | Weak model deletes or skips a newly failing test | **Stop**: restore it; a new failure is a regression until proven pre-existing. |
| Phase 3 | Worktree add fails because base is checked out elsewhere | **Adjust**: `git worktree add --detach ../repro-base <base_ref>`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
