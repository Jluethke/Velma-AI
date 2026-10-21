# PostgreSQL EXPLAIN ANALYZE Reading

**One-line description:** Runs `EXPLAIN (ANALYZE, BUFFERS, SETTINGS)` safely on each slow PostgreSQL query and reads the plan node by node to name the exact cause: row estimate error, filter after scan, wrong join method, sort or hash spilling to disk, heap fetches on an index-only scan, or per-loop cost multiplication.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`. Supplies the allowed actions per environment.
- `slow_query_list` (object[], required): From `sqlo-pg-stat-statements-capture`.
- `captured_plans` (object[], required): From `sqlo-pg-auto-explain-capture`. Real plans with real parameter values.

---

## Outputs

- `plan_findings` (object[]): Per query: the plan text, the node where most time is spent, and one or more findings from the fixed finding list in Phase 3, each with the plan line that proves it.

---

## Phase 1: Prepare a Runnable Statement

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.

### Actions
1. Take the normalized query from `slow_query_list` and fill `$1`, `$2`, ... with the real values from `captured_plans` (the `Query Text` plus logged parameters) or from the application log. Never invent values; a plan for a made-up value can differ from the slow one.
2. If the application uses prepared statements, the server may use a generic plan after five executions (`plan_cache_mode = auto`). To see that plan: `PREPARE q(bigint, text) AS <query>; SET plan_cache_mode = force_generic_plan; EXPLAIN (ANALYZE, BUFFERS) EXECUTE q(8812, 'shipped');`. Record both custom and generic plans when they differ.
3. Set a guard before running: `SET statement_timeout = '<user value>';` using a limit the user approves.
4. If the statement is INSERT, UPDATE or DELETE: EXPLAIN ANALYZE executes it. Wrap it: `BEGIN; EXPLAIN (ANALYZE, BUFFERS) <stmt>; ROLLBACK;`. On `production_primary` follow the allowed-actions table in `tuning_scope`; row locks are still taken until the ROLLBACK.

### Output
Runnable statement with real parameters and guards set.

### Quality Gate
- Every parameter value has a recorded source (captured plan, app log, or user).
- For DML, the command text contains `BEGIN` before and `ROLLBACK` after the EXPLAIN.

---

## Phase 2: Run EXPLAIN

### Entry Criteria
- Phase 1 complete.

### Actions
1. Run `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS) <stmt>;`. `SETTINGS` exists from PostgreSQL 12 and lists planner settings that differ from default. On PostgreSQL 13 and later add `WAL` for DML. On PostgreSQL 18, BUFFERS is included by default with ANALYZE; writing it explicitly is still valid.
2. Run it twice and keep the second run as the warm-cache result. Record the first run's `Buffers: shared read` as the cold-cache cost.
3. Save the full text output. Paste it into a plan viewer only if the user allows sending SQL to a third party (for example explain.depesz.com or explain.dalibo.com).

### Output
Plan text for each query.

### Quality Gate
- Each saved plan ends with `Planning Time:` and `Execution Time:` lines, which proves ANALYZE ran.
- Each plan has `Buffers:` lines.

---

## Phase 3: Read the Plan

### Entry Criteria
- Phase 2 complete.

### Actions
1. Read from the most indented node outward. For each node, `actual time=A..B` is per loop in milliseconds; total node time is `B x loops`. Row count is also per loop: total rows = `rows x loops`.
2. Find the node with the largest exclusive time (its total minus its children's totals). That is the bottleneck node. Record it.
3. Check each rule and record every match as a finding with the plan line:

| Plan evidence | Finding | Next flow |
|---|---|---|
| `rows=` estimate and actual `rows=` differ by a large factor on a scan or join input | `estimate_error` | `sqlo-pg-statistics-analyze` |
| `Rows Removed by Filter:` large compared to rows returned, on a Seq Scan or Index Scan | `filter_after_scan` | `sqlo-sargable-rewrite`, then `sqlo-btree-composite-order` |
| `Seq Scan` on a large table returning few rows | `missing_index` | `sqlo-btree-composite-order` |
| `Index Scan` using an index whose columns only partly match the WHERE, with `Filter:` on the other columns | `partial_index_match` | `sqlo-btree-composite-order` |
| `Sort Method: external merge  Disk: N kB` | `sort_spill` | index matching ORDER BY, or raise `work_mem` for that query only |
| `Hash` node with `Batches:` greater than 1 | `hash_spill` | `work_mem` for that query, or reduce input rows |
| `Index Only Scan` with `Heap Fetches:` close to rows returned | `visibility_map_stale` | `sqlo-pg-vacuum-bloat` |
| `Nested Loop` whose inner side has `loops=` in the thousands or more and a Seq Scan or slow index inside | `nested_loop_amplification` | index on the inner join key, or fix `estimate_error` |
| `Limit` over `Index Scan Backward` with large `Rows Removed by Filter` | `order_by_index_filter_trap` | composite index (filter columns, then sort column) |
| `Buffers: shared read` dominates `shared hit` | `cold_or_too_large` | covering or narrower index; check cache size |
| `JIT:` block with `Timing:` total near the execution time | `jit_overhead` | test with `SET jit = off` for that query |
| `SubPlan` executed per row (`loops=` equal to outer rows) | `correlated_subplan` | `sqlo-sargable-rewrite` (EXISTS or JOIN) |

4. Do not decide a fix in this flow. Record findings only.

### Output
`plan_findings`.

### Quality Gate
- Every finding quotes the exact plan line that matches the rule.
- The bottleneck node is identified with its exclusive time computed from `actual time` and `loops`.

---

## Worked Example

Illustrative only.

Input query: `SELECT * FROM orders WHERE customer_id = 8812 AND status = 'shipped' ORDER BY created_at DESC LIMIT 20;`

Phase 2:
```
Limit  (cost=0.56..412.30 rows=20 width=212) (actual time=0.041..7.390 rows=20 loops=1)
  Buffers: shared hit=31 read=1180
  ->  Index Scan Backward using orders_created_at_idx on public.orders  (cost=0.56..2.1e6 rows=101 width=212) (actual time=0.040..7.386 rows=20 loops=1)
        Filter: ((orders.customer_id = 8812) AND (orders.status = 'shipped'::text))
        Rows Removed by Filter: 118440
        Buffers: shared hit=31 read=1180
Planning Time: 0.210 ms
Execution Time: 7.420 ms
```
Phase 3 findings: `order_by_index_filter_trap` (Index Scan Backward plus `Rows Removed by Filter: 118440`), `cold_or_too_large` (read=1180 vs hit=31), `estimate_error` (estimated 101 matching rows; real count from `SELECT count(*)` was 3,912). Bottleneck: the Index Scan node, 7.386 ms of 7.420 ms.

---

## Exit Criteria

DONE when each slow query has a saved ANALYZE plan, a bottleneck node, and findings from the fixed list, each with its proving line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No real parameter values available | **Return**: ask the user for values from logs; meanwhile use `EXPLAIN` without ANALYZE and mark the result `estimate_only`. |
| Phase 2 | `canceling statement due to statement timeout` | **Adjust**: run `EXPLAIN (BUFFERS)` without ANALYZE for the plan shape, and record the timeout as proof of slowness. |
| Phase 2 | DML on `production_primary` not allowed by scope | **Stop**: run on a `production_like` copy instead. |
| Phase 3 | Plan matches no rule | **Adjust**: record the bottleneck node and its line as `unclassified`; do not invent a cause. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
