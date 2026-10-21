# Go Retries With cenkalti/backoff, gRPC Service Config and a Budget

**One-line description:** Implements the retry policy in Go using github.com/cenkalti/backoff/v4 with a full-jitter BackOff, backoff.Permanent for non-retryable errors, context cancellation, Retry-After support and a mutex-guarded retry budget, or grpc-go's retryPolicy and retryThrottling service config for gRPC, proven with httptest call counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Go module root.
- `retry_policy` (object[], required): Output of `res-retry-policy`.

---

## Outputs

- `retry_changes` (object[]): One row per dependency: file:line, mechanism (backoff loop or gRPC service config), parameters, layers removed, test names, and `go test` output lines.

---

## Phase 1: Pick the Mechanism and Remove Duplicates

### Entry Criteria
- Baseline `go test ./...` passes.

### Actions
1. Use this table per dependency:

| Dependency kind | Mechanism |
|---|---|
| gRPC via grpc-go | service config `retryPolicy` plus `retryThrottling` (gRFC A6) |
| HTTP or other | `cenkalti/backoff/v4` loop in the client wrapper |
| AWS SDK for Go v2 | the SDK retryer: `config.WithRetryMaxAttempts(<max_attempts>)`, remove app loops |

2. Remove every `layers_to_disable` entry (hand-written `for i := 0; i < n; i++` loops around the call). One per change; run `go test ./...` after each.
3. For the backoff loop, check the module version: `go list -m github.com/cenkalti/backoff/v4`. If the repository already uses `/v5`, stop and read the v5 README; its `Retry` signature is generic and context-first, and the code below is for v4.

### Output
Mechanism per dependency; duplicates removed.

### Quality Gate
- `rg -n "for (i|attempt) :?= ?0; .*< ?(retries|maxRetries|attempts)" <changed packages>` returns no hits for planned dependencies.

---

## Phase 2: Implement

### Entry Criteria
- Mechanism chosen.

### Actions
1. Full jitter BackOff (v4 `ExponentialBackOff` uses `RandomizationFactor` 0.5, which is plus or minus 50%, not full jitter):
   ```go
   type fullJitter struct {
       base, cap  time.Duration
       n          int
       retryAfter time.Duration // set by the operation from a Retry-After header
       rnd        *rand.Rand
   }
   func (f *fullJitter) NextBackOff() time.Duration {
       if f.retryAfter > 0 { d := f.retryAfter; f.retryAfter = 0; f.n++; return d }
       ceil := f.base << f.n
       if ceil <= 0 || ceil > f.cap { ceil = f.cap }
       f.n++
       return time.Duration(f.rnd.Int63n(int64(ceil) + 1))
   }
   func (f *fullJitter) Reset() { f.n = 0; f.retryAfter = 0 }
   ```
   Create a new `fullJitter` per logical call; it holds per-call state and is not safe to share.
2. Wrap the call:
   ```go
   func (c *Payments) Charge(ctx context.Context, body []byte, key string) (*Result, error) {
       c.budget.OnRequest()
       bo := &fullJitter{base: c.cfg.Base, cap: c.cfg.Cap, rnd: rand.New(rand.NewSource(time.Now().UnixNano()))}
       var out *Result
       op := func() error {
           req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.url+"/charge", bytes.NewReader(body))
           req.Header.Set("Idempotency-Key", key)
           resp, err := c.http.Do(req)
           if err != nil {
               if ctx.Err() != nil { return backoff.Permanent(err) }      // our deadline: never retry
               if !c.retryable(err) || !c.budget.TryRetry() { return backoff.Permanent(err) }
               return err
           }
           defer resp.Body.Close()
           switch resp.StatusCode {
           case 502, 503, 504, 408, 429:
               if s, e := strconv.Atoi(resp.Header.Get("Retry-After")); e == nil { bo.retryAfter = time.Duration(s) * time.Second }
               if !c.budget.TryRetry() { return backoff.Permanent(fmt.Errorf("status %d, budget empty", resp.StatusCode)) }
               return fmt.Errorf("status %d", resp.StatusCode)
           }
           if resp.StatusCode >= 400 { return backoff.Permanent(fmt.Errorf("status %d", resp.StatusCode)) }
           out = new(Result)
           return json.NewDecoder(resp.Body).Decode(out)
       }
       err := backoff.Retry(op, backoff.WithContext(backoff.WithMaxRetries(bo, uint64(c.cfg.MaxAttempts-1)), ctx))
       return out, err
   }
   ```
   `WithMaxRetries` counts retries after the first call, so pass `max_attempts - 1`. `backoff.Retry` unwraps `*backoff.PermanentError` and returns the inner error.
