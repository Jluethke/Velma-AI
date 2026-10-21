# Go GORM and database/sql N+1 Query Fix

**One-line description:** Detects N+1 queries in a Go code path using a GORM callback counter or a wrapped `database/sql` driver, fixes each with `Preload`, `Joins`, or a single `ANY`/`IN` batch query, and pins the count in a `go test` test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Go module root containing `go.mod`.
- `test_command` (string, required): For example `go test ./...`.
- `suspect_endpoint` (string, required): HTTP handler, service function or worker suspected of N+1.

---

## Outputs

- `n_plus_one_fixes` (object[]): Per fix: file and line, code before and after, counts at two sizes, and the pinning test.

---

## Phase 1: Count Queries

### Entry Criteria
- `test_command` passes before any change.
- Library recorded from `go.mod`: `gorm.io/gorm` (v2), `github.com/jackc/pgx/v5`, `github.com/jmoiron/sqlx`, or plain `database/sql`.

### Actions
1. GORM v2 counter, registered on the test DB:
```go
var queryCount int64
func registerCounter(db *gorm.DB) {
    cb := func(tx *gorm.DB) { atomic.AddInt64(&queryCount, 1) }
    db.Callback().Query().After("gorm:query").Register("test:count_query", cb)
    db.Callback().Row().After("gorm:row").Register("test:count_row", cb)
    db.Callback().Raw().After("gorm:raw").Register("test:count_raw", cb)
}
```
   To see SQL: `db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Info)})` or `db.Debug()` for one call.
2. Plain `database/sql`, sqlx or pgx: count in the test by wrapping the code under test's querier interface (most code takes an interface with `QueryContext`/`Query`; implement a counting wrapper in the test file). Do not add a dependency for this without the user's approval.
3. Seed 10 parents, reset the counter, call the code, record the count; repeat with 20. Growth means N+1.
4. In the code, look for a query inside a `for _, x := range parents` loop, or a GORM association accessed per element with `db.Model(&p).Association("Items").Find(&items)`.

### Output
Counts at two sizes and the looping call sites.

### Quality Gate
- Two counts at two sizes are recorded from `go test -v` output.
- Each looping call site is named by file and line.

---

## Phase 2: Apply the Fix

### Entry Criteria
- N+1 confirmed.

### Actions
1. Choose:

| Situation | Fix |
|---|---|
| GORM has-many or many-to-many | `db.Preload("Items").Find(&orders)` (one extra query with `IN`) |
| GORM nested | `db.Preload("Items.Product").Find(&orders)` |
| GORM belongs-to or has-one | `db.Joins("Customer").Find(&orders)` (LEFT JOIN in one query) |
| GORM preload with filter | `db.Preload("Items", "active = ?", true).Find(&orders)` |
| pgx or database/sql loop | collect ids, then one query: PostgreSQL `SELECT ... FROM order_items WHERE order_id = ANY($1)` passing a Go slice (pgx v5 encodes `[]int64` directly; `lib/pq` needs `pq.Array(ids)`); MySQL `WHERE order_id IN (?, ?, ...)` built with `sqlx.In` and `db.Rebind` |
| sqlx | `query, args, err := sqlx.In("SELECT ... WHERE order_id IN (?)", ids); query = db.Rebind(query)` |

2. After the batch query, group children by parent id in a `map[int64][]Item` and attach them; keep the parent order unchanged.
3. Always check `rows.Err()` after the loop over `rows.Next()` and `defer rows.Close()`; a batch query that silently stops early looks like missing children.
4. Change one function per edit.

### Output
Query code changed at one call site.

### Quality Gate
- `go build ./...` and `go vet ./...` exit 0.
- `git diff --stat` shows only the intended file.

---

## Phase 3: Pin and Run

### Entry Criteria
- Phase 2 edit made.

### Actions
1. Rerun the counting test at both sizes; counts must match.
2. Assert: `if got := atomic.LoadInt64(&queryCount); got != EXPECTED { t.Fatalf("queries = %d, want %d", got, EXPECTED) }` with the post-fix count.
3. Run the full `test_command`, plus `go test -race ./...` if the counter is shared across goroutines. Do not delete or `t.Skip()` failing tests.

### Output
`n_plus_one_fixes`.

### Quality Gate
- Equal counts at both sizes in `go test -v` output.
- The count assertion passes.
- Full `test_command` exit code is 0.

---

## Worked Example

Illustrative only.

Input: `internal/orders/handler.go` `ListShipped` using GORM v2 on PostgreSQL.

Phase 1: 10 orders gives 11 queries; 20 gives 21. Loop at line 38: `db.Where("order_id = ?", o.ID).Find(&o.Items)`.

Phase 2:
```go
var orders []Order
err := db.Joins("Customer").Preload("Items").
    Where("orders.status = ?", "shipped").Limit(50).Find(&orders).Error
```
Phase 3: 2 queries at both sizes. `go test ./...`: ok for all packages.

---

## Exit Criteria

DONE when counts are constant across sizes, a test pins the count, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Callback name already registered | **Adjust**: use a unique name or register once in `TestMain`. |
| Phase 2 | `Preload` field name wrong (`unsupported relations`) | **Adjust**: use the struct field name, not the table name; check the struct tags. |
| Phase 2 | MySQL placeholder count limit for huge IN lists | **Adjust**: batch the id list in chunks; record the chunk size chosen with the user. |
| Phase 3 | Race detector reports the counter | **Retry**: use `sync/atomic` for the counter as shown. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
