# Trie for Prefixes and Binary Trie for XOR

**One-line description:** Implements a prefix tree over strings (prefix counts, word ends, deletion by counts) or a binary trie over integer bits (maximum XOR pair, count of values with XOR below a bound), with node storage chosen from the measured memory budget and preallocated flat arrays where object overhead is too high.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `trie`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `trie_design` (object): Trie kind, alphabet or bit width, node fields, node count bound, storage layout and its byte count, query procedure, complexity, and case run results.

---

## Phase 1: Kind, Alphabet, Node Bound

### Entry Criteria
- `technique_rationale` names `trie`.

### Actions
1. Choose the kind:

| Problem | Kind | Node fields |
|---|---|---|
| count words with a given prefix; autocomplete | string trie | children, pass_count, end_count |
| is a word present; delete words | string trie | children, end_count (decrement to delete) |
| maximum a XOR b over a set | binary trie, bits from high to low | children[2], count (for deletions) |
| count of b with a XOR b < K | binary trie | children[2], count (subtree size) |
| multi-pattern matching in text | Aho-Corasick (trie plus failure links) | outside this flow; note it |

2. Alphabet: read it from the constraints ("lowercase English letters" = 26). Bit width B for a binary trie = bit length of the maximum value (Python `max_val.bit_length()`; for a_i <= 10^9, B = 30).
3. Node bound: string trie nodes <= 1 + total characters inserted; binary trie nodes <= 1 + n * B.
4. Storage bytes: flat arrays children[node_bound][alphabet] of 4-byte ints = node_bound * alphabet * 4. Compare with `memory_limit_mb` from `problem_spec`.

| Bytes vs limit | Layout |
|---|---|
| fits | flat preallocated arrays (fastest in all three stacks) |
| does not fit | per-node hash map children (dict in Python, `unordered_map` or sorted small vector in C++, `HashMap` in Java), or a sorted edge list |

In Python, a dict of dicts costs far more per node than its contents; measure `sys.getsizeof` on a sample node before choosing it, and prefer a flat list of lists or one flat list indexed by node * alphabet + c.

### Output
Kind, alphabet or B, node bound, layout with byte count.

### Quality Gate
- The node bound and byte count are written as numbers and compared with the limit in bytes.

---

## Phase 2: Operations

### Entry Criteria
- Layout chosen.

### Actions
1. Insert (string): node = 0; for each char c: if child missing, allocate the next index; move; increment pass_count. After the loop increment end_count. Root's pass_count counts all words if incremented before the loop.
2. Prefix count: walk the prefix; if any child is missing return 0; else return pass_count of the last node.
3. Delete: walk the word, decrement pass_count along the path and end_count at the end. Check presence first (end_count > 0) so counts never go negative.
4. Binary trie insert: for bit from B-1 down to 0: b = (x >> bit) & 1; move to children[b], allocate if missing; increment count.
5. Maximum XOR query for x: for bit from B-1 down to 0: want = 1 - ((x >> bit) & 1); if children[want] exists with count > 0, move there and set that bit in the result; otherwise move to the other child. The set must be non-empty before querying.
6. Do not confuse "is a prefix of some word" (pass_count > 0) with "is a word" (end_count > 0).

### Output
Operation procedures.

### Quality Gate
- Each operation visits exactly L nodes (string length) or B nodes (bits), stated in the design.
- Delete checks presence before decrementing (inspect the code line).

---

## Phase 3: Implement and Run

### Entry Criteria
- Phase 2 complete.

### Actions
1. Write `solution_file` with an `INVARIANT:` block: "the path of characters from the root to node v spells a prefix; pass_count[v] = number of inserted words with that prefix".
2. Preallocate arrays to the node bound; do not grow by appending one node at a time in Java or C++ when the bound is known.
3. Run samples and edge cases (one word a prefix of another, identical words twice, single-character words):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

4. Run the maximum total-length case and check peak memory: Linux `/usr/bin/time -v python sol.py < X.in` and read "Maximum resident set size (kbytes)"; on Windows use PowerShell `(Get-Process -Id $pid).PeakWorkingSet64` from a wrapper or the judge's report.

### Output
`solution_file` and `trie_design`.

### Quality Gate
- Peak resident set size on the maximum case is below `memory_limit_mb`.
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. Maximum XOR of any pair, n <= 2*10^5, a_i < 2^30. `stack` = cpp.

- Phase 1: binary trie, B = 30, node bound 1 + 2*10^5 * 30 = 6,000,001; children 6,000,001 * 2 * 4 bytes = 48 MB, under 256 MB; flat arrays.
- Phase 2: insert each a_i after querying it against the trie built so far (skip the query for the first element).
- Phase 3:

```
$ g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol
$ for f in sample1 edge_n2 edge_all_equal edge_max_bits; do ./sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_n2 ok
edge_all_equal ok
edge_max_bits ok
$ /usr/bin/time -v ./sol < edge_max_n.in 2>&1 >/dev/null | grep "Maximum resident"
	Maximum resident set size (kbytes): 51240
```

---

## Exit Criteria

DONE when the node bound and memory are computed, operations follow Phase 2, peak memory on the maximum case is under the limit, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Flat arrays and maps both exceed memory | **Return**: to `algo-pattern-select`; consider sorting plus binary search or hashing of prefixes. |
| Phase 2 | Query on an empty set | **Adjust**: insert first, or handle the empty case with the statement's sentinel. |
| Phase 3 | Prefix count off by one | **Adjust**: check whether the root's pass_count is incremented and whether end_count is used instead of pass_count. |
| Phase 3 | Memory limit exceeded in Python | **Adjust**: switch from dict nodes to a flat list indexed by node * alphabet + c. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
