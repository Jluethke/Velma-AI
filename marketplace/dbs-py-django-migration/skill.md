# Python Django Migration

**One-line description:** Writes one Django migration per migration-plan step with `makemigrations`, reads the SQL with `sqlmigrate`, uses `AddIndexConcurrently` with `atomic = False`, `SeparateDatabaseAndState` and reversible `RunPython` where expand-contract needs them, and proves migrate, roll back, and re-migrate on a scratch database.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Django project root containing `manage.py`.
- `scratch_database_url` (string, required): URL of a disposable database of the production engine and major version, wired into `DATABASES` through the project's settings mechanism (for example `dj-database-url` reading `DATABASE_URL`). Never production.

---

## Outputs

- `migration_files` (string[]): Paths of the migration files created (`<app>/migrations/00NN_<name>.py`), one per plan step, in apply order.

---

## Phase 1: Clean Baseline

### Entry Criteria
- `manage.py` exists under `repo_path`.

### Actions
1. Point settings at `scratch_database_url` and run `python manage.py migrate`. Exit code must be 0.
2. Run `python manage.py makemigrations --check --dry-run`. It must print "No changes detected". If it lists changes, models already differ from migrations; stop and report, because your new migration would silently include those unrelated changes.
3. Run `python manage.py showmigrations <app>` and record the last applied migration name for each app you will touch.

### Output
Baseline record.

### Quality Gate
- `makemigrations --check --dry-run` prints "No changes detected" and exits 0.

---

## Phase 2: Write One Migration Per Step

### Entry Criteria
- Clean baseline.

### Actions
1. Change `models.py` for the next plan step only.
2. Run `python manage.py makemigrations <app> --name <phase>_<short_description>`. If Django asks "Did you rename <model>.<old> to <model>.<new>?", answer `N` when the plan uses expand-contract for that rename. Answer `y` only if the plan says a direct rename is safe (for example the table is not yet used in production).
3. Read the SQL: `python manage.py sqlmigrate <app> 00NN`. Every statement must match the plan step.
4. Use these operations for the plan patterns:

| Plan need | Django migration content |
|---|---|
| Build a PostgreSQL index without blocking writes | `from django.contrib.postgres.operations import AddIndexConcurrently`; set `atomic = False` on the `Migration` class; one operation per migration |
| Drop such an index | `RemoveIndexConcurrently` with `atomic = False` |
| Contract step 1: remove a field from the code but keep the column | `migrations.SeparateDatabaseAndState(state_operations=[migrations.RemoveField(...)], database_operations=[])` |
| Contract step 2: drop the column later | `migrations.SeparateDatabaseAndState(state_operations=[], database_operations=[migrations.RunSQL("ALTER TABLE ... DROP COLUMN ...", reverse_sql=...)])` |
| PostgreSQL `NOT VALID` foreign key or check, then `VALIDATE` | `migrations.RunSQL(sql=..., reverse_sql=...)`, wrapped in `SeparateDatabaseAndState` when the model state must also change |
| Small data fix | `migrations.RunPython(forwards, reverse_code=backwards)`; inside, get models with `apps.get_model("<app>", "<Model>")`, never by import |
| Database-level default (Django 5.0+) | `db_default=` on the field; plain `default=` is applied by Django only during `AddField` and then removed from the column |

5. Django creates PostgreSQL foreign keys as `DEFERRABLE INITIALLY DEFERRED` and adds an index for every `ForeignKey` unless `db_index=False`. Record this; constraint checks run at commit, not at the statement.
6. Large backfills do not go in `RunPython`. A migration runs in one transaction on PostgreSQL. Use `dbs-pg-batched-backfill` or `dbs-mysql-batched-backfill`.
7. Every `RunPython` and `RunSQL` gets a reverse. If none is possible, use `migrations.RunPython.noop` only when skipping is truly safe; otherwise leave it irreversible and record it for `dbs-rollback-plan`.
8. Optional linting: `pip install django-migration-linter`, add `django_migration_linter` to `INSTALLED_APPS`, run `python manage.py lintmigrations`. Read every error it reports.

### Output
One migration file per step.

### Quality Gate
- `sqlmigrate` output for each new migration is recorded and matches its plan step.
- Every migration containing `AddIndexConcurrently` or `RemoveIndexConcurrently` has `atomic = False` (check with `rg -n "atomic = False" <app>/migrations/00NN_*.py`).
- Every `RunPython` and `RunSQL` has a reverse argument.

---

## Phase 3: Prove on the Scratch Database

### Entry Criteria
- Migrations written.

### Actions
1. `python manage.py migrate --plan` and read the ordered list.
2. `python manage.py migrate`. Exit code 0.
3. Roll back to the recorded baseline: `python manage.py migrate <app> <baseline_migration_name>`. Then `python manage.py migrate` again.
4. `python manage.py makemigrations --check --dry-run` prints "No changes detected".
5. Run the test suite (`python manage.py test` or `pytest`) and record the pass count.

### Output
`migration_files` and the command log.

### Quality Gate
- Migrate, roll back, re-migrate, and the `--check` command all exit 0, with output recorded.
- Test pass count recorded; no test deleted, skipped, or marked expected-failure to get it.

---

## Common Mistakes To Avoid

- Do not answer `y` to the rename prompt by habit. A direct rename breaks running instances of the previous release.
- Do not import models from `myapp.models` inside a migration; use `apps.get_model`.
- Do not edit or delete a migration that has run in any shared environment.
- Do not run `squashmigrations` in the middle of an expand-contract sequence.
- Do not mix `AddIndexConcurrently` with other operations in one migration.

---

## Worked Example

Illustrative only. Plan step: build `ix_orders_cust_created_open` online on PostgreSQL.

Phase 1: `makemigrations --check --dry-run` prints "No changes detected". Baseline `orders.0011_customer_full_name`.

Phase 2: file `orders/migrations/0012_expand_ix_orders_cust_created_open.py`:
```python
from django.contrib.postgres.operations import AddIndexConcurrently
from django.db import migrations, models
from django.db.models import Q

class Migration(migrations.Migration):
    atomic = False
    dependencies = [("orders", "0011_customer_full_name")]
    operations = [
        AddIndexConcurrently(
            "order",
            models.Index(fields=["customer", "-created_at"],
                         name="ix_orders_cust_created_open",
                         condition=Q(status="open")),
        ),
    ]
```
`sqlmigrate orders 0012` prints `CREATE INDEX CONCURRENTLY "ix_orders_cust_created_open" ON "orders_order" ("customer_id", "created_at" DESC) WHERE "status" = 'open';`.

Phase 3: `migrate`, `migrate orders 0011`, `migrate` all exit 0; `--check` prints "No changes detected"; tests 388 passed.

---

## Exit Criteria

DONE when every plan step has its own migration, each one's SQL was read, and migrate, roll back, re-migrate, `--check`, and tests pass on the scratch database.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--check` lists unrelated changes | **Stop**: report the model drift; it needs its own migration and review first. |
| Phase 2 | `makemigrations` asks for a default for a new non-null field | **Adjust**: make the field nullable for the expand step, per the plan; NOT NULL comes after the backfill. |
| Phase 3 | `CREATE INDEX CONCURRENTLY cannot run inside a transaction block` | **Retry**: set `atomic = False` and keep the operation alone in its migration. |
| Phase 3 | Rollback raises `IrreversibleError` | **Adjust**: add the reverse, or record the migration as irreversible for `dbs-rollback-plan`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
