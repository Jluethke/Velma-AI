# GraphQL Error Codes and Extensions

**One-line description:** Defines a closed catalog of `extensions.code` values, throws them with the exact API of each stack, masks unexpected errors so stack traces and SQL never reach clients, and tests the response shape of each code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validation_code` (string[], required): Validator and resolver paths from `gql-input-validation-rules`, whose errors must use the catalog.
- `project_dir` (string, required): Server root.
- `stack` (string, required): `apollo`, `yoga`, `python` or `go`.

---

## Outputs

- `error_code_catalog` (object[]): Each code, meaning, who should act (client fixes request, user re-authenticates, retry later, bug), and HTTP status if any.
- `error_presenter_code` (string[]): Paths of the error formatting or masking configuration.

---

## Phase 1: Write the Catalog

### Entry Criteria
- The project throws errors from resolvers today (grep `throw`, `raise`, `return nil, err`).

### Actions
1. Start from these codes; Apollo Server defines the first group in `ApolloServerErrorCode` (`@apollo/server/errors`), and using the same strings on every stack keeps clients uniform:

| Code | Source | Meaning |
|---|---|---|
| `GRAPHQL_PARSE_FAILED` | server | syntax error in the document |
| `GRAPHQL_VALIDATION_FAILED` | server | document invalid against schema |
| `BAD_USER_INPUT` | your code | argument value rejected |
| `PERSISTED_QUERY_NOT_FOUND` | server | hash not registered |
| `INTERNAL_SERVER_ERROR` | server | unexpected failure (masked) |
| `UNAUTHENTICATED` | your code | no or invalid credentials |
| `FORBIDDEN` | your code | authenticated but not allowed |
| `NOT_FOUND` | your code | only when the field is non-null and absence is an error; nullable lookups return `null` instead |

2. Add product codes only when a client must branch on them (for example `ORDER_ALREADY_SHIPPED`). Each needs a row with "who acts".
3. List every current throw site: `grep -rn "GraphQLError\|throw new\|raise \|gqlerror" src app graph 2>/dev/null`. Assign each site a code from the catalog.

### Output
`error_code_catalog` and a site-to-code mapping.

### Quality Gate
- Every throw site found by the grep has a code from the catalog.

---

## Phase 2: Throw and Mask per Stack

### Entry Criteria
- Catalog complete.

### Actions
1. Throw expected errors with the exact API:

| `stack` | Expected error |
|---|---|
| `apollo` | `throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })` (import from `graphql`) |
| `yoga` | same `GraphQLError`; Yoga passes `GraphQLError` through unmasked |
| `python` | `raise GraphQLError("Forbidden", extensions={"code": "FORBIDDEN"})` (from `graphql`) |
| `go` | `return nil, &gqlerror.Error{Message: "Forbidden", Extensions: map[string]interface{}{"code": "FORBIDDEN"}}` (`github.com/vektah/gqlparser/v2/gqlerror`); or `graphql.AddError(ctx, err)` to add without failing the field |

2. Mask unexpected errors:

| `stack` | Masking |
|---|---|
| `apollo` | `new ApolloServer({ formatError: (formatted, error) => { const orig = unwrapResolverError(error); if (!(orig instanceof GraphQLError)) { log(orig); return { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }; } return formatted; } })`; stack traces are included in `extensions.stacktrace` unless `NODE_ENV` is `production` or `test` or `includeStacktraceInErrorResponses: false` is set; set it to `false` explicitly |
| `yoga` | masking is on by default (`maskedErrors: true`, message `Unexpected error.`); customize with `maskedErrors: { maskError(error, message, isDev) { ... } }` |
| `python` | add `strawberry.extensions.MaskErrors()` to `extensions=[...]`; pass `should_mask_error=lambda e: not isinstance(e.original_error, ExpectedError)` so your expected errors stay visible |
| `go` | `srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error { var g *gqlerror.Error; if errors.As(e, &g) { return graphql.DefaultErrorPresenter(ctx, e) }; log(e); return &gqlerror.Error{Message: "internal server error", Path: graphql.GetPath(ctx), Extensions: map[string]interface{}{"code": "INTERNAL_SERVER_ERROR"}} })` and `srv.SetRecoverFunc(...)` to turn panics into that error |

3. Log the original error with the request id server-side before masking; masking without logging hides bugs.
4. Change one throw site at a time to its catalog code; rebuild after each file.

### Output
`error_presenter_code`.

### Quality Gate
- Build passes (`npx tsc --noEmit`, `python -c "import app.schema"`, `go build ./...`).
- With the server in production settings, a curl that triggers an unexpected error piped to `grep -c stacktrace` prints `0`.

---

## Phase 3: Test the Shapes

### Entry Criteria
- Masking configured.

### Actions
1. For each catalog code your code throws, write one test that triggers it and asserts `errors[0].extensions.code` equals the code and `errors[0].path` names the field.
2. Write one test where a resolver throws a plain error containing a secret string (for example `"db password=xyz"`) and assert the response message does not contain it and the code is `INTERNAL_SERVER_ERROR`.
3. Assert partial data still arrives: a failing nullable field returns `null` while siblings return data.
4. Run the suite with production settings (`NODE_ENV=production` for Node).

### Output
`error_code_catalog`, `error_presenter_code`.

### Quality Gate
- All code tests pass; the secret-string test passes.
- Test run exits 0.

---

## Worked Example

Illustrative only. `stack = apollo`.

Before: a database error returned
```json
{"errors":[{"message":"relation \"ordrs\" does not exist","extensions":{"code":"INTERNAL_SERVER_ERROR","stacktrace":["error: relation ..."]}}]}
```
After Phase 2 with `formatError` and `includeStacktraceInErrorResponses: false`:
```json
{"errors":[{"message":"Internal server error","extensions":{"code":"INTERNAL_SERVER_ERROR"}}],"data":{"viewer":null}}
```
Server log: `ERROR req=7f3a relation "ordrs" does not exist`. Tests: `6 passed`.

---

## Exit Criteria

DONE when every throw site uses a catalog code, unexpected errors are masked and logged, and each code has a passing shape test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Client asks for a code per message | **Adjust**: add a code only when a client branches on it; others share a generic code. |
| Phase 2 | Expected errors also get masked | **Adjust**: exclude `GraphQLError` (or your expected error class) in the mask predicate. |
| Phase 3 | Secret text appears in response | **Stop**: masking is not applied on that path; fix before shipping. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
