# Resolver and Operation Tests (Node, Apollo or Yoga)

**One-line description:** Tests resolvers in-process with Vitest: unit tests that call resolver functions with a fake context, and full-operation tests through `server.executeOperation` (Apollo) or `yoga.fetch` (Yoga) for every client operation, asserting data shape and error codes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Client operations; each gets at least one full-operation test.
- `project_dir` (string, required): Node server root.
- `error_code_catalog` (object[], required): Codes from `gql-error-extensions`; tests assert codes from this list.

---

## Outputs

- `operation_test_suite` (string): Path to the test directory.
- `test_run_log` (string): Output of the passing test run with the test count.

---

## Phase 1: Test Harness

### Entry Criteria
- Server code exports the schema pieces (`typeDefs`, `resolvers`) and a context factory separately from the listening entry, so tests can build a server without opening a port.

### Actions
1. `npm i -D vitest`. Add `"test": "vitest run"` to `package.json`.
2. If `src/server.ts` both builds and starts the server, split it: `src/app.ts` exports `buildServer()` (Apollo) or `buildYoga()` (Yoga); `src/server.ts` only calls listen. Change only these two files in this step.
3. Create a test database or an in-memory fake implementing the same `Db` interface the context uses. Seed it per test in `beforeEach`.
4. Write a helper:
   - Apollo:
```ts
export async function run(query: string, variables = {}, ctx: Partial<Context> = {}) {
  const res = await server.executeOperation({ query, variables }, { contextValue: { ...baseCtx(), ...ctx } });
  if (res.body.kind !== 'single') throw new Error('unexpected incremental response');
  return res.body.singleResult;
}
```
   - Yoga:
```ts
export async function run(query: string, variables = {}, headers: Record<string, string> = {}) {
  const res = await yoga.fetch('http://test/graphql', { method: 'POST',
    headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ query, variables }) });
  return res.json();
}
```
`executeOperation` skips HTTP but runs the full parse, validate, execute pipeline and plugins; `yoga.fetch` runs the full HTTP handling in-process.

### Output
Harness and helper.

### Quality Gate
- A test running `{ __typename }` passes: `npx vitest run -t typename` prints `1 passed`.

---

## Phase 2: Write Tests

### Entry Criteria
- Harness works.

### Actions
1. Full-operation tests: for each file in `operation_documents`, load the text with `readFileSync`, run it with realistic variables, and assert: `errors` is undefined, and `data` matches an inline snapshot or explicit fields. Prefer explicit `expect(data.viewer.orders.edges).toHaveLength(2)` over large snapshots.
2. Error tests: for each code in `error_code_catalog` your resolvers produce, one test that triggers it and asserts `errors[0].extensions.code`.
3. Unit tests for resolvers with branching logic: call the function directly, for example `resolvers.Order.total(row, {}, ctx, {} as any)`, and assert the mapped value. Unit tests may use `{} as any` for `info` only, never for the context.
4. Write tests one file at a time and run them after each file.
5. Do NOT mock the resolver under test. Mock only external services (payment API, email) at their client boundary.

### Output
Test files.

### Quality Gate
- Every file in `operation_documents` is referenced by at least one test (`grep -l` per operation name in the test directory finds a match).

---

## Phase 3: Run and Record

### Entry Criteria
- Tests written.

### Actions
1. Run `npx vitest run --reporter=verbose`. Save output to `test_run_log`.
2. If a test fails, read the assertion diff. Decide with this table:

| Failure | Action |
|---|---|
| Resolver returns wrong value | fix the resolver |
| Test expectation contradicts the schema or use case | fix the test and record why |
| Flaky (passes on rerun) | find shared state between tests (seed, module-level cache); fix isolation |

3. Never delete a failing test, add `.skip`, or loosen an assertion to `toBeDefined()` to get green.
4. Add the test command to CI.

### Output
`operation_test_suite`, `test_run_log`.

### Quality Gate
- `npx vitest run` exits 0.
- `grep -rn "\.skip\|\.only" <test dir>` prints nothing.

---

## Worked Example

Illustrative only. Apollo.

```ts
it('CustomerOrders returns the first page', async () => {
  const q = readFileSync('operations/CustomerOrders.graphql', 'utf8');
  const r = await run(q, { first: 2 }, { user: alice });
  expect(r.errors).toBeUndefined();
  expect(r.data?.viewer.orders.edges.map((e: any) => e.node.number)).toEqual(['A-1002', 'A-1001']);
  expect(r.data?.viewer.orders.pageInfo.hasNextPage).toBe(true);
});
```
Run:
```
 ✓ test/operations.test.ts (6)
 ✓ test/errors.test.ts (4)
 Test Files  2 passed (2)
      Tests  10 passed (10)
```

---

## Exit Criteria

DONE when every client operation and every produced error code has a passing in-process test, with no skips, and the suite runs in CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `executeOperation` returns `kind: 'incremental'` | **Adjust**: the operation uses `@defer`/`@stream`; read `initialResult` and subsequent results, or test without them. |
| Phase 2 | Tests depend on run order | **Adjust**: reseed in `beforeEach`; never rely on data from another test. |
| Phase 3 | Tempted to update snapshots blindly (`-u`) | **Stop**: read each snapshot diff; update only when the change is intended. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
