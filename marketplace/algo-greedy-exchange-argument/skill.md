# Greedy Algorithm with Exchange Argument

**One-line description:** Turns a candidate greedy rule into a justified algorithm by first hunting counterexamples against the brute force, then proving the rule with an exchange argument (or an adjacent-swap comparator derivation), and finally implementing the sort and single pass with a strict weak ordering comparator.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `greedy`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `greedy_design` (object): Greedy rule, candidate rules rejected with their counterexamples, exchange argument text, comparator and its derivation, complexity, and case run results.

---

## Phase 1: Hunt Counterexamples First

### Entry Criteria
- `technique_rationale` names `greedy`. A brute-force reference `brute.*` exists from `algo-brute-force-reference`.

### Actions
1. Write every plausible greedy rule (sort by start, by end, by length, by ratio, by deadline, by largest value first).
2. Check known results before testing:

| Problem | Correct rule | Known wrong rule |
|---|---|---|
| maximum number of non-overlapping intervals | earliest end time first (Kleinberg and Tardos, *Algorithm Design*, ch. 4) | earliest start, shortest length |
| minimize maximum lateness, one machine | earliest deadline first (same source) | shortest job first |
| fractional knapsack | highest value per weight first | (0/1 knapsack: ratio greedy fails, use DP) |
| optimal prefix code | Huffman: merge two smallest weights | merge largest |
| coin change, arbitrary denominations | not greedy: {1, 3, 4} with amount 6 gives 4+1+1 by greedy but 3+3 is optimal | largest coin first |
| minimize sum of completion times | shortest processing time first | longest first |

3. For each rule not settled by the table, write it as a small function and compare against the brute force on random small inputs (sizes 1 up to `max_brute_n`). Print the first input where they differ.
4. Discard every rule with a counterexample. Save each counterexample to `edge_greedy_<rule>.in` with the brute-force output as `.out`; these become regression cases.

### Output
Surviving rule and the counterexamples of rejected rules.

### Quality Gate
- Every rejected rule has a saved counterexample file.
- The surviving rule agreed with the brute force on every random input tried, and the count tried is recorded.

---

## Phase 2: Prove the Rule

### Entry Criteria
- One rule survived.

### Actions
1. Write the exchange argument with this template, filling every bracket:
   - Let G = (g1, g2, ...) be the greedy choices and O = (o1, o2, ...) an optimal solution that agrees with G on the longest possible prefix, first differing at position k.
   - Show that replacing o_k by g_k in O gives a solution O' that is still feasible because [reason].
   - Show that O' is no worse than O because [inequality].
   - O' agrees with G on a longer prefix, contradicting the choice of O. Therefore G is optimal.
2. For "order the items" problems, use the adjacent swap derivation. Take two adjacent items x then y; write the cost contribution of the pair in both orders; the condition "x before y is no worse" gives the comparator. Example: minimizing sum of w_i * C_i (weighted completion) gives x before y when t_x * w_y < t_y * w_x (Smith's rule). Compare with cross multiplication in integers, never with floating ratios, and check that the products fit the integer width.
3. Check the comparator is a strict weak ordering: irreflexive (x < x is false), transitive, and with transitive incomparability. Using `<=` in a C++ `std::sort` comparator is undefined behavior; Java's `Arrays.sort` on objects can throw "Comparison method violates its general contract!".

### Output
Exchange argument and comparator derivation.

### Quality Gate
- Every bracket in the template is filled with a problem-specific statement.
- The comparator uses strict `<` and integer cross multiplication within the width from `problem_spec`.

---

## Phase 3: Implement and Run

### Entry Criteria
- Proof written.

### Actions
1. Write `solution_file` with an `INVARIANT:` block: "after processing the first i items in sorted order, the chosen set is a prefix of some optimal solution".
2. Sorting by key:

| stack | Form |
|---|---|
| python | `items.sort(key=lambda t: t[1])`; for a pairwise comparator use `functools.cmp_to_key` |
| cpp | `std::sort(v.begin(), v.end(), [](const T& a, const T& b){ return a.end < b.end; });` |
| java | `Arrays.sort(arr, Comparator.comparingInt(a -> a[1]))`; never `(a, b) -> a[1] - b[1]` (overflow) |

3. Run samples, edge cases, and every `edge_greedy_*` counterexample file:

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

### Output
`solution_file` and `greedy_design`.

### Quality Gate
- Every `edge_greedy_*` file passes (the final rule must beat each rejected rule's counterexample).
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. Select the maximum number of non-overlapping meetings [s, e), n <= 2*10^5. `stack` = python.

- Phase 1: rules "earliest start", "shortest", "earliest end". Brute force on n <= 8: earliest start fails on [0,10),[1,2),[2,3) (greedy 1, optimal 2), saved as `edge_greedy_start.in`; shortest fails on [0,5),[4,6),[5,10) (greedy 1, optimal 2). Earliest end survives on all inputs tried.
- Phase 2: exchange: if o_k ends later than g_k, replacing o_k with g_k keeps o_{k+1} feasible because e(g_k) <= e(o_k) <= s(o_{k+1}); count unchanged.
- Phase 3:

```
$ for f in sample1 edge_greedy_start edge_greedy_short edge_ties; do python sol.py < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_greedy_start ok
edge_greedy_short ok
edge_ties ok
```

---

## Exit Criteria

DONE when every rejected rule has a counterexample, the surviving rule has a filled exchange argument, the comparator is a strict weak ordering, and all cases including the counterexamples pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Every rule has a counterexample | **Return**: to `algo-pattern-select`; the problem likely needs `dp`. |
| Phase 2 | The exchange step cannot be shown feasible | **Return**: to Phase 1 and search harder for a counterexample on that step's shape. |
| Phase 3 | C++ crash or Java contract exception during sort | **Adjust**: replace `<=` with `<`, and remove float comparisons from the comparator. |
| Phase 3 | Cross product overflows | **Adjust**: use the next wider type (`__int128` in C++, `Math.multiplyHigh` or `BigInteger` in Java). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
