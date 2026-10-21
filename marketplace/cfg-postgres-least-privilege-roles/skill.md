# PostgreSQL Least-Privilege Application Roles

**One-line description:** Replaces an application's superuser or owner database login with separate PostgreSQL roles (a NOLOGIN owner for schema objects used by migrations, a NOLOGIN read-write group, a read-only group, and LOGIN roles that inherit them), sets `ALTER DEFAULT PRIVILEGES` so future tables stay covered, revokes PUBLIC defaults, and proves each login can do exactly its job with `has_table_privilege` queries and failing statements.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pg_admin_conn` (string, required): Name of an environment variable that holds an admin connection URI (for example `PG_ADMIN_URL`). The URI itself is never passed as text.
- `app_schema` (string, required): Schema the application uses, for example `app`.
- `database_name` (string, required): Database name, for example `billing`.

---

## Outputs

- `role_ddl` (string): Path of the SQL migration file with role and grant statements.
- `privilege_audit` (object): Before and after role attribute tables, grant listings, and the outputs of the positive and negative tests.

---

## Phase 1: Audit Current Roles

### Entry Criteria
- `psql "${!pg_admin_conn}" -c 'select version()'` (bash indirect expansion) or `psql "$PG_ADMIN_URL" -c 'select version()'` succeeds. Record the major version; PostgreSQL 15 changed the default `public` schema privileges.

### Actions
1. List role attributes:
```sql
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls, rolcanlogin, rolinherit
FROM pg_roles WHERE rolname NOT LIKE 'pg\_%' ORDER BY rolname;
```
2. Find which role the application logs in as (from `config_keys` or the connection string user in the secret store; do not print the password) and who owns the schema objects:
```sql
SELECT n.nspname, c.relname, pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = '<app_schema>' AND c.relkind IN ('r','p','v','m','S') ORDER BY 1,2;
```
3. Record problems with this table:

| Observation | Problem |
|---|---|
| App login has `rolsuper = t` | Superuser bypasses every check, can read files (`COPY ... FROM PROGRAM`) |
| App login owns the tables | Owner can `DROP` and `ALTER` them, and `GRANT` to anyone |
| App login has `rolcreaterole` or `rolcreatedb` | Can create roles or databases |
| App login has `rolbypassrls = t` | Row level security policies do not apply |
| `public` schema has `CREATE` for `PUBLIC` (default before PostgreSQL 15) | Any login can create objects there |

4. Check `PUBLIC` privileges: `\dn+ public` and `\l+ <database_name>` in psql, reading the `Access privileges` column (`=UC/postgres` means PUBLIC has USAGE and CREATE).

### Output
Before-state audit.

### Quality Gate
- The attribute table and ownership table are saved in `privilege_audit.before`.
- Every row of the problem table is marked present or absent with the query output that shows it.

---

## Phase 2: Write The Role Migration

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write one SQL file (for example `db/roles/001_least_privilege.sql`). Run it through the project's migration tool if roles are managed there; roles are cluster-wide, so on managed services (RDS, Cloud SQL) an admin who is not a true superuser runs it.
```sql
-- owner of all objects; nobody logs in as it
CREATE ROLE app_owner NOLOGIN;
-- groups
CREATE ROLE app_rw NOLOGIN;
CREATE ROLE app_ro NOLOGIN;
-- logins (passwords set separately with \password, never in this file)
CREATE ROLE app_migrator LOGIN IN ROLE app_owner;   -- inherits owner, used only by migrations
CREATE ROLE app_service  LOGIN IN ROLE app_rw;      -- the running application
CREATE ROLE app_reporting LOGIN IN ROLE app_ro;     -- read-only consumers

REVOKE ALL ON DATABASE <database_name> FROM PUBLIC;
GRANT CONNECT ON DATABASE <database_name> TO app_owner, app_rw, app_ro;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;          -- already the default on PostgreSQL 15+

ALTER SCHEMA <app_schema> OWNER TO app_owner;
GRANT USAGE ON SCHEMA <app_schema> TO app_rw, app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA <app_schema> TO app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA <app_schema> TO app_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA <app_schema> TO app_ro;

ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA <app_schema>
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA <app_schema>
  GRANT USAGE, SELECT ON SEQUENCES TO app_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA <app_schema>
  GRANT SELECT ON TABLES TO app_ro;
```
2. Transfer ownership of existing objects to `app_owner`: `REASSIGN OWNED BY <old_app_login> TO app_owner;` run in each database where the old login owns objects. This also moves ownership of anything else that role owns in that database; review the Phase 1 ownership list first.
3. `ALTER DEFAULT PRIVILEGES FOR ROLE app_owner` applies only to objects created by `app_owner`. Migrations must therefore create objects as `app_owner`: either `app_migrator` runs `SET ROLE app_owner;` at the start of each migration, or `app_migrator` is created with `INHERIT` and the migration tool is configured to `SET ROLE`. Objects created directly as `app_migrator` would be owned by it and not covered.
4. Add `DELETE` only if the code issues deletes; remove it from the grants if the inventory shows soft deletes only. Add `TRUNCATE`, `REFERENCES` or `TRIGGER` only with a recorded need.
5. Set passwords interactively in psql as admin: `\password app_service`. psql sends a hashed value, so the plaintext is not in the server log. Store each in the secret store per `cfg-choose-secret-store`.
6. Remove superuser and extra attributes from the old login after the switch-over (Phase 3), not before: `ALTER ROLE <old_app_login> NOSUPERUSER NOCREATEROLE NOCREATEDB NOBYPASSRLS;` then drop it when unused (`DROP OWNED BY` is not needed after `REASSIGN OWNED`; `DROP ROLE` fails if anything remains, which is a useful check).

