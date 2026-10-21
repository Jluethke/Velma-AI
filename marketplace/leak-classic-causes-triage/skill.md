# Classic Leak Causes Triage

**One-line description:** Searches the codebase for the classic leak patterns (unbounded caches, listeners never removed, closures capturing large scope, growing globals, unstopped timers, unclosed resources, thread-local and classloader leaks, label cardinality) with exact per-stack search commands, and ranks them into testable hypotheses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. The suspect commit range and the code path the load exercises are used for ranking.
- `leak_layer` (string, required): From `leak-managed-vs-native-split`.
- `stack` (string, required): `python`, `node`, `browser`, `jvm`, `go` or `cpp`.

---

## Outputs

- `cause_hypotheses` (object[]): Ranked list. Each entry: causes-table row id, file and line, the code excerpt, why it is on the load path, and the tool flow that can confirm or reject it.

---

## Phase 1: Search for Pattern Matches

### Entry Criteria
- The repository is checked out at the version under test.
- `rg` (ripgrep) is installed: `rg --version` prints a version.

### Actions
1. Run every search for your `stack` from the causes table in the Reference Section. Run them all; do not stop at the first hit. Save output to `triage_hits.txt`:
   `rg -n --type <lang> "<pattern>" > triage_hits.txt` (append with `>>` for each row).
2. Restrict nothing by path. Vendor directories (`node_modules`, `vendor`, `.venv`) are excluded by `.gitignore` already when `rg` respects it; do not add other path filters.
3. For each hit, record file, line and the row id (C1 to C12).

### Output
`triage_hits.txt` with row ids.

### Quality Gate
- `triage_hits.txt` exists and has one section per table row for the stack, including rows with zero hits (write "0 hits").
- `wc -l triage_hits.txt` is printed.

---

## Phase 2: Keep Hits on the Load Path

### Entry Criteria
- `triage_hits.txt` exists.

