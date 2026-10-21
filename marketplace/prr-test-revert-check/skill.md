# PR Test Meaningfulness by Reverting the Fix

**One-line description:** Proves that the PR's new or changed tests actually detect the change by running them against the base version of the production code in a separate worktree, where they must fail, and audits the diff for deleted tests, new skips, focused tests and assertion-free tests that make a green run meaningless.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone path.
- `base_branch` (string, required): PR target branch.
- `head_sha` (string, required): PR head commit.
- `changed_files` (object[], required): Rename-aware file list.
- `test_command` (string, required): The CI test command, for example `pytest -q`, `npx vitest run`, `go test ./...`.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `test_meaning_findings` (object[]): Findings for tests that pass without the change, deleted or weakened tests, and missing tests, written to `<findings_dir>/prr-test-revert-check.json`.

---

## Phase 1: Separate Test Files from Production Files

### Entry Criteria
- `test_command` is copied from CI config.

### Actions
1. Classify each changed file as test or production with this table:

| Stack | Test file patterns |
|---|---|
| Python | `test_*.py`, `*_test.py`, files under `tests/`, `conftest.py` |
| JS/TS | `*.test.*`, `*.spec.*`, files under `__tests__/`, `e2e/`, `cypress/`, `playwright/` |
| Go | `*_test.go`, files under `testdata/` |
| Java/Kotlin | files under `src/test/` |

2. If the PR changes production files but no test file, and the change alters behavior (not a pure rename, comment or formatting), record a `question` finding: "Which test covers this change?"
3. Run the PR's tests on the head first to confirm they pass: in a worktree at `head_sha` run `test_command` restricted to the changed test files (`pytest -q <files>`, `npx vitest run <files>`, `npx jest <files>`, `go test ./<pkg>/ -run '<TestNames>'`). Record the pass output.

### Output
Test file list, production file list, head test result.

### Quality Gate
- Every changed file is classified.
- The head run of the changed tests exited 0, with the command and summary line recorded.

---

## Phase 2: Run the New Tests Against the Old Code

### Entry Criteria
- Phase 1 head run passed.

### Actions
1. Create a separate worktree at the PR head so the author's branch is never touched:
   `git -C <repo_dir> worktree add ../prr-revert <head_sha>`
2. Inside it, restore only the production files to the merge base, keeping the new tests:
   `MB=$(git merge-base origin/<base_branch> <head_sha>)`
   `git -C ../prr-revert checkout $MB -- <production file paths that exist at MB>`
   For production files the PR added (status A), delete them in the worktree: `git -C ../prr-revert rm -q <path>`.
3. Run the same restricted test command as Phase 1 in `../prr-revert`.
4. Read the result with this table:

| Result against old code | Meaning | Label |
|---|---|---|
| Tests fail with assertion errors about the changed behavior | Tests detect the change | none |
| Tests fail only with import or collection errors (new module missing) | Inconclusive: the test may only check that the module exists | question: ask for an assertion on behavior |
| Tests pass | Tests do not detect the change | blocking for a bug fix PR (the regression test does not reproduce the bug); suggestion for a refactor PR (expected) |

5. Remove the worktree: `git -C <repo_dir> worktree remove --force ../prr-revert`.

### Output
Per test file: fails-on-old-code yes, no, or inconclusive, with output excerpt.

### Quality Gate
- The revert run output is recorded for every changed test file.
- `git worktree list` no longer lists `prr-revert`.

---

## Phase 3: Audit Weakened Tests

### Entry Criteria
- Phase 2 complete.

### Actions
1. Find removed tests and new skips in the diff:
   `git diff -U0 origin/<base_branch>...<head_sha> | grep -nE '^-\s*(def test_|func Test|it\(|test\(|@Test)'`
   `git diff -U0 origin/<base_branch>...<head_sha> | grep -nE '^\+.*(pytest\.mark\.skip|pytest\.mark\.xfail|unittest\.skip|t\.Skip\(|\.skip\(|xit\(|xdescribe\(|\.only\(|@Disabled|@Ignore)'`
2. Find removed or loosened assertions: lines starting `-` containing `assert`, `expect(`, `require.`, `assert.` paired with `+` lines that are weaker (for example `toEqual(x)` replaced by `toBeDefined()`, `assert x == 5` replaced by `assert x`, exact match replaced by `in`).
3. Find assertion-free tests: in each added test function, search for `assert`, `expect(`, `t.Error`, `t.Fatal`, `require.`, `assert.`, `pytest.raises`, `toThrow`. A test function with none of them only checks that code does not crash.
4. Apply labels: deleted test with no replacement covering the same behavior, new skip without a linked ticket, `.only(`, or loosened assertion: blocking. Assertion-free test: suggestion.
5. Write `<findings_dir>/prr-test-revert-check.json` (fields `flow`, `category`="tests", `file`, `line`, `evidence`, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`test_meaning_findings`.

### Quality Gate
- Both grep commands were run and their output is recorded (empty output is recorded as "none").
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Bug-fix PR #219 changes `billing/tax.py` and adds `tests/test_tax.py::test_rounding_half_even`. `test_command=pytest -q`.

- Phase 1: head run `pytest -q tests/test_tax.py` prints `5 passed`.
- Phase 2: `git checkout $MB -- billing/tax.py` in `../prr-revert`, rerun: `5 passed`. The new test passes on the old code, so it does not reproduce the bug. Reading it shows it uses `Decimal("2.4")`, which rounds to 2 under both half-up and half-even; the reported bug was a value exactly halfway, such as `Decimal("0.125")` quantized to two places.
- Phase 3: diff shows `-    assert total == Decimal("10.13")` and `+    assert total`. Loosened assertion.
- Findings: blocking "regression test passes on old code; use the input from the bug report", blocking "assertion loosened in test_invoice_total".

---

## Exit Criteria

DONE when each changed test file has been run against the old production code with the result classified, deleted, skipped, focused and loosened tests are audited, and every problem is a finding with command output as evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Changed tests fail on the head | **Return**: record a blocking finding with the failure output; skip Phase 2. |
| Phase 2 | Old code cannot build with new tests for unrelated reasons (renamed module) | **Adjust**: mark inconclusive and ask the author how they confirmed the test fails without the fix. |
| Phase 2 | Tests need services (database, queue) | **Adjust**: start them the way CI does (`docker compose up -d <service>` from the CI config) or mark inconclusive. |
| Phase 3 | Test deleted because the feature was removed | **Adjust**: no finding if the production code it tested is also deleted in this PR. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
