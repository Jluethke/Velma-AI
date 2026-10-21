# MySQL InnoDB Index Design

**One-line description:** Adapts B-tree index candidates to InnoDB rules (clustered primary key appended to every secondary index, covering reads shown as `Using index`, prefix indexes that cannot cover, functional and multi-valued indexes, descending keys, no partial indexes), removes redundant prefixes from the plan, and tests each candidate as an invisible index.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plan_findings` (object[], required): From `sqlo-mysql-explain-analyze-read`.
- `btree_index_proposal` (object[], required): From `sqlo-btree-composite-order`.
- `digest_findings` (object, required): From `sqlo-mysql-perf-schema-digest`. Supplies unused and redundant indexes.
- `schema_ddl` (string, required): `SHOW CREATE TABLE` output for each table.

---

## Outputs

- `index_candidates` (object[]): Final InnoDB index DDL per query with InnoDB-specific adjustments, plan evidence, and existing indexes it makes redundant.

---

## Phase 1: Apply InnoDB Rules

### Entry Criteria
- `btree_index_proposal` is not empty.

### Actions
1. Read the primary key from `schema_ddl`. Every InnoDB secondary index stores the primary key columns in its leaf entries. Consequences:
   - Do not append the primary key column to a secondary index just to cover it; it is already there. (An index on `(customer_id)` with PK `id` can serve `WHERE customer_id = ? ORDER BY id`.)
   - A long primary key (UUID as CHAR(36), composite PK) makes every secondary index larger; record its byte length.
2. Covering: if the query reads only columns in the index key plus the PK, EXPLAIN shows `Using index`. Add needed SELECT columns to the end of the key (MySQL has no INCLUDE clause).
3. Text columns: BLOB and TEXT columns need a prefix length (`name(20)`). A prefix index cannot cover the query and cannot serve ORDER BY on that column. Choose the prefix from data: `SELECT COUNT(DISTINCT LEFT(name, 20)) / COUNT(DISTINCT name) FROM products;` for several lengths, pick the shortest whose ratio stops rising.
4. Functions in predicates (MySQL 8.0.13 and later): functional key part `INDEX idx_lower_email ((LOWER(email)))`; the query must use the identical expression. Alternative: a generated column `email_lower VARCHAR(255) AS (LOWER(email)) STORED` with a normal index.
5. JSON arrays (8.0.17 and later): multi-valued index `INDEX idx_tags ((CAST(data->'$.tags' AS CHAR(32) ARRAY)))`, used by `MEMBER OF()`, `JSON_CONTAINS()` and `JSON_OVERLAPS()` in the WHERE clause.
6. MySQL has no partial indexes. For "only active rows" patterns, put the flag column first in the key, or use a generated column that is NULL for inactive rows and index it.
7. Descending keys are honored from 8.0; on 5.7 `DESC` in an index definition is parsed and ignored.
8. Limits: at most 16 columns per index; key prefix length limit 3072 bytes for DYNAMIC or COMPRESSED row format. Compute the key length (utf8mb4 VARCHAR(n) uses up to 4n bytes plus length).

### Output
InnoDB-adjusted DDL per candidate.

### Quality Gate
- Each candidate states the table's PK and confirms the PK is not redundantly appended.
- Each prefix length cites the distinct-ratio measurement.

---

## Phase 2: Remove Overlap

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each candidate, list existing indexes on the same table from `schema_ddl` and from `digest_findings.redundant_indexes`.
2. If an existing index is a leftmost prefix of the candidate, mark it `drop_after_build` unless it is UNIQUE, a PRIMARY KEY, or required by a foreign key (InnoDB requires an index on FK columns; the new candidate satisfies it only if the FK columns are its leftmost columns).
3. If two candidates share leading columns, merge them into one when the longer one serves both queries; test both queries against the merged index.
4. If a candidate's table already has an index listed in `digest_findings.unused_indexes`, record it for the write cost flow as an offsetting removal candidate. Do not drop anything here.

### Output
Candidates with overlap decisions.

### Quality Gate
- Each `drop_after_build` mark records why the index is not UNIQUE, PK, or the only index for a foreign key.

---

## Phase 3: Test as Invisible Index on a Copy

### Entry Criteria
- `production_like` or `dev` environment.

### Actions
1. Build: `ALTER TABLE products ADD INDEX idx_cat_price (category_id, price) INVISIBLE, ALGORITHM=INPLACE, LOCK=NONE;`
2. In one session: `SET SESSION optimizer_switch = 'use_invisible_indexes=on';` then `EXPLAIN` and `EXPLAIN ANALYZE` the target query. Confirm `key` is the new index, and record `type`, `rows`, `Extra`.
3. Run every other query from `plan_findings` on the same table and confirm none gets worse when the index is visible to the session.
4. Turn it off: `SET SESSION optimizer_switch = 'use_invisible_indexes=off';`. Drop the test index on the copy if it is not kept.
5. Merge the results into `index_candidates`.

### Output
`index_candidates`.

### Quality Gate
- Each kept candidate has EXPLAIN output with `key` equal to its name.
- Each candidate meant to be covering shows `Using index` in `Extra`.

---

## Worked Example

Illustrative only.

Input candidate: `(category_id, price)` for `SELECT id, name, price FROM products WHERE category_id = 42 AND name LIKE '%lamp%' ORDER BY price LIMIT 24;` PK `id BIGINT`.

Phase 1: to cover, `name` would be added; `name` is VARCHAR(200) utf8mb4 (up to 802 bytes), within limits. Final key `(category_id, price, name)`; `id` is implicit.

Phase 2: existing `idx_category (category_id)` is a prefix and not UNIQUE; it is the index for FK `fk_products_category`, but the new index also leads with `category_id`, so it satisfies the FK. Marked `drop_after_build`.

Phase 3:
```
| table    | type | key                | rows | filtered | Extra                    |
| products | ref  | idx_cat_price_name | 1144 |    11.11 | Using where; Using index |
-> Limit: 24 row(s) (actual time=0.09..3.9 rows=24 loops=1)
```
Down from 1152 ms. No other query on `products` changed plan.

---

## Exit Criteria

DONE when each candidate has InnoDB-adjusted DDL, overlap decisions with reasons, and invisible-index plan evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Specified key was too long; max key length is 3072 bytes` | **Adjust**: shorten with a prefix (losing coverage) or drop the widest column from the key. |
| Phase 1 | Server is MySQL 5.7 | **Adjust**: no functional, multi-valued, descending or invisible indexes; use generated columns and test on a copy with plain indexes. |
| Phase 3 | Another query regresses with the index visible | **Return**: record the regression; send both queries back through `sqlo-btree-composite-order`. |
| Phase 3 | Optimizer ignores the index | **Adjust**: check statistics with `sqlo-mysql-statistics-histograms`; do not add `FORCE INDEX` as the fix without user approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
