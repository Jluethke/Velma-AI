# Python gc Referrers and Uncollectable Cycles

**One-line description:** Uses only the standard library `gc`, `sys` and `weakref` modules to prove whether a suspect object is held by a live referrer, sits in an uncollectable cycle, or is leaked by a C extension reference count, and names the referrer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_suspect_sites` (object[], required): From `leak-py-tracemalloc-diff`.
- `py_retention_chain` (object[], required): From `leak-py-objgraph-backrefs`. May be empty when objgraph could not be used.

---

## Outputs

- `py_referrer_report` (object[]): For each suspect type: which of the three retention kinds applies (live referrer, uncollectable cycle, refcount leak), the referrer objects with type and identifying attribute, and the evidence lines.

---

## Phase 1: Reproduce In-Process and Test Reachability

### Entry Criteria
- The leaking operation can be called in a plain Python script or test (no server needed).

### Actions
1. Write a script outside the repository, `/tmp/gc_probe.py`, that imports the app module and calls the leaking operation in a loop. Keep the call identical to the load path.
2. Test whether one created object can die. Create it through the real call path, keep only a weak reference, drop strong references, collect:
   ```python
   import gc, weakref
   obj = make_through_real_path()     # the function the request calls
   r = weakref.ref(obj)
   del obj
   gc.collect()
   print("alive" if r() is not None else "freed")
   ```
   If the type does not support weak references (`TypeError: cannot create weak reference`), use the count method: `sum(isinstance(o, T) for o in gc.get_objects())` before and after N calls.
3. Read the result:

   | Result | Meaning | Next |
   |---|---|---|
   | `freed` | nothing holds it after the call | the leak is elsewhere; pick the next suspect |
   | `alive` | something holds it | Phase 2 |
   | count grows but type is not gc-tracked (`gc.is_tracked(obj)` is False) | likely a C extension or builtin container holding it | Phase 3 |

### Output
Reachability result per suspect type.

### Quality Gate
- The probe script prints `alive` or `freed` (or two counts) for each suspect; output saved to a file.

---

## Phase 2: Find the Referrer

### Entry Criteria
- At least one suspect is `alive`.

### Actions
1. Get direct referrers, excluding the probe's own frames and lists:
   ```python
   import gc, inspect, sys
   target = r()
   refs = [x for x in gc.get_referrers(target)
           if not inspect.isframe(x) and x is not globals()]
   for x in refs:
       print(type(x), getattr(x, "__qualname__", ""), repr(x)[:200])
   ```
2. A `dict` referrer is usually an instance `__dict__` or a module namespace. Call `gc.get_referrers` on that dict to find its owner. Repeat until you reach a module, a class, or a long-lived singleton. Two to five hops is typical; stop at a module or class.
3. Check for uncollectable cycles:
   ```python
   gc.set_debug(gc.DEBUG_SAVEALL)
   unreachable = gc.collect()
   print(unreachable, len(gc.garbage))
   ```
   With `DEBUG_SAVEALL`, everything the collector would have freed goes to `gc.garbage`. If the suspect type appears there, it is a cycle the collector can see; on Python 3.4 and later, cycles with `__del__` are collected (PEP 442), so a cycle that still survives means a C extension type without proper gc support. Reset with `gc.set_debug(0)` and `gc.garbage.clear()` afterwards.
4. Do not leave `DEBUG_SAVEALL` on: it keeps every collected object alive and creates a leak of its own.

### Output
Referrer chain or cycle evidence.

### Quality Gate
- The printed referrer chain ends at a module, class or named singleton, or the `gc.garbage` membership is printed.

---

## Phase 3: Check for a Reference Count Leak

### Entry Criteria
- Suspect objects survive but have no Python-level referrer, or are not gc-tracked.

### Actions
1. Measure `sys.getrefcount(x)` on a shared object passed into the suspect C call (for example a cached string or `None`-like singleton argument) before and after N calls. A count that rises by N with no visible referrer means the extension increments without decrementing.
2. Run the probe with `python -X dev` to enable debug hooks on memory allocators; it reports some misuse that release builds hide.
3. If a debug build of CPython is available (`python3-dbg` on Debian and Ubuntu), `sys.gettotalrefcount()` exists only there; print it before and after N calls.
4. Record the extension module and the call that leaks; this is a native leak and continues in `leak-py-memray-native`.

### Output
`py_referrer_report`.

### Quality Gate
- The report shows the before and after numbers (`getrefcount` or `gettotalrefcount`) for N calls, or states Phase 3 was not entered.

---

## Worked Example

Illustrative only.

Input: suspect type `Cart` from `pricing.py:41`.

Phase 1: probe prints `alive`.

Phase 2: `gc.get_referrers(target)` prints `<class 'tuple'>` (the call arguments key). The tuple's referrer is a `dict`; that dict's referrer is `<class 'functools._lru_cache_wrapper'> quote_for`. Chain: module `orders.pricing` -> `quote_for` (lru_cache wrapper) -> internal cache dict -> key tuple -> `Cart`. `gc.garbage` does not contain `Cart`: no cycle.

Phase 3: not entered.

---

## Exit Criteria

DONE when every suspect type is classified as live referrer, cycle, or refcount leak, with the printed evidence that decided it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Leaking operation needs a running server | **Adjust**: call the view function with a test client (Django `Client`, Flask `app.test_client()`, FastAPI `TestClient`). |
| Phase 2 | Referrer list is huge | **Adjust**: filter by `type(x).__module__` starting with your package name. |
| Phase 2 | Referrer is the probe's own list or frame | **Retry**: delete probe variables and recompute; the probe must not hold the target. |
| Phase 3 | No debug build available | **Adjust**: rely on `getrefcount` evidence and memray native traces. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
