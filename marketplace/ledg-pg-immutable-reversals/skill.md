# Ledger PostgreSQL Immutable Rows and Reversals

**One-line description:** Makes ledger tables append-only in PostgreSQL with privilege revokes plus BEFORE UPDATE/DELETE/TRUNCATE triggers, and implements corrections as reversal entries that negate every posting of the original and link to it, so history is never rewritten.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.

---

## Outputs

- `reversal_procedure` (object): Migration file path for the immutability triggers and grants, the SQL function `ledger_reverse_entry(entry_id, idempotency_key, reason)`, the application role name, and the psql transcript of the acceptance checks.

---

## Phase 1: Block Updates and Deletes

### Entry Criteria
- `ledger_schema` acceptance checks passed.
- The application connects as a role that does not own the tables. Check: `select tableowner from pg_tables where tablename='postings'` differs from the app role. Owners and superusers bypass revoked privileges.

### Actions
1. Write a new migration (do not edit the schema migration).
2. Trigger function:
```
CREATE FUNCTION ledger_forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ledger table % is append-only (% blocked)', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END $$;
CREATE TRIGGER postings_no_update_delete BEFORE UPDATE OR DELETE ON postings
  FOR EACH ROW EXECUTE FUNCTION ledger_forbid_change();
CREATE TRIGGER postings_no_truncate BEFORE TRUNCATE ON postings
  FOR EACH STATEMENT EXECUTE FUNCTION ledger_forbid_change();
```
Repeat both triggers for `journal_entries`.
3. Privileges for the app role (name from the user, for example `ledger_app`):
```
REVOKE UPDATE, DELETE, TRUNCATE ON journal_entries, postings FROM ledger_app;
GRANT SELECT, INSERT ON journal_entries, postings TO ledger_app;
```
4. Note the remaining bypass: a superuser can set `session_replication_role = replica`, which skips ordinary triggers. Record who holds superuser and that audit logging (for example `log_statement = 'ddl'` or the pgaudit extension, if installed) covers it.

### Output
Immutability migration.

### Quality Gate
- As the app role, `UPDATE postings SET amount_minor = 1 WHERE id = 1;` fails with `permission denied for table postings`.
- As the owner, the same statement fails with `ledger table postings is append-only (UPDATE blocked)`.
- `TRUNCATE postings;` as the owner fails with the trigger message.

---

## Phase 2: Reversal Entries

### Entry Criteria
- Phase 1 checks pass.

### Actions
1. Write `ledger_reverse_entry(p_entry_id bigint, p_key text, p_reason text) RETURNS bigint` in plpgsql:
   1. `SELECT ... FROM journal_entries WHERE id = p_entry_id FOR UPDATE` to serialize concurrent reversals of the same entry.
   2. If the entry is itself a reversal (`reverses_entry_id IS NOT NULL`), raise an error: reversing a reversal is done by posting a new correct entry, not by chaining.
   3. Insert a new `journal_entries` row with `reverses_entry_id = p_entry_id`, `idempotency_key = p_key`, `description = 'Reversal of ' || p_entry_id || ': ' || p_reason`, `effective_at = now()` (the current open period, not the original date, unless the user's period-close policy says otherwise), and `request_hash` computed over `p_entry_id` and `p_reason`.
   4. `INSERT INTO postings (entry_id, account_id, currency, amount_minor) SELECT new_id, account_id, currency, -amount_minor FROM postings WHERE entry_id = p_entry_id`.
   5. Return `new_id`.
2. The `UNIQUE` on `reverses_entry_id` from the schema makes a second reversal of the same entry fail with `duplicate key value violates unique constraint`.
3. A partial correction is two entries: a full reversal and a new correct entry. Never post only the difference without the link; auditors follow `reverses_entry_id`.
4. Grant `EXECUTE` on the function to the app role.

### Output
`reversal_procedure`.

### Quality Gate
- After reversing entry N, `SELECT account_id, sum(amount_minor) FROM postings WHERE entry_id IN (N, R) GROUP BY account_id` returns 0 for every account.
- A second call to reverse N fails with the unique constraint error.
- The original entry's postings are unchanged: their `id` and `amount_minor` match a capture taken before the reversal.

---

## Worked Example

Illustrative only. Entry 41 charged a customer 2500 USD cents in error.
```
ledger_dev=> SELECT ledger_reverse_entry(41, 'rev-41-a', 'duplicate charge');
 ledger_reverse_entry
----------------------
                   57
ledger_dev=> SELECT account_id, sum(amount_minor) FROM postings WHERE entry_id IN (41,57) GROUP BY account_id;
 account_id | sum
------------+-----
          3 |   0
          9 |   0
ledger_dev=> SELECT ledger_reverse_entry(41, 'rev-41-b', 'again');
ERROR:  duplicate key value violates unique constraint "journal_entries_reverses_entry_id_key"
```

---

## Exit Criteria

DONE when updates, deletes and truncates on ledger tables fail for both the app role and the owner, and reversals create a linked negating entry that nets every account to zero and cannot be repeated.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | App connects as the table owner | **Stop**: create a separate app role and switch the connection; revokes do not bind the owner. |
| Phase 1 | Existing code issues UPDATE on postings | **Adjust**: list each call site; replace with reversal plus new entry before applying the trigger in shared environments. |
| Phase 2 | Period of original entry is closed | **Adjust**: post the reversal in the current open period, as this flow does by default. |
| Phase 2 | Reversal entry fails the balance trigger | **Stop**: the original was unbalanced, which the schema should have blocked; run `ledg-pg-audit-queries`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
