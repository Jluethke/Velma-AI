# New Index Write Cost Measurement

**One-line description:** Measures what each candidate index costs on the write path before it reaches production (write throughput and latency with pgbench or sysbench/mysqlslap, index size, lost PostgreSQL HOT updates, GIN pending-list growth) and approves only indexes whose measured read gain and write loss fit the user's acceptance criteria.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`. Supplies `db_engine`, environment class and `acceptance_criteria`.
- `index_candidates` (object[], required): From `sqlo-pg-gin-index-select` (PostgreSQL) or `sqlo-mysql-innodb-index-design` (MySQL).
- `schema_ddl` (string, required): Table and index definitions.

---

## Outputs

- `write_cost_report` (object[]): Per candidate: index size, write throughput and latency without and with the index, HOT update share change (PostgreSQL), and the read gain from the design flows.
- `approved_indexes` (object[]): Candidates approved for production, each with DDL, any `drop_after_build` indexes, and the measured numbers that justify it.

---

## Phase 1: Write Workload and Current Write Profile

### Entry Criteria
- `tuning_scope.environment_class` is `production_like` (benchmarks are not allowed on production per the scope table; `dev` results are recorded but do not count).

### Actions
1. Measure the table's real write mix on production (read-only catalog queries):
   - PostgreSQL: `SELECT relname, n_tup_ins, n_tup_upd, n_tup_hot_upd, n_tup_del FROM pg_stat_user_tables WHERE relname = 'orders';` HOT share = `n_tup_hot_upd / n_tup_upd`.
   - MySQL: `SELECT OBJECT_NAME, COUNT_INSERT, COUNT_UPDATE, COUNT_DELETE FROM performance_schema.table_io_waits_summary_by_table WHERE OBJECT_SCHEMA = DATABASE() AND OBJECT_NAME = 'orders';`
2. Find the real write statements for the table from `pg_stat_statements` or the MySQL digest table (INSERT, UPDATE, DELETE on it) and note which columns each UPDATE sets.
3. Write a benchmark script reproducing that mix with realistic values.
   - PostgreSQL `write.sql` for pgbench:
```
\set id random(1, 41000000)
UPDATE orders SET status = 'shipped', updated_at = now() WHERE id = :id;
INSERT INTO orders (customer_id, status, total, created_at) VALUES (:id % 900000, 'new', 19.99, now());
```
   - MySQL: `mysqlslap --create-schema=shop --query=write.sql --concurrency=C --iterations=I --no-drop` (C and I chosen with the user), or sysbench with a custom Lua script.
4. Choose concurrency and duration with the user from production connection counts; record them.

### Output
Write mix, benchmark script, run parameters.

### Quality Gate
- The benchmark script's statements are copied from the captured write statements, not invented shapes.
- Concurrency and duration are recorded with their source.

---

## Phase 2: Measure Without and With

### Entry Criteria
- Phase 1 complete.

### Actions
1. Baseline run, without the candidate: `pgbench -n -f write.sql -c C -j J -T T -r -P 10 shop`. `-n` skips vacuuming pgbench's own tables; `-r` reports per-statement latency; `-P 10` prints progress every 10 seconds. Record `tps` (excluding connection time where shown), `latency average` and per-statement latency.
2. Repeat the baseline at least three times and record each; the spread is the noise floor.
3. Build the candidate on the copy (plain `CREATE INDEX` is fine on a copy), run `ANALYZE` or `ANALYZE TABLE`, repeat the same runs three times.
4. PostgreSQL: after each run read `n_tup_upd` and `n_tup_hot_upd` deltas. Any column that is in any index (key, INCLUDE, partial predicate, expression) and is changed by an UPDATE makes that update non-HOT on PostgreSQL versions before 16; PostgreSQL 16 and later exclude BRIN-only columns from this rule. A falling HOT share means more index and WAL writes.
5. Size: PostgreSQL `SELECT pg_size_pretty(pg_relation_size('idx_name'));`; MySQL `SELECT stat_value * @@innodb_page_size AS bytes FROM mysql.innodb_index_stats WHERE table_name = 'orders' AND index_name = 'idx_name' AND stat_name = 'size';`
6. GIN candidates: after the run, `SELECT * FROM pgstatginindex('idx_name');` (from the `pgstattuple` extension) shows `pending_pages` and `pending_tuples`.

### Output
`write_cost_report`.

### Quality Gate
- Three baseline and three with-index runs are recorded with their raw pgbench, mysqlslap or sysbench summary lines.
- Size is recorded for every candidate.
- The difference in tps is compared with the baseline spread, and stated as within noise or outside noise.

---

## Phase 3: Approve or Reject

### Entry Criteria
- Phase 2 complete.

### Actions
1. Apply:

| Measured | Decision |
|---|---|
| Write loss within noise, read gain measured in the design flow | approve |
| Write loss outside noise and within `acceptance_criteria` allowed loss | approve, record the loss |
| Write loss outside the allowed loss | reject; return to the design flow for a narrower, partial, or non-covering version |
| `acceptance_criteria` has no allowed write loss | **do not approve**; return the numbers to the user as an open question |
| Candidate makes an existing index redundant | measure again with the redundant index dropped on the copy; record both results |

2. Do not round numbers toward approval. Report the median of the three runs and the range.
3. Write `approved_indexes` with DDL, `drop_after_build` indexes, and the numbers.

### Output
`approved_indexes`.

### Quality Gate
- Every approved index cites a numeric allowed loss from `acceptance_criteria`, or a loss within the measured noise floor.
- Every rejected index has its numbers and the reason.

---

## Worked Example

Illustrative only.

Input candidate: `CREATE INDEX orders_cust_status_created_idx ON orders (customer_id, status, created_at DESC);` Allowed write loss in `acceptance_criteria`: 5 percent.

Phase 1: production HOT share 0.71. Writes: `UPDATE orders SET status = ..., updated_at = now() WHERE id = $1` and inserts.

Phase 2:
```
$ pgbench -n -f write.sql -c 16 -j 4 -T 120 -r shop
tps = 4211.8 (without initial connection time)    # baseline runs: 4211.8, 4188.0, 4240.3
tps = 3902.4 (without initial connection time)    # with index:   3902.4, 3925.1, 3880.6
```
HOT share fell from 0.71 to 0.02 because `status` is now indexed and every update changes it. Index size 1.9 GB.

Phase 3: median loss (4211.8 to 3902.4) is 7.3 percent, outside noise and above 5 percent: rejected. Returned to design: a partial index `(customer_id, created_at DESC) WHERE status = 'shipped'` was tested next and lost 2.1 percent (within allowance), approved.

---

## Exit Criteria

DONE when each candidate has measured write cost, size and (on PostgreSQL) HOT impact, and is approved or rejected against a stated number.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `production_like` environment | **Stop**: report that write cost cannot be verified; do not approve. |
| Phase 2 | Run-to-run spread larger than the difference | **Retry**: lengthen `-T` or pin CPU and rerun; if still noisy, record the loss as unmeasurable and ask the user. |
| Phase 2 | Benchmark fails with deadlocks | **Adjust**: use realistic id distributions; random ids across a large range reduce artificial contention. |
| Phase 3 | No allowed loss in acceptance criteria | **Return**: give the user the numbers and ask for a decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
