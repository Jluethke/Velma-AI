# Performance Regression Guard in CI

**One-line description:** Adds a CI job that benchmarks the pull request's base and head commits on the same runner in the same job, compares them with the stack's statistical tool, fails the build only on a statistically significant regression, and proves the guard works by pushing a deliberate slowdown on a throwaway branch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bench_command` (string, required): From `perf-bench-baseline-normalize`.
- `baseline_results` (object, required): Tool, unit, sample count.
- `stack` (string, required): `python`, `node`, `go`, `rust`, `jvm`, `c` or `cpp`.
- `repo_path` (string, required): Repository root.
- `ci_platform` (string, optional): `github-actions` (default) or `gitlab-ci`.
- `significance_alpha` (number, optional): Default 0.05 (benchstat and criterion.rs default).

---

## Outputs

- `ci_guard_config` (object): Path of the workflow file, the compare script path, the failure rule, alpha, sample count, runner type, the proof run (branch, run URL or id, and the failing job output), and the known limits of shared runners.

---

## Phase 1: Choose the Comparison Design

### Entry Criteria
- `bench_command` runs locally and finishes in a time the user accepts for CI (ask the user; record the answer).

### Actions
1. Use same-job A/B: both commits are benchmarked in one job on one machine. Comparing a PR run with numbers stored from an earlier run on a different shared runner mixes machine differences into the result.
2. Choose the compare tool:

   | `stack` | Compare tool in CI | Fail signal |
   |---|---|---|
   | go | benchstat | a `sec/op` row with a `+x%` delta and `p=` below alpha (rows with `~` are not significant) |
   | rust | criterion `--save-baseline base` then `--baseline base` | console line `Performance has regressed.` |
   | python, node, jvm, c, cpp | `perf/sigtest.py` from `perf-significance-check` on extracted samples | p below alpha and ratio interval entirely above 1 |

3. Alternative when shared-runner noise is too high for the user: instruction-count benchmarking (for example CodSpeed with `pytest-codspeed` or `codspeed-criterion-compat`, or `iai-callgrind` for Rust), which measures with Valgrind-based simulation and is less sensitive to runner noise. Record it as an option; do not add a paid service without the user.
4. Also available: `benchmark-action/github-action-benchmark` stores history on a `gh-pages` branch and alerts when a result exceeds `alert-threshold` (documented default `200%`). It compares across runs on different runners, so use it for trend charts, not as the merge gate.

### Output
Design decision recorded.

### Quality Gate
- The compare tool is one table row, and the fail signal is a literal string or numeric rule.

---

## Phase 2: Write the Workflow

### Entry Criteria
- Design chosen.

### Actions
1. Create one new file. GitHub Actions: `.github/workflows/perf-guard.yml`. GitLab: a `perf_guard` job in `.gitlab-ci.yml` (this edits an existing file; show the diff to the user first).
2. Go example (adapt the setup step for other stacks: `actions/setup-python@v5`, `actions/setup-node@v4`, `dtolnay/rust-toolchain@stable`, `actions/setup-java@v4`):

```yaml
name: perf-guard
on: pull_request
jobs:
  bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
      - run: go install golang.org/x/perf/cmd/benchstat@latest
      - name: Benchmark base and head
        run: |
          set -euo pipefail
          BASE=${{ github.event.pull_request.base.sha }}
          HEAD=${{ github.event.pull_request.head.sha }}
          git checkout "$BASE" && go test -c -o /tmp/A.test ./internal/report/
          git checkout "$HEAD" && go test -c -o /tmp/B.test ./internal/report/
          for i in $(seq 1 "$COUNT"); do
            /tmp/A.test -test.run='^$' -test.bench='^BenchmarkBuildReport$' -test.count=1 >> /tmp/A.txt
            /tmp/B.test -test.run='^$' -test.bench='^BenchmarkBuildReport$' -test.count=1 >> /tmp/B.txt
          done
        env:
          COUNT: ${{ vars.PERF_COUNT }}
      - name: Compare
        run: |
          benchstat -alpha "$ALPHA" /tmp/A.txt /tmp/B.txt | tee /tmp/cmp.txt
          python3 perf/ci_fail_on_regression.py /tmp/cmp.txt
        env:
          ALPHA: ${{ vars.PERF_ALPHA }}
```

   `PERF_COUNT` and `PERF_ALPHA` are repository variables set by the user (Settings, Secrets and variables, Actions, Variables), so no number is hard-coded.
3. Write `perf/ci_fail_on_regression.py`: read the benchstat output, take only the `sec/op` section, and exit 1 if any row contains a positive percentage delta followed by `(p=` with p below `PERF_ALPHA` (read from the environment). Print the offending rows. Exit 0 otherwise.
4. Do not make the job pass on error (`continue-on-error: true`) and do not wrap the compare in `|| true`.

### Output
Workflow and compare script.

### Quality Gate
- `python -c "import yaml,sys;yaml.safe_load(open('.github/workflows/perf-guard.yml'))"` exits 0 (or `actionlint` passes if installed).
- `python perf/ci_fail_on_regression.py <a saved benchstat output with no regression>` exits 0 locally.

---

## Phase 3: Prove the Guard Fires

### Entry Criteria
- Workflow committed on a branch.

### Actions
1. On a throwaway branch from the PR head, add a deliberate slowdown inside the benchmarked function (for example an extra loop over the input, or a `time.Sleep` in Go, `time.sleep` in Python, `Thread.sleep` in Java), commit and open a draft PR.
2. Confirm the job fails and the log shows the regressed row. Record the run id and the failing lines.
3. Close the draft PR and delete the throwaway branch. Confirm a PR without the slowdown passes.
4. Record the limits in `ci_guard_config`: shared runners vary in CPU model between runs (record `lscpu` in the job log), so same-job A/B is required; small regressions within runner noise will not be detected at the chosen sample count.
5. Fill `ci_guard_config`.

### Output
`ci_guard_config`.

### Quality Gate
- A recorded CI run with the deliberate slowdown failed in the compare step.
- A recorded CI run without it passed.

---

## Worked Example

Illustrative. Go repository, GitHub Actions, `PERF_COUNT=10`, `PERF_ALPHA=0.05` set by the user.

- Phase 1: same-job A/B with benchstat.
- Phase 2: `.github/workflows/perf-guard.yml` and `perf/ci_fail_on_regression.py` committed; YAML parses.
- Phase 3: branch `perf-guard-proof` adds `for range rows { _ = len(rows) }` twice inside `BuildReport`. Job output: `BuildReport/rows=30000-4  2.910 ± 2%  3.188 ± 1%  +9.55% (p=0.000 n=10)` and `REGRESSION: BuildReport/rows=30000-4`, exit 1. Draft PR closed. A clean PR passed.

---

## Exit Criteria

DONE when a CI job benchmarks base and head in one job, fails only on a significant regression per the compare tool, has no hard-coded thresholds outside user-set variables or documented defaults, and has been shown to fail on a deliberate slowdown and pass without it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Benchmarks too slow for CI | **Adjust**: benchmark the smaller size only in CI and record it; keep the full set for local runs. |
| Phase 2 | Base commit lacks the benchmark (new benchmark in this PR) | **Adjust**: skip the comparison with a clear log line when the benchmark is absent on base; do not fail. |
| Phase 3 | Deliberate slowdown not detected | **Return**: to Phase 2; raise samples or move to instruction counting; the guard is not working. |
| Phase 3 | Clean PR fails | **Retry**: once to confirm, then **Return** to Phase 1; noise exceeds the alpha setting. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
