# BFS and DFS Graph Traversal

**One-line description:** Implements breadth-first and depth-first traversal for unweighted graphs and grids (shortest steps, multi-source BFS, 0-1 BFS, components, Kahn topological sort, three-color cycle detection, bipartite check) with adjacency lists, visit-on-push marking, and iterative DFS that cannot overflow the call stack.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `bfs_dfs`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `traversal_design` (object): Graph model (nodes, edges, directed or not, indexing), chosen traversal variant, data structures, visit rule, complexity, and case run results.

---

## Phase 1: Model the Graph

### Entry Criteria
- `technique_rationale` names `bfs_dfs`.

### Actions
1. Write nodes, edges, direction and indexing (0-based or 1-based as the input gives it). For grids: node = (row, col), encoded as row * W + col; edges = the 4 (or 8, if the statement says so) neighbors inside bounds that are not walls.
2. Storage: adjacency list. Never an n x n matrix when n * n * element size exceeds the memory budget in `complexity_target`. Python `adj = [[] for _ in range(n)]`; C++ `vector<vector<int>> adj(n)`; Java `List<Integer>[]` or, faster, CSR arrays (head, next, to).
3. Undirected input: add both directions. Directed: add one.
4. Choose the variant:

| Question | Variant | Key detail |
|---|---|---|
| fewest edges from s to every node | BFS from s | dist array initialized to -1 |
| fewest edges from the nearest of several sources | multi-source BFS | push all sources with dist 0 before the loop |
| weights only 0 and 1 | 0-1 BFS with a deque | weight 0: appendleft / push_front; weight 1: append / push_back; relax by comparing dist |
| connected components | BFS or iterative DFS from every unvisited node | component id array |
| topological order of a DAG | Kahn's algorithm | queue of indegree-0 nodes; if output length < n, there is a cycle |
| directed cycle detection | three-color DFS (0 white, 1 gray, 2 black) | edge to a gray node = cycle |
| bipartite | BFS coloring | edge between same colors = not bipartite; run from every uncolored node |
| state-space puzzle (node = state) | BFS over encoded states | state count must fit the budget |

### Output
Graph model and variant.

### Quality Gate
- The model states direction and indexing explicitly.
- The edge count after building equals m (undirected: 2m list entries); print it on sample 1.

---

## Phase 2: Traversal Rules

### Entry Criteria
- Model and variant fixed.

### Actions
1. BFS visit rule: set dist (or visited) when a node is pushed, not when it is popped. Marking on pop lets a node enter the queue many times.
2. Queue type: Python `collections.deque` with `popleft()` (never `list.pop(0)`); C++ `std::queue<int>` or `std::deque<int>`; Java `ArrayDeque<Integer>` (or an int array queue).
3. DFS: write it iteratively with an explicit stack when the maximum depth can reach n and n exceeds the recursion depth the runtime allows. CPython's default recursion limit is 1000 (`sys.getrecursionlimit()`); C++ and Java depend on the thread stack size. For post-order work (three-color, subtree sizes) push (node, iterator index) pairs, or push the node twice with an "exit" flag.
4. Multi-test: reallocate or reset dist, visited, adjacency for every test, sized to that test's n only (resetting a max-size array every test breaks the sum-of-n bound).
5. Complexity: O(V + E) per full traversal; evaluate at the maxima.

### Output
Traversal code plan with visit rule and container choices.

### Quality Gate
- The code sets visited or dist inside the neighbor loop before the push (inspect the line).
- No recursive function is used when maximum depth exceeds the runtime limit, unless `algo-py-runtime-pitfalls` or `algo-java-runtime-pitfalls` raised the limit with a recorded stack size.

---

## Phase 3: Implement and Run

### Entry Criteria
- Rules fixed.

### Actions
1. Write `solution_file` with an `INVARIANT:` block. BFS: "nodes leave the queue in nondecreasing dist order; dist[v] is final when v is pushed". Kahn: "a node is output only after all its predecessors". Three-color: "gray nodes are exactly the current DFS path".
2. Run all samples and edge cases (disconnected, single node, self-loop, parallel edges, path of maximum length, start equals target):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

3. Run the maximum-length path case even if it is "time-only": it must finish without a stack overflow or `RecursionError`.

### Output
`solution_file` and `traversal_design`.

### Quality Gate
- The path-graph case of maximum n exits with code 0 (`echo $?` prints 0).
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. Grid H x W <= 1000 x 1000 with walls; fewest moves from S to E or -1. `stack` = python.

- Phase 1: node = r * W + c, 4 neighbors, BFS from S. 10^6 nodes, about 4*10^6 edge checks, within budget.
- Phase 2: `dist = [-1] * (H * W)`; set `dist[v] = dist[u] + 1` before `q.append(v)`; `deque.popleft()`.
- Phase 3:

```
$ for f in sample1 edge_unreachable edge_start_is_end edge_1xn; do python sol.py < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_unreachable ok
edge_start_is_end ok
edge_1xn ok
$ python sol.py < edge_max_open.in > /dev/null; echo $?
0
```

---

## Exit Criteria

DONE when the graph model states direction and indexing, BFS marks on push, DFS is iterative where depth requires it, and all cases pass including the maximum-depth case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Edges carry weights other than 0 and 1 | **Return**: to `algo-pattern-select`; use `dijkstra`. |
| Phase 1 | Adjacency matrix exceeds memory | **Adjust**: switch to adjacency list or CSR arrays. |
| Phase 2 | Queue grows far beyond V | **Adjust**: move the visited mark to push time. |
| Phase 3 | `RecursionError` or segmentation fault on path graph | **Adjust**: convert DFS to an explicit stack, rerun all cases. |
| Phase 3 | Answers off by one node index | **Adjust**: subtract 1 from 1-based input at read time only, once. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
