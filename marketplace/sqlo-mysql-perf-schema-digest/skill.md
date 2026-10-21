# MySQL performance_schema Digest Analysis

**One-line description:** Reads `performance_schema.events_statements_summary_by_digest` and the `sys` schema views to find statements that scan without an index, spill to disk temp tables or sort-merge, and to list unused and redundant indexes, without enabling any log.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `slow_query_list` (object[], required): From `sqlo-mysql-slow-log-capture`. Used to match digests to slow log fingerprints.

---

## Outputs

- `digest_findings` (object): Per digest: no-index and no-good-index counts, disk temp tables, sort merge passes, rows examined per row sent; plus unused indexes and redundant indexes with the uptime they were measured over.

---

## Phase 1: Confirm Instrumentation

### Entry Criteria
- `tuning_scope.db_engine` == `mysql`.

### Actions
1. `SELECT @@performance_schema;` must return `1`. It is read-only at runtime; enabling it needs `performance_schema=ON` in the config and a restart (default ON since MySQL 5.6.6).
2. Check the digest consumer: `SELECT NAME, ENABLED FROM performance_schema.setup_consumers WHERE NAME IN ('statements_digest','events_statements_current');`. Both should be `YES` (the defaults).
3. Record the server uptime: `SHOW GLOBAL STATUS LIKE 'Uptime';`. Digest counters and index usage counters accumulate since startup or since the last truncate, so every finding is relative to this period.
4. Check the `sys` schema exists: `SELECT sys_version FROM sys.version;`.

### Output
Instrumentation confirmed, measurement period recorded.

### Quality Gate
- `@@performance_schema` = 1 and `statements_digest` = `YES` are recorded.
- `Uptime` in seconds is recorded.

---

## Phase 2: Read Statement Digests

### Entry Criteria
- Phase 1 complete.

### Actions
1. Top digests by total latency. Timer columns are in picoseconds; divide by 1e12 for seconds.
```
SELECT DIGEST, SCHEMA_NAME, COUNT_STAR,
       ROUND(SUM_TIMER_WAIT/1e12,1) AS total_s,
       ROUND(AVG_TIMER_WAIT/1e9,2)  AS avg_ms,
       SUM_ROWS_EXAMINED, SUM_ROWS_SENT,
       SUM_NO_INDEX_USED, SUM_NO_GOOD_INDEX_USED,
       SUM_CREATED_TMP_DISK_TABLES, SUM_SORT_MERGE_PASSES,
       LEFT(DIGEST_TEXT, 200) AS q
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = DATABASE()
ORDER BY SUM_TIMER_WAIT DESC LIMIT 20;
```
2. MySQL 8.0 also has `QUERY_SAMPLE_TEXT` in that table: a real statement with literal values, which you can paste into `EXPLAIN`. Record it per digest.
3. Full scans: `SELECT * FROM sys.statements_with_full_table_scans LIMIT 20;`. Temp tables on disk: `SELECT * FROM sys.statements_with_temp_tables ORDER BY disk_tmp_tables DESC LIMIT 20;`. Sorts: `SELECT * FROM sys.statements_with_sorting ORDER BY sort_merge_passes DESC LIMIT 20;`.
4. Match digests to `slow_query_list` entries by normalized text. A digest present here but absent from the slow log is fast per call but costly in total; keep it.
5. Classify each digest:

| Counter | Meaning | Next flow |
|---|---|---|
| `SUM_NO_INDEX_USED` > 0 | at least one table read by full scan | `sqlo-mysql-explain-analyze-read`, then index design |
| `SUM_NO_GOOD_INDEX_USED` > 0 | optimizer found no good index for a join | index design for the join column |
| `SUM_CREATED_TMP_DISK_TABLES` > 0 | GROUP BY / DISTINCT / UNION spilled to disk | rewrite or covering index on GROUP BY columns |
| `SUM_SORT_MERGE_PASSES` > 0 | sort did not fit in `sort_buffer_size` | index that matches ORDER BY |
| examined to sent ratio large | filter applied after reading rows | sargability rewrite, then index |

### Output
Per-digest classification.

### Quality Gate
- Every digest in the top 20 has its counters and a class from the table.
- Time values are converted from picoseconds with the conversion shown in Action 1.

---

## Phase 3: Index Usage Inventory

### Entry Criteria
- Phase 2 complete.

### Actions
1. Unused indexes: `SELECT * FROM sys.schema_unused_indexes WHERE object_schema = DATABASE();`. An index listed here had no reads since startup on this server only. It may be used on replicas or by a monthly job. Never drop on this evidence alone.
2. Redundant indexes: `SELECT table_name, redundant_index_name, redundant_index_columns, dominant_index_name, dominant_index_columns, sql_drop_index FROM sys.schema_redundant_indexes WHERE table_schema = DATABASE();`. A redundant index is a left prefix of another index.
3. Record both lists in `digest_findings` with the `Uptime` from Phase 1. The index write cost flow uses them; this flow drops nothing.

### Output
`digest_findings`.

### Quality Gate
- `digest_findings.unused_indexes` and `digest_findings.redundant_indexes` are present (empty lists allowed) with the uptime.
- No `DROP INDEX` statement was executed.

---

## Worked Example

Illustrative only.

Input: MySQL 8.0.36, Uptime 1,904,220 s (about 22 days).

Phase 2 top digest:
```
COUNT_STAR 701, total_s 812.4, avg_ms 1158.98, SUM_ROWS_EXAMINED 1472100000, SUM_ROWS_SENT 16824,
SUM_NO_INDEX_USED 701, SUM_CREATED_TMP_DISK_TABLES 0, SUM_SORT_MERGE_PASSES 701
q: SELECT `id` , `name` , `price` FROM `products` WHERE `category_id` = ? AND LOWER ( `name` ) LIKE ? ORDER BY `price` LIMIT ?
```
Class: no index used, sort merge passes, examined ratio about 87,500. Next: EXPLAIN, then sargability (LOWER on column) and index design.

Phase 3: `sys.schema_redundant_indexes` shows `idx_category` (category_id) is a prefix of `idx_category_price` (category_id, price).

---

## Exit Criteria

DONE when `digest_findings` holds classified digests with sample text, and the unused and redundant index lists with their measurement period.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `@@performance_schema` = 0 | **Return**: tell the user it needs `performance_schema=ON` and a restart; continue with the slow log only. |
| Phase 1 | `sys` schema missing | **Adjust**: query the base `performance_schema` tables directly (`table_io_waits_summary_by_index_usage` for unused indexes, `COUNT_STAR = 0`). |
| Phase 2 | Digest table full (`Performance_schema_digest_lost` > 0 in `SHOW GLOBAL STATUS`) | **Adjust**: record the coverage gap; the digest table size is `performance_schema_digests_size`. |
| Phase 3 | Uptime is short (recent restart) | **Adjust**: mark the unused index list as low confidence and say so in the output. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
