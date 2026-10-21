# PostgreSQL GIN Index Selection

**One-line description:** Chooses the right GIN index and operator class for PostgreSQL jsonb containment, array overlap, full-text search and substring (`pg_trgm`) predicates, or a B-tree expression index when the predicate is a single extracted key, and rewrites the predicate into the operator the index supports.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plan_findings` (object[], required): From `sqlo-pg-explain-analyze-read`.
- `pg_index_proposal` (object[], required): From `sqlo-pg-partial-covering-index`. Passed through and extended.
- `schema_ddl` (string, required): Table and index definitions, with column types.

---

## Outputs

- `index_candidates` (object[]): All entries of `pg_index_proposal` plus any GIN or expression index candidates, each with DDL, the operator class, the rewritten predicate if one was needed, and plan evidence.

---

## Phase 1: Find GIN-Shaped Predicates

### Entry Criteria
- `schema_ddl` shows at least one `jsonb`, array, `tsvector` or text column used in a slow query's WHERE. If none, copy `pg_index_proposal` into `index_candidates` and stop.

### Actions
1. Classify each predicate:

| Predicate | Index |
|---|---|
| `data @> '{"type":"refund"}'`, `data ? 'key'`, `data ?| array[...]`, `data ?& array[...]` | GIN on `data` with `jsonb_ops` (default) |
| only `@>`, `@?`, `@@` on jsonb | GIN with `jsonb_path_ops` (smaller and faster for `@>`, but no `?` operators) |
| `data->>'type' = 'refund'` (one key, equality or range) | B-tree expression index `((data->>'type'))`; GIN does not serve `->>` equality |
| `tags @> ARRAY['x']`, `tags && ARRAY[...]`, `'x' = ANY(tags)` | GIN on the array (default `array_ops`); rewrite `'x' = ANY(tags)` to `tags @> ARRAY['x']`, because `= ANY(column)` is not indexable |
| `to_tsvector('english', body) @@ to_tsquery('english', 'lamp')` | GIN on the same expression `(to_tsvector('english', body))`, or on a stored generated `tsvector` column |
| `name ILIKE '%lamp%'`, `name LIKE '%lamp%'`, `name ~ 'regex'` | GIN with `gin_trgm_ops` from the `pg_trgm` extension |
| equality on a scalar plus GIN predicate in the same query | consider `btree_gin` extension to put the scalar in the same GIN index, or rely on BitmapAnd of two indexes |

2. Check the expression in the query and the expression in the index will match exactly, including the text search configuration name (`'english'`). A query using `to_tsvector(body)` (default config) does not use an index on `to_tsvector('english', body)`.
3. Trigram limits: `pg_trgm` needs search strings of at least 3 characters to use trigrams; shorter patterns fall back to scanning the whole index.

### Output
GIN-shaped predicates with chosen index type and any required rewrite.

### Quality Gate
- Each predicate has one row from the table with the operator quoted from the SQL.
- For full-text, the text search configuration in the query and the index are recorded as equal.

---

## Phase 2: Build and Test on a Copy

### Entry Criteria
- Phase 1 has candidates. Work on `production_like` or `dev` only.

### Actions
1. Install extensions if needed: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` (or `btree_gin`). On managed services check the provider's allowed extension list.
2. Build:
```
CREATE INDEX events_data_gin ON events USING gin (data jsonb_path_ops);
CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX events_type_expr ON events ((data->>'type'));
```
3. `ANALYZE` the table, then run `EXPLAIN (ANALYZE, BUFFERS)` with the rewritten predicate. A GIN index appears as `Bitmap Index Scan on <index>` under a `Bitmap Heap Scan`. Read `Rows Removed by Index Recheck`: GIN results for trigram and some jsonb queries are rechecked against the row; a large recheck count means low precision.
4. If `Heap Blocks: lossy=` appears, `work_mem` is too small for the bitmap; record it.
5. Record build time and `pg_relation_size` of each index.

### Output
Plan evidence for each candidate.

### Quality Gate
- Each kept candidate shows `Bitmap Index Scan on <its name>` (GIN) or `Index Scan using <its name>` (expression) in EXPLAIN ANALYZE output.
- Each candidate has its size recorded.

---

## Phase 3: Record Write-Side Settings

### Entry Criteria
- Phase 2 complete.

### Actions
1. GIN inserts are expensive; with `fastupdate` (default on) new entries go to a pending list, merged by vacuum or when the list exceeds `gin_pending_list_limit` (default 4MB). A large pending list makes searches slower and some inserts slow when the merge happens.
2. Record for each GIN candidate whether the table is insert-heavy; the write cost flow measures it. Settings available per index: `WITH (fastupdate = off)` or `WITH (gin_pending_list_limit = ...)`. Do not change them without measurement.
3. Merge `pg_index_proposal` and the new candidates into `index_candidates`. Mark entries whose predicate needed a rewrite; the application change must ship with the index.

### Output
`index_candidates`.

### Quality Gate
- `index_candidates` contains every entry of `pg_index_proposal` plus the new ones.
- Each candidate that needs a query rewrite names the file or query text to change.

---

## Worked Example

Illustrative only.

Input query: `SELECT id FROM events WHERE data->>'type' = 'refund' AND data @> '{"region":"eu"}' AND created_at > now() - interval '7 days';`

Phase 1: `data->>'type' = 'refund'` is single-key equality, so B-tree expression index; `data @> ...` is containment, so GIN `jsonb_path_ops`. Alternative: rewrite both into one containment `data @> '{"type":"refund","region":"eu"}'` and use only the GIN index. Chosen: the rewrite, because it needs one index instead of two.

Phase 2:
```
CREATE INDEX events_data_gin ON events USING gin (data jsonb_path_ops);
EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM events WHERE data @> '{"type":"refund","region":"eu"}' AND created_at > now() - interval '7 days';
 Bitmap Heap Scan on events  (actual time=3.1..9.8 rows=2210 loops=1)
   Recheck Cond: (data @> '{"type": "refund", "region": "eu"}'::jsonb)
   Filter: (created_at > (now() - '7 days'::interval))
   Rows Removed by Filter: 4100
   ->  Bitmap Index Scan on events_data_gin  (actual time=2.6..2.6 rows=6310 loops=1)
```
Size 610 MB. Table is insert-heavy (180k rows per hour), flagged for write cost measurement.

---

## Exit Criteria

DONE when every GIN-shaped predicate has an index candidate with plan evidence and size, required rewrites are named, and `index_candidates` holds all candidates.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Predicate uses `->>` with LIKE '%x%' | **Adjust**: trigram GIN on the expression `((data->>'name')) gin_trgm_ops`. |
| Phase 2 | `CREATE EXTENSION` not permitted | **Return**: ask the user or provider to allow it; record the candidate as blocked. |
| Phase 2 | Index not used | **Adjust**: confirm the operator matches the table in Phase 1 exactly; `->>` equality never uses a GIN index. |
| Phase 3 | Search latency spikes after bulk inserts | **Adjust**: record pending list growth for the write cost flow; do not set `fastupdate = off` without measurement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
