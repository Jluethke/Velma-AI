# Node.js Async Interleaving Race Hunt

**One-line description:** Finds check-then-act and read-modify-write sequences split by `await` in Node.js request or job code, plus request context leaking through module globals, proves each with a controlled-promise test that forces the bad ordering, and names the fix (atomic store operation, per-key async mutex, AsyncLocalStorage).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `shared_state_inventory` (object[], required): From `race-shared-state-inventory`; Node rows (module variables, caches, objects shared across requests).
- `stress_command` (string, required): From `race-stress-harness`.

---

## Outputs

- `node_interleaving_findings` (object[]): One row per race: `location` (file:line range from the read to the write), `shared_target` (module variable, cache key, database row, file), `await_between` (the `await` lines between read and write), `pattern`, `proof_test` (test file and name, result before fix), `fix_direction`.

---

## Phase 1: Find Await-Split Sequences

### Entry Criteria
- Node rows in `shared_state_inventory`, or request handlers that read then write a database row or cache entry.

### Actions
1. Node runs JavaScript on one thread, so synchronous code between two `await`s cannot interleave with other JavaScript. A race needs an `await` (or callback boundary) between a read and the write that depends on it. Search for the shape:
   - module-level state: for each inventory row, `rg -n -w "<name>" src/` and inspect each function that reads it, awaits, then writes it.
   - store state: `rg -n "await .*\.(get|findOne|findUnique|findById|select|hget|exists)\(" src/` then check whether the same function later writes the same key with `set`, `update`, `save`, `insert`, `hset`.
2. Mark each sequence with one pattern:

| Pattern | Shape | Example |
|---|---|---|
| Check-then-act across await | `if (!(await exists(k))) await create(k)` | Duplicate user created by two signups |
| Read-modify-write across await | `const n = await get(k); await set(k, n + 1)` | Lost increment of a counter or balance |
| Cache stampede | `if (!cache.has(k)) cache.set(k, await load(k))` | Many concurrent loads of the same key |
| Module-global request context | `let currentUser;` set at request start, read after an `await` | Request A sees request B's user |
| Shared accumulator in `Promise.all` | `await Promise.all(xs.map(async x => { total = total + await price(x); }))` | Each callback reads `total` before another's write lands |

3. For each sequence, list the `await` lines between read and write in `await_between`.

### Output
Candidate sequences with a pattern.

### Quality Gate
- Every candidate has at least one line in `await_between`; candidates with none are discarded (sync code cannot interleave on the main thread).
- Every candidate names one table pattern.

---

## Phase 2: Prove the Ordering With Controlled Promises

### Entry Criteria
- Candidates exist.

### Actions
1. For each candidate, write one test that forces the bad interleaving without timers. Replace the awaited dependency with a fake whose calls return promises the test resolves by hand:
   ```
   function deferred() { let resolve; const p = new Promise(r => (resolve = r)); return { p, resolve }; }
   test('two concurrent increments both count', async () => {
     const reads = [deferred(), deferred()];
     let i = 0;
     const store = { value: 0,
       get: () => reads[i++].p,                       // each caller waits on its own read
       set: async v => { store.value = v; } };
     const a = increment(store, 'k');
     const b = increment(store, 'k');
     reads[0].resolve(0); reads[1].resolve(0);        // both read 0 before either writes
     await Promise.all([a, b]);
     expect(store.value).toBe(2);
   });
   ```
2. For module-global context, the test starts request A, pauses it at its awaited dependency, runs request B to completion, then resumes A and asserts A saw its own user.
3. Run the test against the unfixed code with the stack's runner (`npx jest <file> -t "<name>"`, `npx vitest run <file> -t "<name>"`, `node --test --test-name-pattern="<name>" <file>`). It must FAIL. A proof test that passes on the unfixed code proves nothing; rewrite it.
4. Do not use `setTimeout(..., n)` delays to order the operations. Timing-based tests pass or fail by luck.
5. Optionally confirm under load with `stress_command` and record its failure count.

### Output
Proof tests with their failing results.

### Quality Gate
- Each proof test failed on the unfixed code; the failure message is copied into `proof_test`.
- `rg -n "setTimeout" <proof test file>` shows no ordering delays.

---

## Phase 3: Assign the Fix Direction

### Entry Criteria
- Proof tests fail.

### Actions
1. Choose with this table, top row first:

| Condition | Fix direction |
|---|---|
| State lives in a database or Redis | Single atomic store operation: SQL `UPDATE t SET n = n + 1 WHERE id = $1`, `INSERT ... ON CONFLICT DO NOTHING`, unique constraint, Redis `INCR`/`SET key value NX`, MongoDB `$inc` in `updateOne`; see the database isolation flows |
| State is in process memory and the process is the only writer | Per-key async mutex: `async-mutex` package `const m = new Mutex(); await m.runExclusive(async () => {...})`, one mutex per key held in a `Map` |
| Cache stampede | Store the in-flight promise: `if (!cache.has(k)) cache.set(k, load(k));` then `return cache.get(k);` and delete the entry if the promise rejects |
| Module-global request context | `AsyncLocalStorage` from `node:async_hooks`: `als.run(ctx, () => handler())`, read with `als.getStore()` |
| Several Node processes or containers write the same state | In-memory mutex does not work across processes; use the store's atomic operation or a database row lock |
| Shared accumulator in `Promise.all` | Return values from each callback and reduce after `await Promise.all(...)` |

2. Record the chosen row in `fix_direction`. Do not apply the fix here.

### Output
`node_interleaving_findings`.

### Quality Gate
- Every row has a `fix_direction` from the table.
- Rows whose state is shared across processes do not name an in-memory mutex.

---

## Worked Example

Illustrative only.

Inventory row: `couponUses` table read in `src/coupons/redeem.ts`.

Phase 1: lines 12 to 19: `const c = await repo.find(code);` then `if (c.uses >= c.maxUses) throw ...;` then `await repo.update(code, { uses: c.uses + 1 });`. Pattern: read-modify-write across await; `await_between` = line 12 to line 19.

Phase 2: the controlled-promise test resolves both `find` calls with `{ uses: 4, maxUses: 5 }` before either update. Result on unfixed code: `Expected: 1 rejection, Received: 0` (both redemptions succeeded, six uses of a five-use coupon).

Phase 3: state is in PostgreSQL; fix direction `UPDATE coupons SET uses = uses + 1 WHERE code = $1 AND uses < max_uses RETURNING uses`, zero rows returned means sold out.

---

## Exit Criteria

DONE when every await-split read and write on shared state is a row with a failing proof test that forces the ordering with controlled promises, and a fix direction from the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code uses callbacks instead of promises | **Adjust**: treat each callback boundary as an `await`; the same interleaving rules apply. |
| Phase 2 | Dependency is imported directly and cannot be faked | **Adjust**: use the test runner's module mocking (`jest.mock`, `vi.mock`, `mock.module` in node:test where available) to return deferred promises. |
| Phase 2 | Proof test passes on unfixed code | **Retry**: the test does not force both reads before both writes; reorder the `resolve` calls. |
| Phase 3 | Code runs in `worker_threads` with `SharedArrayBuffer` | **Adjust**: that is true shared memory; use `Atomics.add`, `Atomics.compareExchange` and `Atomics.wait`/`notify`, not an async mutex. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
