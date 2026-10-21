# SDK Retry With Backoff

**One-line description:** Implements a retry policy that retries only safe failures (connection errors, 408, 429, 500, 502, 503, 504) on idempotent requests or requests carrying an idempotency key, waits with capped exponential backoff and full jitter, honors `Retry-After` (RFC 9110 section 10.2.3), and uses urllib3 `Retry`, a handwritten loop, or hashicorp go-retryablehttp per stack.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `rate_limit_headers` and `idempotency_header` decide behavior.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.
- `retry_limits` (object, required): User-supplied `max_retries`, `base_delay`, `max_delay` (cap), and optionally `max_retry_after` (largest server-requested wait the SDK will honor). This flow does not choose the numbers.

---

## Outputs

- `retry_policy` (object): Retryable conditions, method rules, backoff formula with the user's numbers, `Retry-After` handling, implementation file and library, and test results.

---

## Phase 1: Write the Policy Table

### Entry Criteria
- `retry_limits` has `max_retries`, `base_delay` and `max_delay`.

### Actions
1. Fill the retry decision table (first matching row wins):

| Condition | Retry? |
|---|---|
| Caller aborted / cancelled | Never |
| Connection failed before the request was sent (DNS failure, connection refused, connect timeout) | Yes, any method: the server never saw it |
| Read timeout or connection reset after the request was sent | Only if method is idempotent (GET, HEAD, OPTIONS, TRACE, PUT, DELETE per RFC 9110 section 9.2.2) or the request carries an idempotency key |
| Status 408, 429, 500, 502, 503, 504 | Same method rule as the row above |
| Status 409 with docs saying "retry" (for example an idempotency key still in progress) | Same method rule |
| Any other 4xx | Never: the request itself is wrong |
| Request body is a one-shot stream that cannot be replayed | Never |
| Attempts used equal `max_retries` + 1 | Never: raise the last error |

2. Backoff for attempt `n` (0-based) with full jitter, from the AWS Architecture Blog article "Exponential Backoff and Jitter": `sleep = random_uniform(0, min(max_delay, base_delay * 2**n))`.
3. `Retry-After` rule: if the response has `Retry-After` as delay-seconds or as an HTTP-date (both allowed by RFC 9110 section 10.2.3), wait that long instead of the backoff value. If it exceeds `max_retry_after` (when given), do not retry; raise the error with the value attached so the caller can decide.
4. Record whether the API sends rate-limit headers (`api_inventory.rate_limit_headers`) so `RateLimitError` can expose them.

### Output
Policy table.

### Quality Gate
- Every row has a yes or no; the numbers in the formula are the user's `retry_limits` values.

---

## Phase 2: Implement per Stack

### Entry Criteria
- Policy table complete.

### Actions
1. Implement with the stack's tool:

| Stack | Implementation | Known gaps to close |
|---|---|---|
| python + urllib3 (openapi-generator) | `urllib3.Retry(total=max_retries, backoff_factor=..., backoff_max=max_delay, backoff_jitter=..., status_forcelist=[408,429,500,502,503,504], allowed_methods=Retry.DEFAULT_ALLOWED_METHODS, respect_retry_after_header=True, raise_on_status=False)`; set it as `Configuration.retries` in the generated client | urllib3's formula is not full jitter; `backoff_max` and `backoff_jitter` exist in urllib3 2.x (check `help(urllib3.Retry)`); POST with idempotency key needs `allowed_methods` to include POST only for those calls |
| python + httpx | Handwritten loop in the transport (httpx `HTTPTransport(retries=n)` retries only connect errors, not status codes) | Loop must re-send the same `httpx.Request` object; streaming bodies are not replayable |
| typescript (fetch) | Handwritten loop around `fetch` in the shared request function | Clone the body source per attempt; a consumed `ReadableStream` cannot be re-sent; use a fresh timeout signal per attempt |
| go | `github.com/hashicorp/go-retryablehttp`: `rc := retryablehttp.NewClient(); rc.RetryMax = maxRetries; rc.RetryWaitMin = base; rc.RetryWaitMax = maxDelay; rc.HTTPClient = boundedClient; rc.CheckRetry = customCheck`, then `rc.StandardClient()` into `WithHTTPClient` | `DefaultRetryPolicy` retries 5xx except 501 and also connection errors for all methods; write `CheckRetry` to apply the method rule from Phase 1; `DefaultBackoff` honors `Retry-After` on 429 and 503 only; set `rc.Logger = nil` or a redacting logger |

