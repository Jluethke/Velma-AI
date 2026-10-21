# Auth bcrypt to Argon2id Migration

**One-line description:** Migrates stored bcrypt (or fast legacy digest) password hashes to Argon2id without forcing a password reset, choosing between rehash-on-login and immediate hash wrapping from a decision table, handling bcrypt's 72-byte input limit, and proving with a row-count query that no unprotected legacy hashes remain.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_inventory` (object, required): Output of `auth-session-vs-token-decision`.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `hash_migration_plan` (object): Counts of rows per stored format before and after, the chosen strategy and the table row that selected it, the code paths changed, the SQL used, and the test output.

---

## Phase 1: Measure the Legacy Population

### Entry Criteria
- Read access to the user table in a non-production copy of the database, or the user supplies the counts.

### Actions
1. Count rows per format. PostgreSQL example (replace table and column names with the real ones read from the schema; do not guess them):
   ```sql
   SELECT CASE
            WHEN password_hash LIKE '$argon2id$%' THEN 'argon2id'
            WHEN password_hash LIKE 'argon2$argon2id$%' THEN 'argon2id_django'
            WHEN password_hash ~ '^\$2[aby]\$' THEN 'bcrypt'
            WHEN password_hash ~ '^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$' THEN 'fast_digest'
            ELSE 'other' END AS fmt,
          count(*)
   FROM users GROUP BY 1 ORDER BY 2 DESC;
   ```
   MySQL: use `REGEXP` in place of `~`.
2. For bcrypt rows, read the cost from characters 5 and 6 of the hash (`$2b$12$...` is cost 12): `SELECT substring(password_hash from 5 for 2) AS cost, count(*) FROM users WHERE password_hash ~ '^\$2[aby]\$' GROUP BY 1;`
3. Record the counts in `hash_migration_plan.before`.

### Output
Format and cost counts.

### Quality Gate
- The sum of counts equals `SELECT count(*) FROM users;`.
- `other` count is 0, or every `other` prefix is listed for the user to identify.

---

## Phase 2: Choose the Strategy

### Entry Criteria
- Counts exist.

### Actions
1. Choose with this table (first match wins):

| # | Condition | Strategy |
|---|---|---|
| 1 | `fast_digest` count > 0 | **Wrap now**: replace each stored digest `d` with `argon2id(d)` in a batch job, mark the row `hash_scheme = 'argon2id(legacy_digest)'`; at login compute the legacy digest first, then verify Argon2id. Fast digests are crackable offline today, so waiting for logins is not acceptable. |
| 2 | bcrypt rows exist with cost below 10 | **Wrap now** with `argon2id(bcrypt_hash)` as row 1. OWASP Password Storage Cheat Sheet sets bcrypt work factor 10 or more as the minimum. |
| 3 | bcrypt rows exist, all cost 10 or more | **Rehash on login**: keep verifying bcrypt; after a successful login, store a fresh Argon2id hash of the plaintext. Optionally wrap the remaining rows later; ask the user for that cutoff date (do not invent one). |
| 4 | only Argon2id rows | No migration; check parameters with the stack hashing flow. |

2. Add a `hash_scheme` column if the stored string alone cannot tell wrapped rows apart from plain Argon2id rows. Wrapped rows look like ordinary `$argon2id$` strings, so the column is required for rows 1 and 2.
3. bcrypt 72-byte limit: bcrypt only uses the first 72 bytes of input. Recent library versions reject longer input: Go `bcrypt.GenerateFromPassword` returns `bcrypt.ErrPasswordTooLong`; check your Python `bcrypt` and Node `bcrypt` changelogs for their behavior. During migration, verification of existing bcrypt hashes must pass the plaintext exactly as the original code did (including any truncation) or long-password users will be locked out. Argon2id has no such limit.
4. Do NOT pre-hash a password with plain SHA-256 and feed raw binary to bcrypt: binary digests can contain NUL bytes that some bcrypt implementations stop at. If an existing system already pre-hashes, keep its exact encoding (for example base64 of the digest) when verifying.

### Output
Chosen strategy with row number.

