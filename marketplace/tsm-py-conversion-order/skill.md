# Python Annotation Order from the Import Graph

**One-line description:** Builds the package's internal import graph with grimp, collapses import cycles into single units, and emits a leaf-first module order so each module is annotated only after the modules it imports already export real types.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): Supplies `source_roots` and the importable top-level package names.

---

## Outputs

- `py_conversion_order` (object[]): Ordered units. Each unit has `modules` (one dotted module name, or every module of one import cycle), `depth`, `importers` (number of internal modules importing it), and `strict_errors` (count for those modules from `py_error_baseline` when available).

---

## Phase 1: Build the Graph

### Entry Criteria
- The package imports in the project environment: `python -c "import <package>"` succeeds.

### Actions
1. Install grimp pinned into the dev environment (it is a graph library used by import-linter): `pip install grimp==<latest from pip index versions grimp>` or `uv add --dev grimp`. Run `python -c "import grimp; print(grimp.__version__)"` if available, else `pip show grimp`.
2. Dump the edges of the internal graph. `build_graph` takes top-level package names, not paths:
   ```
   python -c "import grimp,json;g=grimp.build_graph('billing');print(json.dumps({m:sorted(g.find_modules_directly_imported_by(m)) for m in g.modules}))" > .typecheck-logs/py-deps.json
   ```
   For several top-level packages pass them all: `grimp.build_graph('billing', 'shared')`.
3. Check the method names exist in the installed grimp: `python -c "import grimp;g=grimp.build_graph('billing');print([n for n in dir(g) if not n.startswith('_')])"`. If `find_modules_directly_imported_by` is not listed, read the grimp docs for the installed version; do not guess a name.
4. Confirm module count: `python -c "import json;print(len(json.load(open('.typecheck-logs/py-deps.json'))))"` and compare with `find src/billing -name "*.py" | wc -l`. Namespace packages without `__init__.py` and scripts outside the package explain differences; list them.
5. Imports inside `if TYPE_CHECKING:` blocks are included by grimp because they are real import statements; that is correct for typing order.

### Output
`py-deps.json`.

### Quality Gate
- Module count matches the file count, with every difference explained.
- Every key in the JSON is a dotted module name under the requested packages.

---

## Phase 2: Compute the Order

### Entry Criteria
- Phase 1 output exists.

### Actions
1. Peel leaves level by level; when only cycles remain, release the module with the fewest unmet imports and tag it `CYCLE`:
   ```
   python -c "import json;g=json.load(open('.typecheck-logs/py-deps.json'));d={};left=set(g);lvl=0
   un=lambda m:len([x for x in g[m] if x in g and x not in d and x!=m])
   while left:
       r=[m for m in left if un(m)==0]
       if not r:
           r=[min(left,key=un)];print('CYCLE',r[0])
       for m in r:d[m]=lvl
       left-=set(r);lvl+=1
   [print(l,m) for m,l in sorted(d.items(),key=lambda t:t[1])]" > .typecheck-logs/py-order.txt
   ```
   Package `__init__` modules often import their submodules; when a package and its submodule import each other, they form a cycle unit.
2. For each `CYCLE` module, find the other members: `python -c "import grimp;g=grimp.build_graph('billing');print(g.find_shortest_chain(importer='billing.a', imported='billing.b'))"` between the tagged module and each module it imports at the same or higher level. Merge members into one unit at the highest member depth.
3. Count importers per module from the JSON (how many keys list it).
4. Order units by depth ascending; within one depth, more importers first; ties broken by fewer `strict_errors` first (quick wins publish types sooner).

### Output
`py_conversion_order`.

### Quality Gate
- Every module in `py-deps.json` appears in exactly one unit.
- For five sampled units, every internal import listed in `py-deps.json` points to an earlier unit or the same cycle unit.

---

## Worked Example

Illustrative only. Package `billing`, 120 modules.

Phase 1: 120 modules in the JSON, 120 `.py` files.

Phase 2 head of `py-order.txt`:
```
0 billing.money
0 billing.settings
0 billing.errors
1 billing.models.customer
CYCLE billing.models.invoice
2 billing.models.invoice
2 billing.models.line_item
```
`find_shortest_chain` shows `billing.models.invoice` imports `billing.models.line_item` and back, so they form one unit at depth 2. `billing.money` has 31 importers and goes first.

---

## Exit Criteria

DONE when every internal module is in exactly one ordered unit, cycles are explicit units, and no unit precedes a module it imports.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `build_graph` fails with ModuleNotFoundError | **Adjust**: install the project into the environment (`pip install -e .`) or run from the `src` directory so the package is importable. |
| Phase 1 | Module count far below file count | **Adjust**: the package uses implicit namespace packages; check the grimp docs for namespace support in the installed version and list missing modules by hand. |
| Phase 2 | One cycle holds a large part of the package | **Return**: report the cycle to the user; breaking it is a refactor that belongs before the migration. |
| Phase 2 | Dynamic imports (`importlib.import_module` with a variable) | **Adjust**: grimp cannot see them; grep for `import_module(` and place the targets by hand. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