2. Handwritten loop skeleton (python shown; the TypeScript loop has the same shape):
   ```python
   for attempt in range(max_retries + 1):
       try:
           resp = self._send(request)
       except httpx.ConnectError as e:
           err = e; retryable = True
       except (httpx.ReadTimeout, httpx.RemoteProtocolError) as e:
           err = e; retryable = is_idempotent(request)
       else:
           if resp.status_code not in RETRY_STATUSES:
               return resp
           err = resp; retryable = is_idempotent(request)
       if not retryable or attempt == max_retries:
           break
       time.sleep(compute_wait(attempt, err))
   raise to_sdk_error(err)
   ```
3. Add an attempt counter header only if the API documents one. Do NOT invent headers.
4. Expose `max_retries` as a client option and a per-call override; `0` disables retries.

### Output
Retry implementation.

### Quality Gate
- Type checker passes (`mypy`, `npx tsc --noEmit`, `go vet ./...`).
- The retryable status set in code equals the table (`grep -nE "408|429|500|502|503|504" <retry file>`).

---

## Phase 3: Test With Controlled Time

### Entry Criteria
- Implementation compiles.

### Actions
1. Inject the sleep function and random source so tests run instantly and deterministically (Python: pass `sleep=` and `rng=`; TypeScript: `vi.useFakeTimers()` or an injected `sleep`; Go: `rc.Backoff` set to a function that records waits and returns 0).
2. Tests:
   - 503, 503, 200 on GET: success after 3 attempts; recorded waits are within `[0, min(max_delay, base*2**n)]`.
   - 503 with `Retry-After: 2`: recorded wait equals 2 s.
   - `Retry-After` as an HTTP-date: wait equals the date minus the mocked now.
   - 503 on POST without idempotency key: exactly 1 attempt.
   - 503 on POST with idempotency key: retried.
   - 400 on GET: exactly 1 attempt.
   - 503 forever: `max_retries + 1` attempts, then the SDK server error.
3. Run the suite.

### Output
`retry_policy`.

### Quality Gate
- All seven tests pass.
- Mutation check: add 400 to the retryable set; the 400 test must fail; restore.

---

## Worked Example

Illustrative only. `stack = go`, `retry_limits = { max_retries: 3, base_delay: 500ms, max_delay: 8s }` from the user.

```go
rc.CheckRetry = func(ctx context.Context, resp *http.Response, err error) (bool, error) {
    if ctx.Err() != nil { return false, ctx.Err() }
    if !idempotent(resp, err) { return false, nil }
    return retryablehttp.DefaultRetryPolicy(ctx, resp, err)
}
```
```
$ go test ./acme -run Retry -count=1 -v | grep -E "^(--- |ok)"
--- PASS: TestRetry503Then200 (0.00s)
--- PASS: TestRetryAfterSeconds (0.00s)
--- PASS: TestRetryAfterHTTPDate (0.00s)
--- PASS: TestNoRetryPostWithoutKey (0.00s)
--- PASS: TestRetryPostWithKey (0.00s)
--- PASS: TestNoRetry400 (0.00s)
--- PASS: TestRetryExhausted (0.00s)
ok  	github.com/example/acme-go/acme	0.03s
```

---

## Exit Criteria

DONE when the SDK retries exactly the table's conditions with the user's limits, uses full-jitter backoff or a bounded `Retry-After`, never retries a non-idempotent request without a key, and tests prove each rule with controlled time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `retry_limits` not provided | **Stop**: ask the user for the values; do not copy another SDK's numbers. |
| Phase 2 | Library cannot apply the method rule | **Adjust**: wrap it with a custom check function, or switch to a handwritten loop. |
| Phase 3 | Tests sleep for real | **Adjust**: inject the clock; real sleeps make the suite slow and flaky. |
| Phase 3 | Retry on POST without key passes the test | **Stop**: duplicate charges or orders are possible; fix before release. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
