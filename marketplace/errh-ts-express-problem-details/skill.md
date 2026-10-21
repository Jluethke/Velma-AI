# Express Problem Details Middleware

**One-line description:** Installs one Express error-handling middleware (four arguments, registered last) and a 404 fallback that map `AppError` subclasses, body-parser errors and unknown errors to RFC 9457 `application/problem+json`, relying on Express 5's automatic forwarding of rejected promises (or a wrapper on Express 4), with a Fastify equivalent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root.
- `ts_error_changes` (object, required): From `errh-ts-result-and-error-cause`, or a list of error classes if run standalone.
- `problem_type_registry` (object[], required): From `errh-rfc9457-problem-type-registry`.
- `message_catalog` (object, required): From `errh-user-message-catalog`.
- `test_command` (string, required): Exact test command.

---

## Outputs

- `ts_http_error_mapping` (object): `{ express_major, middleware_file, class_to_problem, async_forwarding, fallback_404 }`.

---

## Phase 1: Check Version and Async Forwarding

### Entry Criteria
- `npm ls express` (or `pnpm why express`) shows the installed version.

### Actions
1. Decide forwarding:

| Express major | Rejected promise in an `async` handler | Action |
|---|---|---|
| 5 | forwarded to error middleware automatically | none |
| 4 | not forwarded; becomes an unhandled rejection | wrap handlers: `const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);` or upgrade (owner decision) |

2. Build the mapping table: each `AppError` subclass `taxonomyClass` to a registry row. Add:
   - body-parser JSON syntax error: `err.type === "entity.parse.failed"` with `err.status === 400` gives the validation problem with status 400.
   - body too large: `err.type === "entity.too.large"` (413).
   - errors with a numeric `status` or `statusCode` from `http-errors`: `about:blank` with that status when it is 4xx; treat 5xx as internal.
   - everything else: 500 `about:blank`.

### Output
Forwarding decision and mapping.

### Quality Gate
- Express major version recorded from `npm ls`, not from `package.json` ranges.

---

## Phase 2: Implement

### Entry Criteria
- Mapping fixed.

### Actions
1. `src/http/problem.ts`:
```ts
import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (req, _res, next) =>
  next(new NotFoundError(`route ${req.method} ${req.path}`));

export const problemHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err); // Express default handler closes the connection
  const p = toProblem(err, req);         // the Phase 1 table
  if (p.status >= 500) req.log?.error({ err }, "request failed"); // log once
  res.status(p.status).type("application/problem+json").json(p);
};
```
2. `res.json` keeps a `Content-Type` already set, so call `.type("application/problem+json")` before `.json(...)`.
3. Register order in `app.ts`: routes, then `app.use(notFound)`, then `app.use(problemHandler)` last. Express identifies error middleware by its four parameters; do not remove the unused `next` parameter.
4. Set `Retry-After` for 429 and 503 when known, `WWW-Authenticate` for 401.
5. Fastify instead of Express: `fastify.setErrorHandler((err, req, reply) => reply.code(p.status).type("application/problem+json").send(p))` and `fastify.setNotFoundHandler(...)`; Fastify schema validation errors have `err.validation`. Check the Fastify docs for your major version.
6. Run `test_command`.

### Output
Middleware wired.

### Quality Gate
- `rg -n "app\.use\(problemHandler\)" src` shows the handler registered after every router `app.use`.
- `test_command` passes.

---

## Phase 3: Probe with supertest

### Entry Criteria
- Wired.

### Actions
1. One test per mapping row:
```ts
import request from "supertest";
it("maps NotFoundError", async () => {
  const res = await request(app).get("/invoices/9999");
  expect(res.status).toBe(404);
  expect(res.headers["content-type"]).toMatch(/^application\/problem\+json/);
  const { trace_id, instance, ...body } = res.body;
  expect(body).toEqual(fixture("not-found"));
});
```
   supertest parses `+json` bodies into `res.body`; if `res.body` is empty, parse `res.text` with `JSON.parse`.
2. Malformed JSON: `request(app).post("/orders").set("content-type", "application/json").send("{")` returns 400 problem.
3. Unknown error: a test-only route throwing `new Error("x")` returns 500 with no stack in the body (`expect(res.text).not.toMatch(/at .*\.(ts|js):\d+/)`).

### Output
`ts_http_error_mapping`.

### Quality Gate
- All supertest cases pass; one per mapping row plus malformed JSON, unknown route and unknown error.
- No response body contains a stack frame pattern.

---

## Worked Example

Illustrative. Express 5.1.
```
$ curl -si localhost:3000/orders -H 'content-type: application/json' -d '{'
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://api.shop.example/problems/validation-error","title":"Your request is not valid.","status":400,"detail":"The request body is not valid JSON.","trace_id":"..."}
```
Before: Express's default handler returned an HTML page with the stack trace when `NODE_ENV` was not `production`.

---

## Exit Criteria

DONE when every thrown error, body-parser error and unknown route returns an RFC 9457 body matching the registry, verified by supertest, with async errors forwarded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Express 4 with many async handlers | **Adjust**: wrap handlers per router file, one file per step; tests after each. |
| Phase 2 | Middleware never runs | **Retry**: it has fewer than four parameters or is registered before the routes. |
| Phase 2 | Content type shows `application/json` | **Retry**: `.type(...)` must come before `.json(...)`. |
| Phase 3 | Test hangs | **Adjust**: a handler neither responds nor calls `next`; find it with the route under test and fix the missing `next(err)`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
