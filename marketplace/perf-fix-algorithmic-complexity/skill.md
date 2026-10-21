# Algorithmic Complexity Fix Candidates

**One-line description:** For hotspots classified as algorithmic, matches the hot code against a catalog of known superlinear patterns per language (membership tests on lists, nested-loop joins, repeated sorts, front insertion, string building, recomputation), writes the replacement with its complexity before and after, and specifies the equivalence test that must pass before the change is accepted.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `classified_hotspots` (object[], required): From `perf-hotspot-classify`; only entries with class `algorithmic` are used.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `algo_candidates` (object[]): Ranked candidates, each with `id`, `location` (file:line), `pattern` (catalog row), `current_complexity`, `proposed_complexity`, `replacement` (code sketch in the project's language), `semantic_risks`, `equivalence_test` (file and test to add), `expected_share` (hotspot self percent). Written to `perf/candidates_algo.json`. Nothing is applied here.

---

## Phase 1: Read the Hot Code

### Entry Criteria
- At least one hotspot has class `algorithmic`.

### Actions
1. For each algorithmic hotspot, open the file at the recorded line and read the whole function plus every caller listed in the profile. Do not propose anything from the function name alone.
2. Write down, in one sentence each: what the loop iterates over, what is done per iteration, and the sizes of every collection involved (relate them to the `workload_spec` sizes, for example "rows = n, customers = n/4").
3. Derive the current complexity from the loop structure (for example "for each of n rows, scan a list of m customers: O(n*m)"). Check it against the measured exponent recorded in `classified_hotspots`.

### Output
Per-hotspot notes: iteration, per-iteration work, collection sizes, derived complexity.

### Quality Gate
- Each hotspot has a derived complexity with the loop lines cited (file:line range).
- The derived complexity is consistent with the measured exponent, or the mismatch is written down.

---

## Phase 2: Match the Pattern Catalog

### Entry Criteria
- Notes exist.

### Actions
1. Find the matching row. Use only these rows; if none matches, record "no catalog match" for that hotspot.

   | Pattern | Seen as | Replacement | Complexity change |
   |---|---|---|---|
   | Membership test on a list in a loop | Python `x in some_list`, JS `arr.includes(x)`/`indexOf`, Java `list.contains(x)`, Go linear `for` search, C++ `std::find` | build a set or hash map once before the loop: Python `set`/`dict`, JS `Set`/`Map`, Java `HashSet`/`HashMap`, Go `map[K]struct{}`, Rust `HashSet`, C++ `std::unordered_set` | O(n*m) to O(n+m) expected |
   | Nested-loop join on a key | two loops comparing `a.key == b.key` | index one side in a hash map by key, then one pass over the other | O(n*m) to O(n+m) |
   | Sort inside a loop, or sort to take top k | `sorted(...)` per item; `sort` then slice | sort once outside the loop; Python `heapq.nlargest(k, xs)`, Java `PriorityQueue` of size k, C++ `std::partial_sort`/`nth_element` | O(n * n log n) to O(n log n); top k O(n log k) |
   | Removal or insertion at the front of an array | Python `list.pop(0)`/`insert(0, x)`, JS `shift`/`unshift`, Java `ArrayList.remove(0)`, Go `s = append([]T{x}, s...)` | Python `collections.deque`, Java `ArrayDeque`, Go ring buffer or index pointer, JS index pointer | O(n) per op to O(1) |
   | String built by repeated concatenation in a loop | `s += piece` in Python or Java, Go `s += x` | Python `"".join(parts)`, Java `StringBuilder`, Go `strings.Builder`, Rust `String::with_capacity` + `push_str`, JS array `join` | O(n^2) bytes copied to O(n) |
   | Same pure computation repeated with the same arguments | profile shows repeated calls with equal inputs | compute once and reuse; Python `functools.cache`/`lru_cache`, explicit map elsewhere | removes repeated work |
   | Linear search in sorted data | loop to find a position in sorted data | Python `bisect`, Java `Collections.binarySearch`, Go `sort.Search`/`slices.BinarySearch`, Rust `binary_search`, C++ `std::lower_bound` | O(n) to O(log n) per lookup |
   | Regex compiled per call | Python `re.match(pattern, s)` with varying patterns beyond the module's internal cache, Java `Pattern.compile` per call, Go `regexp.MustCompile` per call | compile once at module or struct level | removes compile per call |
   | Repeated `len`/`strlen` or full-size computation in a loop condition (C) | `for (i = 0; i < strlen(s); i++)` | hoist the length out of the loop | O(n^2) to O(n) |

2. For each match, write the replacement as a code sketch in the project's language using only standard library APIs that exist (check the official docs page for each API you name).
3. List the semantic risks the replacement introduces:
   - set or map loses duplicates and (for `set` in Python, `HashSet` in Java) loses order;
   - hash containers need hashable or properly implemented `equals`/`hashCode` keys;
   - floating-point keys and case-sensitivity can change matches;
   - caching is wrong if the function reads mutable state or has side effects;
   - `heapq.nlargest` tie order may differ from a stable sort.

### Output
Candidates with replacement, complexity and risks.

### Quality Gate
- Every candidate cites one catalog row by name.
- Every API named in a replacement exists in the language's standard library documentation (record the doc page).

---

## Phase 3: Specify the Equivalence Test and Rank

### Entry Criteria
- Candidates written.

### Actions
1. For each candidate, specify a test that compares the old and new function on the same inputs before the old code is deleted: same output for the real workload input at the small size, plus edge cases from the risks list (duplicates, empty input, unhashable or equal keys, ties). Name the test file using the project's existing test layout (for example `tests/test_report_equivalence.py`, `report_equivalence_test.go`).
2. Rank candidates by `expected_share` (the hotspot's self percent), highest first.
3. Write `perf/candidates_algo.json` and validate it with `python -m json.tool`.
4. Do not edit source files in this flow. Applying happens in `perf-one-change-apply`, one candidate at a time.

### Output
`algo_candidates`.

### Quality Gate
- Every candidate has an `equivalence_test` with a file name and the list of edge cases.
- `perf/candidates_algo.json` parses with exit code 0.
- `git -C <repo_path> status --porcelain` shows no modified source files.

---

## Worked Example

Illustrative. Python hotspot `find_customer (app/report.py:92)`, 86.3% self, measured k = 1.98.

- Phase 1: for each of n rows, `find_customer` scans `self.customers` (m = n/4) comparing `c.id == customer_id`: O(n*m).
- Phase 2: row "Membership test on a list in a loop". Replacement: build `self._by_id = {c.id: c for c in self.customers}` once in `__init__`, then `return self._by_id.get(customer_id)`. Risk: duplicate ids would keep the last one, while the list scan returned the first. Fix: build the dict in reverse order or with `setdefault` to keep the first.
- Phase 3: test `tests/test_report_equivalence.py::test_find_customer_matches_scan` over the 30,000-row input, plus duplicate id, missing id and empty customer list cases.

---

## Exit Criteria

DONE when every algorithmic hotspot has either a catalog-matched candidate with complexity before and after, risks and an equivalence test, or a recorded "no catalog match", and no source file was modified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hot code is in a dependency | **Adjust**: target the project call site (`first_project_frame`), for example call the dependency less often. |
| Phase 2 | No catalog row matches | **Return**: record "no catalog match" with the derived complexity; do not invent a new algorithm without a reference. |
| Phase 2 | Replacement changes output order that callers rely on | **Adjust**: use an order-preserving structure (Python `dict`, Java `LinkedHashMap`) or sort explicitly. |
| Phase 3 | No existing test layout | **Adjust**: create a single new test file next to the module and record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
