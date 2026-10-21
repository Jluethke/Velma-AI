# Test Hotspot Classification

**One-line description:** Merges the stack's duration and setup-cost reports into one ranked work plan where every slow test, file or package has exactly one cause class (sleep, network, database, fixture setup, import or transform, process or browser, CPU) and one named fix flow, in descending order of seconds saved per change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): `python`, `node` or `go`. Selects which reports are present.
- `repo_path` (string, required): Repository root.
- `baseline_report` (object, required): From `tsp-baseline-lock`; total wall time and test count.
- `py_duration_report` (object, optional): Present when `stack` is `python`.
- `node_duration_report` (object, optional): Present when `stack` is `node`.
- `go_duration_report` (object, optional): Present when `stack` is `go`.
- `py_setup_cost` (object, optional): Present when `stack` is `python`.
- `node_setup_cost` (object, optional): Present when `stack` is `node`.
- `go_setup_cost` (object, optional): Present when `stack` is `go`.

---

## Outputs

- `hotspot_plan` (object): Ordered list of work items. Each item: target (test ids, files or package), cause class, measured seconds attributable, evidence (`file:line` or report row), fix flow name, and status `todo`. Also the serial-seconds total and the baseline wall time, so parallel headroom is visible.

---

## Phase 1: Select and Check Inputs

### Entry Criteria
- `stack` is one of the three values.

### Actions
1. Pick the two reports for the stack:

| `stack` | Duration report | Setup report |
|---|---|---|
| python | `py_duration_report` | `py_setup_cost` |
| node | `node_duration_report` | `node_setup_cost` |
| go | `go_duration_report` | `go_setup_cost` |

2. Confirm both came from the commit in `baseline_report`. If not, stop.
3. Compute serial seconds: the sum of all test (or file, for Node) durations in the duration report. Compare with the baseline median wall time. If serial seconds are far above wall time, the suite already runs in parallel; if close to it, the suite is serial. Record the ratio as a plain division, with no target attached.

### Output
Selected reports and the serial-to-wall ratio.

### Quality Gate
- Both selected reports carry the baseline commit SHA.
- The ratio is shown with its two operands.

---

## Phase 2: Assign One Cause and One Fix Flow

### Entry Criteria
- Reports selected.

### Actions
1. Walk every tagged row of the duration report and every candidate in the setup report. Map its signal to a cause and a fix flow:

| Signal or candidate | Cause class | Fix flow (`stack` python / node / go) |
|---|---|---|
| `sleep` | sleep | `tsp-py-replace-sleeps` / `tsp-node-fake-timers` / `tsp-go-replace-sleeps` |
| `network` | network | `tsp-py-mock-http-boundary` / `tsp-node-msw-boundary` / `tsp-go-httptest-boundary` |
| `database`, DB fixture "not widenable" | database | `tsp-py-db-transaction-rollback` / `tsp-node-db-transaction-rollback` / `tsp-go-db-txdb-rollback`; add `tsp-pg-template-clone` when the cost is schema creation or migrations on PostgreSQL |
| `fixture_setup` with a widen candidate | fixture scope | Same-stack fix: widen scope in place, one fixture per change, run the full suite after each |
| `file_setup`, `dom_environment`, transform candidate | import or transform | Config change from `node_setup_cost`, one per change |
| `build_bound` | build | `tsp-ci-test-tool-cache` |
| `process_or_browser`, `process` | process or browser | `tsp-pyramid-inventory` then `tsp-pyramid-push-down` |
| `cpu_in_test` | CPU | `tsp-pyramid-inventory` (check for oversized inputs or end-to-end tests doing unit work) |

2. One item per fix action. A file with three sleeping tests is one item if one change fixes all three; otherwise three.
3. Attribute seconds: for a sleep, the literal sleep durations summed over calls; for setup, setup count times seconds per setup from the setup report; otherwise the measured row seconds.
4. Do NOT invent a cause. A row whose signal is missing gets class `unknown` and the fix flow `tsp-py-durations-report` / `tsp-node-durations-report` / `tsp-go-test-json-durations` to re-tag.

### Output
Unordered items with cause, seconds and fix flow.

### Quality Gate
- Every item has exactly one cause class from the table and one fix flow name that exists in this domain.
- Every seconds value traces to a named report row.

---

## Phase 3: Order the Plan

### Entry Criteria
- Items exist.

### Actions
1. Sort items by attributable seconds, descending.
2. Apply ordering rules after the sort, in this order:
   - Items of class sleep, network and database come before parallelization, because parallel runs multiply shared-state failures from real networks and shared databases.
   - Parallelization (`tsp-py-xdist-parallel`, `tsp-node-worker-tuning`, `tsp-go-parallel-flags`) is one item placed after all sleep, network and database items.
   - CI items (`tsp-ci-test-tool-cache`, `tsp-ci-shard-by-timing`, `tsp-changed-test-selection`) come last.
3. Write `hotspot_plan` with status `todo` for every item.
4. Do NOT start fixing in this flow.

### Output
`hotspot_plan`.

### Quality Gate
- Items are in the order the rules define; check by reading the cause column top to bottom.
- `git status --porcelain` shows no edits.

---

## Worked Example

Illustrative. `stack=python`, baseline median 83.9 s, serial seconds 77.8 s (ratio 0.93: the suite runs serially).

- Phase 2 items: `db_with_catalog` 118 setups at 0.27 s = 31.9 s, database, `tsp-py-db-transaction-rollback`; `test_retry_backoff` sleeps 3 x 2 s = 6 s, sleep, `tsp-py-replace-sleeps`; `tests/integrations/test_stripe.py` 4.1 s, network, `tsp-py-mock-http-boundary`; `pricing_table` widen to session, 24 s, fixture scope.
- Phase 3 order: database 31.9, fixture scope 24.0, sleep 6.0, network 4.1, then parallelization, then CI items.

---

## Exit Criteria

DONE when `hotspot_plan` lists every measured hotspot once with one cause, one fix flow, traced seconds, and the ordering rules applied.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The report for `stack` is missing | **Stop**: run the stack's duration and setup flows first. |
| Phase 1 | Reports from a different commit | **Return**: rerun the measurement flows at the baseline commit. |
| Phase 2 | One item seems to need two fix flows | **Adjust**: split it into two items, each with its own seconds. |
| Phase 3 | No items at all | **Return**: report that only parallelization and CI items remain; the plan has those two entries. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
