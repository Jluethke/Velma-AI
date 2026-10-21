# Migration Rollback Plan

**One-line description:** Classifies every migration step as reversible, lossy, or irreversible, picks down migration, roll-forward fix, or backup restore for each, writes the exact tool commands and the app-versus-schema rollback order, takes and test-restores a backup before any contract step, and proves the down path with an up, down, up round trip on a scratch database.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root with the migration files.
- `migration_tool` (string, required): `alembic`, `django`, `prisma`, `flyway`, or `golang-migrate`.
- `scratch_database_url` (string, required): Disposable database of the production engine and major version.

---

## Outputs

- `rollback_plan` (object[]): Per step: class (reversible, lossy, irreversible), strategy (down, roll forward, restore), exact commands, the app release that must be rolled back first, backup file and restore proof for lossy steps, and the round-trip test result.

---

## Phase 1: Classify Steps

### Entry Criteria
- `migration_plan` and migration files present.

### Actions
1. Classify each step with this table:

| Step | Reverse operation | Class | Strategy |
|---|---|---|---|
| Add table, column, index, constraint (expand) | Drop it | reversible (values written only to the new object are lost; old object still holds data) | down migration |
| Backfill into a new column | None needed; old column untouched | reversible | no action |
| Validate a constraint, set NOT NULL | Drop constraint, `DROP NOT NULL` | reversible | down migration |
| Drop column or table (contract) | Recreate empty | lossy | backup before, restore from backup, or roll forward |
| In-place type change that narrows (text to varchar(50), bigint to int) | Reverse may fail or truncate | irreversible | roll forward only |
| Data transformation that discards information | None | irreversible | backup before; roll forward |

2. Find each step's down code and confirm it matches: Alembic `downgrade()`, Django operation reverses and `reverse_code`/`reverse_sql`, Prisma stored down script, Flyway reverse SQL file (or `U` file on Teams editions), golang-migrate `.down.sql`. Mark any step whose down code is missing or raises as "no down".

### Output
Classified step list.

### Quality Gate
- Every step has a class and strategy from the table.
- Every reversible step has down code located by file and line.

---

## Phase 2: Write Commands and Order

### Entry Criteria
- Steps classified.

### Actions
1. Write the rollback command for each step by tool:

| Tool | Roll back one step | Roll back to a point |
|---|---|---|
| Alembic | `alembic downgrade -1` | `alembic downgrade <revision>` |
| Django | `python manage.py migrate <app> <previous_migration>` | same, with the target name |
| Prisma | `npx prisma db execute --file <down.sql> --schema prisma/schema.prisma`, then `npx prisma migrate resolve --rolled-back <migration_name>` | apply down scripts newest first |
| Flyway open source | Apply the reverse SQL as a new forward `V` migration (roll forward) | same |
| Flyway Teams or Enterprise | `flyway undo` | `flyway undo -target=<version>` |
| golang-migrate | `migrate -path <dir> -database <url> down 1` | `migrate ... goto <version>` |

2. Write the order rule for each step: schema rollback must never remove something the running app uses. If release R2 reads `full_name`, roll the app back to R1 first, wait until no R2 instance is running, then reverse the schema step. Write the app release next to each step.
3. For every lossy or irreversible step, write the backup command that runs immediately before it:
   - PostgreSQL whole table: `pg_dump --format=custom --table=public.customer --file=customer_pre_contract.dump "$URL"`
   - PostgreSQL one column: `psql "$URL" -c "\copy (SELECT id, name FROM customer) TO 'customer_name_pre_drop.csv' CSV HEADER"`
   - MySQL: `mysqldump --single-transaction --no-create-info app customer > customer_pre_contract.sql`
4. Write the restore command and the re-apply query (for a dropped column: re-add the column, load the CSV into a staging table, `UPDATE ... FROM staging`).
5. State the time limit for using a backup: after the contract step, new rows are written without the old column. Data restored from the backup covers only rows that existed at backup time. Record this in the plan.

### Output
Draft `rollback_plan`.

### Quality Gate
- Every step has a command from the tool table and an app release ordering note.
- Every lossy or irreversible step has backup and restore commands.

---

## Phase 3: Prove It

### Entry Criteria
- Draft plan.

### Actions
1. On `scratch_database_url`: apply all new migrations, insert sample rows touching each new column, then roll back to the baseline with the Phase 2 commands, then apply all again. Every command must exit 0.
2. For each lossy step on scratch: run the backup command, run the contract migration, run the restore procedure, and compare row counts and a checksum of the restored column (`SELECT count(*), md5(string_agg(name, ',' ORDER BY id)) FROM customer;` in PostgreSQL; `SELECT COUNT(*), MD5(GROUP_CONCAT(name ORDER BY id)) FROM customer;` in MySQL, with `group_concat_max_len` raised to fit) before and after.
3. Record each command's output in `rollback_plan`.

### Output
`rollback_plan` with proofs.

### Quality Gate
- The up, down, up round trip exits 0 for every reversible step.
- For every lossy step, the count and checksum before the drop equal the count and checksum after restore.

---

## Common Mistakes To Avoid

- Do not run a down migration that drops a column the current app release reads. Roll the app back first.
- Do not call a step reversible because a down function exists. Run it.
- Do not keep the only backup on the database server itself.
- Do not use `flyway clean`, `prisma migrate reset`, or `migrate drop` as a rollback. They delete everything.

---

## Worked Example

Illustrative only. Alembic, PostgreSQL. Steps: s1 add `full_name` (reversible), s6 drop `name` (lossy).

Phase 1: s1 down `op.drop_column('customer','full_name')` at line 21. s6 down recreates empty `name`; class lossy.

Phase 2: s1 rollback `alembic downgrade 7f3e9a1c2b4d^`, order "roll app back to R0 first". s6 backup: `psql "$URL" -c "\copy (SELECT id, name FROM customer) TO 'customer_name_pre_drop.csv' CSV HEADER"`.

Phase 3: round trip exits 0. s6 on scratch: before `48211 | 9c1e...`; after restore `48211 | 9c1e...`. Equal.

---

## Exit Criteria

DONE when every step has a class, strategy, tool command, and app ordering note, every lossy step has a tested backup and restore, and the round trip passes on scratch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Down code missing for a reversible step | **Return**: send it back to the tool-specific migration flow to add the down code. |
| Phase 2 | No place to store backups off the server | **Stop**: a lossy step without an off-server backup does not run. |
| Phase 3 | Round trip fails on down | **Retry**: fix the down code and rerun the full round trip. |
| Phase 3 | Restore checksum differs | **Retry**: fix the restore procedure; check NULL handling and ordering in the checksum query. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