### Output
Role migration file.

### Quality Gate
- The SQL file contains no password literals (`rg -n -i "password\s+'" db/roles/` returns nothing).
- Running the file on a staging copy completes without errors (`psql -v ON_ERROR_STOP=1 -f db/roles/001_least_privilege.sql` exits 0).

---

## Phase 3: Prove Each Role

### Entry Criteria
- Migration applied in staging; the app's secret updated to `app_service` credentials.

### Actions
1. Positive checks as admin:
```sql
SELECT has_table_privilege('app_service', '<app_schema>.invoices', 'INSERT')  AS svc_insert,
       has_table_privilege('app_reporting', '<app_schema>.invoices', 'SELECT') AS ro_select,
       has_table_privilege('app_reporting', '<app_schema>.invoices', 'INSERT') AS ro_insert,
       has_schema_privilege('app_service', '<app_schema>', 'CREATE')           AS svc_create;
```
   Expected: `t`, `t`, `f`, `f`.
2. Negative checks logged in as `app_service` (each must fail with `permission denied`):
   - `CREATE TABLE <app_schema>.probe(id int);`
   - `DROP TABLE <app_schema>.invoices;` (fails with `must be owner of table invoices`)
   - `CREATE ROLE probe;`
3. Default privileges check: as `app_migrator`, `SET ROLE app_owner; CREATE TABLE <app_schema>.probe_new(id int);`, then as admin `SELECT has_table_privilege('app_service','<app_schema>.probe_new','SELECT');` must print `t`. Drop `probe_new` afterward.
4. Run the application's test suite or smoke test against staging with the new login and record the result.
5. Repeat in production after staging passes, then apply step 6 of Phase 2 to the old login.

### Output
`role_ddl`, `privilege_audit`.

### Quality Gate
- The positive check returns exactly `t, t, f, f`.
- All three negative statements fail with a permission error (outputs recorded).
- The default privileges check prints `t`.

---

## Common Mistakes To Avoid

- Do not run the application as the table owner or a superuser "for migrations"; give migrations their own login.
- Do not write passwords in SQL files or with `ALTER ROLE ... PASSWORD 'x'` when statement logging is on.
- Do not forget sequences; inserts into `serial` or identity-backed columns fail without `USAGE` on the sequence (identity columns use an owned sequence too).
- Do not assume `ALTER DEFAULT PRIVILEGES` without `FOR ROLE` covers objects created by other roles; it covers only objects created by the role that ran it.

---

## Worked Example

Illustrative. PostgreSQL 16 on RDS, `database_name=billing`, `app_schema=app`, app currently logs in as `billing_user` which owns all 14 tables and has `rds_superuser`.

Phase 1: `billing_user | rolsuper f | rolcreaterole t | rolcreatedb t`, member of `rds_superuser`; owns all tables.

Phase 2: migration applied in staging, `REASSIGN OWNED BY billing_user TO app_owner;` moved 14 tables and 9 sequences.

Phase 3:
```
 svc_insert | ro_select | ro_insert | svc_create
------------+-----------+-----------+------------
 t          | t         | f         | f
billing=> CREATE TABLE app.probe(id int);
ERROR:  permission denied for schema app
billing=> DROP TABLE app.invoices;
ERROR:  must be owner of table invoices
```
Default privileges check: `t`. Smoke test: 42 passed. `billing_user` revoked from `rds_superuser` and dropped after a week with no connections in `pg_stat_activity`.

---

## Exit Criteria

DONE when the application logs in as a role that can only read and write data in its schema, objects are owned by a NOLOGIN owner used through migrations, default privileges cover future objects, PUBLIC defaults are revoked, and the positive, negative and default privilege checks pass in staging and production.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Managed service blocks reading `pg_authid` | **Adjust**: `pg_roles` is enough; it hides only password hashes. |
| Phase 2 | `REASSIGN OWNED` fails on objects in another database | **Retry**: run it once per database where the role owns objects. |
| Phase 3 | App fails with `permission denied for sequence` | **Adjust**: grant `USAGE, SELECT` on that sequence and check the default privileges statement for sequences. |
| Phase 3 | New tables from the next migration are not readable | **Stop**: the migration did not `SET ROLE app_owner`; fix the migration runner configuration, then grant on the new tables. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
