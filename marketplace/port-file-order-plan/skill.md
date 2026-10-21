# Port File Order Plan

**One-line description:** Builds the source's internal module dependency graph with a language-specific tool (pydeps, madge, jdeps, cflow or `gcc -MM`), collapses import cycles into single units, and emits a leaf-first porting order with a tie-break rule, so every module is ported only after everything it imports is ported and tested.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`; maps behaviors to modules.

---

## Outputs

- `port_order` (object[]): Ordered list of units. Each unit: `step` number, `files` (one file, or several when they form a cycle), `depends_on` (earlier steps), `behaviors` (B-ids whose code lives here), `lines` (from `wc -l`), and `test_mode` (`module_corpus` or `end_to_end_only`).

---

## Phase 1: Extract the Graph

### Entry Criteria
- Source at the reference commit.

### Actions
1. Run the tool for the source language and save its raw output:

| Source | Graph command | Cycle command |
|---|---|---|
| Python | `pydeps <pkg> --show-deps --no-output --max-bacon=0 > deps.json` (prints JSON of module imports; check `pydeps --help` for your version) | `pydeps <pkg> --show-cycles --no-output` |
| JavaScript | `npx madge --json src/ > deps.json` | `npx madge --circular src/` |
| Java | `jdeps -verbose:class -filter:none -e '<base package>.*' target/classes > deps.txt` (class-level edges within the project) | find strongly connected components from the edges in Phase 2 |
| C (file level) | `gcc -MM -Iinclude src/*.c` (which headers each `.c` includes) | headers rarely cycle; use the function graph |
| C (function level) | `cflow --reverse --omit-arguments src/*.c > callers.txt` and `cflow --omit-arguments src/*.c > calls.txt` (GNU cflow) | recursive calls show as `(recursive: see N)` in cflow output |

2. Keep only edges between modules inside the project; drop standard library and third-party nodes (those are handled by `dependency_map`).
3. For C to Rust, port at function granularity (the FFI strangler swaps one function at a time); for the others, port at file or module granularity.

### Output
Internal edge list.

### Quality Gate
- Every source file under the package or `src` directory appears as a node (compare node count with `fd -e py -e js -e java -e c . <src dir> | wc -l` or `find <src dir> -name "*.<ext>" | wc -l`).
- The raw tool output is saved and its command recorded.

---

## Phase 2: Collapse Cycles and Order

### Entry Criteria
- Edge list exists.

### Actions
1. Find strongly connected components (cycles). Use the cycle command output, or compute them from the edge list (Tarjan's algorithm; Python's `networkx.strongly_connected_components` if available, or `graphlib.TopologicalSorter` raises `CycleError` naming one cycle at a time). Each component with more than one node becomes one unit; its files are ported together in one step.
2. Topologically sort units so every unit comes after everything it depends on (leaf first). Python: `graphlib.TopologicalSorter(graph).static_order()` on the collapsed graph.
3. Break ties among units that are ready at the same time with this rule, in order:
   1. Unit containing behaviors with more golden records first (earlier feedback from the corpus).
   2. Fewer lines first (`wc -l`).
   3. Alphabetical by path (deterministic).
4. Set `test_mode` per unit:

| Stack | Can the target call one ported module while the rest is still source? | `test_mode` |
|---|---|---|
| `java-kotlin` | yes, same JVM | `module_corpus` |
| `js-ts` | yes, same runtime | `module_corpus` |
| `c-rust` | yes, through FFI | `module_corpus` |
| `py-ts`, `py-go` | yes for pure functions: golden records call functions directly (`call` field), so a ported module is tested by its own records even though the rest is not ported | `module_corpus` when every behavior in the unit is a function call; `end_to_end_only` for units whose behaviors are CLI or route level |

### Output
`port_order`.

### Quality Gate
- Every node appears in exactly one unit.
- For every unit, every `depends_on` step number is smaller than the unit's step number.
- Re-running the ordering produces the same list (deterministic tie-break).

---

## Phase 3: Sanity Check the Order

### Entry Criteria
- `port_order` exists.

### Actions
1. List the first five units and confirm by reading each file that its imports are only standard library, third-party, or earlier units.
2. Report the largest unit (by lines). If it is a cycle of many files, list the import edges that create the cycle; the user may choose to break one cycle in the source first (a separate, tested change before porting), or port the unit as is.
3. Report units with `test_mode = end_to_end_only`; they will have no parity signal until the entry point is ported, so they go into the risk list.

### Output
Reviewed `port_order` with the risk list.

### Quality Gate
- The first five units were checked by reading their import lines, with the lines quoted.
- The largest unit and every `end_to_end_only` unit are listed in the report.

---

## Worked Example

Illustrative. Python package `ledger` with 14 modules, `stack=py-go`.
```
$ pydeps ledger --show-cycles --no-output
ledger.accounts -> ledger.posting -> ledger.accounts
$ wc -l ledger/*.py | sort -n | head -n 4
   38 ledger/money.py
   52 ledger/dates.py
   97 ledger/accounts.py
  120 ledger/posting.py
```
Order (excerpt):
```
1 ledger/money.py                       depends_on=[]   behaviors=[B-010,B-011] records=96 test_mode=module_corpus
2 ledger/dates.py                       depends_on=[]   behaviors=[B-012]       records=40 test_mode=module_corpus
3 ledger/accounts.py + ledger/posting.py depends_on=[1,2] behaviors=[B-001..B-004] test_mode=module_corpus (cycle)
...
14 ledger/cli.py                        depends_on=[3..13] behaviors=[B-020]   test_mode=end_to_end_only
```
`money.py` comes before `dates.py` because it has more golden records.

---

## Exit Criteria

DONE when every source file belongs to exactly one unit, units are in a deterministic leaf-first order, cycles are collapsed, and units without per-module parity checks are on the risk list.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tool misses dynamic imports (`importlib`, `require(variable)`, reflection) | **Adjust**: grep for them and add edges by hand, marked "manual". |
| Phase 1 | `pydeps` or `cflow` not installed | **Adjust**: install (`pip install pydeps`, distro package `cflow`); for Python, `python -X importtime -c "import <pkg>"` shows import nesting as a fallback. |
| Phase 2 | One cycle contains most of the code | **Return**: report to the user with the cycle edges; porting it as one unit means one very large step. |
| Phase 3 | An early unit imports a later one | **Retry**: the edge list is missing an edge; rerun Phase 1 with the missed import added. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
