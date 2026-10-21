# Node.js Retries With Cockatiel, Full Jitter and a Retry Budget

**One-line description:** Implements the retry policy in Node.js or TypeScript with cockatiel's retry policy (error and result predicates, ExponentialBackoff with a full-jitter generator), Retry-After handling, AbortSignal propagation, and a retry budget, then proves exact attempt counts with undici MockAgent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Node.js or TypeScript service.
- `retry_policy` (object[], required): Output of `res-retry-policy`.

---

## Outputs

- `retry_changes` (object[]): One row per dependency: policy file:line, cockatiel options written, layers removed, budget parameters, test names, and test output lines.

---

## Phase 1: Remove Duplicate Layers and Install

### Entry Criteria
- Baseline test summary saved.

### Actions
1. Remove each `layers_to_disable` entry from the policy: manual `for`/`while` retry loops, `axios-retry` registrations (`axiosRetry(axios, ...)`), `p-retry` wrappers, or SDK retry settings that the policy moves elsewhere. One removal per change; run the tests after each.
2. For AWS SDK v3 as owning layer, set `maxAttempts: <max_attempts>` on the client constructor (counts the first call) and `retryMode: 'standard'`; remove app loops.
3. Install cockatiel if the app wrapper owns retries: `npm install cockatiel`. Record the installed version from `package-lock.json`.
4. Open `node_modules/cockatiel/dist/index.d.ts` (or the package README for that version) and confirm these exports exist before using them: `retry`, `handleWhen`, `ExponentialBackoff`, `ConstantBackoff`, and a full-jitter generator (named `fullJitterGenerator` in cockatiel 3.x). Do NOT use any name you did not find there.

### Output
Single retry layer per dependency; cockatiel installed.

### Quality Gate
- `rg -n "axiosRetry|pRetry|p-retry|for \(let attempt" <changed files>` shows no remaining duplicate layer for planned dependencies.
- Every cockatiel name used in Phase 2 appears in the installed type definitions (`rg -n "<name>" node_modules/cockatiel/dist/index.d.ts`).

---

## Phase 2: Write the Policy per Dependency

### Entry Criteria
- cockatiel installed and exports confirmed.

### Actions
1. Build the policy in one module per dependency, with the backoff injectable for tests:
   ```ts
   import { retry, handleWhen, ExponentialBackoff, fullJitterGenerator, IBackoffFactory } from 'cockatiel';
   import { setTimeout as sleep } from 'node:timers/promises';

   export class RetryableStatus extends Error { constructor(public status: number, public retryAfterMs?: number) { super(`status ${status}`); } }

   const isRetryable = (err: unknown): boolean =>
     err instanceof RetryableStatus ||
     (err instanceof TypeError && (err as any).cause?.code === 'ECONNREFUSED') ||  // fetch connect failure
     (err instanceof DOMException && err.name === 'TimeoutError' && OPERATION_IDEMPOTENT);

   export const makePaymentsRetry = (backoff: IBackoffFactory<any> = new ExponentialBackoff({ generator: fullJitterGenerator, initialDelay: BASE_MS, maxDelay: CAP_MS })) =>
     retry(handleWhen((e) => isRetryable(e) && budget.tryRetry()), { maxAttempts: MAX_ATTEMPTS - 1, backoff });
   ```
2. cockatiel's `maxAttempts` is the number of RETRIES after the first call, so it is `retry_policy.max_attempts - 1`. Prove this with the call-count test in Phase 3; if the count is off by one, fix the constant, not the test.
3. Execute with the signal cockatiel passes in, so cancellation stops retries:
   ```ts
   export async function charge(body: unknown, key: string, policy = makePaymentsRetry()) {
     budget.onRequest();
     return policy.execute(async ({ signal }) => {
       const res = await fetch(`${BASE}/charge`, { method: 'POST', body: JSON.stringify(body),
         headers: { 'Idempotency-Key': key, 'content-type': 'application/json' },
         signal: AbortSignal.any([signal, AbortSignal.timeout(PER_TRY_MS)]) });
       if ([502, 503, 504, 408, 429].includes(res.status)) {
         const ra = Number(res.headers.get('retry-after'));
         if (Number.isFinite(ra) && ra > 0) await sleep(ra * 1000, undefined, { signal }); // honor Retry-After (seconds form)
         throw new RetryableStatus(res.status);
       }
       if (!res.ok) throw new Error(`status ${res.status}`);
       return res.json();
     });
   }
   ```
