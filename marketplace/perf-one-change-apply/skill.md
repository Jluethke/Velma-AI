# One Performance Change at a Time

**One-line description:** Picks the single highest-ranked untried fix candidate, applies only that change on its own git branch with its equivalence test written first, runs the full test suite, and commits, so every later measurement is attributable to exactly one change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `algo_candidates` (object[], optional): From `perf-fix-algorithmic-complexity`.
- `alloc_candidates` (object[], optional): From `perf-fix-allocation-reduction`.
- `io_candidates` (object[], optional): From `perf-fix-io-batching`.
- `repo_path` (string, required): Repository root.
- `stack` (string, required): Picks the test command.

At least one candidate list must be present and non-empty.

---

## Outputs

- `applied_change` (object): `candidate_id`, `base_commit`, `branch`, `head_commit`, files changed with line counts, the equivalence test name and result, the full test command and its exit code, and the list of candidates still untried.

---

## Phase 1: Pick Exactly One Candidate

### Entry Criteria
- At least one candidate list is non-empty.
- `git -C <repo_path> status --porcelain` prints nothing except files under `perf/`. If source files are modified, stop.

### Actions
1. Read `perf/change_log.jsonl` if it exists. Each line is one earlier attempt with `candidate_id` and `verdict`. Skip every candidate already listed.
2. Merge the present candidate lists. Order: candidates from the list matching `bottleneck_class` (recorded in `perf/classified_hotspots.json`) first, then by each candidate's own ranking field (`expected_share`, allocation count share, or round trips removed).
3. Take the first untried candidate. Only one. Record the rest as `remaining`.
4. If every candidate is already in the log, stop and report "all candidates tried".

### Output
One selected candidate.

### Quality Gate
- Exactly one `candidate_id` is selected and it is absent from `perf/change_log.jsonl`.

---

## Phase 2: Branch, Green Baseline, Equivalence Test

### Entry Criteria
- Candidate selected.

### Actions
1. Record `base_commit = git rev-parse HEAD`. Create the branch: `git switch -c perf/<candidate_id>`.
2. Run the full test suite before changing anything, with the stack's command:

   | `stack` | Test command |
   |---|---|
   | python | `python -m pytest -q` |
   | node | `npm test` |
   | go | `go test ./...` |
   | rust | `cargo test` |
   | jvm | `mvn -q test` or `./gradlew test` |
   | c, cpp | `ctest --test-dir build --output-on-failure` (or the project's documented test target) |

   If it fails before your change, stop: you cannot tell whether your change breaks anything.
3. Write the candidate's `equivalence_test` first (when the candidate has one). It must call the current code and assert the expected output on the real small-size input plus listed edge cases. Run it; it must pass against the unchanged code. A test that only passes after the change is not an equivalence test.
4. Commit the test alone: `git add <test file> && git commit -m "perf: equivalence test for <candidate_id>"`.

### Output
Branch with a passing baseline and a committed equivalence test.

### Quality Gate
- Test command exit code 0 before the change is recorded.
- The equivalence test passes on the unchanged code (output captured).

---

## Phase 3: Apply the One Change and Verify

### Entry Criteria
- Equivalence test committed.

### Actions
1. Edit only the files named in the candidate's `location`. Make the replacement described by the candidate and nothing else: no renames, formatting passes, dependency bumps or unrelated cleanups.
2. Do not touch benchmark files, `perf/` specs, workload inputs or any existing test. Never delete, skip (`@pytest.mark.skip`, `t.Skip`, `#[ignore]`, `@Disabled`, `it.skip`) or loosen an assertion to get green.
3. Run the equivalence test, then the full test suite with the same command as Phase 2.
4. If anything fails, fix the change (not the test). If it still fails after one honest fix attempt, revert with `git restore --source=HEAD -- <files>` and record the candidate as `rejected_tests_failed`.
5. Check the diff size: `git diff --stat`. It must touch only the candidate's files.
6. Commit: `git commit -am "perf: <candidate_id> <technique>"`. Record `head_commit`.
7. Fill `applied_change`.

### Output
`applied_change`.

### Quality Gate
- `git diff --stat <base_commit>..HEAD` lists only the candidate's files and the equivalence test file.
- The full test command exits 0 after the change, with output recorded.
- `git diff <base_commit>..HEAD | grep -E "^-.*(def test_|func Test|#\[test\]|@Test|it\()"` prints nothing (no test removed).

---

## Worked Example

Illustrative. Python, candidate `algo-1` (dict index for `find_customer`).

- Phase 1: `perf/change_log.jsonl` absent; `algo-1` selected; remaining `["alloc-1", "alloc-2"]`.
- Phase 2: `git switch -c perf/algo-1`; `python -m pytest -q` prints `212 passed`. `tests/test_report_equivalence.py` written with the 30,000-row case, duplicate id, missing id, empty list; passes on old code; committed.
- Phase 3: `app/report.py` edited (8 lines). `python -m pytest -q` prints `216 passed`. `git diff --stat` shows `app/report.py | 8 +++---` and the test file. Commit `a41c9e2`.

---

## Exit Criteria

DONE when exactly one candidate is applied on its own branch, the equivalence test passed before and after, the full suite passes, no test was removed or weakened, and the commit is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Uncommitted source changes | **Stop**: ask the user to commit or stash; never mix them into a measurement. |
| Phase 1 | All candidates tried | **Return**: report the change log; go back to profiling if the goal is unmet. |
| Phase 2 | Suite fails before any change | **Stop**: report the failing tests; fixing them is a separate task. |
| Phase 3 | Change needs edits in more files than the candidate names | **Return**: to the fix flow to rewrite the candidate with its full file list. |
| Phase 3 | Tests fail after one fix attempt | **Adjust**: revert, log `rejected_tests_failed`, move to the next candidate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
