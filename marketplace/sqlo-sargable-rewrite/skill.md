# Sargable Query Rewrite

**One-line description:** Rewrites predicates that prevent index use (functions or arithmetic on indexed columns, implicit type or collation conversion, leading wildcards, NOT IN with nullable subqueries, per-row correlated subqueries, OR across columns) into index-friendly equivalents for PostgreSQL or MySQL, and proves each rewrite returns the same rows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`. Supplies `db_engine` and version.
- `plan_findings` (object[], required): From `sqlo-pg-explain-analyze-read` or `sqlo-mysql-explain-analyze-read`. Uses findings `filter_after_scan`, `index_not_chosen`, `correlated_subplan`, `missing_index`.
- `schema_ddl` (string, required): `CREATE TABLE` and `CREATE INDEX` statements for the tables involved, from `pg_dump --schema-only -t <table> <db>` or `SHOW CREATE TABLE <table>;`.

---

## Outputs

- `rewritten_queries` (object[]): Per query: original SQL, rewritten SQL, the rule applied, the result-equality check and its output, and any supporting index the rewrite needs.

---

## Phase 1: Find Non-Sargable Predicates

### Entry Criteria
- At least one finding from the input list.

### Actions
1. For each query, list every WHERE, JOIN ON and ORDER BY expression.
2. Check each against the rule table. Read column types from `schema_ddl`.

| Pattern in SQL | Why the index is skipped | Rewrite |
|---|---|---|
| `date(created_at) = '2024-05-01'`, `created_at::date = ...`, `YEAR(created_at) = 2024` | function on column | half-open range: `created_at >= '2024-05-01' AND created_at < '2024-05-02'` |
| `lower(email) = $1`, `UPPER(name) = ?` | function on column | keep the function and add an expression index (PostgreSQL `CREATE INDEX ... ((lower(email)))`; MySQL 8.0.13 and later functional key part `((LOWER(email)))`); or store normalized values; PostgreSQL alternative: `citext` type |
| `price * 1.2 > 100`, `id + 0 = 5` | arithmetic on column | move arithmetic to the constant side: `price > 100 / 1.2` |
| MySQL: VARCHAR column compared with a number (`phone = 5551234`) | string column converted to number for every row | quote the literal; fix the bind parameter type in the app |
| MySQL: join on columns with different character sets or collations | conversion on one side | align column charset and collation (schema change) |
| PostgreSQL: column `bigint` compared with a `numeric` parameter, or `text` column compared with `varchar(n)` cast to another type | cross-type comparison without an index operator | cast the parameter, not the column: `WHERE id = $1::bigint` |
| `name LIKE '%lamp%'` | leading wildcard | PostgreSQL: `pg_trgm` GIN index (see `sqlo-pg-gin-index-select`); MySQL: FULLTEXT index with `MATCH ... AGAINST` (different semantics, confirm with user) |
| `name LIKE 'lamp%'` in PostgreSQL with a non-C collation | B-tree cannot serve LIKE under most collations | index with `text_pattern_ops` / `varchar_pattern_ops` |
| `a = 1 OR b = 2` (different columns) | single index cannot serve both | PostgreSQL often uses BitmapOr already, check plan first; otherwise `SELECT ... WHERE a = 1 UNION SELECT ... WHERE b = 2` (UNION removes duplicates; use UNION ALL plus `AND b <> 2` guard only when b is NOT NULL) |
| `x NOT IN (SELECT y FROM t2)` with nullable `y` | returns no rows if any y is NULL; PostgreSQL cannot plan an anti-join for it | `NOT EXISTS (SELECT 1 FROM t2 WHERE t2.y = x)`; note semantics differ when y has NULLs, confirm intent |
| `(SELECT count(*) FROM t2 WHERE t2.fk = t1.id) > 0` | counts all rows per outer row | `EXISTS (SELECT 1 FROM t2 WHERE t2.fk = t1.id)` |
| scalar subquery in SELECT list per row | executed per outer row (`SubPlan`, `DEPENDENT SUBQUERY`) | `LEFT JOIN` with GROUP BY or `LATERAL` (PostgreSQL), checked for duplicate rows |
| `COALESCE(col, 'x') = 'y'` | function on column | `col = 'y'` when `'x' <> 'y'`; otherwise `(col = 'y' OR col IS NULL)` |
| PostgreSQL: very long `IN ($1, ..., $n)` list built per call | many distinct statements, planning cost | `= ANY($1::bigint[])` with one array parameter |
| `SELECT *` where a covering index exists for the needed columns | forces heap or clustered index lookup | select only needed columns |

3. Record each match with the exact expression.

### Output
List of non-sargable expressions with their rule.

### Quality Gate
- Each match quotes the expression and names a rule row.
- Column types used in the decision were read from `schema_ddl`, not assumed.

---

## Phase 2: Rewrite and Prove Equality

### Entry Criteria
- Phase 1 found at least one match.

### Actions
1. Rewrite one expression at a time. Keep the original SQL saved next to the rewrite.
2. Do not change the query's meaning to make it faster. If a rewrite changes NULL handling, duplicates or ordering, record it and ask the user.
3. Prove equality on `production_like` or `dev` data with real parameter values:
   - PostgreSQL: `SELECT count(*) FROM ((<original>) EXCEPT ALL (<rewritten>)) d;` and the reverse. Both must return 0.
   - MySQL 8.0.31 and later supports `EXCEPT ALL`; same check. Older MySQL: compare `SELECT COUNT(*), BIT_XOR(CRC32(CONCAT_WS('|', col1, col2, ...))) FROM (<query>) q;` for both; counts and checksums must match.
4. Test edge values: a value with NULLs present, a range boundary (midnight, end of month), an empty result.
5. If the application builds this SQL through an ORM, locate the call site (file and line) and write the ORM expression that produces the rewritten SQL. Change one call site per commit and run that module's tests.

### Output
Rewritten SQL with equality proof.

### Quality Gate
- Both EXCEPT ALL checks return 0, or both checksum pairs match, for every parameter set tested.
- At least one boundary value and one NULL case were tested where the rule involves ranges or NULLs.

---

## Phase 3: Confirm the Plan Changed

### Entry Criteria
- Phase 2 equality checks passed.

### Actions
1. Run the engine's EXPLAIN ANALYZE flow procedure on the rewritten query with the same parameters.
2. Record whether the finding is gone: for example `Rows Removed by Filter` dropped, `type` changed from `ALL` to `range` or `ref`, `SubPlan` replaced by a join.
3. If the rewrite needs an index that does not exist (expression index, trigram index), record it as `needs_index` for the index design flows; do not create it here.

### Output
`rewritten_queries`.

### Quality Gate
- Each entry has before and after EXPLAIN ANALYZE execution time from real output.
- Entries whose plan did not change are marked `no_plan_change` and still listed.

---

## Worked Example

Illustrative only.

Input (MySQL 8.0.36): `SELECT id, name, price FROM products WHERE category_id = 42 AND LOWER(name) LIKE '%lamp%' ORDER BY price LIMIT 24;` Column `name` is `VARCHAR(200)` with collation `utf8mb4_0900_ai_ci`.

Phase 1: `LOWER(name)` matches "function on column". The collation is case-insensitive (`_ci`), so `LOWER()` is redundant. `LIKE '%lamp%'` matches "leading wildcard".

Phase 2 rewrite: `SELECT id, name, price FROM products WHERE category_id = 42 AND name LIKE '%lamp%' ORDER BY price LIMIT 24;`
```
SELECT COUNT(*) FROM ((original) EXCEPT ALL (rewritten)) d;   -> 0
SELECT COUNT(*) FROM ((rewritten) EXCEPT ALL (original)) d;   -> 0
```
Phase 3: still `Using where` on the wildcard, but with the index from the design flow on `(category_id, price)` the plan becomes `ref` on category plus ordered read, 4.1 ms. Recorded `needs_index` = `(category_id, price)`. The wildcard remains a filter; FULLTEXT was offered to the user as an option with different matching rules.

---

## Exit Criteria

DONE when every non-sargable expression has a rewrite with a passing equality check and before and after plan evidence, or is recorded as needing an index.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Query generated by an ORM and the SQL text is all you have | **Adjust**: find the call site by searching the codebase for the table and column names before rewriting. |
| Phase 2 | Equality check returns nonzero | **Stop**: discard the rewrite; do not adjust the check. |
| Phase 2 | Rewrite changes NULL semantics | **Return**: ask the user which semantics are correct before continuing. |
| Phase 3 | Plan unchanged | **Adjust**: mark `no_plan_change` and pass to the index design flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
