# PostgreSQL Plan Review of a PR's New Queries

**One-line description:** Captures the exact SQL of each new or changed query from the PR, runs `EXPLAIN (ANALYZE, BUFFERS)` against a non-production PostgreSQL copy inside a rolled-back transaction, and reads the plan for sequential scans, estimate errors, disk sorts and nested-loop blowups, comparing against the base query where one existed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `new_queries` (object[], required): Query list from `prr-perf-pass`.
- `database_url` (string, required): Connection string for a non-production PostgreSQL database with representative data, for example a staging copy. Never a production primary.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `query_plan_findings` (object[]): Plan findings with the plan excerpt as evidence, written to `<findings_dir>/prr-pg-explain-new-queries.json`.

---

## Phase 1: Get Executable SQL for Each Query

### Entry Criteria
- `new_queries` is non-empty.
- `psql "<database_url>" -c 'select version()'` succeeds and the host is not production (confirm with the person who supplied `database_url`).

### Actions
1. For `raw_sql` queries, copy the SQL and replace each placeholder (`%s`, `$1`, `?`, `:name`) with a realistic value taken from the database: `SELECT <col> FROM <table> LIMIT 1`.
2. For ORM queries, print the SQL the ORM generates, in a shell on a branch checkout:

| ORM | How to print SQL |
|---|---|
| Django | `print(queryset.query)` (parameters are inlined unquoted; fix quoting by hand), or `django.db.connection.queries` with `DEBUG=True` |
| SQLAlchemy | `print(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))` |
| ActiveRecord | `relation.to_sql` |
| Prisma | enable `log: ['query']` in the client constructor |
| GORM | `db.Session(&gorm.Session{DryRun: true}).Find(&x).Statement.SQL.String()` or `db.Debug()` |

3. Alternative for any stack: on the non-production database, set `log_min_duration_statement = 0` for your session or run the test that triggers the code path with statement logging on, then copy the statement from the log. `pg_stat_statements` also lists normalized statements if the extension is installed.
4. If the query replaces an older one, also capture the base version's SQL.

### Output
Executable SQL per query (head and, where applicable, base).

### Quality Gate
- Every query in `new_queries` has executable SQL with no unbound placeholder.
- Each SQL runs once without error on the database.

---

## Phase 2: Run EXPLAIN Safely

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. `EXPLAIN ANALYZE` executes the statement. For `INSERT`, `UPDATE`, `DELETE` or any function with side effects, always wrap it:
   ```
   BEGIN;
   EXPLAIN (ANALYZE, BUFFERS, VERBOSE) <statement>;
   ROLLBACK;
   ```
   For plain `SELECT`, the wrapper is still harmless; use it every time.
2. Run through psql and save the plan: `psql "<database_url>" -X -f q1.sql > ../plan-q1.txt`.
3. If the table statistics may be stale on the copy, check `SELECT relname, last_analyze, last_autoanalyze FROM pg_stat_user_tables WHERE relname = '<table>'`. Do not run `ANALYZE` on a shared database without permission.
4. Record table sizes for context: `SELECT reltuples::bigint FROM pg_class WHERE relname = '<table>'`.
5. Run the base query too and save `../plan-q1-base.txt`.

### Output
Plan text files for head and base.

### Quality Gate
- Every plan file ends with `Planning Time:` and `Execution Time:` lines (proof ANALYZE ran).
- No statement ran outside a `BEGIN` ... `ROLLBACK` block.

---

## Phase 3: Read the Plans and Record Findings

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Read each plan from the innermost nodes up. Check these signals:

| Plan text | Meaning | What to suggest |
|---|---|---|
| `Seq Scan on <table>` with `Filter:` and a large `Rows Removed by Filter` compared with rows returned | No usable index for the filter | An index on the filter columns, created `CONCURRENTLY` (see the migration flow) |
| `rows=<estimate>` far from `actual ... rows=<n>` | Planner misestimate, often stale stats or correlated columns | `ANALYZE <table>` on the real database, or extended statistics (`CREATE STATISTICS`) |
| `Sort Method: external merge  Disk: <n>kB` | Sort spilled to disk | An index matching `ORDER BY`, or a smaller result set |
| `Nested Loop` with `loops=<n>` large on the inner side | Inner node runs once per outer row | Check join columns are indexed, or rewrite |
| `Buffers: shared read=<n>` large compared with `hit` | Data read from disk | Expected on a cold cache; rerun once and compare |
| `Index Scan` replaced by `Seq Scan` compared with the base plan | Regression introduced by the PR | blocking |

2. Do not invent a time threshold. Compare head with base when a base exists; when no base exists, report the plan shape and the table row count and label it `question` unless a signal above is present on a table the author expects to grow.
3. Label: plan regression versus base, or a sequential scan on a filter for a table that grows with users or orders: blocking; misestimate or disk sort: question; everything else: none.
4. Write `<findings_dir>/prr-pg-explain-new-queries.json` (fields `flow`, `category`="performance", `file`, `line`, `evidence` = the plan lines, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`query_plan_findings`.

### Quality Gate
- Every finding quotes the plan node lines it relies on.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Query from `orders/repo.py:52`: `SELECT * FROM orders WHERE customer_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 20`.

- Phase 1: `$1` replaced with `4821` from `SELECT customer_id FROM orders LIMIT 1`.
- Phase 2: plan excerpt:
  ```
  Limit  (cost=0.00..1893.40 rows=20 width=96) (actual time=41.3..41.4 rows=20 loops=1)
    ->  Sort  (actual rows=20 loops=1)
          Sort Method: top-N heapsort  Memory: 30kB
          ->  Seq Scan on orders  (actual rows=212 loops=1)
                Filter: ((customer_id = 4821) AND (status = 'open'))
                Rows Removed by Filter: 398114
  Execution Time: 41.5 ms
  ```
  `reltuples` = 398326.
- Phase 3: Seq Scan removing 398114 rows to return 212 on a table that grows with orders: blocking, fix "index on `(customer_id, status, created_at DESC)` created `CONCURRENTLY`".

---

## Exit Criteria

DONE when every new query ran under `EXPLAIN (ANALYZE, BUFFERS)` inside a rolled-back transaction on a non-production database, plans were compared with the base where possible, and findings quote plan lines.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only a production database is available | **Stop**: do not run ANALYZE on production; run plain `EXPLAIN` (no ANALYZE) only if the owner approves, else label queries `question`. |
| Phase 1 | Copy has too little data to be representative | **Adjust**: report the row counts and label findings `question`. |
| Phase 2 | Statement times out | **Adjust**: run plain `EXPLAIN` without ANALYZE and report the estimated plan, marked as estimated. |
| Phase 3 | Plan differs between runs | **Retry** twice and report the most common plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
