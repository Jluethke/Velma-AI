# Query Complexity Limit in gqlgen (Go)

**One-line description:** Adds `extension.FixedComplexityLimit` to a gqlgen server, writes per-field complexity functions in `ComplexityRoot` so connection fields multiply by `first`, sets the limit from the measured complexity of real operations, and proves abusive queries are rejected.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Directory of real client operations.
- `project_dir` (string, required): Go module root with gqlgen.

---

## Outputs

- `limit_config` (object): Complexity functions, the limit, and its derivation.
- `limit_tests` (string): Path to tests and passing output.

---

## Phase 1: Write Complexity Functions

### Entry Criteria
- The server builds with `handler.New(graph.NewExecutableSchema(cfg))`.

### Actions
1. gqlgen's default complexity is 1 per field plus children; lists do not multiply. A connection with `first: 100` costs the same as `first: 1` until you write functions.
2. Open the generated `ComplexityRoot` struct in `graph/generated.go` and find the field func signatures, for example `Orders func(childComplexity int, first *int, after *string) int` under `Viewer`.
3. Set them where the config is built:
```go
cfg := graph.Config{Resolvers: res}
cfg.Complexity.Viewer.Orders = func(childComplexity int, first *int, after *string) int {
	n := maxPageSize // the same user-supplied cap the connection resolver enforces
	if first != nil { n = *first }
	return 1 + n*childComplexity
}
```
4. Write one function per connection or list field with a size argument. Fields without size arguments keep the default.
5. Do not edit `generated.go`; it is overwritten on every generate.

### Output
Complexity functions in the config.

### Quality Gate
- `go build ./...` exits 0.
- `grep -n "cfg.Complexity\." -r . --include=*.go` lists one line per connection field.

---

## Phase 2: Measure and Set the Limit

### Entry Criteria
- Complexity functions compile.

### Actions
1. Log the computed complexity of each request: gqlgen stores it on the operation context after the complexity extension runs. Add `srv.AroundOperations(func(ctx context.Context, next graphql.OperationHandler) graphql.ResponseHandler { if s := extension.GetComplexityStats(ctx); s != nil { log.Printf("op=%s complexity=%d", graphql.GetOperationContext(ctx).OperationName, s.Complexity) }; return next(ctx) })`. `GetComplexityStats` returns stats only when a complexity extension is installed; install `extension.FixedComplexityLimit` with a temporarily very high value for measurement, then lower it.
2. Run every real operation with its realistic variables (largest `first` the client sends). Record the logged complexity.
3. The limit is the maximum measured complexity. Record each operation's value in `limit_config`.
4. Set `srv.Use(extension.FixedComplexityLimit(LIMIT))`. For per-request limits (for example higher for internal callers), use `&extension.ComplexityLimit{Func: func(ctx context.Context, op *graphql.OperationContext) int { ... }}`.
5. gqlgen has no separate depth-limit extension in core; complexity with multiplying connection functions bounds deep and wide queries. If the user requires an explicit depth limit, record it as open or add a validation rule; do not claim one exists.

### Output
Limit set from measurements.

### Quality Gate
- `limit_config` lists every real operation with its measured complexity, and the limit equals the maximum.

---

## Phase 3: Prove the Limit

### Entry Criteria
- Limit active.

### Actions
1. Test with the gqlgen client (`github.com/99designs/gqlgen/client`): every real operation succeeds.
2. Send `CustomerOrders` with `first` set to make complexity exceed the limit, or nest connections; assert the error message contains `operation has complexity` (gqlgen's message is `operation has complexity X, which exceeds the limit of Y`; confirm in your version) and `extensions.code` is `COMPLEXITY_LIMIT_EXCEEDED`.
3. Run `go test ./... -run Complexity -v`.

### Output
`limit_config`, `limit_tests`.

### Quality Gate
- `go test` exits 0 with real-operation and over-limit tests passing.
- No real operation test was deleted or skipped.

---

## Worked Example

Illustrative only. User cap `maxPageSize = 50`.

Phase 2 log:
```
op=CustomerOrders complexity=153
op=OrderDetail complexity=12
op=CancelOrder complexity=4
```
Limit 153. Phase 3: `CustomerOrders` with a nested `customer { orders(first: 50) { ... } }` returns `operation has complexity 7653, which exceeds the limit of 153`. `ok github.com/acme/shop/graph 0.12s`.

---

## Exit Criteria

DONE when connection fields multiply complexity by page size, the limit equals the maximum measured real-operation complexity, and over-limit queries fail in tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Signature mismatch when assigning the func | **Adjust**: copy the exact signature from `ComplexityRoot` in `generated.go`. |
| Phase 2 | `GetComplexityStats` returns nil | **Adjust**: the complexity extension is not installed or runs after your hook; install it first. |
| Phase 3 | Real operation exceeds limit | **Adjust**: set the limit to that operation's measured value; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
