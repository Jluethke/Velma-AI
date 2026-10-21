# Python tracemalloc Snapshot Diff

**One-line description:** Starts tracemalloc with deep tracebacks, takes three snapshots across two equal load windows, diffs them with `Snapshot.compare_to` grouped by traceback, and keeps only allocation sites that grew in both windows in proportion to the operation count.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Supplies the start command.
- `load_recipe` (object, required): From `leak-intake-load-recipe`. Fixed load and warmup count.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. Used to check whether the diff lands on a predicted site.

---

## Outputs

- `py_alloc_diff` (object[]): For each of the top sites in each window: traceback (outermost frames to allocation line), `size_diff`, `count_diff`, `size`, `count`.
- `py_suspect_sites` (object[]): Sites that grew in both windows, with bytes per operation and whether they match a hypothesis id.

---

## Phase 1: Enable tracemalloc and a Snapshot Hook

### Entry Criteria
- Python 3.4 or later (`python --version`). tracemalloc is in the standard library.
- A test instance you can restart with an environment variable.

### Actions
1. Start the process with tracing from the first import, storing 25 frames per allocation:
   `PYTHONTRACEMALLOC=25 gunicorn -w 1 orders.wsgi:app` or `python -X tracemalloc=25 app.py`. More frames cost more memory and CPU; 25 is a choice to see past framework layers, adjust if tracebacks are cut off inside the framework.
2. Add a debug-only snapshot hook on a branch. A signal handler works for any server:
   ```python
   import gc, os, signal, time, tracemalloc
   def _dump(signum, frame):
       gc.collect()
       tracemalloc.take_snapshot().dump(f"/tmp/snap-{os.getpid()}-{int(time.time())}.pickle")
   signal.signal(signal.SIGUSR1, _dump)
   ```
   On Windows, where `SIGUSR1` does not exist, expose the same body on a localhost-only debug HTTP route instead.
3. Do not call `tracemalloc.start()` later in the code when the env var already started it; calling it again with a different frame count has no effect on traces already collected and confuses readers.

### Output
Instrumented process running with tracemalloc.

### Quality Gate
- `kill -USR1 <pid>` creates one `/tmp/snap-*.pickle` file; `ls -la /tmp/snap-*` shows it.
- `python -c "import tracemalloc; s=tracemalloc.Snapshot.load('<file>'); print(s.traceback_limit, len(s.traces))"` prints 25 and a nonzero trace count.

---

## Phase 2: Take Three Snapshots

### Entry Criteria
- Snapshot hook works.

### Actions
1. Run `load_recipe` until `warmup_ops` is reached. Send `SIGUSR1`: snapshot A.
2. Run exactly N more operations (N equal for both windows; read the counter). Send `SIGUSR1`: snapshot B.
3. Run N more. Send `SIGUSR1`: snapshot C.
4. Record the op count at each snapshot.
5. Why three: a site that grows from A to B but not B to C is a one-time fill (lazy import, cache warm). A leak grows in both windows.

### Output
Three snapshot files with op counts.

### Quality Gate
- Three pickle files exist, and the op count deltas A to B and B to C are printed and equal within the load tool's counting accuracy.

---

## Phase 3: Diff and Filter

### Entry Criteria
- Three snapshots exist.

### Actions
1. Run this script (save it outside the repository, for example in `/tmp/diff.py`):
   ```python
   import sys, tracemalloc
   flt = [tracemalloc.Filter(False, "<frozen importlib._bootstrap>"),
          tracemalloc.Filter(False, "<frozen importlib._bootstrap_external>"),
          tracemalloc.Filter(False, tracemalloc.__file__),
          tracemalloc.Filter(False, "<unknown>")]
   A, B, C = (tracemalloc.Snapshot.load(p).filter_traces(flt) for p in sys.argv[1:4])
   for name, old, new in (("A->B", A, B), ("B->C", B, C)):
       print("==", name)
       for st in new.compare_to(old, "traceback")[:15]:
           print(st.size_diff, st.count_diff, st.size, st.count)
           for line in st.traceback.format(most_recent_first=True)[:8]:
               print("   ", line)
   ```
   `python /tmp/diff.py snapA.pickle snapB.pickle snapC.pickle > tm_diff.txt`
2. If the traceback view is noisy, rerun once with `"lineno"` instead of `"traceback"` to get one line per allocation site.
3. A site is a suspect when all hold:
   - It appears in both windows' top lists.
   - `size_diff` is positive in both.
   - The two `size_diff` values are of the same order (a leak grows per operation; a cache warm-up shows in A to B only).
4. For each suspect, compute bytes per operation as `size_diff / N` and compare with `bytes_per_op` from the growth fit. If the suspects together explain only a small part of RSS growth, the rest is outside tracemalloc (C allocations); note it and send to `leak-py-memray-native`.
5. Match each suspect file:line to `cause_hypotheses`; mark matched ids.

### Output
`py_alloc_diff`, `py_suspect_sites`.

### Quality Gate
- `tm_diff.txt` exists with both windows.
- Every entry in `py_suspect_sites` shows its two `size_diff` values copied from `tm_diff.txt`.

---

## Worked Example

Illustrative only.

Input: hypothesis H1 = C1 at `orders/pricing.py:41`.

Phase 1: `PYTHONTRACEMALLOC=25 gunicorn -w 1 orders.wsgi:app -b 127.0.0.1:8000`; `kill -USR1 31877` writes `/tmp/snap-31877-1760953021.pickle`; load check prints `25 184213`.

Phase 2: A at 6,000 ops, B at 36,000, C at 66,000 (N = 30,000).

Phase 3: `tm_diff.txt` excerpt:
```
== A->B
11987232 30000 13540880 33902
    File "orders/pricing.py", line 41
    File "orders/views.py", line 77
== B->C
12001456 30000 25542336 63902
    File "orders/pricing.py", line 41
```
About 400 bytes and one object per op at `pricing.py:41`, both windows. Matches H1. Second-ranked site `json/decoder.py` appears in A to B only: warm-up, not a suspect.

---

## Exit Criteria

DONE when three snapshots were diffed and `py_suspect_sites` lists only sites that grew in both windows, each with bytes per operation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Process too slow with tracing to run the load | **Adjust**: lower the frame count to 10 and rerun; record the change. |
| Phase 1 | Cannot add a signal handler (third-party runner) | **Adjust**: use `memray attach` from `leak-py-memray-native`. |
| Phase 3 | No site grows in both windows but RSS grows | **Return**: to `leak-managed-vs-native-split`; growth is outside the Python allocator. |
| Phase 3 | Top site is inside the framework | **Adjust**: read deeper frames of the same traceback for the first frame in your own package. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
