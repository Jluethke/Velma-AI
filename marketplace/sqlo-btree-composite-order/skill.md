# B-tree Composite Index Column Order

**One-line description:** Derives the column order of a composite B-tree index from the query's predicates and sort (equality columns first, then at most one range column or the ORDER BY columns in matching direction), checks reuse against existing indexes by the leftmost prefix rule, and tests the candidate without building it (hypopg on PostgreSQL, an invisible index on MySQL copies).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plan_findings` (object[], required): From the engine's EXPLAIN reading flow. Uses `missing_index`, `partial_index_match`, `filter_after_scan`, `sort_spill`, `sort_not_from_index`, `order_by_index_filter_trap`, `nested_loop_amplification`, `join_without_index`.
- `query_rewrites` (object[], required): From `sqlo-keyset-pagination`. Index design uses the rewritten SQL, never the original.
- `schema_ddl` (string, required): Current table and index definitions.

---

## Outputs

- `btree_index_proposal` (object[]): Per query: the proposed index DDL, the rule-by-rule derivation of its column order, existing indexes it makes redundant or that already serve it, and the hypothetical plan evidence.

---

## Phase 1: Classify Each Predicate Column

### Entry Criteria
- At least one finding from the input list exists for a query in `query_rewrites`.

### Actions
1. For each query, list columns of one table at a time, from WHERE, JOIN ON (the inner side of the join), GROUP BY and ORDER BY.
2. Label each column:

| Use in query | Label |
|---|---|
| `col = value`, `col IN (short list)`, `col IS NULL`, join key on the inner side | `E` (equality) |
| `col > x`, `col BETWEEN`, `col LIKE 'prefix%'`, keyset row comparison | `R` (range) |
| `ORDER BY col` | `S` (sort) with its direction |
| `GROUP BY col` | `G` |
| only in the SELECT list | `C` (cover candidate) |
| inside a function or cast | `X`: not indexable as is; send back to `sqlo-sargable-rewrite` or plan an expression index |

3. Record the labels per query and table.

### Output
Labeled column list per query.

### Quality Gate
- Every column in WHERE, JOIN, GROUP BY and ORDER BY of the rewritten SQL has one label.

---

## Phase 2: Derive the Column Order

### Entry Criteria
- Phase 1 complete.

### Actions
1. Apply these rules in order:
   1. Put all `E` columns first. Among `E` columns, order does not change seek cost for this query; choose the order that lets other queries reuse the index by leftmost prefix (the column most often filtered alone goes first). Do not order by "most selective first" as a rule.
   2. If the query has ORDER BY (and the `S` columns can be served), put the `S` columns next, in ORDER BY order, with matching directions. All same direction: plain index works (scanned backward if needed). Mixed directions (`a DESC, b ASC`): declare directions in the index (`(a DESC, b ASC)`); supported by PostgreSQL and by MySQL 8.0 and later.
   3. Otherwise put the single most useful `R` column next. Columns after the first range column cannot narrow the seek; they act only as filters inside the index.
   4. If both an `R` column and `S` columns exist, choose: `E + S` order avoids the sort and works best with a small `LIMIT`; `E + R` order reads fewer rows when the range is narrow and the result is small. Build both as hypothetical indexes in Phase 3 and pick the measured faster one.
   5. `G` columns follow the same rule as `S` when the engine can group from index order.
   6. Optionally add `C` columns at the end to make the index covering; on PostgreSQL 11 and later prefer `INCLUDE (...)` for them (see `sqlo-pg-partial-covering-index`); on MySQL see `sqlo-mysql-innodb-index-design`.
2. Check existing indexes from `schema_ddl`:
   - An existing index whose leading columns equal your proposal's leading columns may already serve the query; then the problem is elsewhere (statistics, sargability), not a missing index.
   - An existing index that is a leftmost prefix of the proposal (for example `(customer_id)` vs proposed `(customer_id, created_at)`) becomes redundant after the new one is built. Record it as a drop candidate; do not drop here, and keep it if it is UNIQUE or backs a constraint.
