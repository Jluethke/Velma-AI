# TypeScript Failure-Path Tests with Vitest or Jest

**One-line description:** Writes Vitest or Jest tests that inject failures with `mockRejectedValueOnce`, assert rejections with `rejects.toBeInstanceOf` and `cause`, check `Result` values, verify retry counts under fake timers, check HTTP problem responses with supertest and count boundary log calls, then prove each test live by breaking the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root.
- `ts_error_changes` (object, required): From `errh-ts-result-and-error-cause`.
- `ts_http_error_mapping` (object, required): From `errh-ts-express-problem-details`.
- `retry_policy_table` (object[], required): From `errh-retryability-table`.
- `test_command` (string, required): Exact test command.

---

## Outputs

- `ts_failure_tests` (object): `{ runner, test_files, cases, mutation_checks, final_summary }`.

---

## Phase 1: Pick the Runner API

### Entry Criteria
- Runner identified from `package.json` (`vitest` or `jest`).

### Actions
1. Use only the API of the installed runner:

| Need | Vitest | Jest |
|---|---|---|
| spy | `vi.spyOn(obj, "m")` | `jest.spyOn(obj, "m")` |
| fail once | `.mockRejectedValueOnce(err)` | same |
| fake timers | `vi.useFakeTimers()` then `await vi.runAllTimersAsync()` | `jest.useFakeTimers()` then `await jest.runAllTimersAsync()` (Jest 29.5+) |
| restore | `vi.restoreAllMocks()` | `jest.restoreAllMocks()` |

2. Always `await` the `expect(...).rejects` assertion. A missing `await` makes the test pass before the assertion runs.

### Output
Runner API table for this repo.

### Quality Gate
- Runner name and version recorded from `npm ls vitest` or `npm ls jest`.

---

## Phase 2: Write Cases

### Entry Criteria
- Runner known.

### Actions
1. Wrap with cause:
```ts
it("wraps fetch failure with cause", async () => {
  const boom = new TypeError("fetch failed");
  vi.spyOn(http, "get").mockRejectedValueOnce(boom);
  const p = getRates("EUR");
  await expect(p).rejects.toBeInstanceOf(DependencyUnavailableError);
  await expect(p).rejects.toMatchObject({ message: "fetch rates EUR", cause: boom });
});
```
2. Result:
```ts
const r = await findInvoice(9999);
expect(r.ok).toBe(false);
if (!r.ok) expect(r.error).toBeInstanceOf(NotFoundError);
```
3. Retry: spy fails `n - 1` times then resolves; with fake timers, start the call, `await vi.runAllTimersAsync()`, then assert `spy` was called `n` times. `n` is `max_attempts` from `retry_policy_table`; if `OPEN`, use `it.todo("retry count: max_attempts OPEN")` and list it.
4. Permanent error: spy rejects with a non-retryable class once; assert one call and that `p-retry` (if used) stopped because the code threw `AbortError`.
5. HTTP: reuse the supertest cases from `errh-ts-express-problem-details`.
6. Log once: inject a logger stub into the app (`const log = { error: vi.fn(), ... }`), trigger a 500, assert `expect(log.error).toHaveBeenCalledTimes(1)`.
7. Unhandled rejection guard: Vitest reports unhandled rejections as errors by default; do not turn that off (`dangerouslyIgnoreUnhandledErrors`). For Jest, confirm no "UnhandledPromiseRejection" lines in output.
8. Run `test_command`.

### Output
Tests.

### Quality Gate
- `test_command` passes and the new test count is visible in the summary.
- `rg -n "\.(skip|only)\(" <new files>` returns nothing.
- `rg -n "expect\([^)]*\)\.rejects" <new files>` lines all start with `await` (check with `rg -n "^\s*expect\([^)]*\)\.rejects" <new files>` returning nothing).

---

## Phase 3: Prove Tests Are Live

### Entry Criteria
- Tests pass.

### Actions
1. Break, run the single test (`npx vitest run <file> -t "<name>"` or `npx jest <file> -t "<name>"`), confirm failure, restore with `git checkout -- <file>`:
   - cause case: drop `{ cause: e }`.
   - Result case: return `ok(undefined)` instead of `err(...)`.
   - HTTP case: remove one branch in `toProblem`.
   - log case: add a second `log.error`.
2. `git status --porcelain` shows only intended files.

### Output
`ts_failure_tests`.

### Quality Gate
- Every case has `failed_as_expected: true`.
- Final `test_command` passes; summary recorded.

---

## Worked Example

Illustrative. Vitest 3.
```
$ npx vitest run src/rates.test.ts
 ✓ src/rates.test.ts (3 tests) 12ms
# break: remove { cause: e } in src/rates.ts
$ npx vitest run src/rates.test.ts -t "wraps fetch failure"
 × wraps fetch failure with cause
   AssertionError: expected error to match object { cause: TypeError: fetch failed }
$ git checkout -- src/rates.ts
```

---

## Exit Criteria

DONE when every error class, Result path, retry path and HTTP mapping has a passing test with awaited rejection assertions, and each test failed under its break.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Fake timers stall an `await` | **Adjust**: use the async timer runners (`runAllTimersAsync`), not the sync ones. |
| Phase 2 | ESM module cannot be spied | **Adjust**: use `vi.mock("./http", ...)` module mocking, or inject the dependency. |
| Phase 3 | Test passes after the break | **Stop**: the assertion is missing an `await` or too loose; fix before continuing. |
| Phase 3 | Restore incomplete | **Retry**: `git diff` and `git checkout -- <file>`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
