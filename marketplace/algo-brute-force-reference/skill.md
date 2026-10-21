# Brute Force Reference Solution

**One-line description:** Writes an exhaustive, obviously correct reference solution that reads the same input format as the real solution, verifies it on every sample, and measures the largest input size it can finish so it can serve as the oracle for differential testing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`: restatement, constraint table, output contract, sample files.
- `stack` (string, required): One of `python`, `cpp`, `java`.
- `brute_file` (string, required): Path where the reference solution is written, for example `brute.py`, `brute.cpp`, `Brute.java`.

---

## Outputs

- `brute_force_limits` (object): The enumeration used, its complexity, measured run time per input size n, and `max_brute_n`, the largest n that finished within `time_limit_seconds` from `problem_spec` (or the user's stated limit).

---

## Phase 1: Choose the Enumeration

### Entry Criteria
- `problem_spec` has a restatement and at least one sample pair.

### Actions
1. Identify what a candidate answer is (a subset, a permutation, a pair of indices, a subarray, an assignment of values, a path). Pick the enumeration from this table:

| Candidate answer | Enumeration | Python | C++ | Java |
|---|---|---|---|---|
| subset of n items | all 2^n bitmasks | `for mask in range(1 << n)` | `for (int mask = 0; mask < (1 << n); ++mask)` | same as C++ |
| ordering of n items | all n! permutations | `itertools.permutations(range(n))` | `std::sort` then `do { } while (std::next_permutation(p.begin(), p.end()));` | recursive swap generation |
| pair or triple of indices | nested loops | `itertools.combinations(range(n), 2)` | two or three `for` loops | two or three `for` loops |
| contiguous subarray or substring | all (l, r), recompute from scratch | `for l in range(n): for r in range(l, n): sum(a[l:r+1])` | triple loop | triple loop |
| sequence of choices with values in [0, V) | all V^n tuples | `itertools.product(range(V), repeat=n)` | odometer counter array | odometer counter array |
| shortest path in a small graph | Floyd-Warshall O(n^3) or all simple paths by DFS | nested loops | nested loops | nested loops |
| answer value in a small range | try every value, check feasibility directly | `for x in range(lo, hi+1)` | `for` loop | `for` loop |

2. Write down the enumeration's complexity, for example O(2^n * n). It is expected to be exponential or high polynomial; that is correct for an oracle.
3. Rules for the reference. Do not share any helper function with the real solution. Do not sort, prune, memoize or "optimize" unless the restatement itself requires it. Recompute every candidate's value from the definition in the statement.

### Output
Enumeration choice and its complexity.

### Quality Gate
- The enumeration visits every candidate the restatement allows (write the count formula, for example 2^n).
- The chosen code contains no early exit except one the restatement defines (for example "print the first").

---

## Phase 2: Write and Verify on Samples

### Entry Criteria
- Enumeration chosen.

### Actions
1. Write `brute_file`. Read input in exactly the format of the statement, including the multi-test count line if present. Print in exactly the output format.
2. If the contract is "any valid", the reference prints the optimal value or a canonical answer, and the checker (written in the stress-test flow) validates the real solution's answer and compares the value. Note this in `brute_force_limits`.
3. Run on every sample and diff:

| stack | Command for each sample k |
|---|---|
| python | `python brute.py < samplek.in > brute_k.txt && diff -w brute_k.txt samplek.out` |
| cpp | `g++ -std=c++17 -O2 -Wall brute.cpp -o brute && ./brute < samplek.in > brute_k.txt && diff -w brute_k.txt samplek.out` |
| java | `javac Brute.java && java Brute < samplek.in > brute_k.txt && diff -w brute_k.txt samplek.out` |

On Windows without Git Bash, use `fc /W brute_k.txt samplek.out` instead of `diff -w`.
4. Do not edit a sample file to make the diff pass. If the reference fails a sample, the reference or the restatement is wrong.

### Output
`brute_file` that passes every sample.

### Quality Gate
- `diff -w` prints nothing for every sample (exit code 0).
- `brute_file` contains no import or include of the real solution file.

---

## Phase 3: Measure Its Size Limit

### Entry Criteria
- All samples pass.

### Actions
1. Write a throwaway generator (or reuse the stress-test generator if it exists) that prints one valid random input for a given n and seed.
2. Time the reference for n = 1, 2, 3, ... and continue until one run exceeds the time limit from `problem_spec`. Use `time` in bash (`time ./brute < in_n.txt`), `Measure-Command { ... }` in PowerShell, or `hyperfine --runs 3 './brute < in_n.txt'` if hyperfine is installed.
3. Record `max_brute_n` = the largest n that finished within the limit, and the time table.
4. Note for the stress-test flow: most bugs show up on very small inputs. Daniel Jackson's small scope hypothesis (*Software Abstractions*, MIT Press) states that a high proportion of bugs can be found by testing all inputs within a small scope. Stress tests use n from 1 up to `max_brute_n`, weighted toward small n.

### Output
`brute_force_limits`.

### Quality Gate
- The time table has one row per n tried, ending at the first n that exceeded the limit.
- `max_brute_n` is at least the smallest n in any sample, or the gap is recorded as an open question.

---

## Worked Example

Illustrative. Problem: longest subarray with sum at most k, `stack` = python, `brute_file` = brute.py.

- Phase 1: candidate = subarray (l, r). Enumeration: all pairs with sum recomputed by `sum(a[l:r+1])`, O(n^3).
- Phase 2:

```
$ python brute.py < sample1.in > brute_1.txt && diff -w brute_1.txt sample1.out
$ echo $?
0
```

- Phase 3: times: n=50 0.03 s, n=100 0.09 s, n=200 0.55 s, n=300 1.7 s (limit 1 s exceeded). `max_brute_n` = 200. The stress flow will draw n mostly from 1 to 10 with values from a small range so that sums hit k exactly.

---

## Exit Criteria

DONE when `brute_file` passes every sample with an exact diff and `brute_force_limits` records the enumeration, complexity, time table and `max_brute_n`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No finite enumeration exists (answer space unbounded) | **Adjust**: bound the space with the constraint table (for example values only up to max a_i) and record the bound. |
| Phase 2 | Reference fails a sample | **Return**: to `algo-problem-restatement`; the restatement or output format is wrong. Never edit the sample. |
| Phase 2 | Whitespace-only diff differences | **Adjust**: match the exact output format (spaces, newline at end) from the statement. |
| Phase 3 | Even n = 1 exceeds the limit | **Stop**: the reference is not exhaustive-simple; rewrite it without hidden heavy work. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
