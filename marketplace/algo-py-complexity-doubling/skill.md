# Python Complexity Verification by Doubling Experiment

**One-line description:** Verifies that a Python solution's empirical growth matches its complexity target, using adversarial worst-case inputs at doubling sizes, a deterministic operation counter, wall-clock timing with hyperfine or timeit, the ratio test against candidate classes, a cProfile hotspot read, and the absolute check at the maximum size against the time limit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `solution_file` (string, required): Path of the Python solution, for example `sol.py`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `stress_report` (object, required): Output of `algo-py-differential-stress-test`. Must show a passing run; timing a wrong solution is wasted work.

---

## Outputs

- `complexity_report` (object): Worst-case generator description, sizes, operation counts and ratios, timing table and ratios, nearest class per ratio, cProfile top functions, maximum-size time against the limit, and a verdict PASS or FAIL with the reason.

---

## Phase 1: Worst-Case Inputs at Doubling Sizes

### Entry Criteria
- `stress_report` shows no mismatch.

### Actions
1. Random inputs are usually not worst case. Build `gen_worst.py <n>` from this table, choosing every row that applies to the code:

| Code feature | Worst-case input |
|---|---|
| sorting, then a scan | already sorted and reverse sorted (both, take the slower) |
| hash map or set keyed by input values | many distinct keys; also all keys equal |
| DFS or recursion on a graph | path graph (maximum depth) |
| BFS or loops over neighbors | star graph (one node with n - 1 neighbors) and complete-ish dense graph within the edge limit |
| two pointers or window | inputs where the left pointer moves on every step |
| binary search on answer | answer at the top of the range (maximum iterations) |
| Dijkstra | many improvements per node (decreasing weights along a dense chain) |
| union-find | unions in the order that builds the tallest trees before compression |
| string or trie | all strings sharing one long prefix |
| multi-test | many tests summing to the sum-of-n bound, and one test at the full bound |

2. Sizes: N_max from the constraint table, then N_max/2, N_max/4, and so on. The smallest size used is set in Phase 3 by the noise rule, not by a fixed count.
3. Generate files: `for k in 0 1 2 3 4 5 6; do python gen_worst.py $((NMAX >> k)) > w_$k.in; done` (extend or cut k after Phase 3 reads the noise).

### Output
Worst-case generator and input files per size.

### Quality Gate
- Every applicable table row is either in the generator or written as "not applicable" with a reason.
- Every file passes the constraint validator from the stress-test flow.

---

## Phase 2: Deterministic Operation Count

### Entry Criteria
- Worst-case files exist.

### Actions
1. Copy `sol.py` to `sol_count.py` (do not edit `sol.py`). Add a global counter `OPS = 0` and increment it in the innermost loop body and in each heap or tree operation. Print it to stderr at exit: `print(OPS, file=sys.stderr)`.
2. Run on each size: `python sol_count.py < w_$k.in > /dev/null` and record OPS.
3. Compute ratio r = OPS(2n) / OPS(n) for each adjacent pair. Expected ratios for doubling: O(n) gives 2; O(n log n) gives 2 * log(2n)/log(n), slightly above 2; O(n log^2 n) a bit higher; O(n sqrt n) gives 2.83; O(n^2) gives 4; O(n^3) gives 8.
4. Classify each ratio as the class whose expected ratio is nearest to r in log scale: minimize |ln r - ln expected|. Counts are exact, so this classification has no noise.

### Output
Operation count table with ratios and nearest classes.

### Quality Gate
- The table has a count for every size and a ratio for every adjacent pair.
- The nearest class at the largest pair is no slower than the target class in `complexity_target`.

---

## Phase 3: Wall-Clock Timing and Absolute Check

### Entry Criteria
- Operation counts recorded.

### Actions
1. Time the unmodified `sol.py` on every size. With hyperfine (install with `winget install sharkdp.hyperfine`, `brew install hyperfine`, `apt install hyperfine` or `cargo install hyperfine`):

```
hyperfine --warmup 1 --parameter-list k 0,1,2,3,4,5,6 'python sol.py < w_{k}.in' --export-json t.json
```

Read `mean`, `stddev`, `median` and `min` per command in `t.json`. hyperfine runs through a shell by default, so `<` redirection works.
2. Without hyperfine: a driver that runs `subprocess.run` five times per size and keeps the minimum (`timeit.repeat`'s default repeat count is 5, and the `timeit` documentation recommends the minimum).
3. Baseline: time `python -c "pass"` the same way. Interpreter startup is included in every run. Noise rule: drop sizes whose (time - baseline mean) is not larger than the baseline stddev; they measure startup, not the algorithm.
4. Compute time ratios on the remaining adjacent pairs and classify as in Phase 2. Timing ratios are noisy; when they disagree with the operation counts, trust the counts for the class and the timing for the absolute check.
5. Absolute check: the time at N_max must be at most the time limit recorded in `complexity_target`. If the judge machine differs, scale by the calibration ratio recorded in `complexity_target`.
6. Hotspots: `python -m cProfile -s cumtime sol.py` prints its table to stdout mixed with the solution's output, so save the profile to a file instead: `python -m cProfile -o prof.out sol.py < w_0.in > /dev/null` then `python -c "import pstats; pstats.Stats('prof.out').sort_stats('tottime').print_stats(10)"`. Read the `tottime` column for the function where time is spent itself, and `ncalls` for unexpected call counts (for example a helper called n^2 times).

### Output
`complexity_report`.

### Quality Gate
- The time at N_max is written next to the limit, with the verdict.
- The top 10 `tottime` rows from pstats are recorded.

---

## Worked Example

Illustrative. Sliding-window solution, target O(n), N_max = 2*10^5, limit 1 s.

- Phase 1: worst case: all a_i = 1 with k = n/2 so the left pointer moves every step after the start. Files w_0 (200000) to w_6 (3125).
- Phase 2: OPS: 3125: 6250, 6250: 12500, ..., 200000: 400000. Every ratio 2.00, nearest class O(n).
- Phase 3:

```
$ hyperfine --warmup 1 --parameter-list k 0,1,2,3,4,5,6 'python sol.py < w_{k}.in' --export-json t.json
Benchmark 1: python sol.py < w_0.in
  Time (mean ± σ):     212.4 ms ±   3.1 ms
...
Benchmark 7: python sol.py < w_6.in
  Time (mean ± σ):      31.0 ms ±   1.2 ms
```

Baseline `python -c "pass"` 27.9 ms ± 1.0 ms: sizes w_5 and w_6 are within noise and dropped. Time ratio w_0/w_1 = 1.98, nearest O(n). Maximum 0.212 s against a 1 s limit: PASS. pstats top row: `solve` 0.15 s tottime.

---

## Exit Criteria

DONE when worst-case inputs exist at doubling sizes, operation counts and timing ratios are classified, the maximum size time is compared with the limit, and the verdict is PASS or FAIL with its reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stress_report` shows a failure | **Stop**: fix correctness first. |
| Phase 2 | Count ratio classifies slower than the target | **Return**: to the technique flow with the ratio table; the implementation has a hidden loop or the technique is wrong. |
| Phase 3 | Class matches but time at N_max exceeds the limit | **Return**: to `algo-py-runtime-pitfalls` for constant-factor fixes (I/O, deque, flattening), or consider PyPy. |
| Phase 3 | All sizes within the startup noise | **Adjust**: the work is tiny at N_max; record PASS on the absolute check and classify by counts only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
