# Python Alembic Migration

**One-line description:** Writes one Alembic revision per migration-plan step with `alembic revision --autogenerate`, fixes the operations autogenerate gets wrong or misses, runs non-transactional PostgreSQL DDL inside `autocommit_block()`, and proves upgrade, downgrade, upgrade and `alembic check` on a scratch database.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root containing `alembic.ini` and the Alembic script directory (often `alembic/` or `migrations/`).
- `scratch_database_url` (string, required): SQLAlchemy URL of a disposable database of the production engine and major version. Never production.

---

## Outputs

- `migration_files` (string[]): Paths of the revision files created, one per plan step, in apply order.

---

## Phase 1: Check the Alembic Setup

### Entry Criteria
- `alembic.ini` exists under `repo_path`.

### Actions
1. Run `alembic --version`, `alembic heads`, and `alembic current` from `repo_path`. `alembic heads` must print exactly one revision. If it prints two, run `alembic merge heads -m "merge heads"` in its own commit first.
2. Open the `env.py` in the script directory and record: how the URL is read (`config.get_main_option("sqlalchemy.url")`, an environment variable, or `-x` arguments through `context.get_x_argument()`), the `target_metadata` assignment, and the options passed to `context.configure`.
3. Confirm the `MetaData` used by the models has a `naming_convention` (keys `ix`, `uq`, `ck`, `fk`, `pk`). Without it, constraints get server-generated names and `drop_constraint` needs names you do not know. If missing, add it in a separate change before this work and record it.
4. Record whether `compare_server_default=True` is set in `context.configure`. Autogenerate ignores server default changes without it. `compare_type` defaults to `True` from Alembic 1.12; on older versions it must be set.
5. Point Alembic at `scratch_database_url` the way `env.py` reads it (for example `export DATABASE_URL=...`). Do not write the URL into `alembic.ini` in git.

### Output
Setup record.

### Quality Gate
- `alembic heads` output shows exactly one head.
- `alembic current` against the scratch database prints a revision or nothing, with exit code 0.

---

## Phase 2: Write One Revision Per Step

### Entry Criteria
- Setup recorded.

### Actions
1. Take the next plan step only. Change the SQLAlchemy models for that step only.
2. Run `alembic revision --autogenerate -m "<phase> <short description>"`. Open the new file.
3. Fix what autogenerate does not handle, using this table:

| Situation | What autogenerate writes | What to write instead |
|---|---|---|
| Column or table rename | `drop_column` plus `add_column` | Follow the plan's expand-contract steps; never accept the drop |
| `Enum` value added (PostgreSQL) | Nothing | `op.execute("ALTER TYPE status ADD VALUE 'x'")` inside `autocommit_block()` before PostgreSQL 12 |
| Server default change without `compare_server_default` | Nothing | `op.alter_column(..., server_default=...)` |
| Partial index | Often nothing or a full index | `op.create_index(..., postgresql_where=sa.text("status = 'open'"))` |
| Constraint without a name | `None` name | Use the naming convention or pass `name=` |
| Trigger, function, view | Nothing | `op.execute(...)` with the SQL, and its reverse in `downgrade()` |

4. PostgreSQL statements that cannot run in a transaction (`CREATE INDEX CONCURRENTLY`, `DROP INDEX CONCURRENTLY`, `REINDEX CONCURRENTLY`) go in their own revision, wrapped like this:
   ```python
   def upgrade():
       with op.get_context().autocommit_block():
           op.create_index("ix_orders_cust_created_open", "orders",
                           ["customer_id", sa.text("created_at DESC")],
                           postgresql_where=sa.text("status = 'open'"),
                           postgresql_concurrently=True)
   ```
