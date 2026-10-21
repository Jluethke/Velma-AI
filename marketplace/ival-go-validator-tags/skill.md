# Go Request Validation With go-playground/validator

**One-line description:** Decodes every Go HTTP request body with a size cap, `DisallowUnknownFields` and a trailing-data check, then validates the struct with `go-playground/validator/v10` tags (`required`, `min`, `max`, `oneof`, `dive`), returns 400 with field paths only, and proves rejection with table-driven `httptest` tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Go module root (contains `go.mod`).
- `entry_point_inventory` (object[], required): Output of `ival-entry-point-inventory`.
- `field_rules` (object[], optional): Per-field limits from the product owner, including the request body byte cap. Fields without a rule get limits from Phase 1 sources or become open questions.

---

## Outputs

- `go_validator_changes` (object): `decode_helper` (file path), `structs` (file and type per entry point), `open_questions`, `test_run` (the `go test` output summary).

---

## Phase 1: Install and Derive Field Contracts

### Entry Criteria
- `go version` prints a toolchain; `go build ./...` exits 0 before any change.

### Actions
1. `go get github.com/go-playground/validator/v10@latest`, then `go list -m github.com/go-playground/validator/v10` and record the version.
2. If the router is Gin: Gin already uses this library through the `binding:"..."` tag and `c.ShouldBindJSON`. Use `binding` tags instead of `validate` tags and skip the custom decoder in Phase 2 step 1, but still add `DisallowUnknownFields` (Gin: `gin.EnableJsonDecoderDisallowUnknownFields()` at startup) and the body cap.
3. Derive each field's bound in this order and stop at the first source: `field_rules`; the database column (`rg -n "varchar\(|VARCHAR\(" migrations/`); a named standard (cite it); an enumerated set in code. Otherwise record an open question. Do NOT make up limits, including the body byte cap.

### Output
Field contract table and body cap value with its source.

### Quality Gate
- `go list -m github.com/go-playground/validator/v10` prints a version.
- Every field has a bound source or an `open_questions` row; the body cap has a source.

---

## Phase 2: Decode Helper and Tagged Structs

### Entry Criteria
- Contracts exist.

### Actions
1. Create `internal/httpx/decode.go`:

```go
package httpx

import (
    "encoding/json"
    "errors"
    "io"
    "net/http"

    "github.com/go-playground/validator/v10"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

// DecodeJSON reads at most maxBytes, rejects unknown fields and trailing data, then validates.
func DecodeJSON(w http.ResponseWriter, r *http.Request, maxBytes int64, dst any) error {
    r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields()
    if err := dec.Decode(dst); err != nil {
        return err
    }
    if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
        return errors.New("body must contain a single JSON object")
    }
    return validate.Struct(dst)
}
```

   Why each line exists:
   - `http.MaxBytesReader` stops reading after `maxBytes`; the decode error is `*http.MaxBytesError` (Go 1.19 and later), which you map to 413.
   - `DisallowUnknownFields` makes `{"is_admin":true}` an error instead of being ignored.
   - The second `Decode` catches `{"a":1}{"b":2}` and trailing garbage, which a single `Decode` accepts.
   - `WithRequiredStructEnabled` makes `required` work on nested struct fields (opt-in since v10.15; it becomes the default in v11).
2. Tag the struct:

```go
type CreateOrder struct {
    SKU      string   `json:"sku"      validate:"required,min=1,max=64,alphanumunicode"`
    Quantity int      `json:"quantity" validate:"required,min=1,max=999"`
    Currency string   `json:"currency" validate:"required,oneof=USD EUR"`
    Tags     []string `json:"tags"     validate:"max=10,dive,min=1,max=32"`
}
```
   - `oneof` values are space separated.
   - `dive` applies the tags after it to each slice element; tags before `dive` apply to the slice itself.
   - `required` on an `int` fails for `0`. If `0` is valid, use a pointer (`*int`) with `required` so missing and zero are distinct.
   - For strings, `min` and `max` count runes, not bytes.
3. Handler error mapping:

| Error | Status | Body |
|---|---|---|
| `*http.MaxBytesError` (check with `errors.As`) | 413 | `{"error":"body too large"}` |
| `*json.SyntaxError`, `*json.UnmarshalTypeError`, unknown field (message starts with `json: unknown field`) | 400 | `{"error":"malformed body"}` |
| `validator.ValidationErrors` | 400 | one entry per `fe.Namespace()` and `fe.Tag()`; never `fe.Value()` |

4. Convert one handler at a time; run `go test ./...` after each.

### Output
Helper, tagged structs, converted handlers.

### Quality Gate
- `go vet ./...` exits 0.
- `rg -n "json\.NewDecoder\(r\.Body\)" --type go` prints only `internal/httpx/decode.go`.

---

## Phase 3: Table-Driven Rejection Tests

### Entry Criteria
- Handlers converted.

### Actions
1. Write `internal/orders/handler_test.go`:

```go
func TestCreateOrderRejects(t *testing.T) {
    cases := []struct{ name, body string; want int }{
        {"unknown field", `{"sku":"A1","quantity":1,"currency":"USD","is_admin":true}`, 400},
        {"trailing data", `{"sku":"A1","quantity":1,"currency":"USD"}{}`, 400},
        {"wrong type", `{"sku":"A1","quantity":"1","currency":"USD"}`, 400},
        {"quantity zero", `{"sku":"A1","quantity":0,"currency":"USD"}`, 400},
        {"bad currency", `{"sku":"A1","quantity":1,"currency":"BTC"}`, 400},
        {"too large", `{"sku":"` + strings.Repeat("A", int(maxBody)) + `"}`, 413},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            rec := httptest.NewRecorder()
            req := httptest.NewRequest(http.MethodPost, "/orders", strings.NewReader(tc.body))
            CreateOrderHandler(rec, req)
            if rec.Code != tc.want { t.Fatalf("got %d want %d", rec.Code, tc.want) }
        })
    }
}
```
2. Run `go test ./internal/... -run Reject -v` and record the PASS lines.
3. Mutation check: comment out `dec.DisallowUnknownFields()`, rerun, confirm `unknown field` fails, restore, rerun green.

### Output
`go_validator_changes`.

### Quality Gate
- `go test ./...` ends with `ok` for every package and no `FAIL` line.
- Mutation run prints `--- FAIL: TestCreateOrderRejects/unknown_field`; restored run passes.

---

## Worked Example

Illustrative. chi router; `POST /orders` (EP-001). `field_rules` gives body cap 65536 bytes and quantity 1 to 999.

Phase 3:
```
$ go test ./internal/orders -run Reject -v
=== RUN   TestCreateOrderRejects/unknown_field
=== RUN   TestCreateOrderRejects/trailing_data
...
--- PASS: TestCreateOrderRejects (0.00s)
ok   example.com/shop/internal/orders  0.012s
```

---

## Exit Criteria

DONE when every Go JSON entry point decodes through the capped, strict helper, validates with tags, maps errors to 400 or 413 without echoing values, and the table test passes and fails under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Module uses `gopkg.in/go-playground/validator.v9` | **Adjust**: keep v9 for this change if upgrading touches unrelated code; tag syntax is the same; record the upgrade as follow-up. |
| Phase 2 | A client sends extra fields | **Return**: list fields and clients; do not remove `DisallowUnknownFields`. |
| Phase 2 | Tag typo panics at first validation (`Undefined validation function`) | **Adjust**: fix the tag; check the tag list in the package README. |
| Phase 3 | A case fails | **Adjust** the handler or struct; never delete the case. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
