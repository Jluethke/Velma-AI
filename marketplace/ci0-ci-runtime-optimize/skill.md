# CI Runtime Optimization From a Measured Report

**One-line description:** Turns a measured CI runtime report into one change at a time (cache, shard, needs graph, skip redundant runs, cancel superseded runs, right-size runners), each applied alone and accepted only if a re-measurement on the same sample size shows the critical path got shorter.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `runtime_report` (object, required): From `ci0-ci-runtime-measure`.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `optimization_plan` (object): `{candidates[], applied: [{change, before_s, after_s, kept}], rejected[], open_questions[]}`.

---

## Phase 1: Rank Candidate Changes

### Entry Criteria
- `runtime_report.critical_path` is non-empty.

### Actions
1. Consider only jobs on the critical path. Changes to other jobs do not shorten wall-clock time.
2. Map evidence to a change with this table. Each row needs the evidence in the left column to apply:

| Evidence in report | Change | Flow that does it |
|---|---|---|
| Install or dependency step is among the three longest steps | Add or fix a lockfile-keyed dependency cache | `ci0-gha-dependency-cache` or `ci0-gitlab-cache-needs` |
| Test step is the longest step and the runner supports sharding | Shard tests across parallel jobs | `ci0-gha-test-splitting` or `ci0-gitlab-parallel-matrix` |
| A job waits on another job it does not use | Remove the false dependency (`needs`) | `ci0-gitlab-cache-needs`, or edit `needs:` in GitHub |
| Median queue time is a large share of wall-clock | Runner capacity; not a pipeline-file fix | open question for the user |
| Same commit runs twice (push and PR) | Restrict `push` to the default branch / use `workflow:rules` | `ci0-gha-workflow-baseline` or `ci0-gitlab-ci-baseline` |
| Superseded PR runs keep running | `concurrency` with `cancel-in-progress` / `interruptible` | same baseline flows |
| Build step long and repeated in several jobs | Build once, pass output as an artifact | edit workflow; artifacts upload and download |
| Docker build step long | Layer cache (`docker/build-push-action` with `cache-from: type=gha` and `cache-to: type=gha,mode=max`; GitLab `--cache-from` with a registry image) | edit workflow |
| Windows or macOS cell is the slowest | Report; dropping an OS is a coverage decision | open question |

3. Write `candidates[]` with the evidence line copied from the report.
4. Do not propose: deleting tests, lowering coverage, removing matrix cells, `-x`/fail-fast flags, or skipping lint. Those reduce what CI checks, which is not optimization.

### Output
Ranked `candidates[]`.

### Quality Gate
- Every candidate cites a number from `runtime_report`.
- No candidate removes tests, checks, or matrix cells.

---

## Phase 2: Apply One Change

### Entry Criteria
- At least one candidate.

### Actions
1. Take the top candidate. Apply it on its own branch, through the named flow when one exists.
2. Do not combine two changes in one branch. With two changes, you cannot tell which one helped or hurt.
3. Run the pipeline enough times on that branch to match `runtime_report`'s sample size, or the number the user approves; record that number.
4. Lint the file (`actionlint` or `glab ci lint`) before pushing.

### Output
Branch with one change and its run IDs.

### Quality Gate
- `git diff --stat <default_branch>...HEAD` shows only the CI file(s) the change needs.
- Lint is clean.

---

## Phase 3: Re-Measure and Decide

### Entry Criteria
- Branch runs completed.

### Actions
1. Run `ci0-ci-runtime-measure` against the branch runs (same method, same statistic).
2. Decide:

| Result | Decision |
|---|---|
| Critical-path median is lower and every job still passes with the same test count | Keep; merge after review |
| Critical-path median is equal or higher | Reject; record numbers in `rejected[]` |
| Faster but test case count dropped (compare JUnit counts) | Reject; something stopped running |
| Faster but a new intermittent failure appears | Reject; report the failure |

3. Repeat Phase 2 with the next candidate only after the previous one is merged or rejected.
4. Never report a percentage improvement computed from single runs.

### Output
`optimization_plan`.

### Quality Gate
- Each `applied[]` entry has `before_s` and `after_s` from measured medians.
- JUnit case counts before and after are equal for every kept change.

---

## Worked Example

Illustrative only. Report: critical path `test (windows, 3.12) -> build`; `install` median 402 s.

Phase 1: candidate 1 cache (install is the longest step); candidate 2 shard tests (431 s).
Phase 2: branch `ci/cache-windows` adds `cache: pip` to setup-python.
Phase 3: re-measure over 20 runs: `install` median 118 s; critical path 1,024 s to 742 s; JUnit count 2,031 before and after. Kept. Candidate 2 then applied on its own branch.

---

## Exit Criteria

DONE when every candidate is applied alone and kept or rejected on measured medians, with equal test counts for every kept change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No candidate has evidence | **Return**: report that the pipeline has no measured hotspot. |
| Phase 2 | Change breaks the pipeline | **Adjust**: fix within the same change, or reject it; do not add a second change. |
| Phase 3 | Variance makes medians overlap | **Return**: report both distributions; ask the user for a larger sample. |
| Phase 3 | Queue time dominates | **Return**: runner capacity is the bottleneck; report to the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
