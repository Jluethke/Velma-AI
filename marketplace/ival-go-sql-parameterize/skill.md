# Go SQL Injection Fix With database/sql Placeholders

**One-line description:** Replaces `fmt.Sprintf` and `+` SQL construction in Go with `database/sql`, pgx or sqlx placeholders in the dialect your driver expects (`$1` for PostgreSQL drivers, `?` for MySQL and SQLite), allowlists identifiers or uses `pgx.Identifier.Sanitize`, and proves each fix with gosec G201/G202 and an injection test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Go module root.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `sql`.

---

## Outputs

- `go_sql_fixes` (object): `fixed` (file, line, before, after), `gosec_before` and `gosec_after` (G201 plus G202 counts), `test_file`, `test_run`.

---

## Phase 1: Baseline and Driver Dialect

### Entry Criteria
- One or more `sql` rows with status `vulnerable` or `needs_review`.

### Actions
1. `go install github.com/securego/gosec/v2/cmd/gosec@latest`, then `gosec -include=G201,G202 -fmt=json -out=gosec-sql-before.json ./...`. G201 is SQL built with format strings; G202 is SQL built with string concatenation. Count with `jq '.Issues | length' gosec-sql-before.json`, record `gosec_before`.
2. Find the driver: `rg -n "jackc/pgx|lib/pq|go-sql-driver/mysql|mattn/go-sqlite3|modernc.org/sqlite|jmoiron/sqlx|gorm.io" go.mod`.
3. Placeholder per driver. The placeholder is the driver's, and using the wrong one gives a syntax error, not a fallback:

| Driver | Placeholder | Safe call |
|---|---|---|
| pgx (native or `pgx/v5/stdlib`), lib/pq | `$1`, `$2` | `db.QueryContext(ctx, "SELECT ... WHERE id = $1", id)` |
| go-sql-driver/mysql | `?` | `db.QueryContext(ctx, "SELECT ... WHERE id = ?", id)` |
| SQLite drivers | `?` | same as MySQL |
| sqlx | driver's own; `sqlx.In` expands slices, then `db.Rebind(q)` converts `?` to the driver form | `q, args, err := sqlx.In("... WHERE id IN (?)", ids); q = db.Rebind(q)` |
| GORM | `db.Where("status = ?", s)` | not `db.Where(fmt.Sprintf(...))` and not `db.Raw(userString)` |

### Output
Fix list with driver; `gosec_before`.

### Quality Gate
- `gosec_before` recorded from the saved JSON.
- Every fix item names its placeholder dialect.

---

## Phase 2: Rewrite Each Query

### Entry Criteria
- Fix list exists.

### Actions
1. Rules by value type:

| Value | Fix |
|---|---|
| Scalar | pass as an argument after the query string |
| Slice for `IN` (pgx) | `WHERE id = ANY($1)` with the Go slice as one argument |
| Slice for `IN` (other drivers) | `sqlx.In` then `Rebind`, or build `?,?,?` from `len(ids)` and pass `ids...` as `[]any` |
| `LIKE` term | escape `%`, `_`, `\` with `strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_")`, then bind `"%" + esc + "%"` with `ESCAPE '\'` in the SQL |
| Column or table | `map[string]string{"date": "created_at"}` allowlist; unknown key returns 400 |
| PostgreSQL identifier that cannot be allowlisted | `pgx.Identifier{schema, table}.Sanitize()` |

2. Do NOT use `fmt.Sprintf("%q", v)` or `strconv.Quote` as SQL quoting; Go string quoting is not SQL quoting.
3. Always use the `Context` variants (`QueryContext`, `ExecContext`) so a slow injected query can be cancelled with the request.
4. Check `rows.Err()` after the loop and `defer rows.Close()`; this is unrelated to injection but weak fixes often drop it while rewriting.
5. One file at a time; `go test ./...` after each.

### Output
Rewritten queries.

### Quality Gate
- `gosec -include=G201,G202 ./...` count is lower than `gosec_before`; each remainder is listed with the allowlist that makes it safe, recorded as `gosec_after`. Annotate a justified remainder with `// #nosec G201 -- identifier from SORT allowlist` only after the justification is written.
- `go vet ./...` exits 0.

---

## Phase 3: Injection Tests

### Entry Criteria
- Queries rewritten.

### Actions
1. Run against a real database. Use the repo's existing test DB setup, or `testcontainers-go` if already a dependency. Do not use `sqlmock` for injection tests: it matches query text and cannot show how the database parses a payload.

```go
func TestListOrdersNotInjectable(t *testing.T) {
    for _, p := range []string{"' OR '1'='1", "1; DROP TABLE orders;--", "x' UNION SELECT password FROM users--"} {
        t.Run(p, func(t *testing.T) {
            seed(t, db)                                   // inserts one 'open' order
            got, err := ListOrders(ctx, db, p, "date")
            if err != nil { t.Fatal(err) }
            if len(got) != 0 { t.Fatalf("payload matched %d rows", len(got)) }
            var n int
            if err := db.QueryRowContext(ctx, "SELECT count(*) FROM orders").Scan(&n); err != nil || n != 1 {
                t.Fatalf("table changed: n=%d err=%v", n, err)
            }
        })
    }
}
```
2. Add a case: unknown sort key returns the error your handler maps to 400.
3. Run `go test ./... -run NotInjectable -v`, record output.
4. Mutation check: reintroduce `fmt.Sprintf` in one query, rerun, confirm a FAIL, revert.

### Output
`go_sql_fixes`.

### Quality Gate
- `go test` output has no `FAIL` line.
- Mutation run prints `--- FAIL: TestListOrdersNotInjectable`; reverted run passes.

---

## Worked Example

Illustrative. `internal/store/orders.go:40`, driver pgx v5 stdlib.

Before:
```go
q := fmt.Sprintf("SELECT id FROM orders WHERE status = '%s' ORDER BY %s", status, sort)
rows, err := db.Query(q)
```
After:
```go
col, ok := sortCols[sort]
if !ok { return nil, ErrBadSort }
q := "SELECT id FROM orders WHERE status = $1 ORDER BY " + col // #nosec G202 -- col from sortCols allowlist
rows, err := db.QueryContext(ctx, q, status)
```
Phase 1 `gosec_before` = 3; Phase 2 `gosec_after` = 0 unsuppressed, 1 justified `#nosec`. Phase 3: `ok example.com/shop/internal/store 0.84s`.

---

## Exit Criteria

DONE when every Go SQL sink binds values with the driver's placeholder, identifiers come from an allowlist or `pgx.Identifier`, gosec counts are reduced with every remainder justified in code, and injection tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | gosec install blocked | **Adjust**: `semgrep scan --config p/golang` and record the tool used. |
| Phase 2 | `pq: syntax error at or near "?"` | **Adjust**: you used `?` with a PostgreSQL driver; switch to `$n` or `Rebind`. |
| Phase 2 | Dynamic `WHERE` built from optional filters | **Adjust**: append fixed SQL fragments and `args = append(args, v)` with `$len(args)` numbering; never append user text. |
| Phase 3 | No database in CI | **Stop**: add one (service container) before claiming the fix; a unit test with sqlmock does not prove it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
