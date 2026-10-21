# BullMQ Reliability Config

**One-line description:** Configures BullMQ queues and workers for at-least-once processing: Redis `maxmemory-policy noeviction` and `maxRetriesPerRequest: null`, `lockDuration` and `stalledInterval` sized from measured runtimes, `maxStalledCount`, `attempts` and a custom jittered `backoffStrategy`, deterministic `jobId`, bounded `removeOnComplete` and `removeOnFail`, and `UnrecoverableError` for permanent failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing `new Queue(` and `new Worker(` calls.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for `queue_choice` = `bullmq`.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.

---

## Outputs

- `bullmq_config` (object): Redis server checks, per-queue and per-worker options with formulas, code diffs, and verification output.

---

## Phase 1: Check Redis and Connections

### Entry Criteria
- `npm ls bullmq` prints a version.

### Actions
1. Record versions: `npm ls bullmq ioredis` and `redis-cli -u "$REDIS_URL" INFO server | rg redis_version`. Read the BullMQ docs for the minimum Redis version of your BullMQ release.
2. Check eviction policy: `redis-cli -u "$REDIS_URL" CONFIG GET maxmemory-policy`. BullMQ's docs require `noeviction`; any other policy can delete job keys under memory pressure, which silently loses jobs. Managed Redis services may block `CONFIG`; read the value in the provider console instead.
3. Check persistence: `redis-cli -u "$REDIS_URL" CONFIG GET appendonly`. Record the value; `no` means a Redis restart loses queued jobs. Report it; do not change the server here.
4. Check the connection options passed to `Worker`: `rg -n "maxRetriesPerRequest" <repo_path>`. BullMQ requires `maxRetriesPerRequest: null` on connections used by workers (blocking commands); it throws or warns otherwise depending on version.
5. Do not use a Redis Cluster without hash tags: BullMQ needs all keys of a queue in one slot. If the URL is a cluster, confirm queues use a `prefix` with a hash tag such as `{bull}` per the BullMQ docs.

### Output
Server and connection findings.

### Quality Gate
- `maxmemory-policy` value is recorded from the command or console.
- Every worker connection has `maxRetriesPerRequest: null` or is listed as a finding.

---

## Phase 2: Derive Worker and Job Options

### Entry Criteria
- Phase 1 findings recorded.

### Actions
1. `lockDuration` (worker option, milliseconds): the worker renews the lock while the job runs, as long as the Node event loop is not blocked. Set it so that the longest synchronous block of the handler is shorter than `lockDuration`. If the handler does CPU-heavy synchronous work, move that work to a sandboxed processor (pass a file path to `new Worker(name, path)`) so the main event loop keeps renewing the lock. Record the BullMQ default from the Worker options docs if unchanged.
2. `stalledInterval` and `maxStalledCount`: a job whose lock expired is "stalled" and moved back to wait; after `maxStalledCount` stalls it fails. Keep `maxStalledCount` at its default unless the requester decides otherwise; record it.
3. Job options from `retry_policy`: `attempts: <max_attempts>`, `backoff: { type: 'custom' }`, and in the Worker `settings: { backoffStrategy }` (jittered formula from the policy). If your BullMQ version documents a `jitter` field for built-in backoff, that may be used instead; cite the docs page.
4. Permanent errors: `import { UnrecoverableError } from 'bullmq'` and `throw new UnrecoverableError(msg)` for errors classified permanent. The job fails immediately with no further attempts.
5. Dedupe: `queue.add(name, data, { jobId: data.idempotency_key })`. While a job with that id exists in the queue (any state, until removed), a second add with the same id is ignored. `jobId` must not contain `:` in some versions; check the docs and replace with another separator if needed. Newer versions also offer a `deduplication` option; use it only if documented for your version.
6. Retention: `removeOnComplete: { age: <s>, count: <n> }` and `removeOnFail: { age: <s>, count: <n> }`. Without them every job stays in Redis forever. Note the interaction: once a job is removed, a new add with the same `jobId` is accepted again, so dedupe lasts only as long as the job is retained. Retention values are user inputs.
7. Concurrency stays as is here; it is sized in `bjq-concurrency-limit-sizing`.

### Output
Option values with reasons.

### Quality Gate
- Each worker lists `lockDuration`, `stalledInterval`, `maxStalledCount` with value and source (set or default).
- `rg -n "removeOnComplete|removeOnFail" <repo_path>` finds settings for every `queue.add` or the Queue `defaultJobOptions`.

---

## Phase 3: Apply and Verify

### Entry Criteria
- Options derived.

### Actions
1. Put shared job options in `new Queue(name, { connection, defaultJobOptions: {...} })` so every add inherits them. Edit one file at a time; run `npx tsc --noEmit` and the job tests after each.
2. Test against a real Redis (`docker run --rm -p 6379:6379 redis:7`), not a mock: BullMQ uses Lua scripts that mocks do not implement.
3. Verification script (illustrative names):
```ts
const events = new QueueEvents('payments', { connection });
const job = await queue.add('charge', env, { jobId: env.idempotency_key });
const dup = await queue.add('charge', env, { jobId: env.idempotency_key });
console.log(job.id === dup.id, await queue.getJobCounts('wait', 'active', 'delayed', 'failed'));
await job.waitUntilFinished(events);
console.log((await queue.getJob(job.id))?.attemptsMade);
```
4. For the permanent-error path, run a job that throws `UnrecoverableError` and confirm `attemptsMade` is 1 and the job is in `failed`.
5. Run the full suite. Do not delete or skip tests.

### Output
`bullmq_config` with diffs and verification output.

### Quality Gate
- The script prints `true` for the duplicate add and a single job in counts.
- The permanent-error job shows one attempt in `failed`.
- `npx tsc --noEmit` and the test command exit 0.

---

## Worked Example

Illustrative only.

Input: queue `payments`; handler max 2.4 s, all async I/O; `retry_policy`: 8 attempts, base 1 s, cap 60 s.

- Phase 1: `CONFIG GET maxmemory-policy` -> `allkeys-lru` (finding: must be `noeviction`); `src/redis.ts:4` lacks `maxRetriesPerRequest: null`.
- Phase 2: `lockDuration` left at default (no synchronous blocking found); `defaultJobOptions: { attempts: 8, backoff: { type: 'custom' }, removeOnComplete: { age: 86400 }, removeOnFail: { age: 1209600 } }` with ages given by the requester; `settings.backoffStrategy = (n) => Math.floor(Math.random() * Math.min(60, 2 ** (n - 1)) * 1000)`.
- Phase 3:
```
true { wait: 1, active: 0, delayed: 0, failed: 0 }
1
```

---

## Exit Criteria

DONE when Redis eviction and persistence are reported, worker connections use `maxRetriesPerRequest: null`, every queue has attempts, jittered backoff, retention and `jobId` dedupe, permanent errors use `UnrecoverableError`, and the verification script output is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `maxmemory-policy` is not `noeviction` | **Return**: report to the Redis owner as a data-loss risk; continue with code changes. |
| Phase 2 | Handler blocks the event loop for long periods | **Adjust**: move it to a sandboxed processor file and re-measure. |
| Phase 3 | Duplicate add creates a second job | **Stop**: check the job id format and that the first job was not already removed by retention. |
| Phase 3 | Tests use a Redis mock and fail | **Adjust**: switch those tests to a real Redis container; do not remove them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
