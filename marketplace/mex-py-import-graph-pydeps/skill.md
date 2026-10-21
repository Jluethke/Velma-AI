# Python Import Graph with grimp and pydeps

**One-line description:** Builds the Python import graph for the monolith with grimp (the engine behind import-linter) and pydeps, then lists every import edge that crosses the candidate module's boundary in both directions, with file and line, plus any import cycle through the candidate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree.
- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`; supplies `candidate_module` and `baseline_sha`.

---

## Outputs

- `py_import_graph` (object): `root_package`, `candidate_package`, `inbound_edges` (importer outside the candidate, imported inside), `outbound_edges` (importer inside, imported outside), each edge with `importer`, `imported`, `line_number`, `line_contents`; `cycles_through_candidate`; `dynamic_import_sites`; and the raw pydeps JSON path.

---

## Phase 1: Install and Build the Graph

### Entry Criteria
- `extraction_brief.stack` == `python`.
- The project's virtual environment can be activated (imports must resolve the same way the app resolves them).

### Actions
1. Activate the project environment, then install the tools into it: `pip install grimp pydeps`. Do not add them to the project's runtime requirements; use the dev or tooling requirements file if the repo has one.
2. Find the top-level package name: the directory that contains `__init__.py` and holds the candidate (for `app/billing` it is `app`). Convert the candidate path to a dotted name: `app/billing` becomes `app.billing`.
3. Confirm grimp can see the package: `python -c "import grimp; g=grimp.build_graph('app'); print(len(g.modules))"`. The number must be greater than the count of `.py` files under the candidate.
4. Produce the pydeps dependency JSON for the record: `pydeps app --show-deps --no-output --max-bacon=0 > /tmp/mex_pydeps.json`. `--max-bacon=0` removes the default two-hop limit; `--no-output` skips drawing. If the repo is large and you also want a picture, run `pydeps app --cluster --max-bacon=2 -T svg -o /tmp/mex_pydeps.svg` (needs Graphviz `dot` on PATH).

### Output
A grimp graph that loads and a pydeps JSON file.

### Quality Gate
- The grimp module count printed in step 3 is greater than zero.
- `/tmp/mex_pydeps.json` is valid JSON: `python -m json.tool /tmp/mex_pydeps.json > /dev/null` exits 0.

---

## Phase 2: Extract Boundary-Crossing Edges

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Write the edge listing to a scratch file outside the repo (for example `/tmp/mex_edges.py`), not into the repo, with this content, then run it with `python /tmp/mex_edges.py`:
   ```python
   import grimp, json
   ROOT, CAND = "app", "app.billing"
   g = grimp.build_graph(ROOT, include_external_packages=False)
   inside = {m for m in g.modules if m == CAND or m.startswith(CAND + ".")}
   out = {"inbound": [], "outbound": []}
   for m in sorted(inside):
       for imp in sorted(g.find_modules_that_directly_import(m)):
           if imp not in inside:
               for d in g.get_import_details(importer=imp, imported=m):
                   out["inbound"].append(d)
       for dep in sorted(g.find_modules_directly_imported_by(m)):
           if dep not in inside:
               for d in g.get_import_details(importer=m, imported=dep):
                   out["outbound"].append(d)
   print(json.dumps(out, indent=1))
   ```
   Each detail dict has `importer`, `imported`, `line_number`, `line_contents`.
2. Find cycles through the candidate. For each outbound target package T (first two dotted segments), run `g.find_shortest_chain(importer=T_module, imported=CAND_module)` for representative modules, or more simply `g.chain_exists(importer="app.orders", imported="app.billing", as_packages=True)` and the reverse. A package that is both imported by and importing the candidate is a cycle; record both chains with `find_shortest_chain`.
3. Find imports grimp cannot see: `rg -n "importlib\.import_module|__import__\(|import_string\(|apps\.get_model\(" "$REPO"`. Django settings strings (`INSTALLED_APPS`, `MIDDLEWARE`, Celery task names as strings) are also invisible; search `rg -n "'app\.billing" "$REPO" --glob "*.py"`. Put every hit in `dynamic_import_sites`.
4. Separate test-only edges: an inbound edge whose importer starts with `tests.` or lives under a `tests/` directory is listed but tagged `test_only: true`.

### Output
`py_import_graph`.

### Quality Gate
- Every edge in `inbound_edges` and `outbound_edges` has a non-empty `line_contents` copied from grimp, not typed by hand.
- Spot check: open three random inbound edges with `sed -n '<line>p' <file>` and confirm the import text matches.
- `cycles_through_candidate` is present (an empty list is a valid result).

---

## Phase 3: Summarize Fan-In and Fan-Out

### Entry Criteria
- Edges extracted.

### Actions
1. Group inbound edges by importing top-level package and by imported candidate module. The candidate module with the most inbound importers is the de facto public API.
2. Group outbound edges by imported package. Outbound edges into shared helper packages (`app.utils`, `app.common`, `app.models`) are tagged `shared_kernel_candidate`.
3. Write `py_import_graph` with the counts table at the top.

### Output
`py_import_graph` with summary tables.

### Quality Gate
- The sum of grouped counts equals the length of the edge lists.

---

## Worked Example

Illustrative. Candidate `app.billing` in package `app`.

```
$ python -c "import grimp; g=grimp.build_graph('app'); print(len(g.modules))"
418
$ python /tmp/mex_edges.py | python -c "import json,sys; d=json.load(sys.stdin); print(len(d['inbound']), len(d['outbound']))"
37 22
```
Top inbound: `app.orders.checkout -> app.billing.models` (line 7, `from app.billing.models import Invoice`), 14 edges from `app.orders`, 9 from `app.admin`, 6 from `tests`. Cycle: `app.billing.tasks -> app.orders.models -> app.billing.models`. Dynamic site: `app/settings.py:88 "app.billing.tasks.send_dunning"` in `CELERY_BEAT_SCHEDULE`.

Summary: `app.billing.models` is imported directly by 23 outside modules, so callers depend on ORM classes, not a service API; this goes to `mex-seam-identification`.

---

## Exit Criteria

DONE when `py_import_graph` lists every grimp-visible edge crossing the boundary with line numbers, every cycle through the candidate, and every dynamic import site.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `grimp.build_graph` raises `ModuleNotFoundError` | **Adjust**: run from the directory that makes the root package importable (`PYTHONPATH=src` for a src layout) and retry. |
| Phase 1 | Namespace package without `__init__.py` | **Adjust**: check the installed grimp version's docs for namespace package support; otherwise build the graph for each subpackage. |
| Phase 2 | API name not found on the graph object | **Stop**: run `python -c "import grimp; help(grimp.build_graph('app'))"` and use the names it prints; do not guess method names. |
| Phase 2 | Script was written inside the repo | **Adjust**: move it to `/tmp`; the repo must stay at `baseline_sha` plus intended changes. |
| Phase 3 | Counts do not add up | **Retry**: regenerate from the JSON, not from memory. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
