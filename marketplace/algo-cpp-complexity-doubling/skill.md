# C++ Complexity Verification by Doubling Experiment

**One-line description:** Verifies that a C++ solution's growth matches its complexity target with adversarial worst-case inputs at doubling sizes, hardware instruction counts from perf stat or callgrind, hyperfine wall-clock timing on the -O2 build only, the ratio test against candidate classes, and the absolute check at the maximum size.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `solution_file` (string, required): Path of the C++ solution, for example `sol.cpp`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `stress_report` (object, required): Output of `algo-cpp-differential-stress-test`. Must show a passing run.

---

## Outputs

- `complexity_report` (object): Worst-case generator description, sizes, instruction counts and ratios, timing table and ratios, nearest class per ratio, hotspot functions, maximum-size time against the limit, and a verdict PASS or FAIL with the reason.

---

## Phase 1: Timing Build and Worst-Case Inputs

### Entry Criteria
- `stress_report` shows no mismatch.

### Actions
1. Build the timing binary with the judge's flags if known, otherwise `g++ -std=c++17 -O2 sol.cpp -o sol_fast`. Never time `sol_check` (sanitizers) or any build with `-D_GLIBCXX_DEBUG`: debug mode adds checks and can change complexity of some operations.
2. Write `gen_worst.cpp` taking n, choosing every row that applies:

| Code feature | Worst-case input |
|---|---|
| `std::sort` then a scan | sorted, reverse sorted, all equal (take the slowest) |
| `std::unordered_map` / `unordered_set` keyed by input values | many distinct keys; on judges with hacks, keys that are multiples of a bucket count prime collide; use a custom hash (for example splitmix64 with a random seed) and test both |
| DFS recursion | path graph (also checks stack depth) |
| loops over neighbors | star graph; densest graph allowed |
| binary search on answer | answer at the top of the range |
| Dijkstra | many successful relaxations per node |
| `std::set` / `std::map` | strictly increasing insertions |
| multi-test | many tiny tests summing to the bound; one test at the full bound |

3. Sizes N_max, N_max/2, N_max/4, ...: `for k in 0 1 2 3 4 5 6; do ./gen_worst $((NMAX >> k)) > w_$k.in; done`.

### Output
`sol_fast`, worst-case files per size.

### Quality Gate
- `sol_fast` was built without `-fsanitize` and without `_GLIBCXX_DEBUG` (show the build command in the report).
- Every applicable row is in the generator or marked "not applicable" with a reason.

---

## Phase 2: Instruction Counts

### Entry Criteria
- Worst-case files exist.

### Actions
1. Instruction counts are far less noisy than time. Use one of:

| Tool | Command | Read |
|---|---|---|
| Linux perf | `perf stat -e instructions -x, ./sol_fast < w_$k.in > /dev/null 2> perf_$k.csv` | first field of the `instructions` line in the CSV |
| Valgrind callgrind | `valgrind --tool=callgrind --callgrind-out-file=cg_$k.out ./sol_fast < w_$k.in > /dev/null` | the `Collected :` total, or `callgrind_annotate cg_$k.out` header "PROGRAM TOTALS" |
| neither available | copy to `sol_count.cpp` with a global `long long OPS` counter in the innermost loops, print to stderr | the printed count |

`perf` may need `kernel.perf_event_paranoid` lowered or root; if it errors, use callgrind (slow, roughly tens of times slower than native, so only on the smaller sizes) or the counter.
2. Subtract a baseline: the count for the smallest size's I/O only, measured by running a copy that reads input and exits.
3. Compute ratio r = count(2n) / count(n) for each adjacent pair. Expected ratios when doubling: O(n) 2; O(n log n) 2 * log(2n)/log(n); O(n sqrt n) 2.83; O(n^2) 4; O(n^3) 8. Classify each r as the class minimizing |ln r - ln expected|.
4. Hotspots: `callgrind_annotate cg_0.out | head -30` lists functions by instruction count; or `perf record ./sol_fast < w_0.in > /dev/null` then `perf report --stdio | head -40`.

### Output
Instruction count table, ratios, nearest classes, hotspots.

### Quality Gate
- The nearest class at the largest pair is no slower than the target in `complexity_target`.
- The count tool and its exact command are recorded.

---

## Phase 3: Wall-Clock Timing and Absolute Check

### Entry Criteria
- Counts recorded.

### Actions
1. Time all sizes with hyperfine:

```
hyperfine --warmup 2 --parameter-list k 0,1,2,3,4,5,6 './sol_fast < w_{k}.in' --export-json t.json
```

Read `mean` and `stddev` per command in `t.json`. Without hyperfine use `/usr/bin/time -f "%e %M" ./sol_fast < w_0.in > /dev/null` (elapsed seconds and peak resident set size in KB) three times and keep the minimum.
2. Noise rule: time `./sol_fast < /dev/null` (or a minimal valid input) as the baseline; drop sizes whose time minus baseline mean is not larger than the baseline stddev.
3. Absolute check: time at N_max must be at most the time limit recorded in `complexity_target`; record peak memory from `/usr/bin/time` against the memory limit.
4. If the counts say the class is right but time is high, the usual causes are I/O (`cin` without `sync_with_stdio(false)`, `endl`), `std::map` where a sorted vector would do, and cache misses from `vector<vector<int>>` adjacency on huge graphs (CSR arrays fix it).

### Output
`complexity_report`.

### Quality Gate
- Time and peak memory at N_max are written next to their limits, with the verdict.

---

## Worked Example

Illustrative. Dijkstra, target O((V + E) log V), V = 10^5, E = 2*10^5, limit 1 s, Linux.

- Phase 1: `g++ -std=c++17 -O2 sol.cpp -o sol_fast`; worst case: a chain with shortcut edges of decreasing weight so most nodes improve several times.
- Phase 2:

```
$ perf stat -e instructions -x, ./sol_fast < w_0.in > /dev/null 2> perf_0.csv; cut -d, -f1 perf_0.csv
612331908
```

Ratios after baseline: 2.09, 2.11, 2.10; nearest O(n log n). `callgrind_annotate` top: `std::priority_queue::pop`.
- Phase 3: hyperfine mean at w_0: 41.8 ms ± 0.9 ms; `/usr/bin/time` peak 14,200 KB. Limit 1 s and 256 MB: PASS.

---

## Exit Criteria

DONE when the timing build is free of sanitizers and debug mode, instruction-count ratios are classified against the target, the maximum-size time and memory are compared with the limits, and a verdict is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stress_report` shows a failure | **Stop**: fix correctness first. |
| Phase 2 | `perf` permission error | **Adjust**: use callgrind on the smaller sizes or the manual counter. |
| Phase 2 | Count ratio slower than the target | **Return**: to the technique flow with the table and the hotspot list. |
| Phase 3 | Class correct but time over the limit | **Return**: to `algo-cpp-overflow-ub-audit` Phase 3 for I/O and container fixes. |
| Phase 3 | Windows host without perf or valgrind | **Adjust**: use WSL, or the manual counter plus hyperfine (available through winget). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