### Quality Gate
- One strategy is recorded with the triggering table row and the counts that triggered it.

---

## Phase 3: Implement and Run

### Entry Criteria
- Strategy chosen; a database backup or a staging copy exists.

### Actions
1. Implement the login-time verify chain in the stack hashing module (`auth-py-argon2id-password-hashing`, `auth-node-argon2id-password-hashing` or `auth-go-argon2id-password-hashing`):
   - `hash_scheme = 'argon2id'`: verify Argon2id directly.
   - `hash_scheme = 'argon2id(bcrypt)'`: verify `argon2id(stored, bcrypt_hash_of_plain)` where the bcrypt hash is recomputed with the salt and cost embedded in the original hash. Python: `bcrypt.hashpw(plain, original_bcrypt_prefix_29_chars)` (the first 29 characters are `$2b$` + cost + `$` + 22-character salt). Node `bcrypt`/`bcryptjs`: `hash(plain, salt29)` accepts a full salt string; confirm in the package README. Go: `x/crypto/bcrypt` exports no function that hashes with a given salt, so bcrypt wrapping is not possible with it. For Go, use rehash-on-login for bcrypt rows and list rows with cost below 10 as an open item for the user, unless the user approves another bcrypt dependency. Wrapping fast digests works in every stack because the digest is deterministic.
   - `bcrypt`: verify bcrypt, then rehash to Argon2id and set `hash_scheme = 'argon2id'`.
   - After any successful legacy verify, write a plain Argon2id hash and set `hash_scheme = 'argon2id'`.
2. For wrap-now strategies, run the batch job in transactions of a fixed batch size the user chooses, with `WHERE hash_scheme = 'bcrypt'` (or the legacy value) so reruns are idempotent.
3. Tests: one per `hash_scheme` value, each asserting login succeeds with the right password, fails with a wrong one, and that the row ends as `hash_scheme = 'argon2id'`.
4. Run the stack test command (`pytest -q`, `npm test`, or `go test ./... -count=1`).

### Output
Migration code, batch job log, test output.

### Quality Gate
- After the batch job, the Phase 1 query shows `fast_digest` = 0 and (for rows 1 and 2) `bcrypt` = 0 unwrapped rows.
- Every `hash_scheme` value has a passing login test.

---

## Phase 4: Report

### Entry Criteria
- Tests pass.

### Actions
1. Rerun the Phase 1 counts and record them in `hash_migration_plan.after`.
2. Record any rows still on a legacy scheme and the rule that keeps them (rehash-on-login waits for the user's next login).

### Output
`hash_migration_plan`.

### Quality Gate
- `before` and `after` counts are both present and sum to the same row total.

---

## Worked Example

Illustrative only. Python Flask app, 41,200 users.

Phase 1 output:
```
   fmt       | count
-------------+-------
 bcrypt      | 39870
 fast_digest |  1330
```
Cost query: all bcrypt rows cost 12.

Phase 2: `fast_digest` > 0 matches row 1, so wrap now for those 1,330 rows; bcrypt rows (cost 12) follow row 3, rehash on login.

Phase 3: batch job log `wrapped 1330 rows in 14 batches`; `pytest -q tests/test_hash_migration.py` prints `3 passed`.

Phase 4 after counts: `bcrypt 39870, argon2id(legacy_digest) 1330, fast_digest 0`.

---

## Exit Criteria

DONE when no fast digest remains unwrapped, every legacy scheme has a tested verify path that upgrades to Argon2id on login, and before and after counts are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No database access | **Return**: ask the user to run the count query and paste the result. |
| Phase 2 | Legacy digest algorithm unknown | **Stop**: do not wrap until the algorithm and salt layout are known; wrapping the wrong value locks users out. |
| Phase 3 | Batch job fails midway | **Retry**: rerun; the `WHERE hash_scheme = ...` filter skips finished rows. |
| Phase 3 | Long-password users fail bcrypt verify in tests | **Adjust**: reproduce the original truncation or encoding exactly when verifying. |
| Phase 4 | Counts do not sum to the total | **Stop**: find the unclassified rows before reporting. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
