# Coverage Parity Gate After Speed Work

**One-line description:** Proves that speed work kept coverage and test strength constant by rerunning coverage with the new parallel (and sharded) command, comparing covered and total lines against the baseline from the same tool, diffing per-file coverage, and checking that no test, assertion or skip was removed without a recorded replacement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root at the commit after the speed changes.
- `stack` (string, required): `python`, `node` or `go`.
- `coverage_baseline` (object, required): From `tsp-baseline-lock`.
- `baseline_report` (object, required): From `tsp-baseline-lock`; the baseline commit SHA and test count.
- `parallel_command` (string, required): From `tsp-order-isolation-check`.
- `shard_config` (object, optional): From `tsp-ci-shard-by-timing`; when present, coverage is merged across shards.

---

## Outputs

- `coverage_verdict` (object): `PASS` or `FAIL`; baseline and current total and covered counts; files whose covered lines dropped with the lines; test count, skip count and assertion count before and after; and the reason for each removed test with its replacement test ids.

---

## Phase 1: Rerun Coverage the Same Way

### Entry Criteria
- `coverage_baseline` holds the tool, command and saved raw file.

### Actions
1. Run coverage with the new command and the same coverage tool and configuration as the baseline:

| `stack` | Command |
|---|---|
| python | `<parallel_command> --cov=<same package> --cov-report=xml:coverage-now.xml --cov-report=term` |
| node (Jest) | `<parallel_command> --coverage --coverageReporters=json-summary --coverageReporters=json` |
| node (Vitest) | `<parallel_command> --coverage.enabled --coverage.reporter=json-summary --coverage.reporter=json` |
| go | `<parallel_command with -covermode=atomic -coverpkg=./... -coverprofile=coverage-now.out>` |

2. If `shard_config` is present, use its merged totals from the merge job instead of a single local run, and record the run id.
3. Confirm the coverage configuration did not change since the baseline: `git diff <baseline sha> -- .coveragerc pyproject.toml setup.cfg jest.config.* vitest.config.* | grep -iE "omit|exclude|ignore|coverpkg|collectCoverageFrom|coveragePathIgnorePatterns"` prints nothing. Any change there must be reverted or explained by the user.

### Output
Current coverage file and totals.

### Quality Gate
- Totals copied from the same totals command as the baseline (`coverage report`, `coverage-summary.json`, `go tool cover -func`).
- The config grep prints nothing, or each hit has a user-approved reason recorded.

---

## Phase 2: Compare Totals and Files

### Entry Criteria
- Current totals recorded.

### Actions
1. Compare covered counts, not only percentages. Rules:

| Condition | Result |
|---|---|
| Production source unchanged since baseline and current covered equals baseline covered | Pass this check |
| Production source unchanged and current covered is below baseline covered | Fail |
| Production source changed (injected clock, optional base URL fields) | Compare per file: every file's covered lines that existed at baseline are still covered |

   Check production changes with `git diff --stat <baseline sha> -- <source dirs>`.
2. Per-file diff: python `diff-cover coverage-now.xml --compare-branch=<baseline sha>` reports changed lines not covered; for unchanged files, compare per-file covered counts from `coverage report` output at both commits. Node: compare `coverage-summary.json` per-file `lines.covered`. Go: compare `go tool cover -func` per-function output at both commits with `diff`.
3. List every file with fewer covered lines and the exact lines.

### Output
Totals comparison and per-file drops.

### Quality Gate
- The comparison shows four numbers (baseline total, baseline covered, current total, current covered) copied from tool output.
- Every dropped file lists line numbers.

---

## Phase 3: Check Test Strength

### Entry Criteria
- Phase 2 complete.

### Actions
1. Test count: compare the current count with `baseline_report`'s count using the same command (`pytest -q` summary, Jest/Vitest `numTotalTests`, Go pass events).
2. Skips: count skip markers before and after: `git diff <baseline sha> -- <test dirs> | grep -E "^\+.*(pytest.mark.skip|xfail|\.skip\(|it\.todo|t\.Skip\()"`. Any added skip fails the gate unless it has a recorded reason approved by the user.
3. Assertions removed: `git diff <baseline sha> -- <test dirs> | grep -cE "^-.*(assert |expect\(|t\.Errorf|t\.Fatalf|require\.)"` versus the added count. If removed exceeds added, every removed assertion must map to a replacement in a `pushdown_record` row or a fix-flow row.
4. Verdict: `PASS` only when Phase 2 passed, test count is equal or every removed test maps to replacement tests, no unapproved skip was added, and every removed assertion maps to a replacement.
5. Do NOT lower coverage thresholds in config (`fail_under`, `coverageThreshold`) to make this pass.

### Output
`coverage_verdict`.

### Quality Gate
- The verdict lists each condition with its evidence line.
- A `FAIL` names the file, test or assertion that caused it.

---

## Worked Example

Illustrative. `stack=python`, `parallel_command=pytest -n 8 --dist loadfile`, no shards.

- Phase 1: `coverage report` ends `TOTAL  6131  714  88%`. Config grep prints nothing.
- Phase 2: production changes: `shop/notify/retry.py` (none), `shop/fx/client.py` (new optional `base_url`, +11 statements). Baseline covered 5408, current 5417; per-file check shows no file lost covered lines.
- Phase 3: test count 412 before, 415 after (3 push-down tests added, 0 removed). Added skips: none. Assertions removed 2, added 7; the 2 map to `pushdown_record` rows. Verdict `PASS`.

---

## Exit Criteria

DONE when `coverage_verdict` is `PASS` with all evidence recorded, or `FAIL` naming exactly what dropped so the responsible flow can be rerun.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parallel coverage lower than serial at the same commit | **Adjust**: collection problem, not lost tests; fix coverage concurrency settings (pytest-cov under xdist combines automatically; Jest and Go per-shard merge) and rerun. |
| Phase 2 | A file lost covered lines | **Return**: send the item that changed that file's tests back to its fix flow (`tsp-pyramid-push-down` for trims). |
| Phase 3 | Added skip without reason | **Stop**: remove the skip and fix the test, or record the user's explicit approval. |
| Phase 3 | Test count dropped without mapping | **Stop**: restore the removed tests from git (`git checkout <baseline sha> -- <file>`) and redo the change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
