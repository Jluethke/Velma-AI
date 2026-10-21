# Constraints and Foreign Keys

**One-line description:** Maps every logical attribute to a physical type, then adds NOT NULL, CHECK, UNIQUE (including soft-delete partial uniqueness), and foreign keys with a deliberate ON DELETE action, and proves each constraint rejects a bad row on a disposable database.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `keyed_schema` (object, required): Schema with keys from `dbs-primary-key-strategy`.
- `db_engine` (string, required): `postgresql` or `mysql`.
- `db_version` (string, required): Server major version.

---

## Outputs

- `constrained_schema` (object): Schema with physical types and every constraint named.
- `constraint_ddl` (string): Complete `CREATE TABLE` DDL with named constraints, ready to apply to an empty database.

---

## Phase 1: Physical Types

### Entry Criteria
- `keyed_schema` present.

### Actions
1. Map each logical type with this table:

| Logical type | PostgreSQL | MySQL 8 |
|---|---|---|
| decimal money | `numeric(p, s)` with p and s from the currency rules the user gives | `DECIMAL(p, s)` |
| timestamp with time zone | `timestamptz` | `DATETIME(6)` storing UTC (MySQL `TIMESTAMP` ends at 2038-01-19, its documented range) |
| date | `date` | `DATE` |
| text | `text` | `VARCHAR(n)` with n from the spec, or `TEXT` when unbounded |
| enumerated value set | `text` plus `CHECK (col IN (...))` | `VARCHAR(n)` plus `CHECK (col IN (...))` |
| boolean | `boolean` | `BOOLEAN` (alias of `TINYINT(1)`) |
| integer count | `bigint` or `integer` when the spec bounds it | `BIGINT` or `INT` |
| JSON | `jsonb` | `JSON` |

2. Never use floating point (`real`, `double precision`, `FLOAT`, `DOUBLE`) for money.
3. In PostgreSQL prefer `text` with a `CHECK (char_length(col) <= n)` over `varchar(n)` only if the user's style guide says so; otherwise `varchar(n)` is fine. Record which.

### Output
Typed columns.

### Quality Gate
- Every column has a physical type from the table.
- Zero money columns use floating point (search the DDL for `real|double|float`, case-insensitive: 0 hits on money columns).

---

## Phase 2: Constraints

### Entry Criteria
- Types set.

### Actions
1. NOT NULL: every attribute marked `required` gets `NOT NULL`. Every foreign key column for an `exactly one` relationship gets `NOT NULL`.
2. CHECK: add one per business rule that involves only the same row (`quantity > 0`, `ends_at > starts_at`, status in its value set). MySQL enforces CHECK only from 8.0.16; on older MySQL record each check as "not enforced, app must validate".
3. UNIQUE: one per natural candidate key. Rules for NULLs and soft delete:

| Situation | PostgreSQL | MySQL |
|---|---|---|
| Unique, NULLs allowed many times | `UNIQUE (col)` (default) | `UNIQUE (col)` (default) |
| Unique, only one NULL allowed | `UNIQUE NULLS NOT DISTINCT (col)` (PostgreSQL 15+) | Not supported; use a generated column `COALESCE(col, '')` with a unique index |
| Unique among non-deleted rows (`deleted_at` soft delete) | `CREATE UNIQUE INDEX ... ON t (email) WHERE deleted_at IS NULL` | Generated column `active_email AS (IF(deleted_at IS NULL, email, NULL))` plus `UNIQUE (active_email)` |

4. Foreign keys: pick ON DELETE from ownership in the ER model:

| Relationship | ON DELETE |
|---|---|
| Owned child (order_line under order) | `CASCADE` |
| Independent, child must keep existing (order to customer) | `RESTRICT` |
| Optional association (task assigned to user) | `SET NULL` (column must be nullable) |
| Two rows reference each other (circular) | PostgreSQL: `DEFERRABLE INITIALLY DEFERRED` on one side; MySQL: no deferrable; break the cycle with a nullable column set after insert |

