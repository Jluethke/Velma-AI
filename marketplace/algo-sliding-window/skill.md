# Sliding Window and Monotonic Deque

**One-line description:** Implements a fixed or variable sliding window (longest, shortest, or count of valid subarrays), including the at-most-k minus at-most-(k-1) trick for "exactly k" and the monotonic deque for window extremes, with the validity-monotonicity check that decides whether a window applies at all.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `sliding_window`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `window_design` (object): Window type, add and remove operations, validity condition, monotonicity proof line, answer update point, complexity, and case run results.

---

## Phase 1: Confirm the Window Applies

### Entry Criteria
- `technique_rationale` names `sliding_window`.

### Actions
1. Write the validity condition V(l, r) of a window a[l..r].
2. Check monotonicity: if V(l, r) is true, is V(l+1, r) true (shrinking keeps validity)? Use this table:

| Condition | Shrink keeps validity? | Window usable? |
|---|---|---|
| sum <= k with all a_i >= 0 | yes | yes |
| sum <= k with negative values allowed | no | no: use prefix sums with a monotonic deque (shortest subarray with sum >= k) or a sorted structure |
| at most k distinct values | yes | yes |
| exactly k distinct values | no | yes via count(at most k) - count(at most k-1) |
| max - min <= d | yes | yes, with two monotonic deques for max and min |
| product < k with all a_i >= 1 | yes | yes |

3. If the table says "no", stop here (see Error Handling). Confirm on small inputs with the brute force if the condition is not in the table: for every valid window found by brute force, check that every subwindow is valid.

### Output
Validity condition and monotonicity result.

### Quality Gate
- The condition matches a table row, or a brute-force subwindow check over all windows of at least one random input printed zero violations.

---

## Phase 2: Choose the Template

### Entry Criteria
- Monotonicity confirmed.

### Actions
1. Choose the template by objective:

| Objective | Template | Answer update |
|---|---|---|
| longest valid window | for r in 0..n-1: add a[r]; while not valid: remove a[l], l += 1 | after the while loop: best = max(best, r - l + 1) |
| count valid windows | same loop | after the while loop: count += r - l + 1 (all windows ending at r starting at l..r) |
| shortest window satisfying a "at least" condition | for r: add a[r]; while condition holds: best = min(best, r - l + 1); remove a[l], l += 1 | inside the while loop, before removing |
| fixed length L | add a[r]; if r >= L: remove a[r-L]; if r >= L-1: evaluate | when r >= L - 1 |
| max or min of every window of length L | monotonic deque of indices: pop back while a[back] <= a[r] (for max); pop front while front <= r - L | front of the deque when r >= L - 1 |

2. Write add and remove as exact operations on the window state (running sum, counter map, deque).
3. Counter map rule: when a count drops to 0, delete the key (Python `del cnt[x]`, C++ `cnt.erase(x)`, Java `cnt.remove(x)`), otherwise `len(cnt)` overcounts distinct values. With a small known alphabet use a fixed array plus a separate distinct counter.

### Output
Template with add, remove and answer update lines.

### Quality Gate
- The answer update is at the position the table gives for the objective.
- The remove operation is the exact inverse of add (check by writing both side by side).

---

## Phase 3: Implement and Run

### Entry Criteria
- Template chosen.

### Actions
1. Write `solution_file` beginning with an `INVARIANT:` comment block: "after the inner loop, a[l..r] is the longest valid window ending at r" (or the counting or shortest equivalent).
2. Use `collections.deque` in Python (never `list.pop(0)`, which is O(n)), `std::deque<int>` in C++, `ArrayDeque<Integer>` in Java (or an int array with head and tail indices for speed).
3. Running sums use the width from `problem_spec`.
4. Run every sample and edge case with the commands below and record pass or fail per case.

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

5. Edit only `solution_file`.

### Output
`solution_file` and `window_design`.

### Quality Gate
- The left pointer only increases (check that no line assigns l a smaller value).
- Every case with an `.out` file shows an empty diff in the run log.

---

## Worked Example

Illustrative. Longest subarray with sum at most k, a_i >= 1, `stack` = python.

- Phase 1: row "sum <= k with all a_i >= 0": usable.
- Phase 2: longest-window template; add `s += a[r]`; remove `s -= a[l]; l += 1`; update `best = max(best, r - l + 1)` after the while loop.
- Phase 3:

```
$ for f in sample1 edge_n1_too_big edge_shrink_empty edge_max_values; do python sol.py < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_n1_too_big ok
edge_shrink_empty ok
edge_max_values ok
```

`edge_n1_too_big` (a=[6], k=5, expected 0) confirms the window can be empty (l = r + 1 gives length 0).

---

## Exit Criteria

DONE when validity monotonicity is confirmed, the template matches the objective, `solution_file` starts with the `INVARIANT:` block, and every case with an expected output passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shrinking can break validity (negative values) | **Return**: to `algo-pattern-select` with the counter-signal noted; use prefix sums with a monotonic deque. |
| Phase 2 | "Exactly k" objective | **Adjust**: implement atMost(k) once and return atMost(k) - atMost(k - 1). |
| Phase 3 | Distinct count too high on a case | **Adjust**: add key deletion when the count reaches 0, rerun all cases. |
| Phase 3 | Time limit on max-size case in Python | **Adjust**: replace dict counters with a list when values are small integers; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