### Actions
1. For each hit, decide whether the code runs under `load_recipe`. Rules:
   - If the function is reachable from the handler the load hits (follow calls with your editor's "find references" or `rg -n "<function_name>\("`), keep it.
   - If it only runs at startup, drop it. Startup allocations do not grow per operation.
   - If you cannot tell, keep it and mark "reachability unknown".
2. For each kept hit, check the matching cleanup exists on the same object. Examples: `addEventListener` has a `removeEventListener` with the same function reference; `.on(` has `.off(` or `.removeListener(`; `setInterval` has `clearInterval`; `time.NewTicker` has `Stop()`; `new Thread`/executor has shutdown; `open(` is inside `with`; Go `resp.Body` has `Close()`; `ThreadLocal.set` has `remove()` in a `finally`.
3. Drop a hit only when its cleanup is present on every exit path, including error paths and early returns.
4. Match `leak_layer`:
   - `managed`: keep C1 to C9, C11.
   - `native`: keep C5, C10, C12 and any native-binding hit.
   - `allocator_retention`: no code hit is required; record "allocator tuning" as hypothesis H1.
   - `both`: keep all.

### Output
Filtered hit list with cleanup status.

### Quality Gate
- Every kept hit lists the cleanup call it searched for and whether it was found.
- Every dropped hit has one of the drop reasons above written next to it.

---

## Phase 3: Rank Into Hypotheses

### Entry Criteria
- Filtered hit list exists.

### Actions
1. Rank with these rules, in order:
   1. Hits in files changed inside the suspect commit range (`git diff --name-only <good>..<bad>`) rank first.
   2. Hits whose collection key or registration includes per-request data (request id, user id, URL, timestamp) rank above fixed keys.
   3. Hits without a size bound or removal rank above hits with one.
2. For each hypothesis, name the confirming flow: Python object growth goes to `leak-py-tracemalloc-diff`, Node retainers to `leak-node-heap-snapshot-compare`, JVM to `leak-jvm-heap-dump-capture`, Go to `leak-go-pprof-heap-diff` or `leak-go-goroutine-leak`, C/C++ to `leak-cpp-heaptrack` or the sanitizer flows.
3. Do not edit code in this flow. Triage only lists suspects; the fix comes after the tool confirms one.

### Output
`cause_hypotheses`.

### Quality Gate
- Every hypothesis has a row id, file:line, ranking reason and confirming flow.
- `git status --porcelain` prints nothing (no code was changed).

---

## Reference Section

### Causes Table With Search Patterns

| Id | Cause | python | node / browser | jvm | go | cpp |
|---|---|---|---|---|---|---|
| C1 | Unbounded cache or memo | `lru_cache\(maxsize=None\)\|@cache\b\|_cache\s*=\s*\{\}` | `new Map\(\)\|= \{\}` at module scope | `static .*Map<\|CacheBuilder\.newBuilder\(\)` without `maximumSize` | `map\[.*\].*= make\(map` at package level | `static std::(unordered_)?map` |
| C2 | Listener or observer never removed | `connect\(\|subscribe\(\|add_listener` | `\.on\(\|addEventListener\|\.subscribe\(` | `addListener\|register\(` | callback slices: `append\(.*[Hh]andlers` | `connect\(` (Qt, Boost.Signals2) |
| C3 | Closure capturing large scope | `lambda` stored in a long-lived list | functions stored in a Map, a listener or a timer that reference request objects | anonymous inner classes held by a static field (they keep the outer instance) | closures sent on channels or stored in maps | lambdas capturing `this` stored in a global |
| C4 | Growing global or module collection | `^[A-Z_]+\s*=\s*(\[\]\|\{\}\|set\(\))` | top-level `const .* = \[\]` then `.push(` | `static final List<` then `.add(` | package-level slice with `append` | global `std::vector` with `push_back` |
| C5 | Unclosed resource | `open\(` outside `with` | streams without `.destroy()` | `new FileInputStream\|getConnection\(` outside try-with-resources | `resp.Body` without `Close()`, `rows` without `Close()` | `fopen\|new ` without matching release |
| C6 | Timer or ticker never stopped | `threading.Timer` | `setInterval\(` | `scheduleAtFixedRate` | `time.NewTicker\|time.Tick\(` | timer threads |
| C7 | Thread-local in a pooled thread | `threading.local\(` | `AsyncLocalStorage` holding large stores | `ThreadLocal<` without `remove\(\)` | not applicable | `thread_local` |
| C8 | Metric or log label cardinality | `labels\(` with request data | `labels\(\|\.inc\(\{` | `Tag.of\|tags\(` | `WithLabelValues\(` | not typical |
| C9 | Goroutine or task never exits | `asyncio.create_task` without keeping or awaiting | promises awaiting forever | executor tasks blocked | `go func` with channel send and no receiver on timeout | detached `std::thread` |
| C10 | Native buffer or handle | numpy or ctypes buffers kept in lists | `Buffer.alloc`, native addons | `ByteBuffer.allocateDirect` | cgo `C.malloc` without `C.free` | `malloc` or `new` without free; `shared_ptr` cycles |
| C11 | Class or module reload leak | `importlib.reload` | hot module reload in dev | classloader per redeploy (metaspace growth) | plugin package reload | `dlopen` without `dlclose` |
| C12 | Allocator retention, not a leak | pymalloc arenas | not typical | not typical | `HeapIdle` not yet released | glibc arenas, fragmentation |

---

## Worked Example

Illustrative only.

Input: `stack` = `python`, `leak_layer` = `managed`, suspect range `v2.3.0..v2.4.0`.

Phase 1: `rg -n "lru_cache\(maxsize=None\)|@cache\b" --type py` finds `orders/pricing.py:41 @functools.lru_cache(maxsize=None)` on `def quote_for(cart: Cart)`. C2 search finds `orders/events.py:88 bus.subscribe(self.on_price_change)`.

Phase 2: `quote_for` is called from the `/orders/quote` handler: kept. `Cart` objects are unique per request, so the key never repeats. `bus.subscribe` in `QuoteSession.__init__` has no `unsubscribe`: kept.

Phase 3: `git diff --name-only v2.3.0..v2.4.0` includes `orders/pricing.py`: H1 = C1 at `pricing.py:41`, confirm with `leak-py-tracemalloc-diff`. H2 = C2 at `events.py:88`, confirm with `leak-py-objgraph-backrefs`.

---

## Exit Criteria

DONE when `cause_hypotheses` is a ranked list where every entry has evidence, a reason and a confirming flow, and no code has been changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Adjust**: use `git grep -n -E "<pattern>"`, which searches tracked files. |
| Phase 1 | Zero hits across all rows | **Adjust**: record "no pattern hits"; the tool flows run without hypotheses and the root cause comes from tool evidence alone. |
| Phase 2 | Thousands of hits for one row | **Adjust**: keep only hits on the load path; do not path-filter the search itself. |
| Phase 3 | Temptation to fix a hit now | **Stop**: no edits until a tool confirms the retention. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
