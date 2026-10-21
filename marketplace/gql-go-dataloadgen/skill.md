# Batch N+1 Fields With dataloadgen (Go, gqlgen)

**One-line description:** Replaces each per-item lookup in gqlgen resolvers with a `github.com/vikstrous/dataloadgen` loader attached to the request context by HTTP middleware, with a fetch function that issues one `ANY($1)` query and returns values aligned to keys.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `n_plus_one_fields` (object[], required): Offending fields from `gql-n-plus-one-detect`.
- `project_dir` (string, required): Go module root with a gqlgen server.

---

## Outputs

- `loader_code` (string): Path to the loaders package (for example `graph/loaders/loaders.go`).
- `query_count_after` (object[]): Statement counts at the same two sizes after batching.

---

## Phase 1: Write Fetch Functions

### Entry Criteria
- The detection regression test fails.

### Actions
1. `go get github.com/vikstrous/dataloadgen` (the loader library used in the gqlgen dataloader docs).
2. Make sure the field has a resolver method. If `Order.customer` is a struct field on a bound model, add `fields: { customer: { resolver: true } }` under `Order` in `gqlgen.yml` and run `go run github.com/99designs/gqlgen generate`.
3. Create `graph/loaders/loaders.go`:
```go
type reader struct{ db *pgxpool.Pool }

func (r *reader) getCustomers(ctx context.Context, ids []string) ([]*model.Customer, []error) {
	rows, err := r.db.Query(ctx, `SELECT id, name FROM customers WHERE id = ANY($1)`, ids)
	if err != nil { return nil, []error{err} }
	defer rows.Close()
	byID := map[string]*model.Customer{}
	for rows.Next() {
		c := &model.Customer{}
		if err := rows.Scan(&c.ID, &c.Name); err != nil { return nil, []error{err} }
		byID[c.ID] = c
	}
	out := make([]*model.Customer, len(ids))
	for i, id := range ids { out[i] = byID[id] }
	return out, nil
}
```
4. Contract: the fetch function returns a slice the same length as `keys`, index-aligned. Errors are either one error applied to all keys or a slice aligned to keys; check the dataloadgen README for the exact rule in your version. Never return rows in database order.
5. One-to-many: value type is a slice (`[][]*model.LineItem`), grouped by foreign key.

### Output
Fetch functions.

### Quality Gate
- `go build ./...` exits 0.
- Each fetch function ends with a loop over the `ids` argument filling `out[i]`.

---

## Phase 2: Attach Loaders Per Request

### Entry Criteria
- Fetch functions compile.

### Actions
1. In the same package:
```go
type ctxKey string
const loadersKey = ctxKey("dataloaders")
type Loaders struct{ CustomerByID *dataloadgen.Loader[string, *model.Customer] }

func NewLoaders(db *pgxpool.Pool) *Loaders {
	r := &reader{db: db}
	return &Loaders{CustomerByID: dataloadgen.NewLoader(r.getCustomers, dataloadgen.WithWait(time.Millisecond))}
}
func Middleware(db *pgxpool.Pool, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		ctx := context.WithValue(req.Context(), loadersKey, NewLoaders(db))
		next.ServeHTTP(w, req.WithContext(ctx))
	})
}
func For(ctx context.Context) *Loaders { return ctx.Value(loadersKey).(*Loaders) }
```
`WithWait(time.Millisecond)` is the value in the gqlgen docs example; keep it unless a trace shows a reason to change it.
2. Wrap the handler: `http.Handle("/query", loaders.Middleware(pool, srv))`. Loaders are created per HTTP request; never store them in a package variable or on the root `Resolver` struct.
3. Resolver: `func (r *orderResolver) Customer(ctx context.Context, obj *model.Order) (*model.Customer, error) { return loaders.For(ctx).CustomerByID.Load(ctx, obj.CustomerID) }`.
4. gqlgen runs sibling field resolvers concurrently when they are marked as resolvers, which is what lets the loader collect keys within the wait window.
5. Run the race detector: `go test ./... -race`.

### Output
Resolvers using loaders.

### Quality Gate
- `grep -rn "dataloadgen.NewLoader" --include=*.go . | grep -v graph/loaders/` prints nothing.
- `go test ./... -race` exits 0 with no `WARNING: DATA RACE`.

---

## Phase 3: Prove the Batch

### Entry Criteria
- Middleware wired.

### Actions
1. Rerun the two-size measurement with the pgx tracer. Record `query_count_after`.
2. Count at N2 equals count at N1; the log shows one `WHERE id = ANY($1)` statement.
3. Run the regression test: `go test ./... -run NPlusOne -v` passes.

### Output
`loader_code`, `query_count_after`.

### Quality Gate
- Equal counts at both sizes for each fixed operation.
- `go test ./...` exits 0; no test uses `t.Skip` to pass.

---

## Worked Example

Illustrative only.

Before: 6 statements at 5 orders. After, tracer output at 5 orders:
```
SELECT ... FROM orders WHERE customer_id = $1 ORDER BY placed_at DESC, id DESC LIMIT $2
SELECT id, name FROM customers WHERE id = ANY($1)
```
`query_count_after`: counts 2 and 2. `go test ./... -race`: `ok github.com/acme/shop/graph 0.31s`.

---

## Exit Criteria

DONE when each offending field loads through a per-request dataloadgen loader, counts no longer grow with item count, and the race detector is clean.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Field has no resolver method to change | **Adjust**: set `resolver: true` for it in `gqlgen.yml` and regenerate. |
| Phase 2 | Panic `interface conversion: interface {} is nil` in `For` | **Return**: the handler is not wrapped by the middleware; fix the `http.Handle` line. |
| Phase 3 | Count still grows | **Adjust**: the field is not a resolver (runs sequentially in a struct) or `Load` is called in a serial loop; use `LoadAll` for slices. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
