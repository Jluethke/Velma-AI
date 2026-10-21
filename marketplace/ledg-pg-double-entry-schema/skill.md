# Ledger PostgreSQL Double-Entry Schema

**One-line description:** Creates a PostgreSQL double-entry ledger schema (accounts, journal entries, postings in integer minor units) where a deferred constraint trigger rejects any journal entry whose postings do not sum to zero per currency, and a composite foreign key keeps every posting in its account's currency.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `database_url` (string, required): libpq connection URI for a development or test database, for example `postgresql://ledger_admin@localhost:5432/ledger_dev`. Never a production database for this flow.
- `money_representation_spec` (object, required): Output of `ledg-money-representation-decision`.

---

## Outputs

- `ledger_schema` (object): Migration file path, table and column list, the sign convention, constraint and trigger names, and the psql transcript of the four acceptance checks.

---

## Phase 1: Write the Migration

### Entry Criteria
- `psql "$DATABASE_URL" -c 'select version()'` connects and reports PostgreSQL 12 or later (generated identity columns need 10, `EXECUTE FUNCTION` in triggers needs 11).
- The database is not production: `select current_database()` matches a dev or test name the user confirmed.

### Actions
1. Write one migration file in the project's migration tool format (for example `migrations/0001_ledger.sql`). Do not edit existing migrations.
2. Sign convention: `amount_minor > 0` is a debit, `< 0` is a credit. Write it in a SQL comment at the top.
3. Tables:
```
CREATE TABLE accounts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  currency      char(3) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, currency)
);
CREATE TABLE journal_entries (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idempotency_key   text NOT NULL UNIQUE,
  request_hash      text NOT NULL,
  description       text NOT NULL,
  effective_at      timestamptz NOT NULL,
  posted_at         timestamptz NOT NULL DEFAULT now(),
  external_ref      text,
  reverses_entry_id bigint UNIQUE REFERENCES journal_entries(id)
);
CREATE TABLE postings (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_id      bigint NOT NULL REFERENCES journal_entries(id),
  account_id    bigint NOT NULL,
  currency      char(3) NOT NULL,
  amount_minor  bigint NOT NULL CHECK (amount_minor <> 0),
  FOREIGN KEY (account_id, currency) REFERENCES accounts (id, currency)
);
CREATE INDEX postings_entry_idx ON postings (entry_id);
CREATE INDEX postings_account_idx ON postings (account_id, id);
```
4. If `money_representation_spec` says decimal for posted amounts, use `numeric(P,S)` with P and S from the spec instead of `bigint`. Never `money`, `real` or `double precision`.
5. Balance trigger (deferred so all postings of an entry insert first, checked at COMMIT):
```
CREATE FUNCTION ledger_check_entry_balanced() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM postings WHERE entry_id = NEW.entry_id) < 2 THEN
    RAISE EXCEPTION 'journal entry % has fewer than 2 postings', NEW.entry_id USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM postings WHERE entry_id = NEW.entry_id
             GROUP BY currency HAVING sum(amount_minor) <> 0) THEN
    RAISE EXCEPTION 'journal entry % does not balance', NEW.entry_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER postings_balanced
  AFTER INSERT ON postings DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_check_entry_balanced();
```
6. Do not add `ON DELETE CASCADE` anywhere; ledger rows are never deleted (`ledg-pg-immutable-reversals` enforces this).

### Output
Migration file.

### Quality Gate
- The file contains no `money`, `real`, `float` or `double precision` type: `rg -n -i -e '\bmoney\b' -e '\breal\b' -e 'double precision' -e '\bfloat' migrations/0001_ledger.sql` prints nothing.
- The file contains `DEFERRABLE INITIALLY DEFERRED`.

---

## Phase 2: Apply and Prove

### Entry Criteria
- Migration file exists.

### Actions
1. Apply: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0001_ledger.sql` (or the migration tool's apply command). `ON_ERROR_STOP=1` makes psql exit non-zero on the first error.
2. Seed two USD accounts and one EUR account in a scratch transaction.
3. Run the four acceptance checks, each in its own `BEGIN; ... COMMIT;`:
   - A: balanced entry (+1000 cash, -1000 revenue, both USD) commits.
   - B: unbalanced entry (+1000, -999) fails at `COMMIT` with `ERROR:  journal entry N does not balance`.
   - C: single-posting entry fails with `has fewer than 2 postings`.
   - D: a USD posting to the EUR account fails with `violates foreign key constraint`.
4. Save the psql output of all four. B and C must fail at COMMIT, not at INSERT; that proves the trigger is deferred.
5. Roll back or drop the seed data per the user's preference; the schema stays.

### Output
`ledger_schema`.

### Quality Gate
- Check A prints `COMMIT`.
- Checks B, C and D each print an `ERROR:` line with the expected text, and B and C print it after the `COMMIT` command.
- `psql "$DATABASE_URL" -c '\d postings'` lists the trigger `postings_balanced`.

---

## Worked Example

Illustrative only.
```
$ psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0001_ledger.sql
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
ledger_dev=# BEGIN;
ledger_dev=*# INSERT INTO journal_entries (idempotency_key, request_hash, description, effective_at) VALUES ('t-b','h','bad', now()) RETURNING id;
 id
----
  2
ledger_dev=*# INSERT INTO postings (entry_id, account_id, currency, amount_minor) VALUES (2,1,'USD',1000),(2,2,'USD',-999);
INSERT 0 2
ledger_dev=*# COMMIT;
ERROR:  journal entry 2 does not balance
```

---

## Exit Criteria

DONE when the migration applies cleanly on a non-production database, balanced entries commit, unbalanced and single-posting entries fail at commit, and cross-currency postings fail on the foreign key.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | PostgreSQL older than 11 | **Adjust**: use `EXECUTE PROCEDURE` in the trigger; older than 10, replace identity with `bigserial`. |
| Phase 1 | `database_url` points at production | **Stop**: ask for a dev or test database. |
| Phase 2 | Check B commits | **Stop**: the trigger is missing or not deferred; inspect `\d postings` and fix the migration. |
| Phase 2 | Apply fails midway | **Retry**: wrap the migration in `BEGIN; ... COMMIT;` (or the tool's transactional mode), fix the error and rerun. |

---

## Reference Section

### Why per-currency sums
A conversion entry has USD and EUR postings. Summing across currencies is meaningless, so the trigger groups by `currency` and each currency must net to zero on its own through clearing accounts (see `ledg-fx-rate-conversion`).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
