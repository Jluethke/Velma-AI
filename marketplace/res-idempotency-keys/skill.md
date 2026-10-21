# Server-Side Idempotency Keys in PostgreSQL

**One-line description:** Makes non-idempotent endpoints safe to retry by implementing the Idempotency-Key header (IETF httpapi draft) with a PostgreSQL table keyed by tenant and key, an INSERT ON CONFLICT claim, request fingerprint comparison, response replay, in-progress locking with expiry, and retention cleanup, plus a dedup table for message consumers, proven with concurrent duplicate requests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `stack` (string, required): `python`, `node`, `go`, or `java`; selects the middleware hook point.
- `key_retention_hours` (number, required): How long a key is remembered. A product decision; Stripe's API documentation, for example, states keys can be pruned after at least 24 hours. Record the user's value and source.

---

## Outputs

- `idempotency_changes` (object): Endpoints covered, migration file, middleware file:line, status code contract, lock expiry value and source, cleanup job, consumer dedup changes, and the concurrent test output.

---

## Phase 1: Select Endpoints and Write the Migration

### Entry Criteria
- The service uses PostgreSQL for its own state (for other databases, the same design needs a unique constraint and an atomic insert-if-absent; check that database's docs).

### Actions
1. List every POST and PATCH route (`rg -n "@(app|router)\.(post|patch)|\.post\(|\.patch\(|HandleFunc|@PostMapping|@PatchMapping"` for your framework) and mark those with side effects (charges, orders, emails, external calls). These need keys. GET, PUT, DELETE are idempotent by HTTP semantics (RFC 9110 section 9.2.2) when implemented correctly; check each PUT really replaces state.
2. Write the migration with the project's tool (Alembic, Prisma, golang-migrate, Flyway or Liquibase):
   ```sql
   CREATE TABLE idempotency_keys (
     tenant_id     text        NOT NULL,
     idem_key      text        NOT NULL,
     request_hash  bytea       NOT NULL,
     status        text        NOT NULL CHECK (status IN ('in_progress', 'completed')),
     response_code int,
     response_body bytea,
     locked_until  timestamptz,
     created_at    timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (tenant_id, idem_key)
   );
   CREATE INDEX idempotency_keys_created_at ON idempotency_keys (created_at);
   ```
   Scope by `tenant_id` (or user id) so two clients choosing the same key never collide.
3. Run the migration against a local database and check: `psql -c "\d idempotency_keys"`.

### Output
Endpoint list and applied migration.

### Quality Gate
- `\d idempotency_keys` shows the primary key on `(tenant_id, idem_key)`.
- Every side-effecting POST/PATCH is in the endpoint list.

---

## Phase 2: Implement the Claim, Replay and Conflict Logic

### Entry Criteria
- Table exists.

### Actions
1. Fingerprint: `request_hash = sha256(method + " " + path + "\n" + canonical body bytes)`. Canonical means the raw body bytes as received; do not re-serialize JSON (key order changes the hash).
2. Middleware or decorator on the listed routes, in this exact order:
   1. Missing `Idempotency-Key` header: return 400 (the draft's response for a required but missing key).
   2. Claim: `INSERT INTO idempotency_keys (tenant_id, idem_key, request_hash, status, locked_until) VALUES ($1, $2, $3, 'in_progress', now() + $4::interval) ON CONFLICT DO NOTHING RETURNING idem_key;`
   3. If a row was returned: run the handler. Then, in the SAME database transaction as the handler's own writes when possible, `UPDATE idempotency_keys SET status='completed', response_code=$c, response_body=$b, locked_until=NULL WHERE tenant_id=$1 AND idem_key=$2;`
   4. If no row was returned: `SELECT request_hash, status, response_code, response_body, locked_until FROM idempotency_keys WHERE tenant_id=$1 AND idem_key=$2;`
      - `request_hash` differs: 422 (key reused with a different payload).
      - `status` = completed: replay `response_code` and `response_body` exactly, and add a header such as `Idempotent-Replayed: true`.
      - `status` = in_progress and `locked_until > now()`: 409 (request in progress); clients retry later.
      - `status` = in_progress and `locked_until <= now()`: the first attempt crashed. Take over with `UPDATE ... SET locked_until = now() + $4 WHERE tenant_id=$1 AND idem_key=$2 AND locked_until <= now() RETURNING idem_key;` and run the handler only if a row is returned.
3. Lock duration `$4`: the endpoint's `request_deadline_ms` from the timeout plan, so a live request never loses its lock. Write the source.
4. If the handler calls an external API that supports idempotency keys, pass a key derived from this one (for example `<idem_key>:payments`) so the external effect is also deduplicated.
5. Do NOT store the response before the side effect commits; a crash in between would replay a success that never happened.
6. Hook points by `stack`: FastAPI/Starlette dependency or middleware; Express/Fastify `preHandler` plus response capture; Go `http.Handler` wrapper with `httptest.ResponseRecorder`-style capture; Spring `HandlerInterceptor` or a `OncePerRequestFilter` with `ContentCachingResponseWrapper`.

### Output
Middleware applied to listed routes.

### Quality Gate
- Unit tests for each branch (400, first call, replay, 422, 409, crash takeover) pass.
- `rg -n "ON CONFLICT DO NOTHING" <source>` shows the claim statement in one place.

---

## Phase 3: Consumers, Cleanup and Concurrency Proof

### Entry Criteria
- Middleware passes unit tests.

### Actions
1. Message consumers (queues deliver at least once): add `processed_messages(consumer text, message_id text, processed_at timestamptz default now(), PRIMARY KEY (consumer, message_id))` and insert into it in the same transaction as the consumer's writes; on unique violation, acknowledge and skip.
2. Cleanup job: `DELETE FROM idempotency_keys WHERE created_at < now() - make_interval(hours => <key_retention_hours>);` scheduled by the platform's scheduler (Kubernetes CronJob, pg_cron, or the app scheduler). Batch it with `ctid IN (SELECT ctid ... LIMIT 10000)` style deletes if the table is large; check the delete plan with `EXPLAIN`.
3. Concurrency proof against a running instance:
   ```bash
   for i in 1 2 3 4 5; do
     curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8080/orders \
       -H "Idempotency-Key: test-123" -H "Content-Type: application/json" -d '{"sku":"A1","qty":1}' &
   done; wait
   ```
   Expect exactly one 201 and the rest 409 or replayed 201. Then count side effects: `psql -c "select count(*) from orders where client_ref='test-123'"` must print 1.
4. Repeat with the same key and a different body: expect 422.
5. Run the project's test suite and save the summary.

### Output
`idempotency_changes` complete.

### Quality Gate
- The concurrent run produced exactly one side effect (the count query prints 1).
- Different body with the same key returned 422.

---

## Worked Example

Illustrative. `stack` = python (FastAPI), `key_retention_hours` = 24 (user, citing Stripe's documented minimum as precedent). Routes: `POST /orders`, `POST /refunds`.

Phase 1 migration `alembic/versions/7f3a_idempotency.py` applied; `\d idempotency_keys` shows `PRIMARY KEY, btree (tenant_id, idem_key)`.

Phase 3 concurrent curl prints `201 409 409 201 409` (the second 201 is a replay with `Idempotent-Replayed: true`); `select count(*) ...` prints `1`. Same key with `"qty":2` returns `422`.

---

## Exit Criteria

DONE when every side-effecting POST/PATCH requires an Idempotency-Key, duplicate and concurrent requests produce one side effect, mismatched reuse returns 422, crashed claims recover, consumers dedupe by message id, and expired keys are cleaned up.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Service has no database of its own | **Return**: idempotency needs durable shared state; report it as a prerequisite. |
| Phase 2 | Handler writes to a different database than the key table | **Adjust**: mark completed only after the handler commits, and document the crash window between commit and mark (replay will then re-run; the downstream key from action 4 must cover it). |
| Phase 3 | Concurrent run creates two orders | **Stop**: the claim is not atomic; check the primary key and that the handler runs only when the INSERT returned a row. |
| Phase 3 | Clients do not send keys yet | **Adjust**: deploy with the 400 rule behind a flag, coordinate client changes, then enable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
