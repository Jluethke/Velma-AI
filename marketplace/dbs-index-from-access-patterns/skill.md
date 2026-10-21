# Index From Access Patterns

**One-line description:** Derives the minimum set of B-tree indexes from the access-pattern table using the equality, sort, range column-order rule, adds partial and covering variants where they apply, removes redundant prefixes, and proves each index is chosen by the planner with `EXPLAIN` on generated data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `constrained_schema` (object, required): Schema from `dbs-constraints-foreign-keys`.
- `access_patterns` (object[], required): Access patterns from `dbs-access-pattern-inventory`.
- `db_engine` (string, required): `postgresql` or `mysql`.

---

## Outputs

- `index_plan` (object[]): Per index: name, table, columns in order, kind (plain, unique, partial, covering), the `ap_id` values it serves, and the `EXPLAIN` evidence.
- `target_ddl` (string): `constraint_ddl` plus the `CREATE INDEX` statements: the full target schema.

---

## Phase 1: Derive Candidate Indexes

### Entry Criteria
- Inputs present.

### Actions
1. For each read access pattern, write columns in this order (the equality, sort, range rule):
   1. every equality filter column (`=`, `IN` with a short list),
   2. then the sort columns in the sort direction,
   3. then at most one range filter column (`<`, `>`, `BETWEEN`, `LIKE 'abc%'`).
   A range column placed before the sort column stops the index from returning rows already sorted.
2. If the primary key or a constraint index already starts with exactly these columns, write "served by <index>" and add nothing.
3. Partial index (PostgreSQL only): if every query of the pattern filters on a constant (`status = 'pending'`, `deleted_at IS NULL`), add `WHERE <that predicate>` to the index and drop the column from the key.
4. Covering: if the pattern reads only a few extra columns, add them with `INCLUDE (...)` (PostgreSQL 11+). In MySQL InnoDB, every secondary index already holds the primary key columns; to cover, append the extra columns to the key.
5. MySQL text columns: an index on `TEXT` needs a prefix length (`col(n)`); n is the length the spec says is distinguishing. Ask if not stated.
6. Merge: if index A's columns are a leading prefix of index B's columns with the same sort direction, drop A (B serves both). Keep A only if it is unique and B is not.

### Output
Candidate `index_plan`.

### Quality Gate
- Every read pattern has an index or a "served by" note.
- Zero indexes are leading prefixes of another index on the same table (unless unique).

---

## Phase 2: Prove With EXPLAIN

### Entry Criteria
- Candidates listed.

### Actions
1. Start a disposable server of the same major version and apply `constraint_ddl` plus the candidate indexes.
2. Generate data with the row counts and value distributions the user gives (for example 1,000 customers each with a user-given number of orders). PostgreSQL: `INSERT INTO orders (...) SELECT ... FROM generate_series(1, :n) g;`. MySQL 8: a recursive CTE `WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < :n) ...` with `SET SESSION cte_max_recursion_depth` raised to cover n.
3. Refresh statistics: `ANALYZE;` (PostgreSQL) or `ANALYZE TABLE orders;` (MySQL).
4. Run each pattern's SQL with literal values:
   - PostgreSQL: `EXPLAIN (ANALYZE, BUFFERS) <sql>;`
   - MySQL: `EXPLAIN FORMAT=TREE <sql>;` and `EXPLAIN ANALYZE <sql>;` (8.0.18+)
5. Read the output with this table:

| Output shows | Meaning | Action |
|---|---|---|
| PostgreSQL `Index Scan` or `Index Only Scan using <your index>` | Index used | Record as evidence |
| PostgreSQL `Seq Scan` on the table with a filter matching the pattern | Index not used | Check column order and data volume; retry |
| PostgreSQL `Sort` node above the scan for a sorted pattern | Sort not served by index | Fix order: sort columns before range column |
| MySQL `type: ALL` or `Table scan` | Full scan | Fix the index |
| MySQL `Using filesort` | Sort not served | Fix column order |
| MySQL `Using index` | Covering index | Record as evidence |

6. A sequential scan on a table with very few rows is expected. Use the user's realistic row count, not a toy count.

### Output
`index_plan` with `EXPLAIN` excerpts.

### Quality Gate
- Every index in `index_plan` has an `EXPLAIN` excerpt naming that index.
- Zero sorted patterns show a `Sort` node or `Using filesort`, unless recorded as accepted with a reason.

---

## Phase 3: Emit Target DDL

### Entry Criteria
- Evidence collected.

### Actions
1. Append each index as `CREATE INDEX ix_<table>_<cols> ON <table> (<cols>) [INCLUDE (...)] [WHERE ...];` to `constraint_ddl`, producing `target_ddl`. Keep plain `CREATE INDEX` here; how to build it on a live table is decided in `dbs-pg-ddl-lock-safety` or `dbs-mysql-online-ddl`.
2. Apply `target_ddl` to a fresh disposable database with `ON_ERROR_STOP=1`.
3. Write the write-cost note: number of indexes per table. Every index slows every insert and update of its columns.

### Output
`target_ddl`, `index_plan`.

### Quality Gate
- `target_ddl` applies to an empty database with exit code 0.
- Every index name in `target_ddl` appears in `index_plan`.

---

## Common Mistakes To Avoid

- Do not index every column "just in case". Each index costs writes and memory.
- Do not trust `EXPLAIN` without `ANALYZE` on a table you never ran `ANALYZE` on; the planner has no statistics.
- Do not put a low-selectivity boolean first unless the pattern always filters on it with equality and a partial index does not fit.
- Do not add `CONCURRENTLY` in this flow's DDL. Live-table builds are handled by the lock-safety flows.

---

## Worked Example

Illustrative only. AP01: `WHERE customer_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 20`.

Phase 1: equality `customer_id`, constant `status = 'open'` becomes a partial predicate, sort `created_at DESC`. Candidate: `CREATE INDEX ix_orders_cust_created_open ON orders (customer_id, created_at DESC) WHERE status = 'open';`. Existing `ix_orders_customer_id (customer_id)` is a prefix of it, but it also serves the foreign key for all statuses; keep it.

Phase 2: with user-given volume loaded and `ANALYZE` run:
```
Limit  (actual time=0.041..0.067 rows=20 loops=1)
  ->  Index Scan using ix_orders_cust_created_open on orders  (actual rows=20 loops=1)
        Index Cond: (customer_id = 4711)
```
No `Sort` node.

Phase 3: `target_ddl` applies with exit 0.

---

## Exit Criteria

DONE when every read pattern is served by an index proved in `EXPLAIN` output on realistic generated volume, redundant prefixes are removed, and `target_ddl` applies cleanly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Pattern has two range filters | **Adjust**: index the more selective one last; record that the other is filtered after the scan. |
| Phase 2 | Planner ignores the index at realistic volume | **Retry**: check column order and statistics; if still ignored, record the pattern as served by a scan. |
| Phase 2 | No row counts from the user | **Return**: ask for expected rows per table; toy data proves nothing. |
| Phase 3 | DDL fails on an empty database | **Retry**: fix the statement; do not skip it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
