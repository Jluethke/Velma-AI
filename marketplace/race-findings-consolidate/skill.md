# Concurrency Findings Consolidation

**One-line description:** Merges every detector, dump and audit report from the concurrency flows into one deduplicated list of race sites ranked by evidence strength, and writes a single root-cause statement naming the shared state, the conflicting accesses and the missing guarantee.

**Execution Pattern:** Phase Pipeline

---

## Inputs

All report inputs come from stack-specific steps. A step skipped by its chain condition provides no value; treat a missing report as empty, never as "clean".

- `failure_class` (string, required): From `race-symptom-triage`.
- `shared_state_inventory` (object[], required): From `race-shared-state-inventory`.
- `go_race_reports` (object[], optional): From `race-go-race-detector`.
- `go_hang_report` (object, optional): From `race-go-goroutine-dump`.
- `cpp_tsan_reports` (object[], optional): From `race-cpp-tsan`.
- `cpp_helgrind_reports` (object[], optional): From `race-cpp-helgrind`.
- `rust_tsan_reports` (object[], optional): From `race-rust-tsan-miri`.
- `loom_results` (object[], optional): From `race-rust-loom`.
- `java_thread_dump_report` (object, optional): From `race-java-thread-dump`.
- `jcstress_results` (object[], optional): From `race-java-jcstress`.
- `py_thread_findings` (object[], optional): From `race-py-thread-race`.
- `py_hang_report` (object, optional): From `race-py-hang-dump`.
- `py_asyncio_debug_findings` (object[], optional): From `race-py-asyncio-debug`.
- `py_blocking_calls` (object[], optional): From `race-py-asyncio-blocking`.
- `py_cancellation_findings` (object[], optional): From `race-py-asyncio-cancellation`.
- `node_rejection_findings` (object[], optional): From `race-node-unhandled-rejection`.
- `node_interleaving_findings` (object[], optional): From `race-node-async-interleaving`.
- `pg_anomaly_report` (object, optional): From `race-db-postgres-isolation`.
- `mysql_anomaly_report` (object, optional): From `race-db-mysql-isolation`.
- `idempotency_gaps` (object[], optional): From `race-idempotency-audit`.

---

## Outputs

- `race_sites` (object[]): Deduplicated rows: `site_id`, `shared_target` (variable, field, row, key, lock), `access_a`, `access_b` (file:line each, or the lock pair for deadlocks), `kind` (`data-race`, `lost-update`, `lock-cycle`, `visibility`, `blocking-in-loop`, `missing-await`, `cancellation`, `unhandled-rejection`, `await-interleaving`, `db-anomaly`, `duplicate-effect`, `leak`), `evidence` (list of report names and the exact line or count from each), `evidence_rank` (from the rank table), `fix_hint` (the fix direction carried from the source report).
- `root_cause` (string): One paragraph: which shared target, which two code paths, what ordering breaks the invariant, and which guarantee is missing (mutual exclusion, happens-before, atomic read-modify-write, consistent lock order, isolation, idempotency, cancellation propagation).

---

## Phase 1: Normalize Every Report

### Entry Criteria
- `failure_class` and `shared_state_inventory` are present.

### Actions
1. Write down which report inputs are present and which are missing. A missing input means the step did not run; say so in the output, never "no issues found".
2. Convert every row of every present report into the `race_sites` row shape. Mapping rules:
   - detector race reports (`go_race_reports`, `cpp_tsan_reports`, `cpp_helgrind_reports`, `rust_tsan_reports`): `access_a`/`access_b` from the two accesses, kind `data-race`, or `lock-cycle` for lock-order reports.
   - hang reports (`go_hang_report`, `java_thread_dump_report`, `py_hang_report`): one row per cycle with the two lock acquisition sites; kind `lock-cycle`, or `leak` for leak classifications.
   - `loom_results`, `jcstress_results` failures: kind `lost-update` or `visibility` per their mapped cause.
   - `py_thread_findings`: kind `lost-update` for read-modify-write, `data-race` otherwise.
   - `py_asyncio_debug_findings`, `py_blocking_calls`, `py_cancellation_findings`: kinds `missing-await`, `blocking-in-loop`, `cancellation`.
   - `node_rejection_findings`: `unhandled-rejection`; `node_interleaving_findings`: `await-interleaving`.
   - `pg_anomaly_report`, `mysql_anomaly_report`: `db-anomaly` with the session script as evidence.
   - `idempotency_gaps`: `duplicate-effect`.
