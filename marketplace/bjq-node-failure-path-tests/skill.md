# Node Job Failure-Path Tests

**One-line description:** Writes Vitest or Jest tests for BullMQ job failure paths against a real Redis container (retry with the custom backoff, `UnrecoverableError` stops retries, duplicate `jobId` and duplicate delivery have one effect, invalid payload fails fast, stalled job recovery), using `QueueEvents` and `job.waitUntilFinished` instead of sleeps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with the test runner configured.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for BullMQ.
- `idempotency_design` (object, required): Output of `bjq-idempotency-key-store`.

---

## Outputs

- `node_failure_tests` (object[]): Per job: test file, test names N1 to N5, and passing runner output.

---

## Phase 1: Test Harness with Real Redis

### Entry Criteria
- `npx vitest --version` or `npx jest --version` prints a version.

### Actions
1. Start Redis for tests: `docker run -d --name redis-test -p 6379:6379 redis:7`, or in CI a service container. BullMQ runs Lua scripts in Redis; in-memory Redis mocks do not support them reliably, so do not mock Redis.
2. Per test file: create a unique queue name per test (`'charge-' + randomUUID()`) so tests do not share state; create `Queue`, `Worker`, and `QueueEvents` on the same connection options with `maxRetriesPerRequest: null`; in `afterEach`, `await worker.close(); await queueEvents.close(); await queue.obliterate({ force: true }); await queue.close();`.
3. Separate the processor function from the Worker construction (export `processCharge(job)`), so tests can build a Worker around it with test settings (short backoff via the same `backoffStrategy` function with a small base).
4. One new test file per job: `test/jobs/<job>.failures.test.ts`.

### Output
Harness and files.

### Quality Gate
- `redis-cli -p 6379 PING` prints `PONG` before tests run.
- No test file imports a Redis mock (`rg -n "ioredis-mock|redis-mock" test/` prints nothing for these files).

---

## Phase 2: Write the Failure Tests

### Entry Criteria
- Harness ready.

### Actions
1. Write and run one test at a time:

| Id | Path | How |
|---|---|---|
| N1 | Retryable error then success | Mock the client to fail twice then succeed; add with `{ attempts: 3, backoff: { type: 'custom' } }`; `await job.waitUntilFinished(queueEvents)`; reload with `Queue.getJob` and assert `attemptsMade` equals 3 (check how your BullMQ version counts `attemptsMade` on success; assert the documented value) |
| N2 | Permanent error | Processor throws `new UnrecoverableError('card declined')`; `await expect(job.waitUntilFinished(queueEvents)).rejects.toThrow('card declined')`; reload and assert `attemptsMade` is 1 and `await job.getState()` is `'failed'` |
| N3 | Duplicate add | Two `queue.add` with the same `jobId`; assert both return the same `id` and `await queue.getJobCountByTypes('wait', 'active', 'completed')` is 1 |
| N4 | Duplicate delivery | Call `processCharge` twice with the same job data; assert the effect count from `idempotency_design` is 1 |
| N5 | Invalid payload | Data with unknown `schema_version`; assert immediate failure with one attempt (the processor converts schema errors to `UnrecoverableError`) |

2. Backoff function unit test: call the exported `backoffStrategy(attemptsMade)` many times for each attempt number and assert every value is between 0 and `min(cap, base * 2 ** (attemptsMade - 1))` in milliseconds.
3. Optional stalled-job test: create a worker with a short `lockDuration` and `stalledInterval` (test-only values), make the processor block the event loop with a busy loop longer than `lockDuration`, and assert a second worker processes the job after the stall (listen for the `stalled` event on `QueueEvents`). Mark it as slow.
4. Use `waitUntilFinished` and events. Do not use fixed `setTimeout` sleeps to wait for jobs; they make tests flaky.

### Output
Test files.

### Quality Gate
- Each job file contains tests N1 to N5 (`rg -n "N[1-5]" test/jobs/<job>.failures.test.ts`).
- The run shows each test passing (paste the runner summary).

---

## Phase 3: Mutation Check and Full Run

### Entry Criteria
- Tests pass.

### Actions
1. On a local branch, one mutation at a time: replace `UnrecoverableError` with `Error` (N2 must fail); remove `jobId` from the add (N3 must fail); remove the idempotency claim (N4 must fail). Revert each with `git checkout -- <file>`.
2. Run the whole suite and the type check: `npx tsc --noEmit && npx vitest run` (or `npx jest`).
3. Never add `.skip`, `.only`, or `test.todo` to get green, and never raise test timeouts to hide a hang without finding the cause.

### Output
`node_failure_tests`.

### Quality Gate
- Each mutation produced a failure (pasted), and code was reverted (`git status --porcelain` clean for source files).
- `rg -n "\.only\(|\.skip\(" test/jobs` prints nothing.
- Full run exits 0.

---

## Worked Example

Illustrative only.

Input: job `charge`, `retry_policy`: attempts 3, permanent on `CardDeclined`.

```ts
it('N2 permanent error fails without retry', async () => {
  stripe.paymentIntents.create.mockRejectedValue(new CardDeclined());
  const job = await queue.add('charge', env, { attempts: 3, backoff: { type: 'custom' } });
  await expect(job.waitUntilFinished(events)).rejects.toThrow('card declined');
  const reloaded = await queue.getJob(job.id!);
  expect(reloaded!.attemptsMade).toBe(1);
});
```
```
$ npx vitest run test/jobs/charge.failures.test.ts
 ✓ test/jobs/charge.failures.test.ts (6 tests) 1.84s
 Test Files  1 passed (1)
```

---

## Exit Criteria

DONE when every BullMQ job has passing N1 to N5 tests against real Redis, the backoff function has a bounds test, each mutation was caught, and the full suite and type check pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docker unavailable in CI | **Adjust**: use the CI's Redis service container feature; do not switch to a mock. |
| Phase 2 | `waitUntilFinished` never resolves | **Adjust**: confirm the `QueueEvents` instance listens on the same queue name and was created before the add; await `queueEvents.waitUntilReady()`. |
| Phase 2 | `attemptsMade` value differs from expectation | **Adjust**: read the BullMQ docs for your version's counting and assert the documented value. |
| Phase 3 | Mutation not caught | **Retry**: strengthen the assertion and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
