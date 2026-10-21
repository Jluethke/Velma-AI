# Node.js Circuit Breaker With Opossum

**One-line description:** Implements the breaker policy in Node.js with opossum (errorThresholdPercentage, rollingCountTimeout and buckets, volumeThreshold, resetTimeout, errorFilter for 4xx, timeout disabled in favor of a real AbortSignal), exports state through opossum-prometheus, and proves open, reject, half-open and close with fake timers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Node.js or TypeScript service.
- `breaker_policy` (object[], required): Output of `res-breaker-policy`.

---

## Outputs

- `breaker_changes` (object[]): One row per dependency: file:line, opossum options written with sources, metrics wiring, gaps, test names, and output lines.

---

## Phase 1: Map Policy to Options

### Entry Criteria
- Baseline test summary saved.
- `npm install opossum` done; version recorded from `package-lock.json`.

### Actions
1. Map each policy field (check the opossum README for the installed version):

| Policy field | opossum option | opossum default |
|---|---|---|
| `failure_rate_threshold` | `errorThresholdPercentage` | 50 |
| time window size | `rollingCountTimeout` (ms) | 10000 |
| window granularity | `rollingCountBuckets` (must divide `rollingCountTimeout` evenly) | 10 |
| `minimum_calls` | `volumeThreshold` | 0 |
| `open_duration` | `resetTimeout` (ms) | 30000 |
| `never_counts` | `errorFilter: (err) => true` means "do not count this error" | none |
| per-try timeout | `timeout` (ms) or `false` | 10000 |

2. `volumeThreshold` default 0 means a single failure in a quiet window can open the breaker. Always set it from `minimum_calls`.
3. opossum is rate-based in a time window; a count-window or slow-call policy row is a gap. Record it; do not approximate.
4. Set `timeout: false` when the call already uses `AbortSignal.timeout` from `res-node-timeouts`. opossum's own timeout rejects the promise but does not cancel the underlying request unless you pass an `abortController` option; two timers also make the effective timeout the shorter one. Keep exactly one timeout mechanism.

### Output
Option map per dependency with gaps.

### Quality Gate
- Every dependency row sets `volumeThreshold` explicitly.
- `rollingCountTimeout % rollingCountBuckets === 0` for every row.

---

## Phase 2: Create and Wire the Breaker

### Entry Criteria
- Option map complete.

### Actions
1. One breaker per dependency, created once at module load:
   ```ts
   import CircuitBreaker from 'opossum';
   import { chargeOnce, ClientError } from './paymentsHttp';

   export const paymentsBreaker = new CircuitBreaker(chargeOnce, {
     name: 'payments',
     errorThresholdPercentage: 50,      // resilience policy, source: opossum default
     rollingCountTimeout: 60000,        // source: user input
     rollingCountBuckets: 10,
     volumeThreshold: 50,               // source: user input
     resetTimeout: 30000,               // source: opossum default
     timeout: false,                    // AbortSignal.timeout in chargeOnce owns the per-try timeout
     errorFilter: (err) => err instanceof ClientError,   // 4xx never counts
   });
   ```
2. Call with `paymentsBreaker.fire(body, key)`. Wrap the cockatiel retry policy AROUND `fire`, and add the open rejection to its never-retry predicate: opossum rejects with an error whose `code === 'EOPENBREAKER'` when open.
3. Do NOT call `chargeOnce` directly anywhere else for this dependency (`rg -n "chargeOnce\(" src` should show only the breaker construction and tests).
4. Metrics: `npm install opossum-prometheus`, then `new PrometheusMetrics({ circuits: [paymentsBreaker], registry })` with the app's prom-client registry. Check the package README for the option names in your version. Also log `open`, `halfOpen`, `close` events: `paymentsBreaker.on('open', () => log.warn({ breaker: 'payments' }, 'breaker open'))`.
5. Map `EOPENBREAKER` at the HTTP boundary to the policy's `open_error` (or the fallback from `res-graceful-degradation`). Do not register `breaker.fallback()` here unless the fallback matrix exists; a fallback hides failures from callers.
6. Edit one dependency at a time and run the tests between edits.

### Output
Breakers wired with metrics and logs.

### Quality Gate
- `rg -n "new CircuitBreaker\(" src` shows one per dependency at module scope.
- `curl -s localhost:<port>/metrics | rg "circuit"` shows the opossum metrics after the app starts.

---

## Phase 3: Prove Transitions

### Entry Criteria
- Breakers wired.

### Actions
1. Export a factory `makePaymentsBreaker(action, overrides)` so tests can pass small windows.
2. Tests (Vitest or Jest; `node:test` works the same way):
   ```ts
   test('opens at threshold and rejects without calling', async () => {
     let calls = 0;
     const b = makePaymentsBreaker(async () => { calls++; throw new Error('503'); },
       { volumeThreshold: 4, rollingCountTimeout: 1000, rollingCountBuckets: 10, resetTimeout: 100 });
     for (let i = 0; i < 4; i++) await expect(b.fire()).rejects.toThrow();
     expect(b.opened).toBe(true);
     await expect(b.fire()).rejects.toMatchObject({ code: 'EOPENBREAKER' });
     expect(calls).toBe(4);
   });
   ```
3. Half-open: after opening, wait past `resetTimeout` (real timers with a 100 ms value, or check the opossum docs before using fake timers; it schedules the half-open with `setTimeout`), fire one success, expect `b.closed` true. Add a half-open failure test expecting `b.opened` true again.
4. 4xx test: fire `volumeThreshold + 2` times with a `ClientError`; expect `b.closed` true and `b.stats.failures === 0`.
5. Call `b.shutdown()` in `afterEach` so its interval timers do not keep the test process alive.
6. Run the breaker tests and save output.

### Output
`breaker_changes` with tests.

### Quality Gate
- Tests for open, reject without call, half-open close, half-open reopen, and 4xx exclusion all pass.
- The test process exits on its own (no "open handles" warning from Jest, or the `node --test` run ends without a timeout).

---

## Worked Example

Illustrative. `payments` policy: rate 50% (opossum default), window 60 s (user), minimum calls 50 (user), open 30 s (opossum default).

Phase 1 sets `timeout: false` because `chargeOnce` already uses `AbortSignal.timeout(750)`. Phase 2 adds `src/clients/paymentsBreaker.ts:6`; `curl -s localhost:3000/metrics | rg circuit` prints lines such as `circuit{name="payments",event="success"} 1204` (exact metric names depend on the opossum-prometheus version). Phase 3: `npx vitest run breaker` prints `Tests  5 passed (5)`.

---

## Exit Criteria

DONE when every mapped dependency calls through one opossum breaker with explicit `volumeThreshold`, a single timeout mechanism, 4xx excluded, metrics exported, and passing transition tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Policy uses a count window | **Return**: record the gap for the user; opossum windows are time-based. |
| Phase 2 | Metrics package missing or incompatible | **Adjust**: subscribe to opossum events and update prom-client counters directly. |
| Phase 3 | Test process hangs | **Adjust**: call `shutdown()` on every breaker created in tests. |
| Phase 3 | Breaker opens on first failure | **Adjust**: `volumeThreshold` is not passed; check the factory merges options. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
