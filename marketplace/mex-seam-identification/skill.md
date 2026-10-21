# Seam Identification

**One-line description:** Classifies every dependency edge crossing the candidate's boundary into one decided action (route through the facade, move the code, invert the dependency, replace with an event, or duplicate a small value type), so the module can be cut along seams where behavior can be redirected without editing the callers' logic.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`.
- `py_import_graph` (object, optional): From `mex-py-import-graph-pydeps` when `stack` is `python`.
- `node_import_graph` (object, optional): From `mex-node-import-graph-madge` when `stack` is `node`.
- `go_package_graph` (object, optional): From `mex-go-package-graph` when `stack` is `go`.
- `java_dependency_graph` (object, optional): From `mex-java-dependency-graph-jdeps` when `stack` is `java`.
- `change_coupling` (object, required): From `mex-change-coupling-git-log`.

Exactly one of the four graph inputs is present. Use that one and ignore the others.

---

## Outputs

- `seam_map` (object): `public_api` (candidate symbols called from outside, with caller counts), `edges` (each crossing edge with its `action` and `seam_type`), `move_in` and `move_out` lists, `shared_kernel` (value types both sides keep), and `order_of_work`.
- `boundary_violations` (object[]): Each inbound edge that reaches past the public API into internals (repository, ORM model, private helper), with file and line.

---

## Phase 1: Define the Public API

### Entry Criteria
- One graph input is present and non-empty.

### Actions
1. From the graph's inbound edges, list each candidate symbol or file imported from outside with its caller count.
2. Find symbols actually used, not just imported. For each inbound file, search the importer for usage: `rg -n "\b(InvoiceService|create_invoice|Invoice)\b" <importer file>`. Record the call shape (function call, attribute access on a returned ORM object, subclassing, type annotation only).
3. Mark a candidate symbol as `public_api` if it is a service function, class method or handler intended for callers. Mark it as `internal` if it is a repository, ORM model, query builder, private helper (Python leading underscore, Go lowercase identifier, Java package-private, TS non-exported from the barrel), or a table-backed entity.
4. Every inbound edge into an `internal` symbol goes into `boundary_violations` with file and line.

### Output
`public_api` list and `boundary_violations`.

### Quality Gate
- Every inbound edge from the graph appears exactly once, either as a `public_api` use or as a `boundary_violations` entry.

---

## Phase 2: Decide an Action per Edge

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Apply this decision table to every crossing edge, top row first, and stop at the first match:

   | # | Condition (check in order) | Action | Seam type |
   |---|---|---|---|
   | 1 | Outbound edge to code that only the candidate calls (check: the target has no other inbound edges in the graph) | `move_in`: the target moves into the candidate | none |
   | 2 | Inbound edge from code that only calls the candidate and belongs to its domain (for example `orders/invoice_pdf.py` used only by billing) | `move_in` | none |
   | 3 | Edge is to or from an immutable value type with no behavior (Money, Currency, Address DTO) | `shared_kernel`: copy or keep in a tiny shared package, never share ORM classes | none |
   | 4 | Inbound edge reads candidate data through an ORM model or repository | `route_via_facade`: replace with a call to a public API function returning a DTO | object seam |
   | 5 | Inbound edge calls a public API function synchronously and needs the result to continue | `route_via_facade` | object seam |
   | 6 | Inbound edge triggers candidate work whose result the caller does not use in the same request | `replace_with_event`: publish a domain event, candidate subscribes | event seam |
   | 7 | Outbound edge where the candidate calls back into the monolith for data it needs | `invert_dependency`: candidate defines an interface (port), monolith provides the adapter | object seam |
   | 8 | Edge exists only in tests | `test_only`: fix in the test after the production edge is fixed | none |
   | 9 | Anything else | `open_question` with the edge and why no row fits | none |

2. Add `hidden_coupling` pairs from `change_coupling` as extra edges. They always get action `route_via_facade` or `replace_with_event` by rows 4 to 6, because the behavior they duplicate must come from one owner.
3. For a cycle through the candidate, the edge on the side that points from the candidate to the monolith gets `invert_dependency` (row 7). Do not try to break a cycle by moving the whole other module in.

### Output
Every edge with `action` and `seam_type`.

### Quality Gate
- Zero edges lack an `action`.
- `open_question` count is reported, and each has a reason.

---

## Phase 3: Order the Work

### Entry Criteria
- Every edge has an action.

### Actions
1. Order of work, fixed: (a) `move_in` items, (b) `shared_kernel` items, (c) introduce the facade functions needed by `route_via_facade` edges, (d) switch callers to the facade one importer file per commit, (e) `invert_dependency` ports, (f) `replace_with_event`, (g) `test_only` cleanups.
2. Each step in `order_of_work` names exactly one file or one symbol. Do not plan steps that edit many unrelated files in one commit; a weak model loses track and a reviewer cannot bisect.
3. After each planned step, the test command from `extraction_brief.test_command` must pass. Write that check into every step.

### Output
`seam_map` with `order_of_work`.

### Quality Gate
- Every step in `order_of_work` has one target and a test command.

---

## Worked Example

Illustrative. Python candidate `app.billing`. Inbound edges: 37; hidden coupling pairs: 2.

| Edge | Row | Action |
|---|---|---|
| `app.orders.checkout -> app.billing.models.Invoice` (`Invoice.objects.create(...)`) | 4 | `route_via_facade` to new `billing.api.create_invoice(order_id, lines) -> InvoiceDTO` |
| `app.admin.reports -> app.billing.models.Invoice` (read-only query) | 4 | `route_via_facade` to `billing.api.list_invoices(filters)` |
| `app.orders.signals -> app.billing.tasks.send_dunning.delay` | 6 | `replace_with_event` `OrderPaymentFailed` |
| `app.billing.tasks -> app.orders.models.Order` | 7 | `invert_dependency`: `billing.ports.OrderLookup` protocol, adapter in orders |
| `app.billing.money.Money` used by orders | 3 | `shared_kernel` |

`boundary_violations`: 23 (all ORM model imports). `order_of_work` step 4: "Change `app/orders/checkout.py` line 7 and the call at line 112 to use `billing.api.create_invoice`; run `pytest -q tests/orders tests/billing`".

---

## Exit Criteria

DONE when every crossing edge has exactly one action, internals reached from outside are listed as violations, and the work is ordered into one-target steps each with a test command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No graph input is present | **Stop**: run the stack's graph flow first. |
| Phase 1 | Inbound edges in the thousands | **Adjust**: group by importing module and by imported symbol, decide per group, then expand. |
| Phase 2 | More than half the edges are `open_question` | **Return**: the candidate boundary is probably wrong; return to the user with the edge groups and ask whether to shrink or grow the candidate. |
| Phase 3 | A step needs two files changed at once to compile | **Adjust**: add a temporary adapter or re-export so each step compiles alone. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