4. Pass the idempotency `key` in from outside `execute`. A key created inside the callback changes every attempt.
5. If `Retry-After` exceeds the remaining deadline, throw a non-retryable error instead of sleeping.
6. Log retries with `policy.onRetry(({ delay, attempt }) => log.warn({ attempt, delay }, 'retry payments'))`; check the event payload shape in the installed type definitions.
7. Do NOT wrap every call in the codebase at once. Wrap one dependency, run tests, then the next.

### Output
One policy module per dependency.

### Quality Gate
- Each module's `maxAttempts` equals `retry_policy.max_attempts - 1` (record both numbers).
- `npx tsc --noEmit` (TypeScript projects) passes.

---

## Phase 3: Budget and Tests

### Entry Criteria
- Policies written.

### Actions
1. Add the budget (`ratio` and `maxTokens` from `retry_policy.budget`, source in a comment):
   ```ts
   export class RetryBudget {
     private tokens: number;
     constructor(private ratio: number, private maxTokens: number) { this.tokens = maxTokens; }
     onRequest() { this.tokens = Math.min(this.maxTokens, this.tokens + this.ratio); }
     tryRetry() { if (this.tokens >= 1) { this.tokens -= 1; return true; } return false; }
   }
   ```
   Node runs JavaScript on one thread, so no lock is needed inside one process.
2. Test with undici `MockAgent` and a zero backoff:
   ```ts
   import { MockAgent, setGlobalDispatcher } from 'undici';
   import { ConstantBackoff } from 'cockatiel';
   const agent = new MockAgent(); agent.disableNetConnect(); setGlobalDispatcher(agent);
   const pool = agent.get('https://payments.test');
   pool.intercept({ path: '/charge', method: 'POST' }).reply(503, '');
   pool.intercept({ path: '/charge', method: 'POST' }).reply(200, { ok: true });
   await charge(body, 'k1', makePaymentsRetry(new ConstantBackoff(0)));
   agent.assertNoPendingInterceptors(); // both intercepts consumed: exactly 2 calls
   ```
   Global `fetch` uses the global dispatcher only when the `undici` package version matches the one bundled with Node; if interception does not happen, pass `dispatcher: agent` explicitly via an injectable option.
3. Add tests: one per `never_retry_on` code (one intercept, expect rejection, no pending interceptors), exhaustion (exactly `max_attempts` intercepts consumed), empty budget (one call), and a generator test that draws 1000 delays and checks `0 <= d <= min(CAP_MS, BASE_MS * 2 ** n)`.
4. Run the tests and save the output.

### Output
`retry_changes` with tests.

### Quality Gate
- All new tests pass and assert exact call counts.
- No `.skip` or `.only` added (`rg -n "\.(skip|only)\(" test/` matches the baseline).

---

## Worked Example

Illustrative. Policy for `payments`: `max_attempts` 2, base 100 ms, cap 1000 ms, budget ratio 0.2 and max 10 (user input).

Phase 1 removes `axiosRetry(axios, { retries: 3 })` from `src/http.ts:12`. `npm test` still passes 188 tests.

Phase 2 writes `retry(handleWhen(...), { maxAttempts: 1, backoff: new ExponentialBackoff({ generator: fullJitterGenerator, initialDelay: 100, maxDelay: 1000 }) })`.

Phase 3: `node --test` prints `# pass 6  # fail 0`; the exhaustion test confirms 2 intercepts consumed, which confirms `maxAttempts: 1` means one retry.

---

## Exit Criteria

DONE when each dependency's retries live in one cockatiel policy that matches the plan, honors Retry-After and cancellation, is gated by a budget, and is proven by exact call-count tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A cockatiel export is missing in the installed version | **Adjust**: use the generator or backoff the installed `index.d.ts` provides and record it; do not upgrade majors inside this flow. |
| Phase 3 | MockAgent does not intercept global fetch | **Adjust**: inject the dispatcher explicitly as described in action 2. |
| Phase 3 | Call count is off by one | **Adjust**: fix `maxAttempts`; the test encodes the policy. |
| Phase 3 | Retries happen on 400 | **Stop**: fix `isRetryable` before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
