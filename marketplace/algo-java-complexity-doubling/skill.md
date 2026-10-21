# Java Complexity Verification by Doubling Experiment

**One-line description:** Verifies that a Java solution's growth matches its complexity target with adversarial worst-case inputs at doubling sizes, an in-process operation counter, end-to-end hyperfine timing with JVM startup measured and subtracted, an in-process nanoTime measurement after JIT warmup, the ratio test, and the absolute check at the maximum size.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `solution_file` (string, required): Path of the Java solution, for example `Sol.java`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `stress_report` (object, required): Output of `algo-java-differential-stress-test`. Must show a passing run.

---

## Outputs

- `complexity_report` (object): Worst-case generator description, sizes, operation counts and ratios, end-to-end and in-process timing tables with ratios, nearest class per ratio, maximum-size time against the limit, GC observations, and a verdict PASS or FAIL with the reason.

---

## Phase 1: Worst-Case Inputs at Doubling Sizes

### Entry Criteria
- `stress_report` shows no mismatch.

### Actions
1. Write `GenWorst.java` taking n, choosing every row that applies:

| Code feature | Worst-case input |
|---|---|
| `Arrays.sort` on primitives | sorted, reverse sorted, all equal; if hacks are possible, note that crafted anti-quicksort arrays exist and confirm the shuffle fix from `algo-java-runtime-pitfalls` is present |
| `HashMap` keyed by input | many distinct keys; Java 8+ converts long bucket chains to balanced trees when keys are `Comparable`, so worst case per operation is O(log n) for `Integer` keys |
| DFS | path graph |
| loops over neighbors | star graph; densest graph allowed |
| binary search on answer | answer at the top of the range |
| `TreeMap` / `TreeSet` | increasing insertions |
| multi-test | many tiny tests summing to the bound; one test at the full bound |

2. Generate sizes N_max, N_max/2, ...: `javac GenWorst.java && for k in 0 1 2 3 4 5 6; do java GenWorst $((NMAX >> k)) > w_$k.in; done`.

### Output
Worst-case files per size.

### Quality Gate
- Every applicable row is in the generator or marked "not applicable" with a reason.
- Every file passes the constraint validator from the stress-test flow.

---

## Phase 2: Operation Count

### Entry Criteria
- Worst-case files exist.

### Actions
1. Copy `Sol.java` to a separate directory as `Sol.java` with a `static long OPS` counter incremented in the innermost loops and in each heap, map or tree operation; print it to `System.err` at the end. Do not edit the original.
2. Run each size and record OPS. Compute r = OPS(2n) / OPS(n) for adjacent pairs. Expected doubling ratios: O(n) 2; O(n log n) 2 * log(2n)/log(n); O(n sqrt n) 2.83; O(n^2) 4; O(n^3) 8. Classify each r as the class minimizing |ln r - ln expected|.

### Output
Operation count table, ratios, nearest classes.

### Quality Gate
- The nearest class at the largest pair is no slower than the target in `complexity_target`.

---

## Phase 3: Timing and Absolute Check

### Entry Criteria
- Counts recorded.

### Actions
1. End-to-end timing, which is what a judge measures:

```
hyperfine --warmup 1 --parameter-list k 0,1,2,3,4,5,6 'java Sol < w_{k}.in' --export-json t.json
```

Read `mean` and `stddev` per command. Baseline: time `java Sol < tiny.in` with the smallest valid input; JVM startup is commonly tens to hundreds of milliseconds and appears in every run. Drop sizes whose time minus baseline mean is not larger than the baseline stddev.
2. In-process timing, to see the algorithm without startup: in a copy of the solution, call `solve` on the same input several times in one JVM, and time each call with `System.nanoTime()`. Early calls include interpretation and JIT compilation; report the later calls once consecutive values stop decreasing. For microbenchmark-grade numbers use JMH (`org.openjdk.jmh`), which handles warmup, dead-code elimination and forks; check its documentation for the archetype command.
3. GC: run once with `java -Xlog:gc Sol < w_0.in > /dev/null` (JDK 9+ unified logging) and count pause lines; many young-generation pauses on the largest size point to boxed collections. Record the heap flag used if the judge sets one (for example `-Xmx` matching the memory limit).
4. Compute time ratios on the kept sizes and classify. Trust the operation counts for the class and the end-to-end time for the absolute check.
5. Absolute check: end-to-end time at N_max at most the time limit in `complexity_target`.

### Output
`complexity_report`.

### Quality Gate
- End-to-end time at N_max is written next to the limit with the verdict.
- The baseline startup time and the sizes dropped by the noise rule are recorded.

---

## Worked Example

Illustrative. Binary search on answer with an O(n) check, target O(n log R), N_max = 10^5, limit 2 s.

- Phase 1: worst case: answer at the top of the range (one huge element, the rest 1), so every iteration runs the full check.
- Phase 2: OPS ratios 2.00, 2.00, 2.00 (log R is fixed by the value range, so growth in n is linear): nearest O(n), consistent with O(n log R).
- Phase 3:

```
$ hyperfine --warmup 1 --parameter-list k 0,1,2,3 'java Sol < w_{k}.in' --export-json t.json
Benchmark 1: java Sol < w_0.in
  Time (mean ± σ):     187.3 ms ±   6.0 ms
Benchmark 4: java Sol < w_3.in
  Time (mean ± σ):      98.7 ms ±   4.1 ms
```

Baseline `java Sol < tiny.in`: 91.5 ms ± 3.8 ms, so w_3 is dropped. In-process: `solve` at n = 10^5 settles at 6.1 ms after the third call. `-Xlog:gc` shows 2 pauses. 0.187 s against 2 s: PASS.

---

## Exit Criteria

DONE when worst-case inputs exist, operation-count ratios are classified against the target, end-to-end time at N_max with startup baseline is compared with the limit, and a verdict is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stress_report` shows a failure | **Stop**: fix correctness first. |
| Phase 2 | Count ratio slower than the target | **Return**: to the technique flow with the table. |
| Phase 3 | Class correct but end-to-end time over the limit | **Return**: to `algo-java-runtime-pitfalls` for I/O, boxing and sort fixes. |
| Phase 3 | In-process times keep dropping across all calls | **Adjust**: run more calls before reading, or use JMH. |
| Phase 3 | `OutOfMemoryError` at N_max | **Return**: to `algo-java-runtime-pitfalls` Phase 3 to replace boxed collections with primitive arrays. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
