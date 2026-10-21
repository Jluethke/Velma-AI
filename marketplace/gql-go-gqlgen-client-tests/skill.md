# Resolver and Operation Tests (Go, gqlgen client)

**One-line description:** Tests a gqlgen server in-process with `github.com/99designs/gqlgen/client` against the real executable schema and a test store, covering every client operation, error codes via `client.RawJsonError`, and the race detector.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Client operations; each gets at least one test.
- `project_dir` (string, required): Go module root.
- `error_code_catalog` (object[], required): Codes tests must assert.

---

## Outputs

- `operation_test_suite` (string): Path to the `_test.go` files.
- `test_run_log` (string): Output of the passing run.

---

## Phase 1: Harness

### Entry Criteria
- The resolver root takes its dependencies as fields (`graph.Resolver{Store: ...}`), so tests can inject a test store.

### Actions
1. Create `graph/testutil_test.go`:
```go
func newClient(t *testing.T, st *store.Store, opts ...client.Option) *client.Client {
	t.Helper()
	cfg := graph.Config{Resolvers: &graph.Resolver{Store: st}}
	// register directives and complexity funcs exactly as production does
	registerDirectives(&cfg)
	srv := handler.New(graph.NewExecutableSchema(cfg))
	srv.AddTransport(transport.POST{})
	return client.New(loaders.Middleware(st.Pool, srv), opts...)
}
```
Build the handler with the same directives, extensions and middleware as production; a test server missing them tests a different server.
2. Test store: a real database in a container (for example testcontainers-go) or a transaction per test rolled back in `t.Cleanup`.
3. Inject the user with a client option that sets the request context, for example:
```go
func asUser(u *auth.User) client.Option {
	return func(bd *client.Request) { bd.HTTP = bd.HTTP.WithContext(auth.WithUser(bd.HTTP.Context(), u)) }
}
```
Check the `client.Request` fields for your gqlgen version.

### Output
Harness.

### Quality Gate
- A `{ __typename }` test passes: `go test ./graph -run TestTypename -v` prints `--- PASS`.

---

## Phase 2: Write Tests

### Entry Criteria
- Harness works.

### Actions
1. For each operation file, read it with `os.ReadFile("../operations/CustomerOrders.graphql")` and post it:
```go
var resp struct{ Viewer struct{ Orders struct {
	Edges []struct{ Node struct{ Number string } }
	PageInfo struct{ HasNextPage bool }
} } }
c.MustPost(string(q), &resp, client.Var("first", 2), asUser(alice))
require.Len(t, resp.Viewer.Orders.Edges, 2)
```
`MustPost` panics on any GraphQL error; use `Post` when you expect errors.
2. Error tests: `err := c.Post(q, &resp, ...)`; `var raw client.RawJsonError; require.ErrorAs(t, err, &raw)`; unmarshal `raw.RawMessage` into `[]struct{ Extensions map[string]any }` and assert `Extensions["code"]` against the catalog.
3. Use table-driven tests (`[]struct{ name string; user *auth.User; wantCode string }`) with `t.Run(tc.name, ...)`.
4. Write one test file at a time and run it.

### Output
Test files.

### Quality Gate
- Every operation name appears in a `_test.go` file (`grep -l "<OperationName>" graph/*_test.go`).

---

## Phase 3: Run and Record

### Entry Criteria
- Tests written.

### Actions
1. Run `go test ./... -race -count=1 -v` and save output to `test_run_log`. `-count=1` disables the test cache so the run is real.
2. On failure:

| Failure | Action |
|---|---|
| `json: cannot unmarshal` into resp | the response struct field names or nesting do not match the selection; fix the struct |
| `WARNING: DATA RACE` | shared state in resolvers or loaders; fix the code, not the test |
| Expectation contradicts schema | fix the test with a recorded reason |

3. Never add `t.Skip`, comment out an assertion, or delete a failing test to get green.
4. Add `go test ./... -race` to CI.

### Output
`operation_test_suite`, `test_run_log`.

### Quality Gate
- `go test ./... -race -count=1` exits 0.
- `grep -rn "t.Skip" --include=*_test.go .` prints nothing.

---

## Worked Example

Illustrative only.

```
=== RUN   TestCustomerOrders
--- PASS: TestCustomerOrders (0.03s)
=== RUN   TestCancelOrder/owner
=== RUN   TestCancelOrder/other_user_null
=== RUN   TestCancelOrder/anonymous_unauthenticated
--- PASS: TestCancelOrder (0.05s)
PASS
ok  	github.com/acme/shop/graph	0.48s
```

---

## Exit Criteria

DONE when every client operation and produced error code has a passing in-process test on a production-equivalent handler, under the race detector.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test handler lacks production directives | **Adjust**: factor directive and extension registration into one function used by both. |
| Phase 2 | `MustPost` panics on expected error | **Adjust**: use `Post` and inspect the error. |
| Phase 3 | Tests pass only with cache | **Retry**: rerun with `-count=1`; fix any test depending on prior state. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
