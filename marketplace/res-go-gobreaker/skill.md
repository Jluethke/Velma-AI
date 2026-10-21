# Go Circuit Breaker With sony/gobreaker

**One-line description:** Implements the breaker policy in Go with github.com/sony/gobreaker (v2 generic API), writing ReadyToTrip for consecutive or rate-based trips, setting Interval so counts reset per window, IsSuccessful to exclude 4xx, OnStateChange for metrics, and proving transitions with race-checked tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Go module root.
- `breaker_policy` (object[], required): Output of `res-breaker-policy`.

---

## Outputs

- `breaker_changes` (object[]): One row per dependency: file:line, `Settings` written with sources, metrics, gaps, tests, and `go test` output.

---

## Phase 1: Map Policy to Settings

### Entry Criteria
- Baseline `go test ./...` passes.
- `go get github.com/sony/gobreaker/v2` done (or v1 already in `go.mod`; check with `go list -m all | rg gobreaker`). v1 uses `Execute(func() (interface{}, error))`; v2 is generic. Use the one already present.

### Actions
1. Map fields (gobreaker README and godoc for the installed version):

| Policy field | `gobreaker.Settings` field | Default when zero |
|---|---|---|
| `half_open_probes` | `MaxRequests` | 1 |
| window size (closed state) | `Interval`: counts are cleared every `Interval` | 0 = counts never cleared |
| `open_duration` | `Timeout` | 60 s |
| trip rule | `ReadyToTrip func(counts gobreaker.Counts) bool` | `counts.ConsecutiveFailures > 5` |
| `never_counts` | `IsSuccessful func(err error) bool` (true = success) | `err == nil` |
| metrics | `OnStateChange func(name string, from, to gobreaker.State)` | none |

2. A rate-based policy needs BOTH a `ReadyToTrip` that computes the rate and a non-zero `Interval`. With `Interval` 0 the counts accumulate since start, so after hours of success the rate barely moves and the breaker never opens. `Interval` gives a fixed (tumbling) window, not a sliding one; record this difference from the policy if the policy says sliding.
3. Slow-call rules have no gobreaker equivalent; record a gap.

### Output
Settings map per dependency, with gaps.

### Quality Gate
- Every rate-based row has `Interval` set to the policy window.
- Every numeric value has a source (policy, gobreaker default, or user input).

---

## Phase 2: Implement

### Entry Criteria
- Settings mapped.

### Actions
1. Construct once per dependency (package-level or in the client constructor):
   ```go
   var errClient = errors.New("client error")

   func newPaymentsBreaker(cfg BreakerCfg) *gobreaker.CircuitBreaker[*Result] {
       return gobreaker.NewCircuitBreaker[*Result](gobreaker.Settings{
           Name:        "payments",
           MaxRequests: cfg.HalfOpenProbes,
           Interval:    cfg.Window,
           Timeout:     cfg.OpenDuration,
           ReadyToTrip: func(c gobreaker.Counts) bool {
               return c.Requests >= cfg.MinCalls &&
                   float64(c.TotalFailures)/float64(c.Requests) >= cfg.FailureRate
           },
           IsSuccessful: func(err error) bool { return err == nil || errors.Is(err, errClient) || errors.Is(err, context.Canceled) },
           OnStateChange: func(name string, from, to gobreaker.State) {
               breakerTransitions.WithLabelValues(name, to.String()).Inc()
           },
       })
   }
   ```
   `breakerTransitions` is a `prometheus.CounterVec` registered once.
2. Wrap only the single attempt; the retry loop from `res-go-backoff-retry` stays OUTSIDE:
   ```go
   op := func() error {
       res, err := c.breaker.Execute(func() (*Result, error) { return c.chargeOnce(ctx, body, key) })
       if errors.Is(err, gobreaker.ErrOpenState) || errors.Is(err, gobreaker.ErrTooManyRequests) {
           return backoff.Permanent(err)      // never retry into an open breaker
       }
       out = res
       return err
   }
   ```
3. Wrap 4xx responses in `chargeOnce` as `fmt.Errorf("status %d: %w", code, errClient)` so `IsSuccessful` sees them.
4. Count the caller's own cancellation as success (`context.Canceled`), or a client disconnect storm opens the breaker. Count `context.DeadlineExceeded` from the per-try timeout as a failure, per policy.
5. Map `ErrOpenState` and `ErrTooManyRequests` at the HTTP handler to the policy's `open_error` (or the fallback).

### Output
Breakers wired.

### Quality Gate
- `go build ./... && go vet ./...` succeed.
- `rg -n "NewCircuitBreaker" --type go` shows one per dependency, not inside a request handler.

---

## Phase 3: Prove Transitions

### Entry Criteria
- Code compiles.

### Actions
1. Tests with small durations:
   ```go
   func TestBreakerOpensAndRejects(t *testing.T) {
       cb := newPaymentsBreaker(BreakerCfg{HalfOpenProbes: 1, Window: time.Second, OpenDuration: 50 * time.Millisecond, MinCalls: 4, FailureRate: 0.5})
       calls := 0
       fail := func() (*Result, error) { calls++; return nil, errors.New("503") }
       for i := 0; i < 4; i++ { cb.Execute(fail) }
       if cb.State() != gobreaker.StateOpen { t.Fatalf("state %v", cb.State()) }
       if _, err := cb.Execute(fail); !errors.Is(err, gobreaker.ErrOpenState) { t.Fatal(err) }
       if calls != 4 { t.Fatalf("called %d", calls) }
   }
   ```
2. Add: half-open success closes (`time.Sleep(60 * time.Millisecond)` then a success, expect `StateClosed`), half-open failure reopens, 4xx wrapped in `errClient` never opens, `context.Canceled` never opens, and counts reset after `Interval` (fail twice, sleep past `Window`, check `cb.Counts().Requests == 0`).
3. Run `go test -race -run Breaker -v ./...` and save output.

### Output
`breaker_changes` with tests.

### Quality Gate
- All six transition tests pass under `-race`.
- Test count did not drop versus the baseline.

---

## Worked Example

Illustrative. `payments` policy: 50% over a 60 s window (user), min calls 50 (user), open 60 s (gobreaker default), probes 1 (gobreaker default).

Phase 1 notes "tumbling 60 s window, policy said sliding: gap recorded". Phase 2 adds `internal/payments/breaker.go`; the retry op returns `backoff.Permanent` on `ErrOpenState`. Phase 3: `go test -race -run Breaker -v ./internal/payments/` prints `--- PASS: TestBreakerOpensAndRejects (0.00s)` and five more PASS lines, then `ok  example.com/checkout/internal/payments 0.412s`.

---

## Exit Criteria

DONE when every mapped dependency's single attempt runs through one gobreaker with a windowed trip rule, 4xx and cancellations excluded, retries refusing open-state errors, metrics on transitions, and passing race-checked tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Module has gobreaker v1 | **Adjust**: use `Execute(func() (interface{}, error))` and type-assert the result; same Settings fields. |
| Phase 2 | Breaker opens when clients disconnect | **Adjust**: add `context.Canceled` to `IsSuccessful`. |
| Phase 3 | Rate breaker never opens in a long test | **Adjust**: `Interval` is zero; set it to the window. |
| Phase 3 | Race detector fires | **Stop**: shared state outside gobreaker is unguarded; fix before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
