# TDD Outside-In or Inside-Out Choice

**One-line description:** Decides with an explicit rule table whether a feature is built outside-in (London school, double loop, starting from a failing acceptance test at the system boundary) or inside-out (classicist, starting from the leaf logic), and for outside-in writes the acceptance test and lists the collaborators it reveals.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `behavior_list` (object[], required): Ordered behaviors from `tdd-behavior-list`.
- `project_dir` (string, required): Project root, used to find existing entry points (HTTP routes, CLI commands, public API modules).
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `tdd_direction` (string): `outside-in` or `inside-out`, with the table row that decided it.
- `acceptance_test` (object): For outside-in: file path, test name, the command that runs it, and its current failure message. For inside-out: empty object.
- `collaborators` (object[]): Each dependency the unit under test talks to: name, role (query, command, stateful store, clock, random source, filesystem, environment, HTTP API), and whether the project owns its code.

---

## Phase 1: Decide the Direction

### Entry Criteria
- `behavior_list` has at least one row.

### Actions
1. Search `project_dir` for an existing entry point that the first behaviors would go through: route declarations (`@app.get`, `router.get(`, `http.HandleFunc(`, `#[get(`, `@GetMapping`), CLI parsers (`argparse`, `commander`, `cobra`, `clap`, `picocli`), or an exported package API.
2. Apply the first matching row:

| # | Condition | Direction |
|---|---|---|
| 1 | The behaviors are pure computation (input to output, no I/O): parsing, pricing math, validation, algorithms | inside-out |
| 2 | The feature is a new endpoint, command or use case that coordinates several parts, and the parts do not exist yet | outside-in |
| 3 | An entry point exists and the behavior changes what it returns or stores | outside-in |
| 4 | The team or codebase forbids mocking libraries | inside-out, then one end-to-end test at the end |
| 5 | None of the above | inside-out |

3. Record the row number in `tdd_direction`.

### Output
`tdd_direction`.

### Quality Gate
- `tdd_direction` names exactly one row number from the table.
- The entry point search results (file and line, or "none found") are recorded.

---

## Phase 2: Outside-In Acceptance Test (skip when inside-out)

### Entry Criteria
- `tdd_direction` is `outside-in`.

### Actions
1. Write ONE acceptance test for the simplest behavior (the S row) that drives the system through its real entry point with in-process tools:

| test_runner | Boundary tool |
|---|---|
| pytest / unittest | FastAPI `TestClient`, Flask `app.test_client()`, Django `django.test.Client`, or calling the CLI `main(argv)` function and capturing output with `capsys` |
| jest / vitest | `supertest` against the exported Express/Fastify app (do not call `listen`), or Fastify `app.inject()` |
| go-test | `httptest.NewRecorder()` + `handler.ServeHTTP(rec, req)`, or `httptest.NewServer(handler)` |
| cargo-test | integration test in `tests/` calling the public library API; for axum, `tower::ServiceExt::oneshot` on the router (check the axum docs for the version in `Cargo.lock`) |
| junit5 | Spring `MockMvc` with `@WebMvcTest` or `@SpringBootTest`, or calling the public facade class |

2. Assert only externally visible results: status code, response body fields, stored record read back through the public API, printed output.
3. Run it. It must fail. Record the failure message in `acceptance_test`. It stays failing until the inner loop finishes; do not mark it passing, skipped or expected-to-fail in the main suite. Keep it in a separate file (for example `tests/acceptance/`) and run it on demand with its own command.
4. Do NOT write production code in this phase.

### Output
`acceptance_test` with a recorded failure.

### Quality Gate
- Running the acceptance test command exits nonzero, and the failure is an assertion or a 404/not-found status, not a syntax or import error in the test file.
- The test touches the system only through the entry point found in Phase 1.

---

## Phase 3: List Collaborators

### Entry Criteria
- Direction decided (and acceptance test written when outside-in).

### Actions
1. For outside-in: write down each object the entry point must call to satisfy the acceptance test, one level down only (for example `OrderService` needs `OrderRepository`, `PaymentGateway`, `Clock`). Classify each role with this table:

| The collaborator... | Role |
|---|---|
| returns data and changes nothing | query |
| changes something outside (sends email, charges card, publishes event) | command |
| stores and returns state (repository, cache) | stateful store |
| returns the current time | clock |
| returns random values or ids | random source |
| reads or writes files | filesystem |
| reads environment variables or config | environment |
| calls a remote HTTP service | HTTP API |

2. For inside-out: list only the boundaries the leaf code touches (often none).
3. Mark `owned: false` for any collaborator whose code lives in a third-party package; these get an adapter in `tdd-test-double-choice`.
4. Emit `collaborators`.

### Output
`collaborators`.

### Quality Gate
- Every collaborator has exactly one role from the table and an `owned` value.
- No collaborator is listed that the acceptance test or behaviors do not need.

---

## Worked Example

Illustrative only. `test_runner` = `jest`, behaviors for "POST /orders creates an order and returns 201 with its id".

Phase 1: `src/app.ts` exports an Express app with `router.post('/carts', ...)` but no `/orders` route. Row 2 applies: `outside-in`.

Phase 2: `tests/acceptance/orders.test.ts`:

```ts
it('POST /orders returns 201 with an order id', async () => {
  const res = await request(app).post('/orders').send({ sku: 'A1', qty: 2 });
  expect(res.status).toBe(201);
  expect(res.body.id).toEqual(expect.any(String));
});
```

`npx jest tests/acceptance/orders.test.ts` fails with `Expected: 201, Received: 404`.

Phase 3: `collaborators` = OrderRepository (stateful store, owned), Clock (clock, owned), StripeClient (command, owned: false).

---

## Exit Criteria

DONE when the direction is chosen by a table row, an outside-in feature has one failing acceptance test at the real boundary, and every needed collaborator is listed with a role.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two rows seem to apply | **Adjust**: the first matching row wins; record why. |
| Phase 2 | Acceptance test fails on an import or compile error | **Retry**: fix the test file only until it fails on status or assertion. |
| Phase 2 | App cannot be created without a real database or network | **Return**: list the missing seam as a collaborator and continue to `tdd-test-double-choice`. |
| Phase 3 | A collaborator has two roles | **Adjust**: split it into two interfaces (for example reader and writer) and list both. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
