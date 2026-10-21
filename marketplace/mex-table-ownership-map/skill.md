# Table Ownership Map

**One-line description:** Assigns every database table the candidate touches to exactly one owning module by combining the code's own table references with the database's statement statistics and foreign key catalog, and lists every table that is written by both sides, joined across the boundary, or tied by a cross-boundary foreign key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree.
- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`; supplies `first_guess_tables`.
- `seam_map` (object, required): From `mex-seam-identification`; supplies which code is inside the candidate after `move_in`.
- `database_engine` (string, required): `postgres`, `mysql` or `other`.

---

## Outputs

- `table_ownership` (object[]): One row per table: `table`, `owner` (`candidate` or the owning monolith module), `readers`, `writers`, evidence (file and line, or statement digest).
- `shared_tables` (object[]): Tables with a problem across the boundary: `table`, `problem` (`written_by_both`, `cross_join`, `cross_fk`, `read_by_other`), evidence, and a suggested resolution from the table in Phase 3.

---

## Phase 1: Tables Referenced by Code

### Entry Criteria
- `seam_map` exists, so the post-move candidate file set is known.

### Actions
1. Map ORM classes to table names:

   | ORM | Command |
   |---|---|
   | Django | `python manage.py shell -c "from django.apps import apps; [print(m._meta.label, m._meta.db_table) for m in apps.get_models()]"` |
   | SQLAlchemy | `rg -n "__tablename__\s*=" ` |
   | TypeORM / Sequelize / Prisma | `rg -n "@Entity\(|tableName:|@@map\(" ` and `model` blocks in `schema.prisma` |
   | GORM | `rg -n "func \(.*\) TableName\(\) string" ` (default name is the snake_case plural of the struct) |
   | JPA / Hibernate | `rg -n "@Table\(name" ` (default is the entity name) |
   | Raw SQL anywhere | `rg -n -i "\b(from|join|into|update)\s+[a-z_\.\"]+" --glob '!**/migrations/**'` |

2. For each table, list files inside and outside the candidate that read it and that write it (writes: `.save(`, `.create(`, `.update(`, `INSERT`, `UPDATE`, `DELETE`, repository `save`). Record file and line.

### Output
Code-derived reader and writer lists per table.

### Quality Gate
- Every table in `extraction_brief.first_guess_tables` appears with at least one reader or writer, or is marked `unused_in_code`.

---

## Phase 2: Tables Referenced at Runtime

### Entry Criteria
- Database access with read permission on catalog views (run against a production replica or staging with real traffic, never by writing to production).

### Actions
1. Statement statistics:
   - PostgreSQL: requires the `pg_stat_statements` extension (`SELECT * FROM pg_extension WHERE extname='pg_stat_statements';`). Then `SELECT calls, query FROM pg_stat_statements WHERE query ILIKE '%invoices%' ORDER BY calls DESC LIMIT 50;`
   - MySQL: `SELECT COUNT_STAR, DIGEST_TEXT FROM performance_schema.events_statements_summary_by_digest WHERE DIGEST_TEXT LIKE '%invoices%' ORDER BY COUNT_STAR DESC LIMIT 50;`
   - Other engines: use the engine's query log or statement statistics view from its official docs and record which one.
2. Any statement that names a candidate table and a non-candidate table together is a `cross_join`. Record the digest text.
3. Foreign keys across the boundary:
   - PostgreSQL: `SELECT conname, conrelid::regclass AS from_table, confrelid::regclass AS to_table FROM pg_constraint WHERE contype='f';`
   - MySQL: `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA = DATABASE();`
   Keep rows where exactly one side is a candidate table; mark them `cross_fk`.
4. Triggers and views can also write or read across: PostgreSQL `SELECT event_object_table, trigger_name FROM information_schema.triggers;` and `SELECT table_name FROM information_schema.views WHERE view_definition ILIKE '%invoices%';`; MySQL the same `information_schema` views.

### Output
Runtime evidence per table.

### Quality Gate
- The statement statistics query returned rows, or the output records why it could not run (extension missing, no permission) and that only code evidence was used.

---

## Phase 3: Assign Owners and Resolutions

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Owner rule: the owner is the single module that writes the table. If one side only reads, the writer owns it. If both write, the table goes to `shared_tables` as `written_by_both`.
2. Pick a resolution for each shared table from this table:

   | Problem | Resolution |
   |---|---|
   | `read_by_other` | Other side calls the owner's facade, or reads a replicated read model (CDC or events) if it needs joins |
   | `cross_join` | Split into two queries joined in code through the facade, or keep a read model on the reader's side |
   | `cross_fk` | Keep the ID column, drop the FK constraint only after `mex-schema-ownership-split`, and enforce existence in the facade |
   | `written_by_both` | Move all writes behind the owner's facade first; never split a table with two writers |
   | Table mixes columns of both domains | Split the table vertically: owner keeps its columns, the other side's columns move to a new table keyed by the same ID |

3. Write `table_ownership` and `shared_tables`.

### Output
`table_ownership`, `shared_tables`.

### Quality Gate
- Every table has exactly one `owner`, or appears in `shared_tables` as `written_by_both`.
- Every `shared_tables` row has evidence and a resolution from the table.

---

## Worked Example

Illustrative. PostgreSQL, candidate `app.billing`.

```
=> SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype='f' AND (conrelid::regclass::text IN ('invoices','payments') OR confrelid::regclass::text IN ('invoices','payments'));
 invoices_order_id_fkey | invoices | orders
 refunds_payment_id_fkey | refunds  | payments
```
`pg_stat_statements` shows `SELECT ... FROM orders o JOIN invoices i ON i.order_id = o.id WHERE o.customer_id = $1` with 1.2M calls (`cross_join`, from the order history page). `refunds` is written by `app/orders/returns.py:88` and by `app/billing/refund.py:30`: `written_by_both`.

Result: `invoices`, `invoice_lines`, `payments` owned by billing; `refunds` shared, resolution "move the orders-side write behind `billing.api.issue_refund`".

---

## Exit Criteria

DONE when every table the candidate touches has one owner or a recorded shared-table problem with evidence and a resolution.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ORM uses a default table name | **Adjust**: read the ORM's naming default in its docs and confirm against `\dt` (psql) or `SHOW TABLES` (mysql). |
| Phase 2 | No access to statement statistics | **Adjust**: use code evidence only and add an open question for runtime confirmation. |
| Phase 2 | Asked to enable an extension in production | **Stop**: enabling `pg_stat_statements` needs `shared_preload_libraries` and a restart; that is the user's change to make. |
| Phase 3 | A table has no writer | **Return**: mark it `read_only_reference` and ask the user who loads it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
