# Dynamic Programming States and Transitions

**One-line description:** Designs a dynamic program by naming the state in words, enumerating every transition, fixing base cases and evaluation order from the state dependency graph, choosing memoization or tabulation, and reducing memory, with each state shape selected from a decision table (prefix, two sequences, interval, knapsack, bitmask, tree, digit).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `dp`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `dp_design` (object): State definition sentence, dimensions with ranges, transition list, base cases, answer location, evaluation order, state count times transition cost, memory plan, and case run results.

---

## Phase 1: Define the State

### Entry Criteria
- `technique_rationale` names `dp`.

### Actions
1. Pick the state shape:

| Structure in the problem | State | Order |
|---|---|---|
| one sequence, decision per element | dp[i] = best for prefix a[0..i-1] (add a last-choice dimension if the next choice depends on it) | i increasing |
| two sequences (LCS, edit distance, matching) | dp[i][j] over prefixes of both | i then j increasing |
| contiguous segment merged or split (matrix chain, burst balloons, palindromic partition) | dp[l][r] | by length r - l increasing |
| items with a capacity | dp[w] = best using capacity w | 0/1 items: w decreasing inside each item; unbounded items: w increasing |
| subsets with n <= 20-ish (assignment, Hamiltonian path) | dp[mask][last] | mask increasing (submasks are numerically smaller) |
| rooted tree | dp[v][state of v] | post-order (children before parent) |
| count numbers in [0, X] with a digit property | dp[pos][tight][extra] | pos from most significant digit |
| grid paths | dp[r][c] | row-major |

2. Write the state as one sentence: "dp[i][j] = the minimum cost to ... using ... such that ...". Every index in the sentence must have a range.
3. Check completeness: the sentence must contain every piece of information the future decisions depend on. If the next choice depends on something not in the state (the last color, remaining budget, whether an item was skipped), add a dimension.
4. Compute state count = product of dimension ranges.

### Output
State sentence, dimensions with ranges, order, state count.

### Quality Gate
- The state sentence names every index and its range.
- State count is evaluated as a number at the maxima.

---

## Phase 2: Transitions, Base Cases, Answer

### Entry Criteria
- State defined.

### Actions
1. List every transition as an equation, one per choice: for example dp[i][j] = min(dp[i-1][j] + del, dp[i][j-1] + ins, dp[i-1][j-1] + (a[i-1] != b[j-1])). Every choice the problem allows must appear exactly once (counting problems double count when a choice appears twice).
2. Base cases: write values for the states with no predecessors. Use this initialization rule:

| Objective | Unreachable state value | Base |
|---|---|---|
| minimize | +INF derived from the maximum possible answer | 0 at the empty state |
| maximize | -INF | 0 at the empty state |
| count ways | 0 | 1 at the empty state |
| feasibility | false | true at the empty state |

For knapsack, "capacity exactly w" initializes dp[0] = 0 and others to the unreachable value; "capacity at most w" initializes every dp[w] = 0.
3. Answer location: write which cell or which reduction (max over dp[n][*]) is the answer.
4. Cost = state count * transitions per state. Evaluate and compare with the budget in `complexity_target`. If over budget, apply a reduction only when its condition holds and write the condition:

| Reduction | Condition |
|---|---|
| prefix sums over a range of previous states | transition is a sum over a contiguous range of dp values |
| monotonic deque | transition is min or max over a sliding range of dp values |
| fewer dimensions | one dimension is determined by others (for example j = sum - i) |
| divide and conquer optimization, Knuth optimization, convex hull trick | the cost function meets the published condition (monotone optimum, quadrangle inequality, linear in a product term); cite it and verify on the brute force |

5. Modular counting: reduce after every addition; after a subtraction use `(x - y) % MOD` in Python, `((x - y) % MOD + MOD) % MOD` in C++ and Java, because C++ and Java `%` keeps the sign of the dividend.

### Output
Transitions, base cases, answer location, cost.

### Quality Gate
- Each transition corresponds to one named choice, and the choice list matches the statement.
- The cost value at the maxima is at most the budget.

---

## Phase 3: Implement, Reduce Memory, Run

### Entry Criteria
- Phase 2 complete.

### Actions
1. Choose implementation: tabulation (loops in the Phase 1 order) by default. Memoized recursion only when reachable states are much fewer than all states and the recursion depth fits the runtime (CPython's default limit is 1000; `functools.lru_cache(maxsize=None)` adds frames).
2. Memory: if row i reads only row i-1, keep two rows (or one row with the loop direction from the knapsack row). Compute bytes before and after.
3. Write `solution_file` with an `INVARIANT:` block containing the state sentence and "every state is computed after all states it reads".
4. Run samples and edge cases (base case only, capacity 0, nothing usable, everything used):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

5. If a small case fails, print the whole dp table for it and compare row by row with a hand computation. A wrong cell points to a missing transition or a missing state dimension.

### Output
`solution_file` and `dp_design`.

### Quality Gate
- Every case with an `.out` file shows an empty diff.
- Memory before and after reduction is written in bytes and the final value is under the limit.

---

## Worked Example

Illustrative. 0/1 knapsack, n <= 100 items, capacity W <= 10^5, values <= 10^9, maximize value with weight at most W. `stack` = cpp.

- Phase 1: capacity row; dp[w] = best value with total weight at most w. State count 10^5.
- Phase 2: for each item (wt, val): for w from W down to wt: dp[w] = max(dp[w], dp[w - wt] + val). Base: all dp[w] = 0 (at most w). Answer dp[W]. Cost 100 * 10^5 = 10^7. Values up to 100 * 10^9 need `long long`.
- Phase 3:

```
$ g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol
$ for f in sample1 edge_capacity0 edge_all_too_heavy edge_take_all; do ./sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_capacity0 ok
edge_all_too_heavy ok
edge_take_all ok
```

Running w upward by mistake makes `edge_take_all` reuse one item twice; the descending loop is what the 0/1 row requires.

---

## Exit Criteria

DONE when the state sentence is complete, transitions cover each choice once, base cases follow the initialization table, cost fits the budget, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | State count alone exceeds memory or budget | **Return**: to `algo-pattern-select` with the count; another technique or reduction is needed. |
| Phase 2 | No reduction condition holds and cost is over budget | **Return**: to `algo-pattern-select`. |
| Phase 3 | Small case wrong | **Adjust**: print the dp table, find the first wrong cell, add the missing transition or dimension. |
| Phase 3 | `RecursionError` with memoization | **Adjust**: convert to tabulation in the Phase 1 order. |
| Phase 3 | Negative counts in C++ or Java | **Adjust**: apply the modular subtraction fix from Phase 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
