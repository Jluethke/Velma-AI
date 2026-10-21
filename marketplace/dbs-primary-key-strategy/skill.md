# Primary Key Strategy

**One-line description:** Chooses the primary key for every relation with a decision table (natural key, composite key, bigint identity, or UUID version 7), writes the exact column definition for PostgreSQL or MySQL, and names the generator library when IDs are created in the application.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `logical_schema` (object, required): Schema from `dbs-denormalize-decision`.
- `db_engine` (string, required): `postgresql` or `mysql`.
- `db_version` (string, required): Server major version, read from `SELECT version();`. It decides whether built-in `uuidv7()` exists.

---

## Outputs

- `keyed_schema` (object): `logical_schema` with a primary key on every relation and a unique constraint on every natural candidate key that is not the primary key.
- `key_decisions` (object[]): Per relation: key kind, column definition, generator (database or application library), and the decision table row used.

---

## Phase 1: Classify Each Relation

### Entry Criteria
- `logical_schema`, `db_engine`, `db_version` present.

### Actions
1. Confirm the version yourself: run `psql "$URL" -Atc "SHOW server_version_num;"` or `mysql -N -e "SELECT VERSION();"`. Record the output.
2. For each relation, answer these questions in writing: (a) Is it a junction table with no attributes of its own beyond the two foreign keys and a timestamp? (b) Does it have a natural candidate key that is assigned by an outside authority and never changes (ISO 4217 currency code, ISO 3166 country code)? (c) Will IDs be created outside this database (mobile offline, another service, merged from several databases)? (d) Will the ID appear in public URLs or APIs where guessing the next ID is a problem?
3. Pick the key with this table, first matching row wins:

| Condition | Primary key |
|---|---|
| (a) junction table | Composite key of the two foreign keys `(a_id, b_id)`, plus an index on `(b_id, a_id)` |
| (b) immutable external code | Natural key, `text` (PostgreSQL) or `CHAR(n)`/`VARCHAR(n)` (MySQL) |
| (c) IDs created outside the database | UUID version 7 |
| (d) public ID and enumeration matters | UUID version 7 as primary key, or bigint primary key plus a separate unique UUID `public_id` column |
| Any other case | 64-bit integer identity |

4. Never pick a 32-bit integer key: `integer` (PostgreSQL) and `INT` (MySQL) stop at 2,147,483,647, the type's documented maximum, and changing the type later rewrites the table and every referencing column.
5. Never use a mutable natural value (email, username, phone number) as the primary key. Use a surrogate and put `UNIQUE` on the natural value.

### Output
Key kind per relation.

### Quality Gate
- Every relation has one row in `key_decisions` with the table row number that selected it.
- Zero relations use a 32-bit integer key.
- Every mutable natural candidate key has a `UNIQUE` constraint listed.

---

## Phase 2: Write the Column Definitions

### Entry Criteria
- Key kinds chosen.

### Actions
1. Write the definition from this table, using the engine in `db_engine`:

