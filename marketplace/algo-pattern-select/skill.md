# Algorithm Pattern Selection by Decision Table

**One-line description:** Maps the signals in a problem specification to exactly one algorithmic technique through an explicit decision table, rejects techniques whose complexity exceeds the derived target, and checks the counter-signals that break each candidate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.

---

## Outputs

- `technique` (string): Exactly one of `two_pointers`, `sliding_window`, `binary_search_answer`, `bfs_dfs`, `dijkstra`, `union_find`, `dp`, `greedy`, `heap`, `trie`, `segment_tree`, or `none`.
- `technique_rationale` (object): Matched signals with the statement text that shows each, counter-signals checked, rejected candidates with the reason, the reduction from the problem to the technique, and the expected complexity.

---

## Phase 1: Collect Signals

### Entry Criteria
- `problem_spec` has a restatement and constraint table; `complexity_target` has a target class.

### Actions
1. Read the restatement and mark every row of this table whose signal is present. Quote the statement text that shows it.

| Signal in the statement | Candidate `technique` |
|---|---|
| Array is sorted, or sorting does not lose needed information; pair or triple with a target sum or difference; merge two sorted sequences; in-place partition or deduplication | `two_pointers` |
| Contiguous subarray or substring; objective "longest", "shortest" or "count" under a constraint that stays true when the window shrinks (all values non-negative, "at most k distinct") | `sliding_window` |
| "Minimize the maximum", "maximize the minimum", "smallest x such that", "k-th smallest" over a large value range; a direct check "is x achievable" is easier than computing the optimum | `binary_search_answer` |
| Unweighted graph or grid; fewest steps; connected components; reachability; topological order; cycle detection; bipartiteness | `bfs_dfs` |
| Weighted graph with every weight >= 0; shortest distance or cheapest path | `dijkstra` |
| Elements are merged into groups over time and never split; "are x and y connected" after unions; minimum spanning tree; undirected cycle detection | `union_find` |
| Count the ways, or minimize or maximize over sequences of choices, where the same subproblem recurs; n <= 20 with subsets suggests bitmask states | `dp` |
| A locally best choice (earliest finishing time, smallest ratio, largest value) may be globally optimal; sorting by one key then a single pass | `greedy` |
| Repeated "take the current minimum or maximum" while inserting; k largest; merging k sorted lists; scheduling by priority | `heap` |
| Many strings with prefix queries; maximum XOR of a pair; dictionary of words with incremental matching | `trie` |
| Interleaved range queries (sum, min, max, gcd) and point or range updates | `segment_tree` |

2. Check the counter-signal for every marked row. A present counter-signal removes the candidate.

| Candidate | Counter-signal that removes it |
|---|---|
| `two_pointers` | Answer needs original indices and sorting is required without keeping (value, index) pairs; no monotone move rule exists |
| `sliding_window` | Values can be negative for a sum constraint (validity is not monotone; use prefix sums with a monotonic deque or a sorted structure instead) |
| `binary_search_answer` | Feasibility is not monotone in x (check on small x with the brute force) |
| `bfs_dfs` | Edges have different weights (use `dijkstra`), unless the weights are only 0 and 1 (0-1 BFS stays in `bfs_dfs`) |
| `dijkstra` | Any edge weight is negative (needs Bellman-Ford, outside this table) |
| `union_find` | Edges are deleted online (needs offline reverse processing or rollback; note it) |
| `dp` | State count times transition cost exceeds the budget even after the reductions in `algo-dp-states-transitions` |
| `greedy` | The brute force finds an input where the greedy rule loses |
| `heap` | Arbitrary-element deletion or ordered iteration is needed (use a balanced tree or sorted container) |
| `trie` | Total characters times alphabet size exceeds the memory budget with array children |
| `segment_tree` | No updates (prefix sums or a sparse table suffice), or the operation is not associative |

### Output
List of surviving candidates with quoted evidence.

### Quality Gate
- Every surviving candidate has a quoted statement fragment for its signal.
- Every surviving candidate has its counter-signal row checked and written as "absent" with a reason.

---

## Phase 2: Filter by Complexity Target

### Entry Criteria
- At least one surviving candidate. If none, go to Error Handling.

### Actions
1. Write the expected complexity of each surviving candidate for this problem with the real symbols: two pointers O(n log n) with sort or O(n); sliding window O(n); binary search on answer O(log(range) * cost of check); BFS/DFS O(V + E); Dijkstra O((V + E) log V) with a binary heap; union-find O(m * alpha(n)) plus sorting; DP O(states * transition cost); greedy usually O(n log n) for the sort; heap O(n log n) or O(n log k); trie O(total length); segment tree O((n + q) log n).
2. Evaluate each with the maxima from the constraint table and compare against the operation budget in `complexity_target`. Remove any candidate whose value exceeds the budget.
3. If two or more remain, pick by this order: the one whose correctness argument is shortest (two pointers, sliding window, BFS, Dijkstra, union-find), then the one with lower complexity, then the one with fewer special cases. Write which rule decided.

### Output
One chosen `technique` with its evaluated complexity.

### Quality Gate
- The chosen technique's complexity is written as a number evaluated at the maxima and is at most the budget.
- The tiebreak rule used is named, or "single candidate" is written.

---

## Phase 3: Write the Reduction

### Entry Criteria
- One technique chosen.

### Actions
1. Write the reduction in technique terms: for a graph technique name the nodes, edges and weights; for DP name the state; for binary search name x, its range and the feasibility check; for a window name what enters, what leaves and the validity condition; for a heap name the key; for a segment tree name the stored value and the operation; for a trie name the alphabet and what a node counts.
2. Work sample 1 by hand through the reduction and confirm it yields `sample1.out`.
3. Emit `technique` and `technique_rationale`.

### Output
`technique`, `technique_rationale`.

### Quality Gate
- `technique` is one of the twelve allowed strings exactly.
- `technique_rationale` contains a hand trace of sample 1 whose final value equals `sample1.out`.

---

## Worked Example

Illustrative. Longest subarray with sum at most k, all a_i >= 1, target O(n log n).

- Phase 1: marked `sliding_window` ("contiguous subarray", "longest", a_i >= 1 quoted) and `binary_search_answer` ("longest length L such that some window of length L has sum <= k"). Counter-signals: values are non-negative, so the window is valid; feasibility in L is monotone because a_i >= 1.
- Phase 2: window O(n) = 2*10^5; binary search O(n log n) = 3.5*10^6. Both fit. Tiebreak: shorter correctness argument and lower complexity, choose `sliding_window`.
- Phase 3: reduction: right pointer adds a[r]; while sum > k remove a[l]; answer = max(r - l + 1). Hand trace of sample 1 (a = 2 1 3 2, k = 4) gives 2, equal to `sample1.out`.

---

## Exit Criteria

DONE when exactly one `technique` is chosen with quoted signals, checked counter-signals, a complexity under budget, and a hand trace of sample 1 recorded in `technique_rationale`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No signal matches | **Return**: emit `technique` = `none` with the signals observed; the problem needs a technique outside this table (for example math, string hashing, flows). |
| Phase 1 | Counter-signal cannot be checked by reading | **Adjust**: run the brute force on small inputs to check monotonicity or the greedy rule, then decide. |
| Phase 2 | Every candidate exceeds budget | **Return**: to `algo-problem-restatement` to recheck the budget and the sum-of-n bound. |
| Phase 3 | Hand trace disagrees with the sample | **Retry**: drop this technique and pick the next surviving candidate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