5. Indexes on referencing columns: PostgreSQL does not create one automatically. Add an index whose first column is the foreign key column, unless the primary key or another index already starts with it. MySQL InnoDB creates one automatically when none exists.
6. Name every constraint: `pk_<table>`, `fk_<table>_<column>`, `uq_<table>_<columns>`, `ck_<table>_<rule>`. Unnamed constraints get generated names that differ between environments and break migration tools.
7. PostgreSQL only, optional: no-overlap rules (two bookings of one room cannot overlap) use an exclusion constraint: `CREATE EXTENSION IF NOT EXISTS btree_gist;` then `EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&)`.

### Output
`constraint_ddl` draft.

### Quality Gate
- Every constraint has an explicit name following the pattern.
- Every PostgreSQL foreign key column is the leading column of some index.
- Every ON DELETE action cites a row of the table above.

---

## Phase 3: Prove Each Constraint Rejects Bad Data

### Entry Criteria
- `constraint_ddl` draft.

### Actions
1. Start a disposable server of `db_version` in Docker as in `dbs-primary-key-strategy` Phase 3, and apply `constraint_ddl` with `ON_ERROR_STOP=1` (psql) or `mysql ... < constraint_ddl.sql`.
2. For each constraint, write one insert that should fail and run it. Record the error code: PostgreSQL `23502` not null, `23503` foreign key, `23505` unique, `23514` check, `23P01` exclusion; MySQL `1048` null, `1452` foreign key, `1062` duplicate, `3819` check.
3. Write one valid insert per table and confirm it succeeds.
4. For each `CASCADE`, delete the parent and confirm the child count drops to 0.
5. In PostgreSQL, run the missing-foreign-key-index query and confirm 0 rows (single-column foreign keys):
   ```sql
   SELECT c.conrelid::regclass, c.conname
   FROM pg_constraint c
   WHERE c.contype = 'f' AND NOT EXISTS (
     SELECT 1 FROM pg_index i
     WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]);
   ```

### Output
Final `constraint_ddl` and `constrained_schema` with the test log.

### Quality Gate
- Every constraint has a failing insert whose error code matches the table above.
- The missing-index query returns 0 rows (PostgreSQL).

---

## Common Mistakes To Avoid

- Do not skip constraints because "the app validates". Two app versions, a script, and a manual fix all bypass app validation.
- Do not use `CASCADE` on independent entities; deleting a customer must not silently delete invoices.
- Do not use MySQL `ENUM` when values will change often; adding a value in the middle rebuilds the table. `VARCHAR` plus `CHECK` changes with a constraint swap.
- Do not trust a CHECK on MySQL older than 8.0.16; it is parsed and ignored.

---

## Worked Example

Illustrative only. PostgreSQL 16.

Phase 1: `orders.total numeric(12,2)`, `orders.created_at timestamptz`, `orders.status text`.

Phase 2:
```sql
CREATE TABLE orders (
  id uuid CONSTRAINT pk_orders PRIMARY KEY,
  customer_id bigint NOT NULL CONSTRAINT fk_orders_customer_id REFERENCES customer(id) ON DELETE RESTRICT,
  status text NOT NULL CONSTRAINT ck_orders_status CHECK (status IN ('open','paid','shipped','cancelled')),
  total numeric(12,2) NOT NULL CONSTRAINT ck_orders_total_nonneg CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_orders_customer_id ON orders (customer_id);
```
Phase 3: `INSERT INTO orders (..., status) VALUES (..., 'lost')` fails with `23514`. Missing-index query returns 0 rows.

---

## Exit Criteria

DONE when every column has a physical type, every rule from the model is a named constraint, every constraint has a failing test with the expected error code, and PostgreSQL foreign keys all have a leading index.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Money precision not specified | **Return**: ask for currency and maximum amount; do not pick p and s. |
| Phase 2 | MySQL older than 8.0.16 | **Adjust**: keep CHECKs in DDL for documentation, record them as not enforced, add app validation tasks. |
| Phase 3 | A bad insert succeeds | **Retry**: the constraint is missing or wrong; fix the DDL and rerun all Phase 3 tests. |
| Phase 3 | Valid insert fails | **Adjust**: the constraint is too strict; recheck it against the spec before loosening. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
