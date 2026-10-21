# Python objgraph Back-Reference Chain

**One-line description:** Uses objgraph to find which object types grow per operation, picks a sample instance of the leaking type, and draws the shortest back-reference chain from a module or other root to that instance so the exact holding container is named.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_suspect_sites` (object[], required): From `leak-py-tracemalloc-diff`. Tells you which allocation line and type to look for.
- `leak_brief` (object, required): From `leak-intake-load-recipe`. How to reach a shell inside the process.

---

## Outputs

- `py_retention_chain` (object[]): For each leaking type: the growth count per window, the chain of objects from root to leaked instance (type and attribute or key at each hop), and the path to the rendered chain image or `.dot` file.

---

## Phase 1: Get a Shell in the Process

### Entry Criteria
- `objgraph` installable: `pip install objgraph` in the target environment. For images, Graphviz `dot` installed (`dot -V`).

### Actions
1. Pick one way to run code inside the live process, in this order:
   - A debug-only localhost endpoint that runs a fixed function (not arbitrary eval in production).
   - `python -m pdb` or `breakpoint()` in a single-worker test instance.
   - On Python 3.14 and later, `python -m pdb -p <pid>` remote attach if available in your build; check `python -m pdb --help`.
   - Pyrasite or gdb-based injection only on a disposable test host.
2. Make sure the code you run does not hold references after it finishes. Local variables in a debugger frame are references; delete them with `del` before the next measurement.

### Output
A way to run objgraph calls inside the process.

### Quality Gate
- Running `import objgraph; objgraph.show_most_common_types(limit=5)` inside the process prints five type names with counts.

---

## Phase 2: Find the Growing Type

### Entry Criteria
- Shell works and the load is warmed up.

### Actions
1. Call `gc.collect()`, then `objgraph.show_growth(limit=20)` once to set the baseline. The first call prints everything; ignore it.
2. Run N operations of the load.
3. Call `gc.collect()`, then `objgraph.show_growth(limit=20)` again. Each line is `TypeName  total  +delta`.
4. Run N more operations and call it a third time.
5. A leaking type has a positive delta in both calls of the same order as N or a fixed multiple of N. Cross-check with the allocation line in `py_suspect_sites`: the type created at that line should be in the list.
6. Ignore `dict`, `list`, `tuple`, `function`, `cell` alone at first. They are usually the containers or attributes of a more specific type that also grows; pick the most specific user-defined type with the same delta pattern.

### Output
Leaking type name and its two deltas.

### Quality Gate
- The two `show_growth` outputs are saved to a file, and the chosen type's two deltas are quoted from them.

---

## Phase 3: Draw the Back-Reference Chain

### Entry Criteria
- A leaking type is chosen.

### Actions
1. Pick a recent instance, not the first one created (old ones may be legitimately held):
   `objs = objgraph.by_type('Cart'); obj = objs[-1]`
   `by_type` accepts a qualified name such as `'orders.models.Cart'` when the short name is ambiguous.
2. Find the shortest chain to a module:
   `chain = objgraph.find_backref_chain(obj, objgraph.is_proper_module)`
3. Render it:
   `objgraph.show_chain(chain, filename='/tmp/chain.png')` (needs Graphviz). Without Graphviz, write `.dot`: `objgraph.show_chain(chain, filename='/tmp/chain.dot')` and read the text.
4. If the chain is too short or empty (no module path), draw the wider picture:
   `objgraph.show_backrefs([obj], max_depth=6, filename='/tmp/backrefs.dot', too_many=20)`
5. Read the chain from the module end to the object end and write each hop as `type.attribute` or `dict[key]`. The first container whose size grows with N is the holder. Common holders: a module-level dict, a class attribute dict, the `cache` of an `lru_cache` wrapper (`functools._lru_cache_wrapper`), a list of callbacks on an event bus, a `cell` object (closure variable).
6. Clean up: `del objs, obj, chain`. These lists themselves hold every instance alive.

### Output
`py_retention_chain`.

### Quality Gate
- The chain file exists (`ls -la /tmp/chain.*`).
- The written hop list starts at a module or a frame and ends at the leaking type.

---

## Worked Example

Illustrative only.

Input: suspect site `events.py:88` (subscribe without unsubscribe).

Phase 2: second `show_growth` prints `QuoteSession  30014  +30000` and `method  30020  +30000`; third prints `QuoteSession  60014  +30000`.

Phase 3: `obj = objgraph.by_type('QuoteSession')[-1]`; `find_backref_chain` gives module `orders.events` -> `bus` (`EventBus`) -> `bus._subscribers` (`dict`) -> `['price_change']` (`list`) -> `method` (bound method) -> `QuoteSession`. Holder: `EventBus._subscribers['price_change']`, a list that grows one bound method per request.

---

## Exit Criteria

DONE when every leaking type has a saved chain from a root to an instance and the growing holder is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No way to run code in the process | **Adjust**: use `leak-py-gc-referrers` from a test that reproduces the load in-process. |
| Phase 2 | Only builtin types grow | **Adjust**: use `objgraph.get_leaking_objects()` and `objgraph.typestats()` to find objects with no referrers, then follow `py_suspect_sites` lines. |
| Phase 3 | `find_backref_chain` returns only `[obj]` | **Adjust**: the root is not a module; use `show_backrefs` with a larger `max_depth` and look for frames or C-level holders. |
| Phase 3 | Graphviz missing | **Adjust**: write `.dot` and read it as text; do not skip the chain. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
