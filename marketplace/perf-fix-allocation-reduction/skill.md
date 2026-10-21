# Allocation Reduction Fix Candidates

**One-line description:** Turns measured allocation sites into concrete, stack-specific fix candidates (preallocation, reuse, avoiding boxing and copies, cheaper string formatting), collecting the evidence first for Rust (dhat), Node (`--heap-prof`) and C/C++ (heaptrack) when no stack-specific allocation profile exists, and states the allocation count each change must reduce.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `classified_hotspots` (object[], required): From `perf-hotspot-classify`.
- `py_alloc_profile` (object, optional): From `perf-py-tracemalloc-alloc`.
- `go_alloc_profile` (object, optional): From `perf-go-alloc-escape-analysis`.
- `jvm_alloc_profile` (object, optional): From `perf-jvm-alloc-profile`.
- `stack` (string, required): `python`, `node`, `go`, `rust`, `jvm`, `c` or `cpp`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `alloc_candidates` (object[]): Ranked candidates, each with `id`, `location`, `site_evidence` (bytes and count from a tool), `technique` (catalog row), `replacement` sketch, `semantic_risks`, `metric_to_check` (for example allocs/op, `gc.alloc.rate.norm`, memray total allocations) and its baseline value. Written to `perf/candidates_alloc.json`. Nothing is applied here.

---

## Phase 1: Gather Allocation Evidence

### Entry Criteria
- At least one hotspot has class `allocation` or `secondary_class` allocation.

### Actions
1. If the matching profile input exists (`py_alloc_profile` for python, `go_alloc_profile` for go, `jvm_alloc_profile` for jvm), use its sites and skip to Phase 2.
2. Otherwise capture evidence for the stack:

   | `stack` | Tool | Commands | Read |
   |---|---|---|---|
   | `rust` | dhat-rs crate | `cargo add --dev dhat` or as an optional dependency behind a feature; in the bench or a test binary add `#[global_allocator] static ALLOC: dhat::Alloc = dhat::Alloc;` and `let _profiler = dhat::Profiler::new_heap();` at the start of `main`; run it; it writes `dhat-heap.json` | open `dhat-heap.json` in the DHAT viewer (`dh_view.html` from Valgrind, linked in the dhat-rs docs); sort by "total (blocks)" |
   | `node` | V8 sampling heap profiler | `node --heap-prof --heap-prof-dir=perf/profiles dist/cli.js <args>` writes `.heapprofile`; also `node --trace-gc dist/cli.js <args> 2> perf/profiles/gc.txt` | load the `.heapprofile` in Chrome DevTools Memory panel; count `Scavenge` and `Mark-Compact` lines in `gc.txt` |
   | `c`, `cpp` | heaptrack | `heaptrack ./build/report --input data/orders_30000.csv` then `heaptrack_print heaptrack.report.<pid>.zst \| head -60` (file extension varies by version) | sections "MOST CALLS TO ALLOCATION FUNCTIONS" and "PEAK MEMORY CONSUMERS" |

3. Record the top 5 sites by allocation count with their project frame, bytes and count, copied from the tool.

### Output
Allocation sites with evidence.

### Quality Gate
- Every site has a count or byte value copied from a named tool output.
- Every site has a project file:line.

---

## Phase 2: Match Techniques

### Entry Criteria
- Sites with evidence exist.

