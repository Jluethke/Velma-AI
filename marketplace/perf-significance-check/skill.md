# Benchmark Statistical Significance Check

**One-line description:** Decides whether a performance change is a real improvement, a regression or noise, using the stack tool's built-in test (benchstat, criterion.rs) or a Mann-Whitney U test with a bootstrap confidence interval on the A/B samples, corrects for multiple benchmarks, and then keeps or reverts the change and logs it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ab_samples` (object, required): From `perf-bench-ab-rerun`.
- `perf_spec` (object, required): Metric direction and goal.
- `applied_change` (object, required): Branch, commits and candidate id.
- `significance_alpha` (number, optional): Significance level. Default 0.05, which is the documented default of both benchstat (`-alpha`) and criterion.rs (`significance_level`).

---

## Outputs

- `significance_verdict` (object): Per benchmark and size: test used, p-value, alpha after correction, median A, median B, ratio B/A with its confidence interval, verdict (`improved`, `regressed`, `no_change`), whether `perf_spec.goal` is met, and the action taken (`kept` or `reverted`).
- `change_log` (object[]): All attempts so far, read from and appended to `perf/change_log.jsonl`.

---

## Phase 1: Run the Test

### Entry Criteria
- Every A file has a B file with the same count.

### Actions
1. Choose the test by tool:

   | Tool | Test | Command |
   |---|---|---|
   | go | benchstat (Mann-Whitney U test, per its docs) | `benchstat -alpha <alpha> perf/samples/A_go.txt perf/samples/B_go.txt` (pass the raw `go test` output files kept by the A/B run) |
   | criterion | criterion's built-in comparison | read the `change:` line and `p = ` value printed by `cargo bench -- --baseline A`, or `target/criterion/<id>/change/estimates.json` |
   | pytest-benchmark, tinybench, hyperfine, JMH | Mann-Whitney U on the sample files | script below |

2. For the script path, create `perf/sigtest.py` (measurement code, not application code) and run it once per pair:

```python
import sys, numpy as np
from scipy.stats import mannwhitneyu, bootstrap
a = np.loadtxt(sys.argv[1]); b = np.loadtxt(sys.argv[2]); alpha = float(sys.argv[3])
res = mannwhitneyu(a, b, alternative="two-sided")
ratio = lambda x, y: np.median(y) / np.median(x)
ci = bootstrap((a, b), ratio, paired=False, vectorized=False,
               confidence_level=1 - alpha, method="percentile").confidence_interval
print(f"medianA={np.median(a):.6g} medianB={np.median(b):.6g} ratio={ratio(a,b):.4f} "
      f"ci=[{ci.low:.4f},{ci.high:.4f}] p={res.pvalue:.4g}")
```

   Run: `python perf/sigtest.py perf/samples/A_<name>_<size>.txt perf/samples/B_<name>_<size>.txt <alpha_corrected>`. Install with `python -m pip install numpy scipy` if missing.
3. If more than one benchmark or size is tested for the same change, apply the Bonferroni correction: `alpha_corrected = alpha / k`, where k is the number of comparisons. Use `alpha_corrected` for every pair and for benchstat's `-alpha`.
4. Why Mann-Whitney: benchmark times are often skewed with outliers, so a rank test that does not assume normal distributions is the default choice of benchstat; the script follows the same approach.

### Output
Test results per pair.

### Quality Gate
- Every pair has a p-value or criterion `p =` value copied from tool output, and the alpha used.
- For script results, the ratio confidence interval is recorded.

---

## Phase 2: Decide

### Entry Criteria
- Results recorded.

### Actions
1. Decide each pair with this table (lower-is-better metrics; flip the ratio sides for higher-is-better):

   | Condition | Verdict |
   |---|---|
   | p < alpha_corrected and ratio B/A < 1 and the ratio interval is entirely below 1 | `improved` |
   | p < alpha_corrected and ratio B/A > 1 and the interval is entirely above 1 | `regressed` |
   | benchstat prints `~` for the row | `no_change` |
   | criterion prints `No change in performance detected.` or `Change within noise threshold.` | `no_change` |
   | anything else | `no_change` |

2. The change verdict: `improved` if at least one pair is `improved` and none is `regressed`; `regressed` if any pair is `regressed`; else `no_change`.
3. Goal check: if `perf_spec.goal_source` is `user`, compare median B with the goal and record met or not met. If `default`, the goal is met when the verdict is `improved`.
4. Do not re-run the benchmark until it says `improved`. Rerunning and picking the best run inflates false positives. One A/B session decides.

### Output
Verdicts and goal status.

### Quality Gate
- Each verdict cites the table row that produced it.

---

## Phase 3: Keep or Revert, and Log

### Entry Criteria
- Verdict decided.

### Actions
1. Act:

   | Verdict | Action |
   |---|---|
   | `improved` | keep the branch; merge into the working branch with `git switch <original branch> && git merge --no-ff perf/<candidate_id>` only if the user asked for merges, else leave the branch for review |
   | `no_change` or `regressed` | `git switch <original branch>` and leave the branch unmerged; record it as rejected |

2. Append one JSON line to `perf/change_log.jsonl`: candidate id, branch, commits, verdict, p-values, ratios, intervals, goal status, timestamp.
3. Read the whole log back into `change_log`.
4. If the verdict was not `improved` and `applied_change.remaining` is not empty, the next step is `perf-one-change-apply` again (it skips logged candidates). If the goal is met or no candidates remain, the loop ends.

### Output
`significance_verdict`, `change_log`.

### Quality Gate
- `tail -1 perf/change_log.jsonl | python -m json.tool` exits 0 and shows this candidate.
- For `no_change` and `regressed`, `git branch --show-current` is not `perf/<candidate_id>`.

---

## Worked Example

Illustrative. Go, two sizes, alpha 0.05, k = 2, alpha_corrected 0.025.

```
$ benchstat -alpha 0.025 perf/samples/A_go.txt perf/samples/B_go.txt
                          │ A_go.txt │              B_go.txt              │
                          │  sec/op  │   sec/op     vs base               │
BuildReport/rows=30000-8    2.915 ± 1%   0.061 ± 2%  -97.91% (p=0.000 n=10)
BuildReport/rows=120000-8   45.10 ± 2%   0.247 ± 1%  -99.45% (p=0.000 n=10)
```

Both pairs `improved`; change verdict `improved`; goal source `default`, so met. Branch `perf/algo-1` kept for review; log line appended.

---

## Exit Criteria

DONE when every A/B pair has a tool or script test result at the corrected alpha, the change verdict follows the table, the branch is kept or left unmerged accordingly, and `perf/change_log.jsonl` has the new entry.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Too few samples (benchstat footnote, very wide interval) | **Return**: to `perf-bench-ab-rerun` with more samples; do not decide on too little data. |
| Phase 1 | SciPy not installable | **Adjust**: use benchstat on any stack by writing samples in Go benchmark line format, and record it. |
| Phase 2 | Improvement at one size and regression at another | **Stop**: verdict `regressed`; report both to the user. |
| Phase 3 | User asked for no merges | **Adjust**: leave the kept branch unmerged and list it in the report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
