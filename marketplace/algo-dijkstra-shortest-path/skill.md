# Dijkstra Shortest Path with a Binary Heap

**One-line description:** Implements Dijkstra's algorithm with a binary heap and lazy deletion for graphs with non-negative weights, including the negative-weight guard, a derived infinity that cannot overflow, path reconstruction, and the expanded-state variant for problems with extra resources such as coupons or fuel.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `dijkstra`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `dijkstra_design` (object): Graph or state-graph model, weight sign check, INF derivation, heap entry format, stale-entry rule, reconstruction method, complexity, and case run results.

---

## Phase 1: Model and Guard

### Entry Criteria
- `technique_rationale` names `dijkstra`.

### Actions
1. Write nodes, directed or undirected edges, and weight ranges from the constraint table.
2. Confirm every weight is >= 0 from the constraints. If the constraints allow a negative weight, stop (Error Handling). Add an assertion when reading edges during development (`assert w >= 0`).
3. If the problem has an extra resource (k free edges, fuel level, parity, time modulo p), expand the state: node' = (node, resource). State count = V * (resource values); transitions per state = edges plus the resource transition. Evaluate the state count against the budget.
4. Choose the implementation by density:

| Graph | Implementation | Complexity |
|---|---|---|
| sparse (E much smaller than V^2) | binary heap with lazy deletion | O((V + E) log V) |
| dense (E close to V^2) | array scan for the minimum, no heap | O(V^2) |

Evaluate both at the maxima; pick the smaller.

### Output
Model, weight check, state expansion if any, implementation choice.

### Quality Gate
- The weight lower bound quoted from the constraints is >= 0.
- Both complexities are evaluated numerically and the smaller is chosen.

---

## Phase 2: Heap Details and INF

### Entry Criteria
- Implementation chosen.

### Actions
1. Derive INF: the longest shortest path has at most V - 1 edges, so any real distance is at most (V - 1) * max_w. Choose INF larger than that and confirm INF + max_w fits the integer type (C++ `long long`, Java `long`). In Python, `float('inf')` or that integer bound both work; integers are faster to compare with integers.
2. Heap entry format and library behavior:

| stack | Heap | Entry | Note |
|---|---|---|---|
| python | `heapq` (min-heap) | `(dist, node)` tuple | `heapq.heappush(pq, (nd, v))`; `heapq.heappop(pq)` |
| cpp | `std::priority_queue` is a max-heap by default | `pair<long long,int>` | declare `priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>>` |
| java | `PriorityQueue` (min-heap) | `long[]{dist, node}` | comparator `(x, y) -> Long.compare(x[0], y[0])`, never `(int)(x[0] - y[0])` which overflows |

3. Lazy deletion: none of these heaps supports decrease-key, so push a new entry on every improvement and on pop skip stale entries: `if d > dist[u]: continue`.
4. Relax only when strictly better: `if dist[u] + w < dist[v]`. Do not mark nodes visited at push time (that is BFS, and wrong here).
5. Reconstruction: store `parent[v] = u` on each successful relax; walk parent from target back to source and reverse.

### Output
INF derivation, heap declaration, relax and skip rules.

### Quality Gate
- INF and INF + max_w are written as numbers and both fit the chosen type.
- The pop step contains the stale-entry skip (inspect the line).

---

## Phase 3: Implement and Run

### Entry Criteria
- Phase 2 complete.

### Actions
1. Write `solution_file` with an `INVARIANT:` block: "when u is popped with d == dist[u], dist[u] is the true shortest distance (all weights >= 0)".
2. Print unreachable nodes with the statement's sentinel (often -1), testing `dist[v] == INF`, never `dist[v] > some guess`.
3. Run samples and edge cases (zero-weight edges, unreachable target, equal-length paths, maximum weights on a longest path):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

4. When the contract is "any shortest path", the path differs from the expected file legitimately; verify the path length and edge validity with a checker instead of diff.

### Output
`solution_file` and `dijkstra_design`.

### Quality Gate
- The maximum-weight longest-path case prints the full 64-bit distance (compare digits with the hand derivation).
- Every case with an `.out` file passes diff, or the checker for "any path" contracts.

---

## Worked Example

Illustrative. V <= 10^5, E <= 2*10^5, 1 <= w <= 10^9, distance from node 1 to all. `stack` = cpp.

- Phase 1: weights >= 1, sparse; heap O(3*10^5 * 17) = 5.1*10^6 versus O(V^2) = 10^10. Heap chosen.
- Phase 2: max distance (10^5 - 1) * 10^9 about 10^14; INF = 4*10^18 fits `long long` (max about 9.2*10^18) and INF + 10^9 fits.
- Phase 3:

```
$ g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol
$ for f in sample1 edge_unreachable edge_zero_weight edge_max_path; do ./sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_unreachable ok
edge_zero_weight ok
edge_max_path ok
```

---

## Exit Criteria

DONE when weights are confirmed non-negative, INF is derived and overflow-safe, the heap has the right order and stale-entry skip, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Negative weights allowed | **Return**: to `algo-pattern-select`; Bellman-Ford O(VE) (negative cycle if a relax succeeds on round V) or SPFA is needed. |
| Phase 1 | Expanded state count exceeds budget | **Return**: to `algo-pattern-select` with the computed count. |
| Phase 2 | C++ results are longest paths | **Adjust**: the heap is a max-heap; add `greater<>`. |
| Phase 3 | Time limit with many stale entries | **Adjust**: confirm the skip compares `d > dist[u]`; confirm relax uses strict `<`. |
| Phase 3 | Negative or garbage distance | **Adjust**: overflow; recheck INF and the integer type. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
