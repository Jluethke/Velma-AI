# Algorithm Problem Restatement and Complexity Target

**One-line description:** Restates an algorithmic problem as a precise specification (input domain, output contract, value ranges, integer widths) and derives the required time and memory complexity from the stated input sizes and a measured operations-per-second budget on the target runtime.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_statement` (string, required): Full problem text, including the constraints block and every sample input and output.
- `time_limit_seconds` (number, optional): Time limit per test file. If absent, look for it in `problem_statement`; if it is not there either, record "time limit unknown" as an open question.
- `memory_limit_mb` (number, optional): Memory limit per test file in megabytes. Same fallback as `time_limit_seconds`.
- `stack` (string, required): One of `python`, `cpp`, `java`. Selects the calibration program in Phase 2.

---

## Outputs

- `problem_spec` (object): Restatement, constraint table, input format, output contract (unique answer or any valid answer), integer width per quantity, modulus if any, multi-test structure, sample files, and open questions.
- `complexity_target` (object): The time and memory limits used (copied from `time_limit_seconds` and `memory_limit_mb` or the statement), N_max per size symbol, measured operations per second, operation budget, the largest admissible complexity class with the arithmetic that admits it, the classes it rejects with their arithmetic, and the memory budget check.

---

## Phase 1: Restate the Problem Exactly

### Entry Criteria
- `problem_statement` contains a constraints block. If it has none, **Stop** (see Error Handling).

### Actions
1. Copy every constraint verbatim into a table with columns: symbol, minimum, maximum, type (integer, real, string, graph), source line. Do not round or paraphrase "1 <= n <= 2 * 10^5" into "about 200k".
2. Find multi-test structure. Look for "t test cases" and for a phrase like "the sum of n over all test cases does not exceed X". If the sum bound exists, the complexity target in Phase 3 uses the sum bound, not t times the per-test maximum.
3. Write a restatement of at most three sentences that names the input objects, the quantity to compute, and the objective (count, minimize, maximize, decide, construct).
4. Classify the output contract with this table:

| Statement wording | Contract | Consequence |
|---|---|---|
| "print the answer", single number or yes/no | unique | Compare outputs with exact diff |
| "print any", "if there are multiple answers" | any valid | A checker program is required for stress testing |
| "absolute or relative error at most 1e-6" (or similar) | real tolerance | Checker compares with the stated tolerance, never with diff |
| "modulo 998244353" or "modulo 10^9+7" | modular | All arithmetic reduced mod the stated prime |

5. Compute the largest magnitude every intermediate quantity can reach from the constraint table (for example, n times max a_i). Apply this width rule:

| Largest magnitude | Python | C++ | Java |
|---|---|---|---|
| at most 2^31 - 1 | int | int | int |
| at most 2^63 - 1 | int | long long | long |
| above 2^63 - 1 | int (arbitrary precision) | __int128 or modular reduction | BigInteger or modular reduction |

6. Save every sample from the statement to files named `sample1.in`, `sample1.out`, `sample2.in`, and so on, byte for byte.

### Output
Draft `problem_spec` with constraint table, contract, widths and sample files.

### Quality Gate
- The constraint table has one row per symbol that appears in the constraints block (count both).
- Every intermediate quantity has a width chosen by the table in Action 5, with the multiplication written out.
- `ls sample*.in sample*.out` lists one `.out` per `.in`.

---

## Phase 2: Measure the Operation Budget

### Entry Criteria
- `stack` is one of `python`, `cpp`, `java`.

### Actions
1. Write the calibration program for `stack` to a file outside the solution directory. It runs a fixed loop of 10^7 additions and prints elapsed seconds. The loop count is only a measurement size, not a threshold.

| stack | File | Body | Run |
|---|---|---|---|
| python | calib.py | `import time; t=time.perf_counter(); s=0` then `for i in range(10**7): s+=i` then `print(time.perf_counter()-t, s)` | `python calib.py` |
| cpp | calib.cpp | `std::chrono::steady_clock` around `for (long long i=0;i<10000000;i++) s+=i^(s>>3);` and print `s` so the loop is not removed by the optimizer | `g++ -std=c++17 -O2 calib.cpp -o calib && ./calib` |
| java | Calib.java | `System.nanoTime()` around the same loop run 5 times in one process; report the last run so the JIT has compiled it | `javac Calib.java && java Calib` |

2. Run it three times and keep the smallest elapsed time `t_cal`. The minimum is the least noisy estimate (the Python `timeit` documentation gives this reasoning for using the minimum of repeats).
3. Compute `ops_per_sec = 10^7 / t_cal` and `budget = ops_per_sec * time_limit_seconds`.
4. If the target judge runs on different hardware from this machine, record that `budget` is a local estimate in the open questions.

### Output
`ops_per_sec` and `budget` recorded in draft `complexity_target`.

### Quality Gate
- The calibration program printed a number three times and the minimum is recorded.
- The C++ program prints `s` (without it, `-O2` can delete the loop and the time reads near zero).

---

## Phase 3: Derive the Complexity Target

### Entry Criteria
- Constraint table and `budget` exist (or "time limit unknown" is recorded).

### Actions
1. Let `N` be the size bound from Phase 1 (the sum bound when one exists). For each class in order O(n!), O(2^n * n), O(n^3), O(n^2 log n), O(n^2), O(n sqrt n), O(n log^2 n), O(n log n), O(n), compute f(N) numerically, using log base 2.
2. Admit a class when f(N) <= `budget`. The target is the slowest admitted class. Record f(N) for the target and for the next slower class to show why it fails.
3. Cross-check against the input-size table in Laaksonen, *Competitive Programmer's Handbook*, section 2.4 (stated for roughly one second): n <= 10 suggests O(n!), n <= 20 suggests O(2^n), n <= 500 suggests O(n^3), n <= 5000 suggests O(n^2), n <= 10^6 suggests O(n log n) or O(n), larger n suggests O(1) or O(log n). If your measured target and the table differ by more than one row, write both in `complexity_target` and keep the measured one.
4. When there are two size parameters (n and m, or n and q), compute f for the combined form, for example O((n + q) log n), with both maxima.
5. Memory: for each array, bytes = length * element size (4 for int/int32, 8 for long long/long/double; for Python lists, measure with `sys.getsizeof` on a list of the real length because each int object adds overhead). Sum them and compare against `memory_limit_mb * 2^20`.
6. If `time_limit_seconds` is unknown, use only the handbook table and mark the target "unconfirmed".

### Output
`problem_spec` and `complexity_target`.

### Quality Gate
- `complexity_target` contains the numeric f(N) for the chosen class and for the rejected next-slower class.
- The memory sum is written as a product per array, and its total is compared with the limit in bytes.

---

## Worked Example

Illustrative. `problem_statement`: "Given n integers a_1..a_n (1 <= n <= 2*10^5, 1 <= a_i <= 10^9) and k (1 <= k <= 10^15), print the length of the longest contiguous subarray with sum at most k." `time_limit_seconds` = 1, `memory_limit_mb` = 256, `stack` = python.

- Phase 1: constraint table has 3 rows (n, a_i, k). Contract: unique. Largest subarray sum = 2*10^5 * 10^9 = 2*10^14, above 2^31 - 1 and below 2^63 - 1, so 64-bit in C++/Java and plain int in Python. Files `sample1.in`, `sample1.out` saved.
- Phase 2: `python calib.py` printed 0.61, 0.58, 0.60. t_cal = 0.58, ops_per_sec = 1.72*10^7, budget = 1.72*10^7.
- Phase 3: N = 2*10^5. n log n = 2*10^5 * 17.6 = 3.5*10^6 (admitted). n sqrt n = 8.9*10^7 (rejected). n^2 = 4*10^10 (rejected). Target O(n log n), and O(n) also fits. Handbook row n <= 10^6 agrees. Memory: one list of 2*10^5 ints measured at about 1.6 MB plus int objects, far under 256 * 2^20 bytes.

---

## Exit Criteria

DONE when `problem_spec` holds a verbatim constraint table, an output contract, integer widths with their arithmetic, and sample files, and `complexity_target` holds a measured budget, the admitted class with its f(N), and a memory check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No constraints block in the statement | **Stop**: ask the user for input bounds; a complexity target cannot be derived without them. |
| Phase 1 | Samples contradict the restatement when worked by hand | **Adjust**: reread the statement and rewrite the restatement until every sample matches. |
| Phase 2 | Calibration time reads near zero | **Adjust**: the optimizer removed the loop; print the accumulator and rerun. |
| Phase 2 | Compiler or interpreter missing | **Stop**: report the missing tool; do not guess a budget. |
| Phase 3 | No class is admitted, even O(n) | **Return**: report that the intended solution is sublinear or the budget estimate is wrong; record both as open questions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
