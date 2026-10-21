# Ledger Go Integer Cents Money

**One-line description:** Implements Go money as `int64` minor units with explicit overflow checks and uses `shopspring/decimal` only for sub-unit math, avoiding `NewFromFloat`, struct `==` on decimals and the global `DivisionPrecision`, and fixes the database/sql, pgx and JSON boundaries.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Go module (directory containing `go.mod`).
- `money_representation_spec` (object, required): Output of `ledg-money-representation-decision`.

---

## Outputs

- `go_money_module` (object): Package path of the money package, its exported API, boundary fixes (file and line), and the passing `go test` and `go vet` commands with summaries.

---

## Phase 1: Write the Money Package

### Entry Criteria
- `money_representation_spec` lists go types.
- `go version` runs and `go test ./...` runs (passing or not, record the baseline).

### Actions
1. Create package `money` in one file `money.go`. Define `type Money struct { Minor int64; Currency string }` with no float fields.
2. Go integer overflow wraps silently. Write `Add(a, b Money) (Money, error)` that rejects currency mismatch and checks overflow before adding: `if (b.Minor > 0 && a.Minor > math.MaxInt64-b.Minor) || (b.Minor < 0 && a.Minor < math.MinInt64-b.Minor) { return Money{}, ErrOverflow }`. Same pattern for `Sub`.
3. Write `Parse(s, currency string) (Money, error)`:
```
d, err := decimal.NewFromString(s)            // github.com/shopspring/decimal
if err != nil { return Money{}, err }
shifted := d.Shift(int32(exp))                // exp from the spec, for example 2 for USD
if !shifted.Equal(shifted.Truncate(0)) { return Money{}, ErrTooManyDigits }
if shifted.Cmp(decimal.NewFromInt(math.MaxInt64)) > 0 || shifted.Cmp(decimal.NewFromInt(math.MinInt64)) < 0 { return Money{}, ErrOverflow }
return Money{Minor: shifted.IntPart(), Currency: currency}, nil
```
4. Rate math: `MulRate(m Money, rate decimal.Decimal, mode RoundMode) (Money, error)`. shopspring rounding methods: `Round(places)` rounds half away from zero, `RoundBank(places)` rounds half to even, `RoundCeil`, `RoundFloor`, `RoundUp`, `RoundDown` exist in recent versions; check `go doc github.com/shopspring/decimal.Decimal` for the installed version. Map the policy from `ledg-rounding-policy` to one of these.
5. Never call `decimal.NewFromFloat`; it carries the binary float error. Never compare decimals with `==` (struct comparison of internal fields); use `d.Equal(e)` or `d.Cmp(e) == 0`.
6. `decimal.DivisionPrecision` is a package-level variable (default 16) used by `Div`. Do not change it globally; use `DivRound(d2, precision)` with the precision from the rounding policy.

### Output
`money.go` with type, arithmetic and parser.

### Quality Gate
- `go test ./money/...` passes with tests for overflow (`math.MaxInt64` plus 1 returns `ErrOverflow`) and parsing (`"1.005"` USD returns an error).
- `rg -n 'NewFromFloat' --type go` returns no money hit.

---

## Phase 2: Fix the Boundaries

### Entry Criteria
- Phase 1 tests pass.

### Actions
1. database/sql: scan `bigint` into `int64`. Scan `numeric` into `decimal.Decimal` (it implements `sql.Scanner` and `driver.Valuer`) or into `string`, never into `float64`.
2. pgx v5: `numeric` decodes to `pgtype.Numeric`; to get `decimal.Decimal`, register the adapter from `github.com/jackc/pgx-shopspring-decimal` on the connection's type map (see that module's README for the `Register` call). Do not scan numeric into `float64`.
3. JSON: `decimal.Decimal` marshals as a quoted string by default (`decimal.MarshalJSONWithoutQuotes` is false); keep that default. For `Money`, implement `MarshalJSON` that writes the minor units as a string or the decimal string with exactly the currency exponent.
4. Replace `strconv.ParseFloat` and `math.Round` on money with `Parse` and `MulRate`. Change one file at a time and run `go test ./...` after each.
5. GORM: money columns use `gorm:"type:bigint"` or `gorm:"type:numeric(P,S)"` from the spec.

### Output
Boundary fixes list.

### Quality Gate
- `rg -n --type go -e 'float64' -e 'ParseFloat' -e 'math\.Round'` returns no hit classified as money.
- `go test ./...` exits 0.

---

## Phase 3: Static Checks

### Entry Criteria
- Phase 2 suite passes.

### Actions
1. Run `go vet ./...` and fix every report in money code.
2. If `golangci-lint` is configured, run `golangci-lint run ./...` and add a `forbidigo` rule (linter name `forbidigo`) forbidding `^decimal\.NewFromFloat` and `^strconv\.ParseFloat` in the money and billing packages. Check the forbidigo pattern syntax in the golangci-lint docs for your version.
3. Run `go test -race ./...` once to catch shared mutable state in money code.

### Output
`go_money_module`.

### Quality Gate
- `go vet ./...` prints nothing and exits 0.
- `go test -race ./...` exits 0.

---

## Worked Example

Illustrative only.
```
$ go doc github.com/shopspring/decimal Decimal.RoundBank
func (d Decimal) RoundBank(places int32) Decimal
$ go test ./money/...
ok   example.com/shop/money  0.012s
$ go test -race ./...
ok   example.com/shop/billing  1.204s
```
Phase 2 output lists `billing/invoice.go:57` changed from `rows.Scan(&total)` with `total float64` to `total decimal.Decimal`.

---

## Exit Criteria

DONE when money is `int64` minor units with overflow checks, decimal math uses shopspring with an explicit rounding method, no float scans or parses remain on money, and `go vet`, `go test` and `go test -race` pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | shopspring version lacks a rounding method | **Adjust**: upgrade with `go get github.com/shopspring/decimal@latest` after user approval, or implement the mode with `Truncate` and sign checks plus tests. |
| Phase 2 | pgx adapter module not allowed | **Adjust**: scan numeric as `string` and parse with `decimal.NewFromString`. |
| Phase 3 | `go test -race` reports a race in money code | **Stop**: fix the shared state before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
