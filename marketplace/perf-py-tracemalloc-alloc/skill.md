# Python Allocation Profile with tracemalloc and memray

**One-line description:** Finds the Python source lines that allocate the most memory blocks and bytes during the slow workload, using `tracemalloc` snapshots grouped by line and traceback (and memray for native allocations and a flame graph), so allocation fixes target measured lines.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `classified_hotspots` (object[], required): From `perf-hotspot-classify`; the allocation-class entries name the functions to examine.
- `workload_spec` (object, required): Command, inputs and sizes.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_alloc_profile` (object): Top allocation sites by size and by count (file:line, size, count, average block size), traceback for the top 3, peak traced memory, the script used, and the memray flame graph path if captured.

---

## Phase 1: Capture tracemalloc Snapshots

### Entry Criteria
- At least one hotspot has class `allocation` (or `secondary_class` allocation).

### Actions
1. Create `perf/trace_alloc.py` (a measurement script, not application code):

```python
import tracemalloc
from app.report import build_report          # real import; grep first
from benchmarks.data import load_rows

rows = load_rows(30_000)                      # smaller size from workload_spec
tracemalloc.start(25)                         # keep 25 frames per traceback
before = tracemalloc.take_snapshot()
build_report(rows)
after = tracemalloc.take_snapshot()
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()

filters = [tracemalloc.Filter(False, tracemalloc.__file__),
           tracemalloc.Filter(False, "<frozen importlib._bootstrap>")]
diff = after.filter_traces(filters).compare_to(before.filter_traces(filters), "lineno")
print(f"peak traced: {peak/1e6:.1f} MB")
for stat in diff[:20]:
    print(stat)
```

2. Run it: `python perf/trace_alloc.py | tee perf/profiles/tracemalloc_lineno.txt`.
3. tracemalloc counts blocks still alive at snapshot time. Short-lived temporaries freed before the second snapshot do not appear in the diff. To see churn, also take a snapshot inside the loop (temporarily, in the measurement script by calling the inner function directly) or use memray in Phase 2.
4. tracemalloc slows Python allocation; do not compare timings taken with tracemalloc on.

### Output
`perf/profiles/tracemalloc_lineno.txt`.

### Quality Gate
- The file has a `peak traced:` line and up to 20 lines of the form `<file>:<line>: size=... (+...), count=... (+...), average=...`.

---

## Phase 2: Capture memray for Churn and Native Allocations

### Entry Criteria
- Linux or macOS (memray does not support Windows).

### Actions
1. Install: `python -m pip install memray`. Record `memray --version`.
2. Run the whole workload: `memray run -o perf/profiles/memray.bin -m app.report --input data/orders_30000.csv`. Add `--native` to include frames from C extensions.
3. Summaries:

```bash
memray stats perf/profiles/memray.bin            # total allocations, top locations by size and count
memray flamegraph -o perf/profiles/memray.html perf/profiles/memray.bin
```

4. memray stats shows total allocation count including freed blocks, which is what drives allocator and GC cost in hot loops. In the flame graph HTML, width is memory at the peak by default; check the page's toggle for "temporary allocations" if your version offers it, or use `memray flamegraph --temporary-allocations` (confirm with `memray flamegraph --help`).

### Output
memray binary, stats and flame graph.

### Quality Gate
- `memray stats` output includes a total allocations count.
- `perf/profiles/memray.html` exists, or the OS limitation is recorded.

---

## Phase 3: Attribute to Project Lines

### Entry Criteria
- At least the tracemalloc output exists.

### Actions
1. For the top 5 sites by size and the top 5 by count, rerun the comparison grouped by traceback (`compare_to(..., "traceback")`) and print `stat.traceback.format()` to find the project line that triggered the allocation when the site is inside a library.
2. For each site record: file:line, size, count, average size, the project line responsible, and a short note of what is allocated (for example "dict per row", "list copy from slicing", "str from f-string").
3. Fill `py_alloc_profile`.

### Output
`py_alloc_profile`.

### Quality Gate
- Every recorded site has a project file:line taken from a printed traceback.
- Sizes and counts are copied from tool output.

---

## Worked Example

Illustrative. `build_report` on 30,000 rows.

```
peak traced: 412.6 MB
app/report.py:71: size=268 MiB (+268 MiB), count=1800003 (+1800003), average=156 B
app/report.py:64: size=41.2 MiB (+41.2 MiB), count=30000 (+30000), average=1440 B
```

Line 71: `entry = {"id": r.id, "sku": r.sku, ...}` creates one dict per line item. Line 64: `row.items[:]` copies a list per row. `memray stats` total allocations 9,412,331.

---

## Exit Criteria

DONE when the top allocation sites by size and count are attributed to project lines with copied numbers, and memray churn data is recorded or its absence explained.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Diff is empty | **Adjust**: the objects were freed; use memray or snapshot inside the hot loop. |
| Phase 1 | Top site is in `site-packages` | **Adjust**: group by `traceback` to find the project caller. |
| Phase 2 | Windows host | **Adjust**: skip memray; rely on tracemalloc and record it. |
| Phase 3 | Allocation share small compared with CPU hotspots | **Return**: to `perf-hotspot-classify`; allocation may not be the bottleneck. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
