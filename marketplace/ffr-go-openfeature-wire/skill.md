# Go OpenFeature SDK Wiring

**One-line description:** Adds `github.com/open-feature/go-sdk` and the chosen provider to one Go service, calls `openfeature.SetProviderAndWait` once in `main`, and replaces one code decision with `client.BooleanValue` (or the matching typed method) passing a `context.Context`, the safe default, and an evaluation context with a targeting key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `flagd_config` (object, optional): Output of `ffr-flagd-local-setup` when the provider is flagd.
- `unleash_config` (object, optional): Output of `ffr-unleash-setup` when the provider is Unleash.
- `launchdarkly_config` (object, optional): Output of `ffr-launchdarkly-setup` when the provider is LaunchDarkly.
- `repo_path` (string, required): Root of the Go module (the directory with `go.mod`).

---

## Outputs

- `go_flag_wiring` (object): Module versions added, the file where the provider is set, every call site with its default, and the `go vet` and `go test` results.

---

## Phase 1: Add Modules and Set the Provider

### Entry Criteria
- The provider config matching `provider_choice.provider` is present.

### Actions
1. From `repo_path`:
```
go get github.com/open-feature/go-sdk
go get github.com/open-feature/go-sdk-contrib/providers/flagd
```
(For LaunchDarkly or Unleash use the module path confirmed in `provider_choice`.)
2. In `main()` (usually `cmd/<service>/main.go`), before starting the HTTP or gRPC server:
```go
import (
    "github.com/open-feature/go-sdk/openfeature"
    flagd "github.com/open-feature/go-sdk-contrib/providers/flagd/pkg"
)

provider, err := flagd.NewProvider(flagd.WithHost(os.Getenv("FLAGD_HOST")), flagd.WithPort(8013))
if err != nil { log.Fatalf("flagd provider: %v", err) }
if err := openfeature.SetProviderAndWait(provider); err != nil {
    log.Printf("flag provider not ready, serving defaults: %v", err)
}
defer openfeature.Shutdown()
```
3. The constructor signature of `flagd.NewProvider` has changed between versions (some return only the provider, newer ones also return an error). Run `go doc github.com/open-feature/go-sdk-contrib/providers/flagd/pkg NewProvider` and match the printed signature. Do not guess.
4. Apply the same startup rule as other stacks: if the service is safe with every flag at its default, log the readiness error and continue; if permission flags guard access, exit.

### Output
Provider set once in `main`.

### Quality Gate
- `go build ./...` exits 0.
- `rg -n "SetProvider(AndWait)?\(" --type go` returns exactly one non-test line.

---

## Phase 2: Replace One Decision with a Flag Evaluation

### Entry Criteria
- Provider set.

### Actions
1. Create `internal/flags/flags.go`:
```go
package flags

const (
    CheckoutNewTaxEngine        = "checkout-new-tax-engine"
    CheckoutNewTaxEngineDefault = false
)
```
2. Create the client once (package-level or injected): `client := openfeature.NewClient("checkout")`.
3. At the decision point, pass the request `ctx` so cancellation and tracing propagate:
```go
evalCtx := openfeature.NewEvaluationContext(
    strconv.FormatInt(user.ID, 10),
    map[string]any{"country": user.Country, "plan": user.Plan},
)
useV2, err := client.BooleanValue(ctx, flags.CheckoutNewTaxEngine, flags.CheckoutNewTaxEngineDefault, evalCtx)
if err != nil {
    log.Printf("flag %s: %v (serving default)", flags.CheckoutNewTaxEngine, err)
}
if useV2 { total = taxv2.Compute(cart) } else { total = taxv1.Compute(cart) }
```
4. On error, `BooleanValue` returns the default you passed together with the error. Use the returned value; never write `if err != nil { return err }` here, because that turns a flag service blip into a failed request.
5. Use the typed method matching `flag_spec.value_type`: `BooleanValue`, `StringValue`, `IntValue`, `FloatValue`, `ObjectValue`. For details (variant, reason) use the `...ValueDetails` variants.
6. Change one call site, run tests, then the next. Keep the old path.

### Output
One call site using the flag.

### Quality Gate
- `rg -n "checkout-new-tax-engine" --type go` shows the key only in `internal/flags`.
- No flag evaluation error path returns an error to the caller (`rg -n -A2 "BooleanValue\(" --type go` shows no `return .*err` in the next two lines).

---

## Phase 3: Vet and Test

### Entry Criteria
- Call site changed.

### Actions
1. Run `go vet ./...`.
2. Run `go test ./... -race`. The race detector matters because the provider updates flag state from a background goroutine.
3. Tests must not need a running flagd. The in-memory provider fixture is added in `ffr-both-paths-test`. Do not delete or `t.Skip` a failing test.

### Output
`go_flag_wiring`.

### Quality Gate
- `go vet ./...` exits 0.
- `go test ./... -race` exits 0 with no `WARNING: DATA RACE` in the output.

---

## Worked Example

Illustrative only.

```
$ go doc github.com/open-feature/go-sdk-contrib/providers/flagd/pkg NewProvider
func NewProvider(opts ...ProviderOption) (*Provider, error)
$ go build ./...
$ go vet ./...
$ go test ./... -race
ok   example.com/shop/internal/checkout  1.204s
ok   example.com/shop/internal/flags     0.011s
```
Call site `internal/checkout/total.go:41`; on provider timeout the log shows `flag checkout-new-tax-engine: ... (serving default)` and the v1 engine runs.

---

## Exit Criteria

DONE when the provider is set once in `main`, one decision uses a typed evaluation with `ctx`, the shared default and a stable targeting key, errors fall back to the default, and vet plus race-enabled tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Compile error on `NewProvider` | **Adjust**: match the signature printed by `go doc`. |
| Phase 1 | `go get` resolves an old major version | **Adjust**: check the module's releases and request the version explicitly with `@vX.Y.Z`. |
| Phase 2 | No stable user ID at the call site | **Return**: record an open question for `ffr-targeting-rules`. |
| Phase 3 | Data race reported | **Stop**: fix shared state access; do not drop `-race`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
