# Binary Search on the Answer

**One-line description:** Implements binary search over the answer value with a monotone feasibility check, using the lo-infeasible / hi-feasible invariant that cannot loop forever, overflow-safe midpoints, bounds derived from the constraints, and a brute-force monotonicity check before any code is trusted.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `binary_search_answer`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `bsearch_design` (object): The searched variable, feasibility function and its cost, direction of monotonicity, bounds with derivation, loop form, iteration count, total complexity, and case run results.

---

## Phase 1: Define and Verify the Predicate

### Entry Criteria
- `technique_rationale` names `binary_search_answer`.

### Actions
1. Name x (the answer value) and write feasible(x) as a yes/no question that can be checked directly, for example "can the array be split into at most m parts each with sum <= x".
2. State the direction: for "minimize x such that feasible", feasible must be false...false true...true as x increases. For "maximize x" it is true...true false...false; convert it by searching the first infeasible x and subtracting 1, or negate the predicate.
3. Verify monotonicity on small inputs: run feasible(x) for every x from the smallest to the largest possible answer on every sample, every small edge case, and a batch of random inputs from the brute-force generator, and assert the sequence changes value at most once. Print any violating input. Record how many inputs and which x range you checked; this flow sets no minimum count, so a larger batch only adds confidence.
4. Write the cost of one feasible(x) call, usually O(n) or O(n log n).

### Output
Predicate, direction and monotonicity check result.

### Quality Gate
- The monotonicity script printed zero violations, with the number of inputs and range checked written in `bsearch_design`.

---

## Phase 2: Bounds and Loop Form

### Entry Criteria
- Predicate verified.

### Actions
1. Derive lo and hi from the constraint table so that feasible(lo) is false and feasible(hi) is true. For "minimize": lo = (smallest possible answer) - 1, hi = largest possible answer. Example for splitting into parts: lo = max(a) - 1, hi = sum(a). Write the derivation.
2. Use exactly this integer loop form (it maintains feasible(lo) == false and feasible(hi) == true and always terminates):

```
while hi - lo > 1:
    mid = lo + (hi - lo) // 2
    if feasible(mid): hi = mid
    else: lo = mid
answer = hi
```

C++ and Java: `mid = lo + (hi - lo) / 2` with `long long` / `long` when hi can exceed 2^31 - 1. Never `(lo + hi) / 2` in C++ or Java with 32-bit types. Never use `lo = mid + 1` together with `hi = mid - 1` from memory; mixing forms is the main source of infinite loops and off-by-one answers.
3. Real-valued answers: run a fixed iteration count derived from the required precision eps in the statement: iterations = ceil(log2((hi - lo) / eps)). Write the computed number. Do not loop on `hi - lo > eps` with doubles when values are large, because rounding can stop progress.
4. Total complexity = iterations * cost of feasible. Evaluate at the maxima and compare with the budget in `complexity_target`.
5. Library alternatives are allowed if you know the exact semantics: Python 3.10+ `bisect.bisect_left(range(lo, hi + 1), True, key=feasible)`; C++20 `std::ranges::partition_point(std::views::iota(lo, hi + 1), pred)` with pred = not feasible. Check the official docs for the version you run before using either.

### Output
Bounds with derivation, loop, iteration count and total complexity.

### Quality Gate
- feasible(lo) is false and feasible(hi) is true on sample 1 (print both).
- The total complexity evaluated at the maxima is at most the budget.

---

## Phase 3: Implement and Run

### Entry Criteria
- Bounds and loop fixed.

### Actions
1. Write `solution_file` with an `INVARIANT:` block: "feasible(lo) is false and feasible(hi) is true at every loop test; hi - lo strictly decreases".
2. Implement feasible as its own function. Make sure it does not early-return with a wrong value when partial sums overflow (use the width from `problem_spec`).
3. If the answer can be "impossible" (feasible(hi_max) is false), check feasible(hi) once before the loop and print the statement's sentinel.
4. Run all samples and edge cases:

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

### Output
`solution_file` and `bsearch_design`.

### Quality Gate
- The edge cases "answer = lowest value" and "answer = highest value" pass (these catch wrong bounds).
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. Split a (n <= 10^5, a_i <= 10^9) into at most m contiguous parts minimizing the largest part sum. `stack` = java.

- Phase 1: feasible(x) = greedy count of parts with sum <= x is at most m. Monotonicity script: 50 inputs, x in 0..60, zero violations.
- Phase 2: lo = max(a) - 1, hi = sum(a) <= 10^14 (needs `long`). Iterations <= ceil(log2(10^14)) = 47; total 47 * 10^5 = 4.7*10^6.
- Phase 3:

```
$ javac Sol.java
$ for f in sample1 edge_answer_low edge_answer_high; do java Sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_answer_low ok
edge_answer_high ok
```

---

## Exit Criteria

DONE when the predicate is verified monotone on random inputs, bounds satisfy feasible(lo) = false and feasible(hi) = true, the loop uses the invariant form, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Monotonicity violation found | **Return**: to `algo-pattern-select`; binary search on this predicate is wrong. Keep the violating input as an edge case. |
| Phase 2 | feasible(hi) is false on a valid input | **Adjust**: raise hi to the true upper bound from the constraints, or add the impossible sentinel. |
| Phase 3 | Program hangs | **Adjust**: replace the loop with the exact invariant form from Phase 2; do not patch with an iteration cap. |
| Phase 3 | Off-by-one on answer | **Adjust**: print lo, hi, feasible(lo), feasible(hi) on the failing case; fix the bound, not the loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
