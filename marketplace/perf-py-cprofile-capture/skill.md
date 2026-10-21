# Python Deterministic Profile with cProfile and pstats

**One-line description:** Captures a cProfile `.pstats` file for the Python workload at two input sizes, reads it with `pstats` sorted by `tottime` and `cumtime`, uses `ncalls` growth between sizes to spot superlinear call counts, and renders a call graph with snakeviz or gprof2dot.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Command, inputs and the two or more sizes.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_cprofile_stats` (object): Paths to `perf/profiles/cprofile_<size>.pstats` per size, the top 20 functions by `tottime` and by `cumtime` with `ncalls`, the `ncalls` ratio between sizes for each, and the path to a rendered view.

---

## Phase 1: Capture One Profile per Size

### Entry Criteria
- The workload runs as a script (`python script.py`) or module (`python -m package.module`).

### Actions
1. Run once per size:

```bash
python -m cProfile -o perf/profiles/cprofile_30000.pstats -m app.report --input data/orders_30000.csv
python -m cProfile -o perf/profiles/cprofile_120000.pstats -m app.report --input data/orders_120000.csv
```

   `-o` writes the binary stats file. `-s` is ignored when `-o` is given, so sort later in pstats. `-m` profiles a module (Python 3.7+).
2. If the slow code is a function in a long-running process, profile only that call instead of the whole process:

```python
import cProfile, pstats
with cProfile.Profile() as pr:          # context manager form: Python 3.8+
    build_report(rows)
pr.dump_stats("perf/profiles/cprofile_30000.pstats")
```

   Put this in a temporary script under `perf/`, not in application code.
3. Know the limits before reading:
   - cProfile adds a fixed cost per Python function call, so code with many tiny calls looks slower than it is. Use py-spy (`perf-py-spy-flamegraph`) to confirm proportions.
   - cProfile records only the thread that enabled it. Work in other threads, `multiprocessing` workers and C extensions' internals is not broken down.
   - Time in C code shows as `{built-in method ...}` or `{method '...' of '...' objects}`.

### Output
One `.pstats` file per size.

### Quality Gate
- `ls -l perf/profiles/cprofile_*.pstats` shows one non-empty file per size.
- The profiled run exited 0.

---

## Phase 2: Read with pstats

### Entry Criteria
- `.pstats` files exist.

### Actions
1. Print the top functions by self time and by cumulative time:

```bash
python -c "import pstats; p=pstats.Stats('perf/profiles/cprofile_120000.pstats'); p.strip_dirs().sort_stats('tottime').print_stats(20)"
python -c "import pstats; p=pstats.Stats('perf/profiles/cprofile_120000.pstats'); p.strip_dirs().sort_stats('cumulative').print_stats(20)"
```

2. Read the columns:

   | Column | Meaning |
   |---|---|
   | `ncalls` | number of calls; `a/b` means a total calls, b primitive (non-recursive) calls |
   | `tottime` | time in this function excluding sub-calls (self time) |
   | `percall` (first) | `tottime / ncalls` |
   | `cumtime` | time in this function including sub-calls |
   | `percall` (second) | `cumtime / primitive calls` |
   | `filename:lineno(function)` | where it is defined |

3. Find who calls a hot function: `p.print_callers('func_name')`; find what it calls: `p.print_callees('func_name')`.
4. For each of the top 20 by `tottime`, compute `ncalls(large) / ncalls(small)` across the two sizes and record it next to the size ratio. A call-count ratio near the square of the size ratio means a call inside a loop over the data that is itself inside a loop over the data.

### Output
Top-20 tables and call-count ratios.

### Quality Gate
- Both sort orders are recorded for the largest size.
- Every top-20 function has an `ncalls` ratio or "absent at small size".

---

## Phase 3: Render a View and Record

### Entry Criteria
- Tables recorded.

### Actions
1. Choose one viewer:

   | Viewer | Command | Use when |
   |---|---|---|
   | snakeviz | `python -m pip install snakeviz` then `snakeviz perf/profiles/cprofile_120000.pstats` | interactive icicle or sunburst in a browser |
   | gprof2dot | `python -m pip install gprof2dot` then `gprof2dot -f pstats perf/profiles/cprofile_120000.pstats \| dot -Tsvg -o perf/profiles/cprofile_120000.svg` | a static call graph file (needs Graphviz `dot`) |

2. Fill `py_cprofile_stats` with file paths, both tables (function, `ncalls`, `tottime`, `cumtime`), call-count ratios and the view path.

### Output
`py_cprofile_stats`.

### Quality Gate
- The view file exists or the snakeviz URL was opened and the top box named.
- `py_cprofile_stats` lists functions by `filename:lineno(function)`, not by guess.

---

## Worked Example

Illustrative. Sizes 30,000 and 120,000.

```
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
 7200000   38.912    0.000   38.912    0.000 report.py:88(find_customer)
  120000    1.004    0.000   40.551    0.000 report.py:61(add_row)
       1    0.211    0.211   44.830   44.830 report.py:40(build_report)
```

At 30,000 rows `find_customer` had 1,800,000 calls. Call ratio 4.0 for 4x rows, but `tottime` per call grew too: `find_customer` scans a list (line 92 `for c in self.customers:`). Recorded for classification.

---

## Exit Criteria

DONE when a `.pstats` file exists for each size, the top 20 by `tottime` and `cumtime` are recorded with call-count ratios across sizes, and a rendered view exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Work happens in threads or subprocesses | **Adjust**: use `perf-py-spy-flamegraph` with `--subprocesses`; cProfile misses it. |
| Phase 1 | Run takes much longer under cProfile | **Adjust**: profile the smaller size only and confirm the larger with py-spy. |
| Phase 2 | Top entry is `{method 'acquire' of '_thread.lock' objects}` | **Return**: lock waiting is a concurrency problem; record it for `perf-hotspot-classify`. |
| Phase 3 | `dot: command not found` | **Adjust**: install Graphviz or use snakeviz. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
