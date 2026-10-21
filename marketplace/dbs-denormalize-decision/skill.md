# Denormalize Decision

**One-line description:** Decides, per hot access pattern, whether to keep the normalized form or add one specific denormalization (counter cache, stored generated column, materialized view, copied attribute, or JSON column), and requires a measured reason, a named sync mechanism, and a reconciliation query for every one added.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `normalized_schema` (object, required): 3NF schema from `dbs-normalize-to-3nf`.
- `access_patterns` (object[], required): Access patterns with `hot` marks and join counts.
- `latency_targets` (object, optional): Per `ap_id` latency target and percentile, supplied by the user or an SLO document. Without it, no denormalization is justified by latency.

---

## Outputs

- `logical_schema` (object): `normalized_schema` plus every accepted denormalization, each tagged with its sync mechanism.
- `denormalization_log` (object[]): One row per candidate: `ap_id`, problem, measurement, option chosen or "keep normalized", sync mechanism, reconciliation query, owner.

---

## Phase 1: Find Candidates

### Entry Criteria
- `normalized_schema` and `access_patterns` present.

### Actions
1. List every access pattern marked `hot` that needs a join, an aggregate (`COUNT`, `SUM`) over child rows, or a sort on a column from another relation.
2. For each candidate, write the exact SQL the normalized schema needs.
3. If a database with representative data exists, run `EXPLAIN (ANALYZE, BUFFERS)` (PostgreSQL) or `EXPLAIN ANALYZE` (MySQL 8.0.18 and later) for that SQL and record execution time and rows. If no such database exists, record "not measured".
4. A candidate stays a candidate only if `latency_targets` has a target for it and the measurement misses it. Otherwise record "keep normalized: no measured miss".

### Output
Candidate list with SQL and measurements.

### Quality Gate
- Every candidate has its SQL and either a measured time from `EXPLAIN ANALYZE` output or "not measured".
- Zero candidates advance without a target from `latency_targets`.

---

## Phase 2: Pick the Option

### Entry Criteria
- At least one candidate with a measured miss. If none, skip to Phase 3 and emit `logical_schema` equal to `normalized_schema`.

### Actions
1. First try an index (record it for `dbs-index-from-access-patterns`) and a query rewrite. Re-measure. Only if both still miss, continue.
2. Choose exactly one option per candidate from this table:

| Problem shape | Option | Sync mechanism |
|---|---|---|
| Count or sum of children read far more often than children change | Counter cache column on the parent (`order.line_count`) | Update in the same transaction as the child write, or a trigger |
| Value computed only from columns of the same row | Stored generated column (`GENERATED ALWAYS AS (...) STORED`, PostgreSQL 12+ and MySQL 5.7+) | The database computes it; no app code |
| Expensive report over many rows that may be stale by a known interval | Materialized view (PostgreSQL) or summary table (MySQL) | `REFRESH MATERIALIZED VIEW CONCURRENTLY` on a schedule (requires a unique index on the view) or a scheduled job |
| Parent attribute needed to filter or sort child rows | Copy the attribute to the child (`order_line.customer_id`) | Same-transaction write; foreign key or check that it matches the parent |
| Sparse attributes that vary per row type and are never joined on | `jsonb` column (PostgreSQL) or `JSON` (MySQL) | None; validate shape with a `CHECK` or in the app |

3. Write the reconciliation query that finds rows where the denormalized value disagrees with the source. Example for a counter cache:
   ```sql
   SELECT o.id, o.line_count, COUNT(l.id) AS actual
   FROM orders o LEFT JOIN order_lines l ON l.order_id = o.id
   GROUP BY o.id, o.line_count
   HAVING o.line_count <> COUNT(l.id);
   ```
4. Name the owner who runs the reconciliation and how often (user input; do not invent a schedule).

### Output
Accepted denormalizations with sync and reconciliation.

### Quality Gate
- Every accepted denormalization has a re-measurement showing the index and rewrite alone still miss.
- Every accepted denormalization has a sync mechanism and a reconciliation query that runs without a syntax error on the target engine.

---

## Phase 3: Emit the Logical Schema

### Entry Criteria
- Decisions made.

### Actions
1. Copy `normalized_schema` to `logical_schema` and add each accepted column, view, or table, tagged `denormalized: <log row>`.
2. Emit `denormalization_log` including every "keep normalized" decision.

### Output
`logical_schema`, `denormalization_log`.

### Quality Gate
- The number of `denormalized:` tags in `logical_schema` equals the number of accepted rows in `denormalization_log`.

---

## Common Mistakes To Avoid

- Do not denormalize because a join "might be slow". No measurement, no denormalization.
- Do not add a counter cache updated by a separate background job unless stale counts are acceptable to the spec owner, in writing.
- Do not use plain `REFRESH MATERIALIZED VIEW` on a view read by live traffic; it takes an `ACCESS EXCLUSIVE` lock. Use `CONCURRENTLY`, which needs a unique index.
- Do not confuse a historical snapshot (price paid) with denormalization. Snapshots need no sync.

---

## Worked Example

Illustrative only. AP01 "list orders with line count" is hot; `latency_targets` says AP01 p95 under a user-set target.

Phase 1: SQL joins `orders` and `order_lines` with `GROUP BY`. `EXPLAIN (ANALYZE, BUFFERS)` shows `Execution Time` above the target with a `HashAggregate` over all lines of the customer.

Phase 2: index `order_lines(order_id)` already exists; rewrite to a lateral count still misses. Option: counter cache `orders.line_count integer NOT NULL DEFAULT 0`, maintained in the same transaction as line insert and delete. Reconciliation query above returns 0 rows on the test copy.

Phase 3: `logical_schema` gains `orders.line_count` tagged `denormalized: D1`. Log has D1 accepted and AP03 "keep normalized: no measured miss".

---

## Exit Criteria

DONE when every hot pattern has a decision, every accepted denormalization has a measurement, sync mechanism, reconciliation query, and owner, and `logical_schema` reflects exactly the accepted rows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No representative data to measure | **Adjust**: record "not measured" and keep normalized; revisit after data exists. |
| Phase 1 | `latency_targets` absent | **Adjust**: keep every pattern normalized and list them as open questions. |
| Phase 2 | No owner for reconciliation | **Return**: ask the user to name one; do not accept the denormalization without one. |
| Phase 2 | Reconciliation query finds mismatches on test data | **Retry**: fix the sync mechanism and rerun until 0 rows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
