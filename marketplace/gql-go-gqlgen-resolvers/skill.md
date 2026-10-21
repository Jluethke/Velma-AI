# gqlgen Resolvers From SDL (Go)

**One-line description:** Generates a schema-first Go GraphQL server with `github.com/99designs/gqlgen`, binds GraphQL types to existing Go models in `gqlgen.yml`, replaces every generated `not implemented` panic with a real resolver, and smoke-tests the handler.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Path to the lint-clean `schema.graphql`.
- `project_dir` (string, required): Go module root (contains `go.mod`).

---

## Outputs

- `resolver_code` (string): Path to the resolver package (default `graph/`).
- `server_entry` (string): Path to the server main (default `server.go`) and the start command.

---

## Phase 1: Initialize and Configure

### Entry Criteria
- `go version` prints a version supported by the gqlgen release you install (see its `go.mod`).

### Actions
1. In `project_dir`: `go get github.com/99designs/gqlgen@latest`. On Go 1.24 or newer you can pin it as a tool: `go get -tool github.com/99designs/gqlgen` and then run `go tool gqlgen`; otherwise use `go run github.com/99designs/gqlgen`.
2. Initialize once: `go run github.com/99designs/gqlgen init`. It creates `gqlgen.yml`, `graph/schema.graphqls`, `graph/resolver.go`, `graph/schema.resolvers.go`, `graph/model/models_gen.go` and `server.go`.
3. Replace `graph/schema.graphqls` with the contents of `validated_schema` (gqlgen reads the `schema:` globs in `gqlgen.yml`, default `graph/*.graphqls`).
4. Bind types you already have in Go, in `gqlgen.yml`:
```yaml
models:
  Order:
    model: github.com/acme/shop/internal/store.Order
  ID:
    model:
      - github.com/99designs/gqlgen/graphql.ID
```
5. Force a resolver method for fields that need a lookup, instead of a struct field:
```yaml
  Order:
    model: github.com/acme/shop/internal/store.Order
    fields:
      customer:
        resolver: true
```
6. Generate: `go run github.com/99designs/gqlgen generate`.

### Output
Generated code and resolver stubs.

### Quality Gate
- `go run github.com/99designs/gqlgen generate` exits 0.
- `go build ./...` exits 0 (stubs compile even before implementation).

---

## Phase 2: Implement Resolvers

### Entry Criteria
- Generation succeeds.

### Actions
1. Put dependencies on the root resolver in `graph/resolver.go`: `type Resolver struct { Store *store.Store }`. gqlgen never overwrites this file.
2. List the stubs: `grep -rn "not implemented" graph/`. Each line is a method in `graph/schema.resolvers.go` (or `graph/<name>.resolvers.go` when you split schema files) containing `panic(fmt.Errorf("not implemented: ..."))`.
3. Replace one stub at a time with real logic. Signature example: `func (r *queryResolver) Order(ctx context.Context, id string) (*store.Order, error)`. Return `nil, nil` for "not found" on a nullable field; return an error for failures.
4. Rerun `go run github.com/99designs/gqlgen generate` after any schema or `gqlgen.yml` change. gqlgen keeps your implemented method bodies and moves resolvers for removed fields to a commented block at the bottom of the file; delete that block only after confirming the field was intentionally removed.
5. Implement `Node` resolution: gqlgen generates an interface `model.Node`; your types must implement `IsNode()` (generated for gqlgen models; add it to bound models).
6. Run `go vet ./...` after each group.

### Output
Implemented `graph/*.resolvers.go`.

### Quality Gate
- `grep -rn "not implemented" graph/` prints nothing (except stubs deliberately left for `gql-connection-keyset-resolver`, each listed).
- `go build ./... && go vet ./...` exits 0.

---

## Phase 3: Serve and Smoke Test

### Entry Criteria
- Build and vet pass.

### Actions
1. In `server.go`, construct the handler. Recent gqlgen deprecates `handler.NewDefaultServer`; use `srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{Store: st}}))` then add transports explicitly: `srv.AddTransport(transport.POST{})`, `srv.AddTransport(transport.GET{})`, and `srv.Use(extension.Introspection{})` only where introspection is allowed. Check the gqlgen `_examples` folder for your version.
2. Mount: `http.Handle("/query", srv)` (gqlgen convention) and optionally `http.Handle("/", playground.Handler("GraphQL", "/query"))` for local use only.
3. Start: `go run server.go`.
4. Smoke: `curl -s -X POST http://localhost:8080/query -H 'content-type: application/json' -d '{"query":"{ __typename }"}'` prints `{"data":{"__typename":"Query"}}` (8080 is the default port in the generated `server.go`).
5. Run one real operation from `operations/` and confirm no `errors` key.

### Output
`resolver_code`, `server_entry`.

### Quality Gate
- Smoke curl prints `{"data":{"__typename":"Query"}}`.
- A real operation returns no `errors` key.

---

## Worked Example

Illustrative only.

Phase 1: `go run github.com/99designs/gqlgen generate` exits 0. Phase 2: `grep -rn "not implemented" graph/` shows:
```
graph/schema.resolvers.go:21: panic(fmt.Errorf("not implemented: CancelOrder - cancelOrder"))
graph/schema.resolvers.go:31: panic(fmt.Errorf("not implemented: Node - node"))
```
Implemented:
```go
func (r *mutationResolver) CancelOrder(ctx context.Context, input model.CancelOrderInput) (*model.CancelOrderPayload, error) {
	o, err := r.Store.CancelOrder(ctx, input.OrderID)
	if err != nil { return nil, err }
	return &model.CancelOrderPayload{Order: o}, nil
}
```
grep prints nothing; `go vet ./...` exit 0; curl to `/query` returns `{"data":{"__typename":"Query"}}`.

---

## Exit Criteria

DONE when generation, build and vet pass, no unlisted `not implemented` stub remains, and the handler answers a real operation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `validation failed: packages.Load` during generate | **Adjust**: run `go mod tidy`, then generate again. |
| Phase 1 | Bound model field type does not match schema type | **Adjust**: gqlgen prints the field; add `resolver: true` for it or change the binding. |
| Phase 2 | Implemented code moved to the commented block after generate | **Return**: the method name changed with the schema; move the body into the new stub. |
| Phase 3 | `handler.NewDefaultServer` deprecation warning | **Adjust**: switch to `handler.New` with explicit transports as in Action 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
