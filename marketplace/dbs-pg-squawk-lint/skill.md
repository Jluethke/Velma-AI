# PostgreSQL Squawk Migration Lint

**One-line description:** Runs the Squawk linter over the rendered SQL of every new PostgreSQL migration, reads each rule violation, fixes it or records a justified suppression, and wires the same command into CI so unsafe DDL fails the build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with the migration files.
- `lock_review` (object[], required): Output of `dbs-pg-ddl-lock-safety`, used to confirm each fix matches the reviewed recipe.
- `db_version` (string, required): PostgreSQL major version, passed to Squawk so version-specific rules are correct.

---

## Outputs

- `lint_report` (object): Squawk version, the exact command, every violation (file, line, rule, fix or suppression with reason), and the final exit code.

---

## Phase 1: Install and Render SQL

### Entry Criteria
- New migration files exist and `lock_review` is complete.

### Actions
1. Install Squawk: `npm install -g squawk-cli` or `pip install squawk-cli`. Record `squawk --version`.
2. Run `squawk --help` and record which of these options your version lists: `--exclude`, `--pg-version`, `--assume-in-transaction`, `--config`. Use only options that appear.
3. Squawk lints SQL text. Produce one `.sql` file per new migration in a temporary directory outside the repository (for example `$TMPDIR/squawk/`):
   - Alembic: `alembic upgrade <prev>:<rev> --sql > $TMPDIR/squawk/<rev>.sql`
   - Django: `python manage.py sqlmigrate <app> <n> > $TMPDIR/squawk/<app>_<n>.sql`
   - Prisma: lint `prisma/migrations/<name>/migration.sql` directly.
   - Flyway and golang-migrate: lint the `.sql` files directly.
4. If the tool wraps each migration in a transaction (Alembic, Django by default, Flyway by default), record it; pass `--assume-in-transaction` when available so Squawk evaluates the statements as they actually run.

### Output
Rendered SQL files and the Squawk version.

### Quality Gate
- One rendered `.sql` per new migration exists (count files versus migrations).
- `squawk --version` output recorded.

---

## Phase 2: Lint and Resolve

### Entry Criteria
- Rendered SQL exists.

### Actions
1. Run `squawk --pg-version=<db_version> $TMPDIR/squawk/*.sql` (drop `--pg-version` if your version does not list it; set `pg_version` in `.squawk.toml` instead). Record the full output and the exit code.
2. Resolve each violation with this table:

| Rule | Meaning | Fix |
|---|---|---|
| `require-concurrent-index-creation` | `CREATE INDEX` without `CONCURRENTLY` on an existing table | Use `CONCURRENTLY` in its own non-transactional migration |
| `require-concurrent-index-deletion` | `DROP INDEX` without `CONCURRENTLY` | Use `DROP INDEX CONCURRENTLY` |
| `constraint-missing-not-valid` | Constraint added without `NOT VALID` | Add `NOT VALID`; `VALIDATE` in a later migration |
| `adding-foreign-key-constraint` | Foreign key scans and locks both tables | `NOT VALID` then `VALIDATE` |
| `adding-not-nullable-field` | `SET NOT NULL` scans the table | CHECK `NOT VALID`, validate, then `SET NOT NULL` (PostgreSQL 12+) |
| `adding-required-field` | New NOT NULL column without default | Nullable column, backfill, then NOT NULL |
| `adding-field-with-default` | Default that forces a rewrite (volatile, or any default before PostgreSQL 11) | Add nullable, backfill, set default |
| `changing-column-type` | Type change rewrites the table | Expand-contract with a new column |
| `renaming-column`, `renaming-table` | Breaks running code | Expand-contract |
| `ban-drop-column`, `ban-drop-table` | Destructive | Allowed only in a contract step listed in the plan |
| `disallowed-unique-constraint` | `ADD CONSTRAINT UNIQUE` builds the index under lock | `CREATE UNIQUE INDEX CONCURRENTLY`, then `ADD CONSTRAINT ... USING INDEX` |
| `prefer-bigint-over-int`, `prefer-identity`, `prefer-timestamptz`, `prefer-text-field` | Type choices | Follow the rule unless `dbs-constraints-foreign-keys` recorded a reason |

3. For a rule Squawk's docs describe but the table does not list, read its documentation page at the Squawk website and record the fix.
4. A violation may be suppressed only when one of these is true, written next to it: the table is created in the same migration (empty), the step is a contract step in the plan, or `lock_review` shows the table is small enough per a user-given row count that the lock is accepted by the service owner. Suppress with `--exclude=<rule>` for that file run, or the inline ignore comment syntax your Squawk version documents.
5. Rerun Squawk until the exit code is 0.

### Output
Clean lint run and the violation log.

### Quality Gate
- Final `squawk` exit code is 0, with the command recorded.
- Every suppression names one of the three allowed reasons.
- Every fix matches the recipe row in `lock_review` for that statement.

---

## Phase 3: Add to CI

### Entry Criteria
- Clean local run.

### Actions
1. Add a CI step that renders SQL for migrations changed in the pull request and runs the same `squawk` command. Squawk also publishes a GitHub Action; check its README for the current inputs before using it.
2. Commit `.squawk.toml` if you used one, with `excluded_rules` limited to rules you justified for the whole repository (usually none).
3. Prove the gate: on a throwaway branch, add `CREATE INDEX ix_test ON orders (status);` as a new migration and confirm the CI step fails; then delete the branch.

### Output
`lint_report` with the CI proof.

### Quality Gate
- The throwaway-branch CI run failed on the Squawk step, with the job link or log excerpt recorded.

---

## Common Mistakes To Avoid

- Do not add a rule to `excluded_rules` globally to get green. Suppress per file with a reason.
- Do not lint the ORM's Python or TypeScript files. Squawk reads SQL only; render first.
- Do not write rendered SQL into the migrations directory; the migration tool may try to run it.
- Do not claim the lint passed without the exit code.

---

## Worked Example

Illustrative only. Django migration `orders 0013` renders to:
```sql
BEGIN;
ALTER TABLE "orders_order" ADD CONSTRAINT "fk_orders_coupon" FOREIGN KEY ("coupon_id") REFERENCES "coupon" ("id");
COMMIT;
```
Phase 2: `squawk --pg-version=16 $TMPDIR/squawk/orders_0013.sql` prints a violation of `adding-foreign-key-constraint` at line 2, exit code 1. Fix: split into `0013` with `... NOT VALID` and `0014` with `VALIDATE CONSTRAINT`, matching `lock_review`. Rerun: exit code 0.

Phase 3: throwaway branch with a plain `CREATE INDEX` fails CI with `require-concurrent-index-creation`.

---

## Exit Criteria

DONE when every new migration's SQL passes Squawk with exit code 0, every suppression has an allowed reason, and CI is proven to fail on an unsafe migration.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `squawk` cannot install (no npm or pip) | **Adjust**: download the release binary from the Squawk GitHub releases page and record its version. |
| Phase 1 | ORM cannot render SQL offline | **Adjust**: apply to scratch with statement logging (`log_statement = 'ddl'`) and lint the captured DDL. |
| Phase 2 | Squawk parse error on valid SQL | **Adjust**: record the statement and Squawk version; lint the rest; review that statement by hand against `lock_review`. |
| Phase 3 | CI does not fail on the test migration | **Retry**: the step is not running on changed files; fix the path filter and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