5. Raw SQL the plan specifies (`NOT VALID` foreign keys, `VALIDATE CONSTRAINT`) goes through `op.execute("...")`.
6. Write `downgrade()` for every revision. If the step cannot be reversed (it drops data), make `downgrade()` raise `NotImplementedError("irreversible: <reason>")` and record it for `dbs-rollback-plan`.
7. Do not import application ORM models in a revision. If a small data change is needed, use `sa.table("customer", sa.column("id"), ...)` and `op.get_bind()`. Large backfills belong in `dbs-pg-batched-backfill` or `dbs-mysql-batched-backfill`, not in a revision.
8. Render the SQL for review: `alembic upgrade <prev_rev>:<new_rev> --sql`. Read every statement.

### Output
One revision file per step.

### Quality Gate
- `alembic heads` still shows exactly one head after each new revision.
- The `--sql` output contains zero `DROP COLUMN` statements that the plan does not list as a contract step.
- Every revision has a `downgrade()` body or an explicit `NotImplementedError` with a reason.

---

## Phase 3: Prove on the Scratch Database

### Entry Criteria
- Revisions written.

### Actions
1. `alembic upgrade head`; exit code must be 0.
2. `alembic downgrade -1`, then `alembic upgrade head`. Repeat for each new revision you can reverse (`alembic downgrade <rev>` to the revision before the first new one, then `upgrade head`).
3. `alembic check`. It must print "No new upgrade operations detected." It exits nonzero when the models and the migrated database differ.
4. Run the project's test suite against the scratch database. Record the command and the pass count.

### Output
`migration_files` and the command log.

### Quality Gate
- `alembic upgrade head`, the downgrade and re-upgrade, and `alembic check` all exit 0, with output recorded.
- The test suite pass count is recorded; zero tests were deleted or skipped to get it.

---

## Common Mistakes To Avoid

- Do not edit a revision that has already run in any shared environment. Write a new one.
- Do not put several plan steps in one revision. One step, one revision.
- Do not trust autogenerate output without reading it. It is a draft.
- Do not run `CREATE INDEX CONCURRENTLY` without `autocommit_block()`; it fails with "cannot run inside a transaction block".
- Do not point `alembic upgrade` at production from this flow.

---

## Worked Example

Illustrative only. Plan step 1: `ADD COLUMN customer.full_name text` (nullable).

Phase 1: `alembic heads` prints `a1b2c3d4e5f6 (head)`. `env.py` reads `os.environ["DATABASE_URL"]`. Naming convention present.

Phase 2: add `full_name: Mapped[str | None]` to `Customer`. `alembic revision --autogenerate -m "expand add customer full_name"` creates `alembic/versions/7f3e9a1c2b4d_expand_add_customer_full_name.py` with `op.add_column('customer', sa.Column('full_name', sa.Text(), nullable=True))` and downgrade `op.drop_column('customer', 'full_name')`. `alembic upgrade a1b2c3d4e5f6:7f3e9a1c2b4d --sql` prints `ALTER TABLE customer ADD COLUMN full_name TEXT;`.

Phase 3:
```
$ alembic upgrade head
INFO  [alembic.runtime.migration] Running upgrade a1b2c3d4e5f6 -> 7f3e9a1c2b4d, expand add customer full_name
$ alembic downgrade -1 && alembic upgrade head
$ alembic check
No new upgrade operations detected.
```
`pytest -q` against scratch: 412 passed.

---

## Exit Criteria

DONE when every plan step has its own revision, every revision's SQL was read, and upgrade, downgrade, re-upgrade, `alembic check`, and the test suite all pass on the scratch database.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `alembic heads` shows several heads | **Adjust**: `alembic merge heads` in its own commit, then continue. |
| Phase 2 | Autogenerate produces an empty revision | **Adjust**: confirm `target_metadata` imports the changed model module; then write the operation by hand. |
| Phase 3 | `cannot run inside a transaction block` | **Retry**: move the statement into its own revision inside `autocommit_block()`. |
| Phase 3 | `alembic check` reports operations | **Retry**: a model change is missing from a revision; add a revision and rerun. |
| Phase 3 | Downgrade fails | **Retry**: fix `downgrade()`; if it truly cannot reverse, raise `NotImplementedError` and record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
