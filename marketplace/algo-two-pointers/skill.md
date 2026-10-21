# Two Pointers Technique

**One-line description:** Implements a two-pointer solution (opposite ends on sorted data, or same-direction read and write pointers) with a stated elimination invariant, the exact move rule, duplicate handling, and a run against every sample and edge case.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `two_pointers`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write, for example `sol.py`, `sol.cpp`, `Sol.java`.

---

## Outputs

- `two_pointer_design` (object): Variant, sort key, move rule table, invariant, duplicate rule, complexity, and the sample and edge-case run results.

---

## Phase 1: Pick the Variant and Move Rule

### Entry Criteria
- `technique_rationale` names `two_pointers`.

### Actions
1. Choose the variant:

| Problem shape | Variant | Pointer start |
|---|---|---|
| Pair in sorted array with sum, difference or product condition; maximize area between two ends | opposite ends | i = 0, j = n - 1, loop `while i < j` |
| k-sum (k >= 3) | fix the first k-2 elements by loops, opposite ends on the rest | inner i = outer + 1, j = n - 1 |
| Remove duplicates, partition, compact in place | same direction, read r and write w | w = 0, r scans 0..n-1 |
| Pair with difference exactly d | same direction, both increasing | i = 0, j = 0, keep j > i |
| Merge or intersect two sorted sequences | one pointer per sequence | i = 0, j = 0 |

2. If the input is not sorted and the variant needs it, sort. If the answer needs original indices, sort pairs `(value, original_index)`, never the bare values.
3. Write the move rule as a table with one row per comparison outcome. Example for pair sum target T on sorted a:

| Condition | Action | Why it is safe |
|---|---|---|
| a[i] + a[j] == T | record; move by the duplicate rule | pair found |
| a[i] + a[j] < T | i += 1 | a[i] with any index <= j sums to at most a[i] + a[j] < T, so a[i] is in no answer |
| a[i] + a[j] > T | j -= 1 | a[j] with any index >= i sums to at least a[i] + a[j] > T |

4. Write the invariant: "every pair (i', j') with i' < i or j' > j has been either recorded or proven not to be an answer". This is the line the proof flow will check.

### Output
Variant, move rule table, invariant.

### Quality Gate
- The move rule table has a row for every comparison outcome (equal, less, greater, or the problem's equivalents).
- Each row's "why it is safe" column names which pairs it eliminates.

---

## Phase 2: Duplicates and Termination

### Entry Criteria
- Move rule exists.

### Actions
1. Decide what the problem counts: distinct value pairs, or index pairs.

| Counts | Duplicate rule after a match |
|---|---|
| distinct value tuples (3-sum style) | advance i while a[i] == a[i-1]; retreat j while a[j] == a[j+1]; in the outer loop skip index o when a[o] == a[o-1] |
| index pairs, values may repeat | if a[i] == a[j], add C(j - i + 1, 2) and stop; else count run lengths cnt_i of a[i] and cnt_j of a[j], add cnt_i * cnt_j, skip both runs |

2. Confirm each loop iteration moves at least one pointer, so the loop runs at most n times. Write the bound.

### Output
Duplicate rule and termination bound.

### Quality Gate
- Every branch of the loop body changes i, j, w or r (check the code line by line).
- The duplicate rule matches the counting mode quoted from the statement.

---

## Phase 3: Implement and Run

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Write `solution_file`. The first lines are a comment block that starts with `INVARIANT:` and copies the invariant and move rule. The proof flow reads this block.
2. Use the integer width from `problem_spec` for sums (C++ `long long`, Java `long`).
3. Edit only `solution_file`. Do not touch `brute.*`, sample files or edge-case files.
4. Run every sample and every edge case with an `.out` file:

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

5. Record each case as pass or fail in `two_pointer_design`. Do not report success for a case you did not run.

### Output
`solution_file` and `two_pointer_design`.

### Quality Gate
- `head` of `solution_file` shows the `INVARIANT:` block.
- Every listed case shows an empty diff (exit 0) in the recorded run log.

---

## Worked Example

Illustrative. "Count index pairs i < j with a_i + a_j = T", n <= 2*10^5, `stack` = cpp.

- Phase 1: opposite ends after `sort(a.begin(), a.end())`; move rule as in the table above; invariant written.
- Phase 2: counts index pairs, so on a match with a[i] != a[j], count the run of a[i] (cnt_i) and of a[j] (cnt_j), add cnt_i * cnt_j as `long long`, skip both runs; if a[i] == a[j], add m*(m-1)/2 with m = j - i + 1 and break.
- Phase 3:

```
$ g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol
$ for f in sample1 edge_all_equal edge_n1_fits; do ./sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_all_equal ok
edge_n1_fits ok
```

`edge_all_equal` (n=6, all 5, T=10) gives 15 = C(6,2), the case that catches the missing equal-values branch.

---

## Exit Criteria

DONE when `solution_file` begins with the `INVARIANT:` block, implements the move rule and duplicate rule, and passes every sample and every edge case that has an expected output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A comparison outcome has no safe move | **Return**: to `algo-pattern-select`; the problem is not two-pointer monotone. |
| Phase 2 | Loop can run without moving a pointer | **Adjust**: add the missing move to that branch, then recheck the bound. |
| Phase 3 | A case fails | **Adjust**: trace that case by hand against the move rule table; change one thing in `solution_file` and rerun all cases. |
| Phase 3 | Temptation to edit an `.out` file or skip a failing case | **Stop**: expected outputs are fixed; fix the solution. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
