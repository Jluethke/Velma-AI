# Union-Find (Disjoint Set Union)

**One-line description:** Implements a disjoint set union with path compression and union by size, applied to connectivity queries, Kruskal minimum spanning tree, undirected cycle detection, weighted (potential) constraints, and offline deletion by reverse processing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `union_find`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `dsu_design` (object): Application variant, element mapping, find and union implementation, extra per-set data, complexity, and case run results.

---

## Phase 1: Choose the Application

### Entry Criteria
- `technique_rationale` names `union_find`.

### Actions
1. Choose the variant:

| Problem | Variant | Core loop |
|---|---|---|
| "are x and y connected" after a sequence of unions | plain DSU | union on each edge, find(x) == find(y) on each query |
| minimum spanning tree | Kruskal | sort edges by weight; for each, if find(u) != find(v): union, add weight; stop after V - 1 unions |
| cycle in an undirected graph | plain DSU | an edge whose endpoints already share a root closes a cycle |
| number of components | plain DSU with a counter | counter starts at n, decreases on each successful union |
| relations with offsets ("x is d more than y", parity, "same or different") | weighted DSU | store pot[x] = value(x) - value(parent(x)); combine along the path in find |
| edges removed over time, queries in between | offline reverse | read all operations; start from the final graph; process in reverse, turning removals into unions |
| undo needed (divide and conquer over time) | DSU with rollback | union by size, no path compression, keep a stack of changes |

2. Map elements to 0..n-1. For non-integer or sparse keys, build a dict or coordinate compression first.

### Output
Variant and element mapping.

### Quality Gate
- The variant row is named, and the mapping covers every element that appears in the input (count them on sample 1).

---

## Phase 2: Implement Find and Union Correctly

### Entry Criteria
- Variant chosen.

### Actions
1. Arrays: `parent[i] = i`, `size[i] = 1`.
2. find with path compression. Write it iteratively in Python to avoid the default recursion limit of 1000:

```
def find(x):
    root = x
    while parent[root] != root: root = parent[root]
    while parent[x] != root: parent[x], x = root, parent[x]
    return root
```

C++ and Java may use the recursive one-liner `return parent[x] == x ? x : parent[x] = find(parent[x]);` because union by size keeps depth at O(log n) before compression.
3. union by size: `a = find(a); b = find(b); if a == b: return False; if size[a] < size[b]: swap; parent[b] = a; size[a] += size[b]; return True`.
4. Do not compare `parent[a] == parent[b]` to test connectivity; always compare `find(a) == find(b)`. Do not write `parent[a] = b` without finding roots first.
5. With both optimizations, m operations take O(m * alpha(n)) time, where alpha is the inverse Ackermann function (Tarjan, 1975). Rollback DSU must skip path compression and costs O(log n) per find.
6. Weighted DSU: in find, accumulate pot along the path before compressing; in union of x and y with value(x) - value(y) = d, set pot[ry] = pot[x] - pot[y] - d for root ry attached under rx (derive and write the formula for your sign convention, then test it on sample 1).

### Output
Find and union code plan.

### Quality Gate
- The find function contains no recursion in Python (inspect).
- Union returns whether a merge happened, and the component counter or MST edge count uses that return value.

---

## Phase 3: Implement and Run

### Entry Criteria
- Phase 2 complete.

### Actions
1. Write `solution_file` with an `INVARIANT:` block: "two elements have the same root if and only if they are connected by the unions processed so far; size[root] is the set size".
2. For Kruskal: sort edges by weight with a key, not by the whole tuple when ties do not matter; MST weight uses the width from `problem_spec`. If unions < V - 1 at the end, the graph is disconnected; print the statement's sentinel.
3. Run samples and edge cases (union of an already connected pair, all into one set, no unions, chain unions):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

### Output
`solution_file` and `dsu_design`.

### Quality Gate
- The chain-union maximum-size case finishes with exit code 0.
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. n <= 2*10^5 nodes, m <= 2*10^5 weighted edges; print MST weight or -1. `stack` = python.

- Phase 1: Kruskal row. Nodes 1-based, mapped by subtracting 1.
- Phase 2: iterative find, union by size returns True on merge. Complexity: sort 2*10^5 * 17.6 = 3.5*10^6 plus near-linear DSU.
- Phase 3:

```
$ for f in sample1 edge_disconnected edge_all_same_weight edge_chain_max; do python sol.py < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_disconnected ok
edge_all_same_weight ok
edge_chain_max ok
```

---

## Exit Criteria

DONE when the variant is chosen, find compresses paths (iteratively in Python), union is by size on roots, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Online deletions with interleaved queries and no offline read possible | **Return**: to `algo-pattern-select`; DSU does not support online deletion. |
| Phase 2 | Weighted DSU gives wrong signs on sample 1 | **Adjust**: rederive the pot formula on paper for one union and one find; retest. |
| Phase 3 | `RecursionError` in Python | **Adjust**: replace find with the iterative version above. |
| Phase 3 | Component count wrong | **Adjust**: decrement only when union returns True. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
