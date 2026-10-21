# Algorithm Edge Case Enumeration

**One-line description:** Enumerates the boundary and degenerate inputs for a problem from its constraint table and chosen technique, writes each as a concrete input file with its expected output computed by hand or by the brute force, before any optimized code exists.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with constraint table and output contract.
- `technique` (string, required): Output of `algo-pattern-select`.

---

## Outputs

- `edge_cases` (object[]): One entry per case: name, category, input file path (`edge_<name>.in`), expected output file path (`edge_<name>.out`) or "brute" when the brute force supplies it, and the bug class it targets.

---

## Phase 1: Universal Boundary Cases

### Entry Criteria
- `problem_spec` contains the constraint table.

### Actions
1. For every row of the constraint table, create the cases in this table that apply. Use the exact minimum and maximum from the table, not round numbers.

| Category | Case | Bug class it catches |
|---|---|---|
| size | n = minimum (often 0 or 1) | empty loops, index -1, uninitialized answer |
| size | n = minimum + 1 | off-by-one in pair loops |
| size | n = maximum | time limit, recursion depth, memory |
| values | all values = minimum | zero or negative handling |
| values | all values = maximum | integer overflow in sums and products |
| values | all values equal | ties in sorting and comparisons |
| order | strictly increasing; strictly decreasing | pointer moves that assume one direction |
| order | alternating high and low | monotonic stack and deque logic |
| answer | no valid answer exists (the statement's "-1" or "NO" case) | missing sentinel output |
| answer | answer is the whole input; answer is a single element | boundary of window or range |
| parameter | k = minimum, k = maximum, k larger than n when allowed | guard clauses |
| multi-test | two tests where the first leaves large state and the second is tiny | state not reset between tests |
| format | strings of length 1; all one character | trie and window corner cases |

2. Compute the overflow case explicitly: build the input whose intermediate value is largest (from the width table in `problem_spec`) and write the expected output with the full number.

### Output
Universal case list.

### Quality Gate
- Each constraint row produced at least a minimum case and a maximum case, or a written reason why not.
- The overflow case's expected output is written with every digit.

---

## Phase 2: Technique-Specific Cases

### Entry Criteria
- `technique` is not `none`.

### Actions
1. Add every row for the chosen `technique`:

| `technique` | Cases |
|---|---|
| `two_pointers` | duplicates of the target pair (3-sum skipping); pair uses the same index twice; target unreachable |
| `sliding_window` | window must shrink to empty; single element alone violates the constraint; constraint met exactly at equality |
| `binary_search_answer` | answer = lowest value in range; answer = highest value in range; check true for every x; check false for every x |
| `bfs_dfs` | disconnected graph; single node; self-loop; parallel edges; path graph of maximum length (recursion depth); star graph (high degree); start equals target; grid of 1 x n and n x 1 |
| `dijkstra` | zero-weight edges; unreachable target; multiple equal shortest paths; maximum weight on a longest path (distance overflow) |
| `union_find` | union of already connected pair; all unions into one set; no unions; chain unions in worst order |
| `dp` | base case only (n at minimum); capacity 0; all items unusable; answer requires using every item |
| `greedy` | ties in the sort key; an input where a naive alternate greedy key fails |
| `heap` | k = 1; k = n; equal priorities with different payloads |
| `trie` | one word a prefix of another; identical words inserted twice; empty query prefix if allowed |
| `segment_tree` | n = 1; query of a single position; query of the full range; updates at both ends; repeated update of one position |

2. For graph problems, write the indexing convention (0-based or 1-based) at the top of every edge-case file comment in `edge_cases`, because a wrong convention is the most common graph input bug.

### Output
Technique case list.

### Quality Gate
- Every row of the chosen technique appears in `edge_cases` or has a written "not applicable" reason.

---

## Phase 3: Materialize the Files

### Entry Criteria
- Case lists from Phases 1 and 2.

### Actions
1. Write each case to `edge_<name>.in` in the exact input format, including the test count line for multi-test problems.
2. For small cases, compute the expected output with the reference: `python brute.py < edge_<name>.in > edge_<name>.out` (or the C++ or Java reference). For cases larger than `max_brute_n`, compute the expected output by hand from a closed form and write the derivation in the entry; if no closed form exists, mark the expected output "time-only" (the case checks run time and crashes, not the value).
3. Validate every input file against the constraints with a small validator (or by inspection for tiny files): sizes, value ranges, graph indices in range, string alphabet.
4. Do not include any input that violates the constraints; an out-of-range case tests nothing the judge will send.

### Output
`edge_cases`.

### Quality Gate
- `ls edge_*.in | wc -l` equals the number of entries in `edge_cases`.
- Every entry has an `.out` file, a written derivation, or the "time-only" mark.
- The validator (or inspection note) reports zero out-of-range values.

---

## Worked Example

Illustrative. Longest subarray with sum at most k, `technique` = `sliding_window`.

- Phase 1: `edge_n1_fits` (n=1, a=[5], k=5, expected 1); `edge_n1_too_big` (n=1, a=[6], k=5, expected 0); `edge_max_values` (n=200000, all a_i=10^9, k=10^15, expected 200000 since 2*10^14 <= 10^15; checks 64-bit sum); `edge_all_equal` (n=6, a_i=3, k=7, expected 2).
- Phase 2: `edge_shrink_empty` (a=[9 1 9], k=1, expected 1); `edge_exact_equality` (a=[2 2 2], k=4, expected 2).
- Phase 3: `python brute.py < edge_all_equal.in` prints 2, saved as `edge_all_equal.out`; `edge_max_values` is above `max_brute_n`, so its expected output 200000 is derived by hand (whole array sum 2*10^14 <= k).

---

## Exit Criteria

DONE when every universal and technique-specific case is a constraint-valid input file with an expected output, a derivation, or a "time-only" mark, all listed in `edge_cases`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Constraint table missing a bound | **Return**: to `algo-problem-restatement` to complete the table. |
| Phase 2 | `technique` is `none` | **Adjust**: produce Phase 1 cases only and record that technique cases are missing. |
| Phase 3 | Brute force disagrees with a hand-derived expected value | **Stop**: one of them is wrong; recheck the derivation against the statement before writing either file. |
| Phase 3 | Case violates constraints | **Adjust**: delete that case file and fix the generator values. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