3. `c.retryable(err)` implements `retry_on`: true for `errors.Is(err, syscall.ECONNREFUSED)`, and for `os.IsTimeout(err)` only when the operation is idempotent.
4. gRPC: set the service config at dial:
   ```go
   grpc.NewClient(target, grpc.WithDefaultServiceConfig(`{
     "methodConfig": [{"name": [{"service": "payments.v1.Payments"}],
       "retryPolicy": {"maxAttempts": 2, "initialBackoff": "0.1s", "maxBackoff": "1s",
                       "backoffMultiplier": 2, "retryableStatusCodes": ["UNAVAILABLE"]}}],
     "retryThrottling": {"maxTokens": 10, "tokenRatio": 0.1}}`))
   ```
   Values come from `retry_policy` (`maxTokens` and `tokenRatio` have no default and must be user inputs). gRFC A6 backoff is already randomized between 0 and the exponential ceiling. Use `grpc.Dial` instead of `grpc.NewClient` if the grpc-go version is older than 1.63.
5. Do NOT put `time.Sleep` in the operation; the BackOff returns the delay and `backoff.Retry` waits while honoring `ctx`.

### Output
Wrappers or service configs per dependency.

### Quality Gate
- `go vet ./...` passes and `go build ./...` succeeds.
- Every wrapper passes `MaxAttempts-1` to `WithMaxRetries` and wraps with `WithContext` (show the line).

---

## Phase 3: Budget and Tests

### Entry Criteria
- Wrappers compile.

### Actions
1. Budget with a mutex (handlers run concurrently):
   ```go
   type RetryBudget struct{ mu sync.Mutex; tokens, ratio, max float64 }
   func (b *RetryBudget) OnRequest() { b.mu.Lock(); b.tokens = math.Min(b.max, b.tokens+b.ratio); b.mu.Unlock() }
   func (b *RetryBudget) TryRetry() bool { b.mu.Lock(); defer b.mu.Unlock(); if b.tokens >= 1 { b.tokens--; return true }; return false }
   ```
2. Tests with an `httptest.Server` and `atomic.Int32` counting calls; set `Base` and `Cap` to `time.Millisecond` in tests:
   ```go
   var calls atomic.Int32
   srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
       if calls.Add(1) == 1 { w.WriteHeader(503); return }
       w.Write([]byte(`{"ok":true}`))
   }))
   ```
   Assert `calls.Load() == 2` for success after one 503, `== MaxAttempts` for exhaustion, `== 1` for each `never_retry_on` code, `== 1` for an empty budget, and that both requests carried the same `Idempotency-Key`.
3. For gRPC, use `google.golang.org/grpc/test/bufconn` with a server that returns `status.Error(codes.Unavailable, "x")` on the first call and count calls.
4. Run `go test -race -run 'Retry|Budget' -v ./...` and save output.

### Output
`retry_changes` with tests.

### Quality Gate
- All retry tests pass under `-race` with exact call counts asserted.
- Test count is not lower than the baseline (`go test -list . ./... | rg -c "^Test"`).

---

## Worked Example

Illustrative. `payments` HTTP: `max_attempts` 2, base 100 ms, cap 1 s, budget ratio 0.2 and max 10 (user input). `ledger` gRPC: `max_attempts` 3, `UNAVAILABLE` only, throttling `maxTokens` 10, `tokenRatio` 0.1 (user input).

Phase 1 removes the loop at `internal/payments/client.go:44`. Phase 2 adds `fullJitter` and `backoff.Retry(op, backoff.WithContext(backoff.WithMaxRetries(bo, 1), ctx))`; `ledger` dial gains the service config. Phase 3: `go test -race -run 'Retry|Budget' -v ./internal/...` prints `--- PASS: TestChargeRetries503Once (0.00s)` and six more PASS lines.

---

## Exit Criteria

DONE when each Go dependency retries in exactly one mechanism matching the policy, with full jitter, context cancellation, Permanent errors for non-retryable cases, a budget, and race-clean call-count tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repository uses backoff v5 | **Adjust**: follow the v5 README API (`backoff.Retry(ctx, op, opts...)`); keep the same policy values. |
| Phase 2 | gRPC retries do not happen | **Adjust**: check that the `service` name in `methodConfig` is the fully qualified proto service and that retries are not disabled with `grpc.WithDisableRetry()`. |
| Phase 3 | Race detector reports the budget | **Stop**: the budget is accessed without the mutex; fix before continuing. |
| Phase 3 | Test count off by one | **Adjust**: fix `WithMaxRetries` argument; never change the test to match wrong code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