| Kind | PostgreSQL | MySQL (InnoDB) |
|---|---|---|
| 64-bit identity | `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | `id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY` |
| UUID v7, database generated | `id uuid PRIMARY KEY DEFAULT uuidv7()` only when `server_version_num` is 180000 or higher | Not available; generate in the application |
| UUID v7, application generated | `id uuid PRIMARY KEY` | `id BINARY(16) NOT NULL PRIMARY KEY` |
| Foreign key to a bigint key | `customer_id bigint NOT NULL REFERENCES customer(id)` | `customer_id BIGINT UNSIGNED NOT NULL` plus `FOREIGN KEY` clause |

2. For application-generated UUID v7, name the library for the stack and do not write your own generator:

| Stack | Library and call |
|---|---|
| Python 3.14 and later | `uuid.uuid7()` in the standard library |
| Python before 3.14 | `uuid6` package `uuid6.uuid7()`, or `uuid-utils` package `uuid_utils.uuid7()` |
| Node | `uuid` package version 10 or later, `import { v7 } from 'uuid'` |
| Go | `github.com/google/uuid`, `uuid.NewV7()` |
| Java | `com.github.f4b6a3:uuid-creator`, `UuidCreator.getTimeOrderedEpoch()` |

3. MySQL UUID storage: convert with `UUID_TO_BIN(?)` on write and `BIN_TO_UUID(id)` on read. Do not pass the swap flag (`UUID_TO_BIN(?, 1)`) for version 7; it reorders version 1 time fields and breaks the v7 ordering.
4. Store UUIDs in the native `uuid` type in PostgreSQL. Never as `varchar(36)` or `text`.
5. Write a one-line note in `key_decisions` for each UUID key: version 7 embeds the creation time in milliseconds (RFC 9562 section 5.7), so the ID reveals when the row was made. If that is unacceptable, use a bigint key plus a random version 4 `public_id`.

### Output
`keyed_schema`, `key_decisions`.

### Quality Gate
- Every definition in `keyed_schema` matches a cell in the table above for the chosen engine.
- `uuidv7()` appears only when the recorded `server_version_num` is 180000 or higher.
- Every application-generated key names a library from the stack table.

---

## Phase 3: Prove the Definitions Parse

### Entry Criteria
- Definitions written.

### Actions
1. Start a disposable server of the same major version: `docker run --rm -d --name dbs-pk -e POSTGRES_PASSWORD=pw -p 55432:5432 postgres:<major>` or `docker run --rm -d --name dbs-pk -e MYSQL_ROOT_PASSWORD=pw -p 53306:3306 mysql:<major>`.
2. Apply only the `CREATE TABLE` statements with key columns: `psql "postgresql://postgres:pw@localhost:55432/postgres" -v ON_ERROR_STOP=1 -f keys.sql` or `mysql -h127.0.0.1 -P53306 -uroot -ppw -e "CREATE DATABASE t; USE t; SOURCE keys.sql;"`.
3. Insert two rows into each table using the chosen generator and read them back in key order. For UUID v7, confirm the second inserted ID sorts after the first.
4. Stop the container: `docker stop dbs-pk`.

### Output
Apply log with exit codes.

### Quality Gate
- `psql` or `mysql` exits 0.
- The ordering check prints the two IDs in insertion order.

---

## Common Mistakes To Avoid

- Do not use UUID version 4 as the clustered primary key in InnoDB. Random keys insert across the whole B-tree and split pages; version 7 is time ordered.
- Do not assume `uuidv7()` exists because a blog said so. Check `server_version_num`.
- Do not use `SERIAL` for new PostgreSQL tables; use identity columns, which are SQL standard and keep the sequence owned by the column.
- Do not expose sequential bigint IDs in public URLs when the spec says enumeration matters.

---

## Worked Example

Illustrative only. PostgreSQL, `SHOW server_version_num` prints `170004`.

Phase 1: `currency` gets natural key `code text` (ISO 4217). `product_tag` gets composite `(product_id, tag_id)`. `order` IDs are created by an offline mobile client, so UUID v7. `customer` gets bigint identity plus `UNIQUE (email)`.

Phase 2: `order.id uuid PRIMARY KEY` with the app generating IDs via `uuid6.uuid7()` (Python 3.12). `uuidv7()` not used because 170004 is below 180000.

Phase 3: `psql ... -f keys.sql` exits 0; two order IDs `01929b1e-...` then `01929b1f-...` read back in insertion order.

---

## Exit Criteria

DONE when every relation has a key chosen by the table, a definition valid for the engine and version, a named generator, and the DDL applies on a disposable server of the same major version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot connect to read the version | **Return**: ask the user for the exact major version; do not assume the latest. |
| Phase 2 | Stack not in the library table | **Adjust**: search the official package registry for a maintained RFC 9562 UUID v7 implementation and cite it; do not hand-roll one. |
| Phase 3 | `function uuidv7() does not exist` | **Adjust**: the server is older than 18; switch to application generation. |
| Phase 3 | Docker not available | **Adjust**: use any disposable server of the same major version and record which. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
