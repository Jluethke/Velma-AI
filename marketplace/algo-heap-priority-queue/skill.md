# Heap and Priority Queue Patterns

**One-line description:** Implements heap-based solutions (top-k with a bounded heap, k-way merge, two-heap running median, sweep with a heap of end times, lazy deletion) with the exact min-heap or max-heap semantics of Python heapq, C++ priority_queue and Java PriorityQueue, tie-breaking that never compares payloads, and overflow-free comparators.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`.
- `complexity_target` (object, required): Output of `algo-problem-restatement`.
- `technique_rationale` (object, required): Output of `algo-pattern-select` with `technique` = `heap`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stack` (string, required): `python`, `cpp` or `java`.
- `solution_file` (string, required): Path of the solution to write.

---

## Outputs

- `heap_design` (object): Pattern, heap order and key, entry format with tie-breaker, deletion strategy, complexity, and case run results.

---

## Phase 1: Choose the Pattern

### Entry Criteria
- `technique_rationale` names `heap`.

### Actions
1. Choose:

| Problem | Pattern | Complexity |
|---|---|---|
| k largest of n | min-heap of size k: push, pop when size > k | O(n log k) |
| k smallest of n | max-heap of size k | O(n log k) |
| merge k sorted lists | min-heap of (value, list id, index) | O(N log k) |
| running median | max-heap for the lower half, min-heap for the upper half; sizes differ by at most 1 | O(log n) per insert |
| minimum rooms or machines for intervals | sort by start; min-heap of end times; pop while top <= start | O(n log n) |
| repeatedly combine two smallest (Huffman-like cost) | min-heap, pop two, push sum | O(n log n) |
| scheduling, pick best available job as time advances | sort jobs by release time; heap of available jobs keyed by priority | O(n log n) |
| delete arbitrary element later | lazy deletion: a counter of "to delete" values; discard at the top when popped | amortized O(log n) |

2. Write the key and the order (min or max) for each heap in the chosen pattern.

### Output
Pattern, keys and orders.

### Quality Gate
- Each heap in the pattern has its order and key written.
- The pattern's complexity evaluated at the maxima is under the budget.

---

## Phase 2: Library Semantics

### Entry Criteria
- Pattern chosen.

### Actions
1. Use the library exactly as documented:

| stack | Default order | Max-heap form | Peek, push, pop |
|---|---|---|---|
| python | `heapq` is a min-heap on a list | push `-x` and negate on pop (or `(-key, ...)` tuples) | `h[0]`, `heapq.heappush(h, x)`, `heapq.heappop(h)`; build in O(n) with `heapq.heapify(h)` |
| cpp | `std::priority_queue<T>` is a max-heap | default | `pq.top()`, `pq.push(x)`, `pq.pop()` (pop returns void); min-heap: `priority_queue<T, vector<T>, greater<T>>` |
| java | `java.util.PriorityQueue<E>` is a min-heap | `new PriorityQueue<>(Comparator.reverseOrder())` | `peek()`, `offer(x)`, `poll()` |

2. Tie-breaking: in Python, tuples compare element by element, so `(priority, payload)` compares payloads on equal priority and raises `TypeError` for unorderable payloads (dicts, custom objects). Use `(priority, counter, payload)` with an increasing counter from `itertools.count()`.
3. Java comparators: use `Integer.compare`, `Long.compare` or `Comparator.comparingLong`; never `(a, b) -> a - b`, which overflows for values of opposite sign near the limits.
4. Do not modify an element's key while it is inside the heap; push a new entry and lazily discard the old one.
5. `h[0]` is the minimum, but the list `h` is not sorted; never iterate it expecting sorted order.
6. Removing an arbitrary element with `list.remove` then `heapify` costs O(n); use lazy deletion from the Phase 1 table instead.

### Output
Heap declarations and entry formats.

### Quality Gate
- Python entries with non-numeric payloads include a counter tie-breaker (inspect the push lines).
- Java comparators contain no subtraction (search the file for `->` lines containing ` - `).

---

## Phase 3: Implement and Run

### Entry Criteria
- Phase 2 complete.

### Actions
1. Write `solution_file` with an `INVARIANT:` block that names exactly what the heap contains, for example "the min-heap holds the k largest values seen so far; its top is the k-th largest".
2. Run samples and edge cases (k = 1, k = n, equal priorities with different payloads):

| stack | Build | Run case X |
|---|---|---|
| python | none | `python sol.py < X.in > got.txt && diff -w got.txt X.out` |
| cpp | `g++ -std=c++17 -O2 -Wall -Wextra sol.cpp -o sol` | `./sol < X.in > got.txt && diff -w got.txt X.out` |
| java | `javac Sol.java` | `java Sol < X.in > got.txt && diff -w got.txt X.out` |

3. For the running median, after each insert assert both size and order conditions in a debug run: `len(lo) - len(hi)` in {0, 1} and `-lo[0] <= hi[0]`.

### Output
`solution_file` and `heap_design`.

### Quality Gate
- The equal-priority case runs without `TypeError` and passes diff.
- Every case with an `.out` file shows an empty diff.

---

## Worked Example

Illustrative. Minimum meeting rooms for n <= 10^5 intervals [s, e). `stack` = java.

- Phase 1: rooms pattern; min-heap of end times.
- Phase 2: `PriorityQueue<Integer> ends = new PriorityQueue<>();` sort intervals with `Comparator.comparingInt(a -> a[0])`; while `!ends.isEmpty() && ends.peek() <= s` poll.
- Phase 3:

```
$ javac Sol.java
$ for f in sample1 edge_n1 edge_touching edge_all_overlap; do java Sol < $f.in > got.txt && diff -w got.txt $f.out && echo "$f ok"; done
sample1 ok
edge_n1 ok
edge_touching ok
edge_all_overlap ok
```

`edge_touching` ([1,2),[2,3) needs 1 room) checks the `<=` in the pop condition for half-open intervals.

---

## Exit Criteria

DONE when the pattern, heap orders and keys are fixed, library semantics are applied as in the table, tie-breakers and comparators are safe, and all cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Needs ordered iteration or k-th element queries with deletions | **Return**: to `algo-pattern-select`; use a balanced tree, sorted container, or a Fenwick tree over compressed values. |
| Phase 2 | Python `TypeError: '<' not supported` | **Adjust**: add the counter tie-breaker. |
| Phase 3 | C++ returns largest instead of smallest | **Adjust**: add `greater<T>`; `priority_queue` defaults to max. |
| Phase 3 | Wrong answer after deletions | **Adjust**: confirm lazy deletion discards at the top before every peek. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
