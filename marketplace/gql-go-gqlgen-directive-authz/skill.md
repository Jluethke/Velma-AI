# gqlgen Directive Authorization (Go)

**One-line description:** Enforces an access rule table in a gqlgen server with an HTTP auth middleware that puts the user in `context.Context`, a schema directive `@hasRole` implemented through `Config.Directives`, owner-filtered queries, and client tests per rule row.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Contract schema.
- `project_dir` (string, required): Go module root with gqlgen.
- `access_rules` (object[], required): User-supplied rules per coordinate.

---

## Outputs

- `authz_code` (string[]): Paths of the middleware, directive implementation and changed resolvers.
- `authz_tests` (string): Path to the authorization tests and passing output.

---

## Phase 1: Auth Middleware

### Entry Criteria
- Every coordinate has a rule row or a confirmed public mark.

### Actions
1. Create `internal/auth/middleware.go`: read `Authorization`, verify the JWT (for example `github.com/golang-jwt/jwt/v5` `jwt.Parse(tok, keyFunc, jwt.WithValidMethods([]string{"RS256"}), jwt.WithAudience(aud), jwt.WithIssuer(iss))`), and store the user: `ctx = context.WithValue(r.Context(), userKey, u)`.
2. Missing token: call `next` with no user. Invalid token: respond `http.Error(w, "invalid token", http.StatusUnauthorized)` and return.
3. Export `func UserFrom(ctx context.Context) (*User, bool)`.
4. Wrap the GraphQL handler: `http.Handle("/query", auth.Middleware(loaders.Middleware(pool, srv)))`.

### Output
Context carries the user.

### Quality Gate
- `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer x" -X POST localhost:8080/query -H 'content-type: application/json' -d '{"query":"{ __typename }"}'` prints `401`.

---

## Phase 2: Directive and Owner Filters

### Entry Criteria
- Middleware wired.

### Actions
1. Add to the schema (in a file under `graph/`, and as an approved schema change):
```graphql
enum Role { CUSTOMER SUPPORT ADMIN }
directive @hasRole(role: Role!) on FIELD_DEFINITION
type Mutation { refundOrder(input: RefundOrderInput!): RefundOrderPayload @hasRole(role: SUPPORT) }
```
2. Regenerate: `go run github.com/99designs/gqlgen generate`. gqlgen adds `HasRole func(ctx context.Context, obj interface{}, next graphql.Resolver, role model.Role) (res interface{}, err error)` to `DirectiveRoot`.
3. Implement and register it where the config is built:
```go
c := graph.Config{Resolvers: res}
c.Directives.HasRole = func(ctx context.Context, obj interface{}, next graphql.Resolver, role model.Role) (interface{}, error) {
	u, ok := auth.UserFrom(ctx)
	if !ok { return nil, &gqlerror.Error{Message: "Not signed in", Extensions: map[string]interface{}{"code": "UNAUTHENTICATED"}} }
	if !u.Has(role) { return nil, &gqlerror.Error{Message: "Forbidden", Extensions: map[string]interface{}{"code": "FORBIDDEN"}} }
	return next(ctx)
}
srv := handler.New(graph.NewExecutableSchema(c))
```
If a directive used in the schema has no implementation, the generated code returns an error such as `directive hasRole is not implemented` when the field runs; set every directive explicitly.
4. Owner rules are not directives: filter in SQL (`WHERE id = $1 AND customer_id = $2`) in the store method the resolver calls, using `auth.UserFrom(ctx)`. Return `nil, nil` when absent.
5. Route `Query.node` through the same owner-filtered loaders.
6. Run `go build ./... && go vet ./...`.

### Output
Directive registered; owner filters in store methods.

### Quality Gate
- `grep -n "c.Directives.HasRole" -r .` finds one registration.
- Every role rule row maps to a `@hasRole` in the schema; every owner row maps to a store query with the owner column in its WHERE clause.

---

## Phase 3: Test Every Rule Row

### Entry Criteria
- Build passes.

### Actions
1. Use the gqlgen test client with a context injector:
```go
c := client.New(auth.Middleware(srvUnderTest))
var resp struct{ RefundOrder struct{ Order *struct{ ID string } } }
err := c.Post(`mutation($id: ID!){ refundOrder(input:{orderId:$id}){ order { id } } }`, &resp,
	client.Var("id", "ord_1"), client.AddHeader("Authorization", "Bearer "+customerToken))
require.ErrorContains(t, err, "Forbidden")
```
(`client.AddHeader` exists in recent gqlgen; otherwise inject the user into context with a `client.Option` that sets `bd.HTTP` request context; check `client` package docs.)
2. Three callers per rule row plus a `node(id:)` cross-user test.
3. Run `go test ./... -run Authz -v -race`.

### Output
`authz_code`, `authz_tests`.

### Quality Gate
- Test count is at least 3 times the non-public rule rows.
- `go test` exits 0, no `t.Skip`.

---

## Worked Example

Illustrative only.

After generate and before registration, calling `refundOrder` returns `directive hasRole is not implemented`. After setting `c.Directives.HasRole`, test output:
```
=== RUN   TestAuthzRefundOrder/customer_forbidden
=== RUN   TestAuthzRefundOrder/support_allowed
=== RUN   TestAuthzRefundOrder/anonymous_unauthenticated
--- PASS: TestAuthzRefundOrder (0.02s)
--- PASS: TestAuthzNodeCrossUser (0.01s)
ok  	github.com/acme/shop/graph	0.19s
```

---

## Exit Criteria

DONE when role rules are enforced by a registered directive, owner rules by SQL filters, and each rule passes allowed, denied and anonymous tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Generated `DirectiveRoot` lacks `HasRole` | **Retry**: confirm the directive is in a file matched by `schema:` in `gqlgen.yml`; regenerate. |
| Phase 2 | Tempted to put owner checks in a directive with `obj interface{}` casts | **Adjust**: owner checks belong in the store query, where they also protect lists. |
| Phase 3 | Cross-user `node` test returns data | **Stop**: fix `node` routing first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
