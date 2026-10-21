# Segment Tree and Fenwick Tree for Range Queries

**One-line description:** Chooses between a Fenwick tree, an iterative bottom-up segment tree and a recursive lazy-propagation segment tree from the query and update types, then implements it with a stated monoid (associative operation plus identity), consistent half-open ranges, correct lazy tag composition, and a naive-array cross-check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `segment_tree`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `segtree_design` (object): Structure chosen, monoid (operation, identity), tag type and composition rule if lazy, range convention, array sizes, complexity, and case run results.

---

## Phase 1: Choose the Structure

### Entry Criteria
- `technique_rationale` names `segment_tree`.

### Actions
1. Choose by the operations the problem needs:

| Updates | Queries | Operation invertible (sum, xor) | Structure |
|---|---|---|---|
| none | range | any | prefix sums (invertible) or sparse table (idempotent: min, max, gcd); stop and note it |
| point | prefix or range | yes | Fenwick tree (binary indexed tree), size n + 1, 1-based |
| range add | point | yes | Fenwick tree on the difference array |
| point | range | no (min, max, gcd, matrix product) | iterative segment tree, size 2n |
| range (add, assign, chmin) | range | any | recursive segment tree with lazy propagation, size 4n |

2. Write the monoid: operation op and identity e with op(e, x) = op(x, e) = x. Identities: sum 0, product 1, min +INF, max -INF, gcd 0, xor 0. Confirm op is associative. If op is not commutative (matrix product, "first element", string concatenation), note it: combination order must be left then right everywhere.
3. Fix one range convention for the whole file: half-open [l, r). Convert 1-based inclusive input [L, R] once at read time to [L - 1, R).

### Output
Structure, monoid, range convention.

### Quality Gate
- The identity satisfies op(e, x) = x for three sample values (write them).
- Exactly one range convention is written, with the conversion line from the input format.

---

## Phase 2: Lazy Tags (only for range updates)

### Entry Criteria
- Structure is the lazy segment tree; otherwise skip to Phase 3 and write "no lazy" in `segtree_design`.

### Actions
1. Define the tag type and three functions: apply(tag, node value, segment length), compose(new tag, old tag), and the identity tag.

| Update | Query | apply | compose (new after old) |
|---|---|---|---|
| range add v | range sum | value += v * length | add_old + add_new |
| range add v | range min or max | value += v | add_old + add_new |
| range assign v | range sum | value = v * length | the new assign replaces the old |
| range assign then add mixed | range sum | tag = (assign or none, add) | new assign clears old add; new add adds to the add part |

2. push(node) applies the node's tag to both children and resets it to the identity tag. Call push before descending into children in both update and query.
3. Sum values with lengths up to n and values up to the maxima need the width from `problem_spec`; compute max |sum| = n * max |value| after all updates.

### Output
Tag definition, apply, compose, push rule.

### Quality Gate
- compose is tested by hand on two consecutive updates of one segment and gives the same value as applying them one after another to a naive array.

---

## Phase 3: Implement, Cross-Check, Run

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Implement:
   - Fenwick: `add(i, v)`: while i <= n: t[i] += v; i += i & -i. `prefix(i)`: while i > 0: s += t[i]; i -= i & -i. Range sum [l, r] = prefix(r) - prefix(l - 1).
   - Iterative segment tree (size 2n, leaves at n..2n-1): query [l, r) with l += n, r += n and two accumulators resl (from the left) and resr (from the right) so non-commutative ops stay in order: while l < r: if l & 1: resl = op(resl, t[l]); l += 1. If r & 1: r -= 1; resr = op(t[r], resr). Then l >>= 1; r >>= 1. Return op(resl, resr).
   - Lazy tree: recursive on (node, node_l, node_r) with arrays of size 4n.
2. Write `solution_file` with an `INVARIANT:` block: "t[node] = op over its segment with every pending tag on its ancestors not yet applied below it".
3. Cross-check: write a debug mode (environment variable or flag) that keeps a naive array, applies every update and query naively, and asserts equality after each operation on small random inputs.
4. Python performance: a recursive lazy segment tree in CPython is often too slow for 2*10^5 operations; prefer Fenwick or the iterative tree, and time the maximum case with `algo-py-complexity-doubling`.
5. Run samples and edge cases (n = 1, single position, full range, both ends, repeated updates):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

### Output
`solution_file` and `segtree_design`.

### Quality Gate
- The naive cross-check mode runs on random small inputs with zero assertion failures (record the count run).
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. n, q <= 2*10^5; operations "add v to [l, r]" and "sum of [l, r]", 1-based inclusive, |v| <= 10^9. `stack` = cpp.

- Phase 1: range add plus range sum: lazy tree, or two Fenwick trees. Lazy tree chosen. Monoid (+, 0). Convention [l-1, r).
- Phase 2: tag = pending add; apply value += v * len; compose add. If only the initial values were bounded, 2*10^5 adds of 10^9 could grow one element to 2*10^14 and a full-range sum to 4*10^19, above the `long long` maximum of about 9.2*10^18. Here the statement bounds |a_i| <= 10^9 at all times, so max |sum| = 2*10^5 * 10^9 = 2*10^14 and `long long` suffices.
- Phase 3:

```
$ g++ -std=c++17 -O2 -Wall -Wextra -DCHECK sol.cpp -o sol_check && ./gen 1 | ./sol_check > /dev/null && echo cross-check ok
cross-check ok
$ g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol
$ for f in sample1 edge_n1 edge_full_range edge_both_ends; do ./sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_n1 ok
edge_full_range ok
edge_both_ends ok
```

---

## Exit Criteria

DONE when the structure matches the update and query types, the monoid and tags are written and hand-checked, the naive cross-check passes, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No updates at all | **Return**: to `algo-pattern-select`; prefix sums or a sparse table are simpler. |
| Phase 1 | Operation not associative | **Return**: to `algo-pattern-select`; a segment tree cannot combine it. |
| Phase 2 | compose hand check disagrees with sequential application | **Adjust**: swap the composition order (new after old) and recheck. |
| Phase 3 | Index out of range on n not a power of two | **Adjust**: size the recursive tree 4n, or use the iterative 2n form, which works for any n. |
| Phase 3 | Python too slow on the maximum case | **Adjust**: switch to Fenwick or the iterative tree. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
