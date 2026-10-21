# Algorithm Correctness Proof Sketch

**One-line description:** Writes a short correctness argument for an implemented solution (invariant with initialization, maintenance and termination, plus the technique-specific proof obligation), ties every claim to a line of the code, and turns each unproven step into a named proof gap with a targeted test input.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `technique` (string, required): Output of `algo-pattern-select`.
- `solution_file` (string, required): The implemented solution, which starts with an `INVARIANT:` comment block written by the technique flow.

---

## Outputs

- `proof_sketch` (object): Invariant, initialization, maintenance, termination, the technique obligation discharged, and the code line each claim refers to.
- `proof_gaps` (object[]): Every claim that could not be justified, with the code line, the reason, and a concrete input file that targets it. Empty when none.

---

## Phase 1: Extract the Claims

### Entry Criteria
- `solution_file` exists and its first comment block starts with `INVARIANT:`. If not, **Return** (see Error Handling).

### Actions
1. Copy the `INVARIANT:` block verbatim into `proof_sketch`.
2. Find the main loop or recursion in `solution_file` and record its line numbers (`grep -n "while\|for" sol.py`, or open the file and count).
3. Split the argument into the three parts of a loop invariant proof (Cormen, Leiserson, Rivest and Stein, *Introduction to Algorithms*, section 2.1): initialization (true before the first iteration), maintenance (if true before an iteration, true after it), termination (when the loop ends, the invariant implies the answer is correct).
4. Add a fourth part: the loop terminates. Name the quantity that strictly decreases or increases each iteration and its bound.

### Output
Four empty claim slots with the code lines they refer to.

### Quality Gate
- Each of the four parts names at least one line number in `solution_file`.

---

## Phase 2: Discharge the Technique Obligation

### Entry Criteria
- Claim slots exist.

### Actions
1. Fill the obligation for `technique` from this table. Write it with the problem's symbols, not generic words.

| `technique` | Obligation to show |
|---|---|
| `two_pointers` | each pointer move discards only candidates that cannot be (better than) the answer |
| `sliding_window` | validity is monotone under shrinking, so the window at r starts at the smallest valid l |
| `binary_search_answer` | feasible is monotone; feasible(lo) false and feasible(hi) true hold at every loop test |
| `bfs_dfs` | BFS dequeues nodes in nondecreasing distance; each node gets its distance when first discovered |
| `dijkstra` | with non-negative weights, the popped node with the smallest tentative distance cannot be improved later |
| `union_find` | same root if and only if connected; union merges exactly the two classes |
| `dp` | the state captures everything future choices depend on; transitions cover every choice exactly once; evaluation order respects dependencies; base cases are correct |
| `greedy` | the exchange argument: some optimal solution agrees with each greedy choice |
| `heap` | the heap contains exactly the stated candidate set after each step; the top is its extreme |
| `trie` | node paths equal prefixes; counts equal the number of inserted words through each node |
| `segment_tree` | each node stores op over its segment; tags compose correctly; push happens before descending |

2. For each obligation step, write one or two sentences and the line numbers where the code enforces it.
3. Fill initialization, maintenance, termination and the termination measure from Phase 1.

### Output
Filled `proof_sketch`.

### Quality Gate
- Every row element of the obligation for this `technique` has a sentence and a line number.
- The termination measure is a named integer quantity with a bound, for example "r increases by 1 each iteration, at most n iterations".

---

## Phase 3: Record Gaps as Tests

### Entry Criteria
- `proof_sketch` filled.

### Actions
1. Any sentence that relies on "obviously", "clearly" or an untested assumption (ties, empty input, equal keys, overflow, unreachable states) becomes a gap. Do not delete a gap to make the sketch look complete.
2. For each gap write a concrete input that would break the code if the assumption is false, save it as `gap_<k>.in`, and compute its expected output with the brute force: `python brute.py < gap_<k>.in > gap_<k>.out` (or the C++ or Java reference).
3. Run the solution on every gap file with the same diff commands the technique flow used. A failing gap file means a real bug: record it and **Return** to the technique flow.
4. Emit `proof_sketch` and `proof_gaps`. A gap whose test passes stays listed with status "tested, not proven".

### Output
`proof_sketch`, `proof_gaps`.

### Quality Gate
- Every entry in `proof_gaps` has a `gap_<k>.in` file and a recorded run result.
- The words "obviously" and "clearly" do not appear in `proof_sketch` (search the text).

---

## Worked Example

Illustrative. `technique` = `sliding_window`, longest subarray with sum at most k, a_i >= 1, `solution_file` = sol.py.

- Phase 1: invariant (line 3): "after the while loop at line 14, a[l..r] is the longest valid window ending at r". Main loop lines 10 to 16.
- Phase 2: monotone validity: a_i >= 1 (constraint) so removing a[l] lowers the sum; therefore, if a[l..r] is invalid, a[l'..r] with l' < l is also invalid, and the smallest valid l for r is at least the smallest valid l for r - 1 (line 13 never decreases l). Termination: r increases each iteration; l increases at most n times overall; at most 2n steps.
- Phase 3: gap 1: "the window can become empty when a[r] > k" was assumed. `gap_1.in` = "1 5\n6\n", brute output 0, solution output 0: status tested, not proven. No failures.

---

## Exit Criteria

DONE when the four invariant parts and the technique obligation are written with line references, and every unjustified claim is a gap with a test file and a run result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `INVARIANT:` block in `solution_file` | **Return**: to the technique flow to add it; do not invent an invariant from the code. |
| Phase 2 | Obligation cannot be argued (for example a greedy step without an exchange) | **Adjust**: record it as a gap with a targeted input; do not mark the sketch complete. |
| Phase 3 | A gap input fails | **Return**: to the technique flow with the failing file; the proof found a bug. |
| Phase 3 | Brute force too slow for a gap input | **Adjust**: shrink the gap input to a size within `max_brute_n`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
