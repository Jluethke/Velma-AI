# Ledger PostgreSQL Idempotent Posting

**One-line description:** Implements a posting function that writes a journal entry and its postings exactly once per client idempotency key using `INSERT ... ON CONFLICT DO NOTHING RETURNING`, compares a canonical request hash to catch key reuse with a different payload, and retries serialization and deadlock failures with the same key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.
- `reversal_procedure` (object, required): Output of `ledg-pg-immutable-reversals`. The posting service exposes reversal through the same idempotent path.

---

## Outputs

- `posting_service` (object): File path and signature of `post_entry(idempotency_key, description, effective_at, postings[], external_ref)`, the canonical hash definition, the retry rule with the SQLSTATE codes it retries, and the transcript of the duplicate, conflict and concurrent-duplicate checks.

---

## Phase 1: Define the Key and the Hash

### Entry Criteria
- `journal_entries.idempotency_key` is `UNIQUE` and `request_hash` exists (from `ledger_schema`).

### Actions
1. The key comes from the caller, not the server: for API requests, the client's `Idempotency-Key` header; for events, a stable id such as the processor event id (Stripe `evt_...`) or `"<source>:<object id>:<action>"`. Never generate a fresh UUID inside the retry loop; that defeats idempotency.
2. Canonical request form: JSON with keys sorted, no whitespace, amounts as integer strings, timestamps in UTC RFC 3339, and postings sorted by `(account_id, currency, amount_minor)`. Hash it with SHA-256 and store the lowercase hex in `request_hash`.
3. Write the canonical form function in the stack's language with a unit test: two payloads that differ only in key order or posting order give the same hash; a payload that differs by one minor unit gives a different hash.

### Output
Key source rule and tested hash function.

### Quality Gate
- The hash unit test passes and covers key order, posting order and a one-unit difference.

---

## Phase 2: Write the Posting Transaction

### Entry Criteria
- Hash function tested.

### Actions
1. In one transaction:
```
BEGIN;
INSERT INTO journal_entries (idempotency_key, request_hash, description, effective_at, external_ref)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```
2. If a row came back: insert all postings with one multi-row `INSERT INTO postings ... VALUES (...), (...)`, then `COMMIT`. The deferred balance trigger runs at `COMMIT`.
3. If no row came back: the key exists. `SELECT id, request_hash FROM journal_entries WHERE idempotency_key = $1`. If the hash matches, `COMMIT` (nothing written) and return the existing id with a `replayed = true` flag. If the hash differs, `ROLLBACK` and return a conflict error (HTTP 409 or 422 per the API's convention) naming the key.
4. Concurrency behavior to rely on: when two transactions insert the same key, the second waits on the unique index until the first commits or aborts. If the first commits, the second's `ON CONFLICT DO NOTHING` returns no row and step 3 runs. If the first aborts, the second inserts.
5. Retry rule: on SQLSTATE `40001` (serialization_failure) or `40P01` (deadlock_detected), roll back and rerun the whole transaction with the same key and payload. The maximum retry count and backoff are user inputs; record them, do not invent them.
6. Do not catch `23505` (unique_violation) from the postings insert as success; with `ON CONFLICT` on the entry it should not happen, and if it does it is a bug.

### Output
`post_entry` implementation.

### Quality Gate
- The code calls `ON CONFLICT (idempotency_key) DO NOTHING RETURNING id` exactly once per call path: `rg -n "ON CONFLICT \(idempotency_key\)"` shows it.
- The retry branch matches on SQLSTATE codes, not on error message text.

---

## Phase 3: Prove It

### Entry Criteria
- Implementation compiles and existing tests pass.

### Actions
1. Duplicate test: call `post_entry` twice with the same key and payload. Assert one row in `journal_entries` for the key, one set of postings, second call returns `replayed = true`.
2. Conflict test: same key, amount changed by one minor unit. Assert the conflict error and no new rows.
3. Concurrent duplicate test: open two connections, start both transactions, insert the same key from both, commit the first, then let the second continue. Assert the second returns the replay path. In psql you can do this by hand with two terminals.
4. Count check after the tests: `SELECT idempotency_key, count(*) FROM journal_entries GROUP BY 1 HAVING count(*) > 1;` returns zero rows.
5. Run the stack's full test command and record the summary.

### Output
`posting_service`.

### Quality Gate
- All three tests pass.
- The duplicate-key count query returns zero rows.

---

## Worked Example

Illustrative only.
```
-- terminal 1
ledger_dev=> BEGIN; INSERT INTO journal_entries (idempotency_key, request_hash, description, effective_at)
             VALUES ('evt_1Q', 'ab12', 'charge', now()) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id;
 id
----
 88
-- terminal 2 (blocks here until terminal 1 commits)
ledger_dev=> BEGIN; INSERT INTO journal_entries (...) VALUES ('evt_1Q', 'ab12', ...) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id;
-- terminal 1
ledger_dev=*> INSERT INTO postings ...; COMMIT;
-- terminal 2 now returns
 id
----
(0 rows)
```
Terminal 2 then selects the existing row, sees hash `ab12` matches, and returns entry 88 as replayed.

---

## Exit Criteria

DONE when the same key and payload posts once, the same key with a different payload is rejected, concurrent duplicates resolve to one entry, and retries reuse the key.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Caller cannot supply a stable key | **Return**: ask for a natural key from the source event; without one, idempotency is not possible. |
| Phase 2 | Balance trigger fails at COMMIT | **Return**: report the unbalanced payload to the caller; do not retry, it will fail again. |
| Phase 2 | Retries exhausted | **Return**: surface the last SQLSTATE; the caller retries later with the same key. |
| Phase 3 | Duplicate rows found | **Stop**: the unique constraint is missing or the key differs per retry; fix before use. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
