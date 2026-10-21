# Jest Async Wait Fix

**One-line description:** Fixes the async mistakes that make Jest tests flaky (unawaited `expect(...).resolves`, floating promises, `done` callbacks mixed with promises, fixed `setTimeout` delays, sync queries for async UI) using awaited assertions, `expect.assertions`, Testing Library `findBy` and `waitFor`, and the eslint rules that catch them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Suspect lines from the classifier.
- `flake_class` (string, required): Must be `timing` or `race`.
- `baseline_command` (string, required): Command that reproduces the flake.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_async_fix_diff` (string): Unified diff with a note per hunk.

---

## Phase 1: Find The Async Defects

### Entry Criteria
- `flake_class` is `timing` or `race`. Otherwise return an empty diff.

### Actions
1. Read the failure output for these Jest messages; each points at a defect:

| Message | Defect |
|---|---|
| `Cannot log after tests are done. Did you forget to wait for something async in your test?` | Work continues after the test returned: missing `await` or `return`. |
| `Exceeded timeout of 5000 ms for a test.` (5000 is Jest's default `testTimeout`) | A promise never resolves, or a `done` callback is never called. |
| `Warning: An update to X inside a test was not wrapped in act(...)` | React state update after the assertion; the test did not wait for it. |
| `Test functions cannot both take a 'done' callback and return something.` | `done` mixed with `async`. |
| Assertion passes even though the code is broken | `expect(promise).resolves.toBe(x)` without `await`: the assertion runs after the test ends. |

2. Grep the test file:
   `grep -n -E "\.resolves|\.rejects|setTimeout|new Promise|done\)|getBy|queryBy|waitFor|act\(" <test file>`
3. Run the lint rules that detect these, if eslint is configured: `npx eslint <test file> --rule '{"jest/valid-expect": ["error", {"alwaysAwait": true}], "jest/no-done-callback": "error"}'` (requires `eslint-plugin-jest`), and for TypeScript `@typescript-eslint/no-floating-promises` (needs type information configured). For Testing Library: `testing-library/await-async-queries`, `testing-library/no-wait-for-side-effects`. Check `npm ls eslint-plugin-jest eslint-plugin-testing-library` first; do not add plugins only for this run.

### Output
A defect list with line numbers.

### Quality Gate
- Every listed defect cites a line and a row of the table or a lint rule message.

---

## Phase 2: Fix One Defect At A Time

### Entry Criteria
- Defect list exists.

### Actions
1. Apply the matching fix, run the single test, then move to the next:

| Defect | Fix |
|---|---|
| `expect(p).resolves...` not awaited | `await expect(p).resolves.toBe(x)` |
| Promise-returning call not awaited | `await` it, or `return` it from the test |
| `done` callback with async code | Convert to `async` test with `await`; delete `done` |
| `await new Promise(r => setTimeout(r, 300))` before an assertion | Wait for the real signal: await the promise the code returns, or `await waitFor(() => expect(x).toBe(y))` |
| `getByText` for content that appears after a fetch | `await screen.findByText('Paid')` (findBy = getBy plus waitFor) |
| Side effect inside `waitFor` callback (click, fetch) | Move the side effect out; keep only assertions inside `waitFor` |
| Assertions inside callbacks that may not run | `expect.assertions(<number of expects>)` or `expect.hasAssertions()` at the top |
| State update after test ends (React) | `await` the user action (`await user.click(...)` with `@testing-library/user-event` v14) and then `findBy` the result |
| Event emitter result | `const [value] = await once(emitter, 'done')` from `node:events` |

2. Timeouts: keep Jest's `testTimeout` and Testing Library's `waitFor` default unless the test already sets one. Do not raise `testTimeout` to make a test pass; a test that needs more time than the suite allows is waiting on the wrong thing.
3. Do NOT wrap the assertion in `try/catch`, add `jest.retryTimes`, or switch to `test.skip`.
4. For `race` class in product code (two async calls updating shared state in unpredictable order), fix product code: serialize the calls, or make the update order-independent; keep the test unchanged.

### Output
Edited test.

### Quality Gate
- Single test passes once: `npx jest <file> -t "<pattern>" --ci` reports `1 passed`.
- The lint command from Phase 1 action 3 reports no errors for the file.

---

## Phase 3: Produce The Diff

### Entry Criteria
- All defects fixed.

### Actions
1. Run the whole file once in band: `npx jest <file> --ci --runInBand`.
2. `git -C <repo_path> diff > flk-node-async.diff`; copy into `node_async_fix_diff`; delete the file.
3. Do NOT verify here; `flk-verify-same-count` reruns `baseline_command`.

### Output
`node_async_fix_diff`.

### Quality Gate
- The file run reports zero failed tests.
- `git diff --stat` lists only the test file (or product files for `race`).

---

## Worked Example

Illustrative. `src/checkout/Pay.test.tsx`, test `shows paid state`.

- Phase 1: failure `Unable to find an element with the text: Paid`, plus the act warning. Line 41: `await new Promise(r => setTimeout(r, 300))`; line 42: `expect(screen.getByText('Paid')).toBeInTheDocument()`.
- Phase 2: replaced both lines with `expect(await screen.findByText('Paid')).toBeInTheDocument()`; line 39 `user.click(payButton)` changed to `await user.click(payButton)`.
- Phase 3: `npx jest src/checkout/Pay.test.tsx --ci --runInBand` prints `Tests: 7 passed, 7 total`.

---

## Exit Criteria

DONE when every listed defect is fixed with its table fix, the file passes once, lint reports no async rule errors, and the diff touches only listed sites.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not timing or race | **Return**: empty diff. |
| Phase 1 | eslint plugins not installed | **Adjust**: skip the lint step and rely on the grep list; note it. |
| Phase 2 | Test fails deterministically after the fix | **Adjust**: the await exposed the real defect; fix it, do not remove the await. |
| Phase 2 | Fake timers active and `findBy` never resolves | **Adjust**: use `jest.useFakeTimers({ advanceTimers: true })` or advance timers; see `flk-node-fake-timers-fix`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
