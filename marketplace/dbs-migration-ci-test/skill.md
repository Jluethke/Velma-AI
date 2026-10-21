# Migration CI Test

**One-line description:** Adds a CI job that starts the production database engine at the production major version as a service container, applies every migration from empty, runs the model drift check, rolls all the way down and back up, applies new migrations on top of a production schema snapshot, and fails the build on any error.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_tool` (string, required): `alembic`, `django`, `prisma`, `flyway`, or `golang-migrate`.
- `db_engine` (string, required): `postgresql` or `mysql`.
- `db_version` (string, required): Production major version. CI uses the same image tag.
- `ci_platform` (string, required): `github-actions` or `gitlab-ci`. Other platforms: map the same steps onto their service-container feature.

---

## Outputs

- `ci_job` (string): Path of the CI configuration file changed and the job name, plus links or log excerpts proving the job passes on a good change and fails on a broken one.

---

## Phase 1: Define the Service Database

### Entry Criteria
- Inputs present.

### Actions
1. Use the official image with the production major version: `postgres:<db_version>` or `mysql:<db_version>`. Never SQLite or an in-memory substitute; locking, types, and transactional DDL differ.
2. GitHub Actions service block for PostgreSQL (health-check values follow the GitHub Actions documentation example for PostgreSQL service containers):
   ```yaml
   services:
     db:
       image: postgres:16
       env:
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: app_test
       ports: ["5432:5432"]
       options: >-
         --health-cmd pg_isready
         --health-interval 10s
         --health-timeout 5s
         --health-retries 5
   ```
   For MySQL use `image: mysql:8.0`, `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, port `3306:3306`, and `--health-cmd "mysqladmin ping -h localhost"`.
3. GitLab CI: `services: [{ name: "postgres:16", alias: db }]` with `variables: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: app_test }`; connect to host `db`.
4. Set `DATABASE_URL` in the job environment to the service.

### Output
Service definition.

### Quality Gate
- The image tag major version equals `db_version`.

---

## Phase 2: Write the Migration Steps

### Entry Criteria
- Service defined.

### Actions
1. Add these steps in this order, using the tool row:

| Tool | Up from empty | Drift check | All the way down | Up again |
|---|---|---|---|---|
| Alembic | `alembic upgrade head` | `alembic check` | `alembic downgrade base` | `alembic upgrade head` |
| Django | `python manage.py migrate` | `python manage.py makemigrations --check --dry-run` | `python manage.py migrate <app> zero` per app | `python manage.py migrate` |
| Prisma | `npx prisma migrate deploy` | `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$SHADOW_URL" --exit-code` (confirm flags with `--help` for your version) | not available (no down migrations) | skip |
| Flyway | `flyway migrate` | `flyway validate` | not available on open-source edition; `flyway undo` on Teams | skip or `flyway migrate` |
| golang-migrate | `migrate -path db/migrations -database "$DATABASE_URL" up` | compare schema dump to a committed `schema.sql` (see `dbs-schema-drift-check`) | `migrate ... down -all` (check `migrate -help` for the flag) | `migrate ... up` |

2. Add a production-snapshot step: commit or fetch a schema-only dump of production (from `dbs-schema-drift-check`), load it into a second database, insert its version-table rows, then apply only the new migrations. This catches migrations that work from empty but fail against the real schema.
3. Add the Squawk step from `dbs-pg-squawk-lint` for PostgreSQL.
4. Run the test suite after the migration steps.
5. Mark the job required in branch protection (GitHub: Settings, Branches, required status checks) or `rules` in GitLab, so it cannot be skipped.

### Output
CI file changes.

### Quality Gate
- The CI file parses: `actionlint` for GitHub Actions or the GitLab CI Lint tool (`glab ci lint` or the web linter) exits without errors.
- Every step from the tool row is present in order.

---

## Phase 3: Prove the Gate Works

### Entry Criteria
- CI file committed on a branch.

### Actions
1. Push the branch and record the job result: it must pass.
2. On a throwaway branch, add a migration with a deliberate error (for example `ALTER TABLE does_not_exist ADD COLUMN x int;`). Push. The job must fail at the "Up from empty" step.
3. On another throwaway branch, change a model without a migration (ORM tools). The job must fail at the drift check.
4. Delete both throwaway branches.

### Output
`ci_job` with proof links.

### Quality Gate
- One passing run and two failing runs recorded, with the failing step name for each.

---

## Common Mistakes To Avoid

- Do not use `latest` as the image tag; it changes major version without warning.
- Do not mark the migration job `continue-on-error: true` or `allow_failure: true` to get green.
- Do not run `prisma migrate reset` or `flyway clean` against anything except the CI service container.
- Do not skip the down-and-up step because "we never roll back". It is the only test of the down code.

---

## Worked Example

Illustrative only. Alembic, PostgreSQL 16, GitHub Actions. `.github/workflows/migrations.yml` job `migrations`:
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
    with: { python-version: "3.12" }
  - run: pip install -r requirements.txt
  - run: alembic upgrade head
  - run: alembic check
  - run: alembic downgrade base
  - run: alembic upgrade head
  - run: pytest -q
env:
  DATABASE_URL: postgresql+psycopg://postgres:postgres@localhost:5432/app_test
```
`actionlint` exits 0. Good branch: passed. Broken migration branch: failed at `alembic upgrade head` with `relation "does_not_exist" does not exist`. Model-only branch: failed at `alembic check` with "New upgrade operations detected".

---

## Exit Criteria

DONE when the CI job runs every migration step against the production engine and version, is required for merge, and is proven to pass on a good change and fail on both kinds of broken change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Production version image not published | **Return**: ask for the exact version; use the nearest patch of the same major and record it. |
| Phase 2 | Downgrade to base fails on an old irreversible migration | **Adjust**: downgrade only to the revision before this change's first migration and record why. |
| Phase 2 | No production schema dump available | **Adjust**: ship without the snapshot step and list it as an open item with an owner. |
| Phase 3 | Broken branch passes | **Retry**: the step is not running or its error is swallowed; check `set -e` and step conditions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