3. Write the DDL with an explicit name: `CREATE INDEX orders_cust_status_created_idx ON orders (customer_id, status, created_at DESC);`.

### Output
Candidate DDL with derivation.

### Quality Gate
- Each candidate lists which rule placed each column.
- Each candidate lists existing indexes that overlap it by leftmost prefix, or states none.

---

## Phase 3: Test Without Building

### Entry Criteria
- Phase 2 produced candidates.

### Actions
1. PostgreSQL with the `hypopg` extension (on a copy, or where the user allows installing it):
```
CREATE EXTENSION IF NOT EXISTS hypopg;
SELECT * FROM hypopg_create_index('CREATE INDEX ON orders (customer_id, status, created_at DESC)');
EXPLAIN SELECT ... ;          -- plain EXPLAIN only; hypothetical indexes are ignored by EXPLAIN ANALYZE
SELECT hypopg_reset();
```
   The plan must name the hypothetical index (shown as `<NNNN>btree_orders_...`).
2. MySQL on a `production_like` copy: build the index invisible, then test it in one session:
```
ALTER TABLE orders ADD INDEX idx_cust_status_created (customer_id, status, created_at DESC) INVISIBLE;
SET SESSION optimizer_switch = 'use_invisible_indexes=on';
EXPLAIN ANALYZE SELECT ... ;
SET SESSION optimizer_switch = 'use_invisible_indexes=off';
```
3. Without hypopg on PostgreSQL: build the candidate on a `production_like` copy with plain `CREATE INDEX`, run EXPLAIN ANALYZE, and drop it.
4. For rule 2.4 cases, test both orders and keep the one with lower execution time in EXPLAIN ANALYZE (or lower estimated cost under hypopg, marked `estimate_only`).

### Output
`btree_index_proposal`.

### Quality Gate
- Each kept candidate has a plan showing the planner uses it (hypothetical index name or the invisible index name in `key`).
- Each candidate the planner did not use is listed as `rejected` with its plan.

---

## Worked Example

Illustrative only.

Input query (PostgreSQL): `SELECT * FROM orders WHERE customer_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 20;` Finding `order_by_index_filter_trap`. Existing indexes: `orders_pkey (id)`, `orders_created_at_idx (created_at)`, `orders_customer_idx (customer_id)`.

Phase 1: customer_id `E`, status `E`, created_at `S DESC`.

Phase 2: rule 1 puts `customer_id, status` (customer_id first because 6 other queries filter on it alone); rule 2 appends `created_at DESC`. `orders_customer_idx` becomes a redundant prefix (drop candidate, not dropped).

Phase 3:
```
SELECT * FROM hypopg_create_index('CREATE INDEX ON orders (customer_id, status, created_at DESC)');
EXPLAIN SELECT * FROM orders WHERE customer_id = 8812 AND status = 'shipped' ORDER BY created_at DESC LIMIT 20;
 Limit  (cost=0.29..21.70 rows=20 width=212)
   ->  Index Scan using "<16455>btree_orders_customer_id_status_created_at" on orders  (cost=0.29..4212.10 rows=3933 width=212)
         Index Cond: ((customer_id = 8812) AND (status = 'shipped'::text))
```
No Sort node and no Filter line. Candidate kept.

---

## Exit Criteria

DONE when each query with an index finding has a candidate whose order is derived rule by rule, overlaps with existing indexes are recorded, and the planner's use of the candidate is shown.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Column labeled `X` | **Return**: send the query to `sqlo-sargable-rewrite`, or record an expression index candidate. |
| Phase 2 | An existing index already matches the proposal | **Return**: report that a missing index is not the cause; pass to the statistics flow. |
| Phase 3 | `hypopg` not installable | **Adjust**: use Phase 3 Action 3 on a copy. |
| Phase 3 | Planner ignores the candidate | **Adjust**: record it as `rejected`; check row estimates and try the alternative order from rule 2.4. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