3. For each row, link `shared_target` to an `shared_state_inventory` row by file:line or name. Rows with no match get `shared_target` from the report text and a note "not in inventory".

### Output
Normalized row list with source report names.

### Quality Gate
- The count of normalized rows equals the sum of rows across present reports (write both numbers).
- Every row names its source report.

---

## Phase 2: Deduplicate and Rank

### Entry Criteria
- Normalized rows exist.

### Actions
1. Merge rows whose access pair is the same file:line pair (order ignored) or whose lock pair is the same. Keep every source in `evidence`.
2. Assign `evidence_rank` with this table (1 is strongest):

| Rank | Evidence |
|---|---|
| 1 | A detector report with both stacks (Go `-race`, TSan, Miri, Helgrind and DRD both) or a JVM-detected deadlock |
| 2 | A failing model check or proof test (loom, jcstress FORBIDDEN outcome, controlled-promise test, cancellation test, replay test, two-session database script) |
| 3 | A runtime warning with location (asyncio debug, strict unhandled rejection) or a hand-built wait-for graph from two dumps |
| 4 | Static finding only (lint rule, ruff rule, grep pattern, inventory guard `NONE`) |

3. Sort by rank, then by whether the row's `shared_target` is the value named in `failure_class` evidence.
4. Do not drop rank 4 rows. They stay in `race_sites` and are fixed or explicitly deferred by the user.

### Output
Ranked, deduplicated `race_sites`.

### Quality Gate
- No two rows share the same access pair.
- Every row has an `evidence_rank` from 1 to 4 that matches its strongest evidence item.

---

## Phase 3: Write the Root Cause

### Entry Criteria
- `race_sites` ranked.

### Actions
1. Take the top-ranked rows that explain `failure_class`. If several unrelated rows rank 1, write one root-cause sentence per row.
2. Fill this template exactly: "`<shared_target>` is <written/locked/awaited> at `<access_a>` and <read/written/locked> at `<access_b>` from <contexts>. When <ordering>, <invariant> breaks. The missing guarantee is <guarantee>." Guarantee is one of: mutual exclusion, happens-before (visibility), atomic read-modify-write, consistent lock order, transaction isolation, idempotency, cancellation propagation, non-blocking event loop, rejection handling.
3. Check the root cause against `failure_class`. If they disagree (for example class `deadlock` but the only rank 1 row is a data race), state both and do not hide the disagreement.

### Output
`root_cause`.

### Quality Gate
- `root_cause` contains two file:line references that appear in `race_sites`.
- `root_cause` names exactly one guarantee per sentence from the list in step 2.

---

## Worked Example

Illustrative only.

Present inputs: `failure_class` = `lost-update`, `shared_state_inventory` (row `Store.stock`), `go_race_reports` (1 row: write `reserve.go:51`, read `reserve.go:47`), `go_hang_report` (classification `not-applicable`). All Python, Node, Java, C++, Rust and database reports missing (steps skipped for `stack` = `go`).

Phase 1: 1 normalized row from `go_race_reports`; `go_hang_report` contributes 0.

Phase 2: one row, rank 1.

Phase 3: "`Store.stock` is written at `inventory/reserve.go:51` and read at `inventory/reserve.go:47` from concurrent `Reserve` goroutines. When two goroutines read the same count before either writes, one reservation is lost. The missing guarantee is atomic read-modify-write."

---

## Exit Criteria

DONE when every present report is normalized, rows are deduplicated and ranked, missing reports are listed as not run, and `root_cause` names the target, both accesses and one missing guarantee.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | All report inputs are missing or empty | **Return**: emit `race_sites` from inventory rows with guard `NONE` at rank 4 and a `root_cause` that says no dynamic evidence exists. |
| Phase 2 | Two reports give different line numbers for the same access (different builds) | **Adjust**: rerun the weaker tool on the current commit; record the commit hash with each report. |
| Phase 3 | Root cause and `failure_class` disagree | **Adjust**: report both; the regression test flow must cover each. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