### Actions
1. Choose a technique per site from the row for the stack. Use only these techniques; record "no technique matched" otherwise.

   | `stack` | Site pattern | Technique |
   |---|---|---|
   | python | dict per row for fixed fields | class with `__slots__`, or a tuple/`namedtuple`; or keep columns as lists |
   | python | intermediate lists (`[f(x) for x in xs]` passed straight to `sum`, `max`, `join`) | generator expression |
   | python | slicing copies (`row.items[:]`, `data[i:j]` on bytes) | iterate without copying; `memoryview` for bytes |
   | python | numeric loops creating float or int objects | move the loop into NumPy vectorized operations if NumPy is already a dependency |
   | go | `append` growth | `make([]T, 0, n)` with the known `n` |
   | go | `fmt.Sprintf` for keys or numbers | `strconv.AppendInt`/`strconv.Itoa`, `strings.Builder` with `Grow` |
   | go | short-lived buffers per call | reuse via a field or `sync.Pool` (only for buffers; reset before reuse) |
   | go | `&T{}` stored as `[]*T` | store values `[]T` when items are not shared |
   | jvm | autoboxing in collections | primitive arrays, `IntStream`/`LongStream`, or a primitive collections library already in the project |
   | jvm | `HashMap`/`ArrayList` resizing | construct with expected capacity (`new ArrayList<>(n)`; for HashMap, `HashMap.newHashMap(n)` on JDK 19+) |
   | jvm | stream pipeline per element in a hot loop | plain `for` loop |
   | rust | `clone()` of `String` or `Vec` to satisfy the borrow checker | borrow `&str`/`&[T]`, or `Cow` |
   | rust | `Vec`/`String` growth | `Vec::with_capacity`, `String::with_capacity`, `reserve` |
   | rust | `format!` in a loop | `write!` into a reused `String` |
   | node | object or array literal per item in a hot loop | reuse an object, or use typed arrays for numbers |
   | node | string concatenation building large output | collect parts in an array and `join`, or stream writes |
   | c, cpp | `std::vector` growth | `reserve(n)` |
   | c, cpp | copies of `std::string` or containers passed by value | pass `const&` or `std::string_view`; move with `std::move` when ownership transfers |
   | c, cpp | `malloc`/`new` per item | allocate arrays in one block or use an arena already in the project |

2. Write the replacement sketch using APIs that exist in the project's language version (check the docs; for example `HashMap.newHashMap` needs JDK 19).
3. List semantic risks: shared mutable state from reuse (reset buffers; never return a pooled buffer to callers), `__slots__` breaks code that adds attributes dynamically, generators can be consumed only once, `sync.Pool` objects may be dropped at any GC, borrowing changes lifetimes and APIs.

### Output
Candidates with technique, replacement and risks.

### Quality Gate
- Every candidate cites one table row for its stack.
- Every candidate names `metric_to_check` and its baseline value from the evidence.

---

## Phase 3: Rank and Save

### Entry Criteria
- Candidates exist.

### Actions
1. Rank by allocation count share of the site (count drives allocator and GC work more than bytes for small objects), then by bytes.
2. Write `perf/candidates_alloc.json`; validate with `python -m json.tool`.
3. Do not edit source files here. `perf-one-change-apply` applies one candidate at a time.

### Output
`alloc_candidates`.

### Quality Gate
- `perf/candidates_alloc.json` parses with exit code 0.
- `git -C <repo_path> status --porcelain` lists no modified source files.

---

## Worked Example

Illustrative. Go, `go_alloc_profile` present.

- Phase 1: sites: `AddRow` line 71 `&Entry{...}` 1,800,000 objects; line 73 `fmt.Sprintf` 960,000 objects.
- Phase 2: candidate A1: store `[]Entry` values instead of `[]*Entry`, `make([]Entry, 0, len(rows)*itemsPerRow)`; risk: callers that mutate through pointers. Candidate A2: build key with `strconv.AppendInt(buf[:0], id, 10)` plus `append(buf, '-')` and the SKU, using a reused `[]byte` field; risk: key string must be copied with `string(buf)` before storing in a map. Metric: allocs/op, baseline 3,601,877.
- Phase 3: A1 ranked first (49.97% of objects), A2 second (26.65%).

---

## Exit Criteria

DONE when each allocation site has a stack-specific technique with replacement, risks and a measurable allocation metric with its baseline, and no source file was modified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | heaptrack or dhat unavailable | **Adjust**: for C/C++ use `valgrind --tool=dhat`; for Rust use `perf-linux-perf-flamegraph` and look for `malloc` callers; record it. |
| Phase 1 | Allocation sites are all in a library | **Adjust**: record the project call site that triggers them. |
| Phase 2 | Technique needs a new dependency | **Return**: ask the user; do not add dependencies on your own. |
| Phase 2 | No technique matches | **Adjust**: record "no technique matched" with the evidence. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
