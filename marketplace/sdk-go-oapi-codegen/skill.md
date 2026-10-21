# SDK Go oapi-codegen Client

**One-line description:** Generates a Go client and models with oapi-codegen v2 from a checked-in config file and a `go:generate` directive pinned through the Go tool mechanism, wires a request editor for auth, and proves the package builds, vets and decodes one typed response.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): Path to the validated spec.
- `generation_plan` (object, required): Output of `sdk-generator-decision`; generator must be oapi-codegen.
- `type_mapping` (object, required): Output of `sdk-model-type-mapping`; decides output options such as `nullable-type`.
- `project_dir` (string, required): Go module root (contains `go.mod`).

---

## Outputs

- `go_client_package` (object): Package path, generated file, config file, pinned oapi-codegen version, and results of `go build`, `go vet` and the decode test.

---

## Phase 1: Pin and Configure

### Entry Criteria
- `go version` prints 1.22 or later; Action 1 uses the `tool` directive, which needs Go 1.24 or later.

### Actions
1. Pin the generator:
   - Go 1.24 or later: `go get -tool github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@<version>`. This adds a `tool` line to `go.mod`; run it as `go tool oapi-codegen`.
   - Older Go: create `tools/tools.go` with `//go:build tools` and a blank import of `github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen`, then `go get` that path at the pinned version and run it with `go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen`.
2. Create `acme/oapi-codegen.yaml`:
   ```yaml
   package: acme
   output: acme.gen.go
   generate:
     models: true
     client: true
   ```
   Add `output-options` keys (for example `nullable-type: true`) only after confirming the key in the oapi-codegen configuration schema in its repository for the pinned version.
3. Create `acme/generate.go`:
   ```go
   package acme

   //go:generate go tool oapi-codegen -config oapi-codegen.yaml ../api/openapi.yaml
   ```

### Output
Pinned tool, config, `go:generate` directive.

### Quality Gate
- `go.mod` contains the oapi-codegen module at an exact version (`grep oapi-codegen go.mod`).
- `go tool oapi-codegen --version` (or the `go run` form) prints that version.

---

## Phase 2: Generate and Build

### Entry Criteria
- Config exists.

### Actions
1. Run `go generate ./acme/...`.
2. Run `go mod tidy` to add runtime dependencies the generated code imports (commonly `github.com/oapi-codegen/runtime`).
3. Run `go build ./...` and `go vet ./...`.
4. Read the generated API surface: `go doc ./acme | head -60`. Expect `func NewClient(server string, opts ...ClientOption) (*Client, error)`, `func NewClientWithResponses(...)`, `WithHTTPClient`, `WithRequestEditorFn`, and per-operation methods such as `GetUserWithResponse(ctx, id, reqEditors...)` returning a `*GetUserResponse` with `JSON200 *User` and `HTTPResponse *http.Response` fields.
5. Do NOT edit `acme.gen.go`. Handwritten code goes in other files of the same package (for example `acme/auth.go`).

### Output
`acme/acme.gen.go`.

### Quality Gate
- `go build ./...` and `go vet ./...` both exit 0.
- `head -5 acme/acme.gen.go` shows the `Code generated ... DO NOT EDIT.` header.

---

## Phase 3: Wire Auth and Prove Decoding

### Entry Criteria
- Package builds.

### Actions
1. Add `acme/auth.go`:
   ```go
   func WithAPIKey(key string) ClientOption {
       return WithRequestEditorFn(func(ctx context.Context, req *http.Request) error {
           req.Header.Set("X-API-Key", key)
           return nil
       })
   }
   ```
   Use the header name from `api_inventory.auth_schemes`.
2. Always pass an `*http.Client` with a timeout through `WithHTTPClient`; the generated default uses `&http.Client{}`, which has no timeout. The `sdk-go-timeouts` flow sets the values.
3. Write `acme/decode_test.go` with `httptest.NewServer` returning one JSON body for `GET /v1/users/u_1`, call `NewClientWithResponses(srv.URL, WithAPIKey("k"))`, then `GetUserWithResponse`, and assert `resp.StatusCode() == 200`, `resp.JSON200 != nil`, the `created_at` field parsed into a non-zero `time.Time`, and the server saw the `X-API-Key` header.
4. Run `go test ./acme/... -race -count=1`.
5. Check unknown enum handling: return an enum value not in the spec. oapi-codegen string enums are named string types, so decoding succeeds; record whether your code validates them with the generated `Valid()` method, if present in the pinned version.

### Output
`go_client_package`.

### Quality Gate
- `go test ./acme/... -race -count=1` exits 0 and prints `ok`.
- The test asserts the header the server received (grep the test for `r.Header.Get(`).

---

## Worked Example

Illustrative only. Module `github.com/example/acme-go`, spec 3.0.3.

```
$ go get -tool github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.x.y
$ go generate ./acme/... && go mod tidy && go build ./... && go vet ./...
$ go doc ./acme | grep -E "^func New"
func NewClient(server string, opts ...ClientOption) (*Client, error)
func NewClientWithResponses(server string, opts ...ClientOption) (*ClientWithResponses, error)
$ go test ./acme/... -race -count=1
ok  	github.com/example/acme-go/acme	1.12s
```

---

## Exit Criteria

DONE when the client is generated from a pinned oapi-codegen, builds and vets, auth is attached through a request editor in a handwritten file, and a test proves typed decoding and header delivery.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Go older than 1.24 | **Adjust**: use the `tools.go` pattern in Action 1. |
| Phase 2 | Generator rejects the spec (often 3.1 constructs) | **Return**: send to `sdk-generator-decision` with the error; consider `hybrid`. |
| Phase 2 | `go build` fails in generated code | **Stop**: record the schema that produced it; do not patch generated code by hand. |
| Phase 3 | Test passes without asserting the header | **Adjust**: add the header assertion; a test that cannot fail is not evidence. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
