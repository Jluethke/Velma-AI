# Idempotency Key Store

**One-line description:** Makes each unsafe job handler safe to run twice by recording its idempotency key in a unique-keyed table inside the same transaction as its database effect, passing the key to external providers that support idempotent requests, and proving it with a run-twice test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `job_inventory` (object[], required): Output of `bjq-handler-side-effect-audit`; the `unsafe_handlers` rows are the work list.
- `payload_schema` (object[], required): Output of `bjq-job-payload-design`; gives the `idempotency_key` source per job.
- `stack` (string, required): `python`, `node` or `ruby`.
- `database` (string, required): `postgres` or `mysql`. The key store lives in the same database as the handler's writes.

---

## Outputs

- `idempotency_design` (object): Table DDL, the per-handler pattern chosen (P1 to P4), key retention rule, and residual risks.
- `idempotency_patch` (object[]): One entry per changed handler: file, diff, and the command plus output of its run-twice test.

---

## Phase 1: Create the Key Table

### Entry Criteria
- At least one handler in `job_inventory` has class C, D or E side effects without protection.

### Actions
1. Write a migration with the project's migration tool (Alembic, Django migrations, Knex, Prisma, Rails `bin/rails g migration`). Do not run raw DDL against a shared database by hand.
2. Postgres DDL:
```sql
CREATE TABLE processed_jobs (
  idempotency_key text PRIMARY KEY,
  job_name        text NOT NULL,
  status          text NOT NULL CHECK (status IN ('started', 'done')),
  result          jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);
CREATE INDEX processed_jobs_created_at_idx ON processed_jobs (created_at);
```
MySQL 8 DDL: same columns with `idempotency_key VARCHAR(255) PRIMARY KEY`, `result JSON`, `created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
3. Run the migration against the local or test database and confirm the table exists: Postgres `psql -c '\d processed_jobs'`, MySQL `mysql -e 'SHOW CREATE TABLE processed_jobs\G'`.

### Output
Migration file and a created table in the test database.

### Quality Gate
- `\d processed_jobs` (or `SHOW CREATE TABLE`) prints the primary key on `idempotency_key`.
- The migration file is committed to the working tree alongside the code change, not applied by hand only.

---

## Phase 2: Choose the Pattern per Handler

### Entry Criteria
- Key table exists.

### Actions
1. Pick exactly one pattern per unsafe handler with this table:

| Side effect class | Pattern | What the handler does |
|---|---|---|
| C (DB write in the same database) | P1 claim in transaction | Open a transaction; insert the key; if the insert hit a conflict, commit nothing and return success; else do the write and mark `done`; commit. Effect and key commit together or not at all. |
| D, and the provider accepts an idempotency key (Stripe `Idempotency-Key` header, other APIs that document one) | P2 provider key | Send the job's `idempotency_key` (or a stable derivative) as the provider's key on every attempt. Then record `done` with the provider's response id. Read the provider's docs for how long it remembers keys. |
| D, and the provider has no idempotency support | P3 claim then act, with reconcile | Insert the key with `status = 'started'` and commit; call the provider; update to `done`. On a retry that finds `started`, query the provider for evidence of the earlier call (sent log, list by reference id) before acting. If the provider cannot be queried, record a residual risk: a crash between the call and the update can cause one duplicate. |
| E (enqueue a child job) | P4 deterministic child id | Give the child a key derived from the parent key (`<parent key>:<child job>`) and pass it as the library's dedupe id (`jobId` in BullMQ, `MessageDeduplicationId` on SQS FIFO), or move the enqueue into the outbox (`bjq-transactional-outbox-enqueue`). |

2. Do not use a Redis `SET key 1 NX EX <ttl>` lock as the only protection for class C or D. Redis-backed locks are lost on Redis failover or eviction and the TTL is a guess. It may be added as a fast pre-check in front of P1 to P3.

### Output
Pattern assignment per handler in `idempotency_design`.

### Quality Gate
- Every handler in `unsafe_handlers` has exactly one of P1 to P4.
- Every P2 row cites the provider documentation page for its idempotency header.

---

## Phase 3: Implement One Handler at a Time

### Entry Criteria
- Patterns assigned.

### Actions
1. Change one handler, run its test, then move to the next. Never edit several handlers before running tests.
2. P1 claim statement by database (use the exact form; it distinguishes inserted from conflicted):

| `database` | Statement | Inserted when |
|---|---|---|
| postgres | `INSERT INTO processed_jobs (idempotency_key, job_name, status) VALUES ($1, $2, 'started') ON CONFLICT (idempotency_key) DO NOTHING RETURNING idempotency_key` | one row returned |
| mysql | `INSERT INTO processed_jobs (idempotency_key, job_name, status) VALUES (?, ?, 'started') ON DUPLICATE KEY UPDATE idempotency_key = idempotency_key` | affected rows = 1 (0 means it already existed). Do not use `INSERT IGNORE`; it also hides unrelated errors. |

3. Stack snippets for P1 (Postgres):
   - `python` (psycopg 3): `with conn.transaction(): cur = conn.execute(SQL, (key, "charge_order")); if cur.fetchone() is None: return "duplicate"; do_write(conn); conn.execute("UPDATE processed_jobs SET status='done', completed_at=now() WHERE idempotency_key=%s", (key,))`.
   - `node` (node-postgres): `const c = await pool.connect(); try { await c.query('BEGIN'); const r = await c.query(SQL, [key, 'charge_order']); if (r.rowCount === 0) { await c.query('ROLLBACK'); return 'duplicate'; } ...; await c.query('COMMIT'); } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }`.
   - `ruby` (Rails 7+): `ApplicationRecord.transaction { r = ProcessedJob.insert({idempotency_key: key, job_name: "charge_order", status: "started"}, unique_by: :idempotency_key, returning: :idempotency_key); next :duplicate if r.rows.empty?; ...; ProcessedJob.where(idempotency_key: key).update_all(status: "done", completed_at: Time.current) }`.
4. A duplicate returns success, not an error. Raising on a duplicate sends the job into retries and the dead-letter queue for no reason.
5. Write the run-twice test for the handler: call the handler function twice with the same payload, then assert the effect happened once (row count, mock call count of the provider client is 1 for P3, or the same provider key was sent both times for P2).
6. Run the test file only, then the full suite: `pytest tests/jobs/test_charge_order.py -q`, `npx vitest run test/jobs/chargeOrder.test.ts` (or `npx jest <file>`), `bundle exec rspec spec/jobs/charge_order_job_spec.rb`.
7. Do not delete, skip or weaken an existing test to make the suite pass. If an existing test asserted the duplicate side effect, report it in `idempotency_patch` and ask before changing it.

### Output
`idempotency_patch` entries with diffs and test output.

### Quality Gate
- Each patch entry contains the test command and its passing output (for example `1 passed`).
- The full suite command exits 0 after the last handler.

---

## Phase 4: Set Key Retention

### Entry Criteria
- All handlers patched.

### Actions
1. Derive the minimum retention: a key must outlive the longest time a duplicate can still arrive, which is the sum of the full retry window (from `retry_policy`, if available, or the library default) and the dead-letter retention plus redrive time. Write the formula with the values filled in. If a value is unknown, record it as an open question; do not pick a number.
2. Add a scheduled delete that runs in batches: Postgres `DELETE FROM processed_jobs WHERE ctid IN (SELECT ctid FROM processed_jobs WHERE created_at < now() - $1::interval LIMIT $2)`; MySQL `DELETE FROM processed_jobs WHERE created_at < ? LIMIT ?`. The batch size is a user input.

### Output
`idempotency_design` complete with retention formula.

### Quality Gate
- The retention formula shows each term and its source.
- The cleanup job itself is idempotent (deleting old rows twice is harmless) and is listed for `bjq-scheduled-cron-jobs`.

---

## Worked Example

Illustrative only.

Input: `stack` = `python`, `database` = `postgres`, unsafe handler `credit_wallet` (class C: `UPDATE wallets SET balance = balance + %s`).

- Phase 1: `alembic revision -m "processed_jobs"`, `alembic upgrade head`, then `psql -c '\d processed_jobs'` shows `"processed_jobs_pkey" PRIMARY KEY, btree (idempotency_key)`.
- Phase 2: P1.
- Phase 3 test:
```
def test_credit_wallet_twice(db):
    p = {"schema_version": 1, "idempotency_key": "credit_wallet:txn:771", "args": {"wallet_id": 5, "cents": 500}}
    credit_wallet.run(p); credit_wallet.run(p)
    assert db.scalar("select balance from wallets where id=5") == 500
$ pytest tests/jobs/test_credit_wallet.py -q
1 passed in 0.41s
```
- Phase 4: retention >= Celery retry window (sum of countdowns from `retry_policy`) + DLQ retention; DLQ retention unknown, recorded as an open question.

---

## Exit Criteria

DONE when every unsafe handler has an assigned pattern, a committed change, and a passing run-twice test, and the key table has a derived retention rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Handler writes to a different database than the app database | **Adjust**: put `processed_jobs` in the database the handler writes to; P1 only works inside one transaction. |
| Phase 2 | Effect spans two databases or a DB plus a provider | **Adjust**: split into two jobs chained through the outbox so each job has one transactional effect. |
| Phase 3 | Run-twice test fails | **Retry**: fix the handler, not the test; rerun the single test file. |
| Phase 3 | Existing tests break | **Stop**: report which assertions conflict; never delete or skip them. |
| Phase 4 | Retry window or DLQ retention unknown | **Return**: list the missing value as an open question for `bjq-retry-backoff-jitter-policy` or `bjq-dead-letter-redrive-runbook`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
