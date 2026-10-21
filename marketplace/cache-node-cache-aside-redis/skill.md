# Node Cache-Aside With node-redis

**One-line description:** Adds a cache-aside read path and after-commit invalidation to one Node.js or TypeScript hotspot using the official `redis` (node-redis v4 or later) client, with a single connected client, command timeouts enforced in code, fail-open on errors, and tests run against a real Redis container.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Node.js repository.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`.
- `ttl_table` (object[], required): TTL and jitter per entry type from `cache-ttl-from-change-rate`.
- `invalidation_plan` (object[], required): Strategy and writer list from `cache-invalidation-strategy-select`.

---

## Outputs

- `cache_aside_change` (object): Files changed, the read function wrapped, the writers hooked, the test command and its pass output, and the client package and version.

---

## Phase 1: Prepare Client and Tests

### Entry Criteria
- Tests run green before any change: run the repo's test script (`npm test` or the script in `package.json`) and record the summary line.

### Actions
1. Check which client the repo already uses: `npm ls redis ioredis`. If one is present, use it and do not add the other. This flow shows node-redis (`redis` package). For ioredis the calls differ: `redis.set(key, val, 'EX', ttl)` instead of an options object.
2. If neither is present: `npm install redis`. Confirm the major version with `npm ls redis`; v4 and later are promise-based and need `await client.connect()`.
3. Create one module, for example `src/cache/client.ts`, that creates and connects ONE client at startup:
   `const client = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: CONNECT_TIMEOUT_MS } });`
   `client.on('error', (err) => logger.warn({ err }, 'redis error'));`
   The `error` listener is required: an unhandled `error` event on an EventEmitter crashes the process.
   Check the node-redis README for your installed version before relying on any other socket option name.
4. Commands queue while the client is reconnecting, so a read can wait indefinitely. Bound every cache call in code with a timeout helper: `Promise.race([client.get(key), timeout(OP_TIMEOUT_MS)])`. Both timeout values are user inputs.
5. Write failing tests in the repo's runner (Jest or Vitest) against a real Redis started with `docker run --rm -d -p 6379:6379 --name cache-test redis:7`:
   - second call does not hit the repository (spy on it);
   - after the writer commits, the next read returns the new value;
   - with the client disconnected (`await client.disconnect()` in the test) the read still returns the repository value.
6. Run them. They must fail now.

### Output
Client module and failing tests.

### Quality Gate
- `npx vitest run <entity>Cache` (or `npx jest <entity>Cache`) exits non-zero with assertion failures.
- `npm ls redis` prints one version.

---

## Phase 2: Implement the Read Path

### Entry Criteria
- Failing tests exist.

### Actions
1. Edit only the hotspot function:

   ```ts
   export async function getProduct(id: number): Promise<Product> {
     const key = keys.product(id);
     const raw = await safe(() => client.get(key));      // safe() = timeout + catch, returns null on error
     if (raw !== null) return JSON.parse(raw) as Product;
     const value = await repo.loadProduct(id);
     if (value !== null) {
       await safe(() => client.set(key, JSON.stringify(value), { EX: ttlWithJitter(PRODUCT_TTL, PRODUCT_JITTER) }));
     }
     return value;
   }
   ```
2. `EX` is seconds, `PX` is milliseconds; node-redis takes them in the options object.
3. Do not `await` the cache write if the caller is latency sensitive and the team accepts fire-and-forget; if you skip the await, attach `.catch()` so a rejected promise is not unhandled.
4. `JSON.stringify` drops `undefined` fields and turns `Date` into strings. If the value contains `Date`, `Map`, `BigInt` or class instances, write one explicit serializer and test the round trip.
5. Run the read tests until they pass.

### Output
Read path implemented.

### Quality Gate
- Read tests exit 0.
- `git diff --stat` lists only the hotspot file, the client module and the test file.

---

## Phase 3: Hook the Writers

### Entry Criteria
- Read tests pass.

### Actions
1. For each in-service writer in `invalidation_plan`, delete the key after the transaction resolves. One writer per edit, tests after each.
   - Prisma: call delete after `await prisma.$transaction([...])` resolves, not inside the callback.
   - Knex: after `await trx.commit()` or after `await knex.transaction(async trx => {...})` returns.
   - TypeORM: after `await dataSource.transaction(...)` returns.
   - Sequelize: `t.afterCommit(() => safeDel(key))` inside a managed transaction.
2. For `write-through` rows, set the committed value read back after commit.
3. Run the full suite, then stop the container: `docker stop cache-test`.

### Output
`cache_aside_change`.

### Quality Gate
- Full suite exits 0 with the pass count at least the baseline plus the new tests.
- During the test run, `redis-cli TTL <example key>` returns a positive number; -1 means the key has no expiry.

---

## Worked Example

Illustrative. Express + Prisma, entry `product`, TTL 300 s.

Phase 1: `npm ls redis` shows `redis@4.7.0`. New Vitest tests fail: `expected "spy" to be called 1 times, but got 2 times`.

Phase 2: edit `src/catalog/productRepo.ts`; read tests pass.

Phase 3: `src/catalog/adminRoutes.ts` deletes `keys.product(id)` after `await prisma.$transaction(...)`. `npx vitest run` prints `Tests 148 passed (148)`. `redis-cli TTL shop:product:v3:42` prints `(integer) 291`.

---

## Exit Criteria

DONE when the hotspot reads through Redis with bounded wait time, writers invalidate after commit, Redis failures fall back to the repository, and the suite passes against a real Redis.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo already uses ioredis | **Adjust**: use ioredis call signatures; do not add a second client library. |
| Phase 1 | `ClientClosedError` in tests | **Adjust**: the client was not connected; `await client.connect()` in setup and `await client.quit()` in teardown. |
| Phase 2 | Process crashes on Redis restart | **Adjust**: the `error` listener is missing; add it in the client module. |
| Phase 3 | Existing test fails after a writer edit | **Retry**: revert that edit and fix the cause; never skip or delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
