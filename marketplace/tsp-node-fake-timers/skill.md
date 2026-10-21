# Jest and Vitest Fake Timers for Sleeps

**One-line description:** Removes real waiting from Jest or Vitest tests by switching timer-driven code to fake timers (`jest.useFakeTimers` with `advanceTimersByTimeAsync`, `vi.useFakeTimers` with `vi.advanceTimersByTimeAsync`) and replacing fixed `setTimeout` waits with awaits on the real event, one test file per change, with a mutation check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `sleep`.

---

## Outputs

- `node_sleep_fixes` (object): One row per item: file, test name, sleep kind, technique, commit SHA, file runtime before and after, mutation check result, and full-suite result.

---

## Phase 1: Classify Each Wait

### Entry Criteria
- At least one `sleep` item is `todo`.

### Actions
1. Find the runner version: `npx jest --version` or `npx vitest --version`. Async timer helpers (`advanceTimersByTimeAsync`, `runAllTimersAsync`) exist in Jest 29.5 and later and in Vitest; on older Jest use the sync helpers plus flushing promises (see Phase 2).
2. Classify each item:

| Pattern | Kind |
|---|---|
| Production code uses `setTimeout`/`setInterval` for debounce, retry, polling, or TTL, and the test waits real time for it | `timer_driven` |
| Test does `await new Promise(r => setTimeout(r, n))` waiting for an emitter, stream, or callback | `wait_for_effect` |
| Code compares `Date.now()` or `new Date()` to an expiry | `clock_read` |
| Playwright `page.waitForTimeout(n)` | `browser_wait` |

### Output
Kind per item.

### Quality Gate
- Runner version recorded; each item has one kind.

---

## Phase 2: Apply One Fix

### Entry Criteria
- One item selected; suite green.

### Actions
1. Time the file before: `npx jest <file>` or `npx vitest run <file>`; record the file time.
2. Apply the technique:

| Kind | Jest | Vitest |
|---|---|---|
| `timer_driven` | `beforeEach(() => jest.useFakeTimers())`, `afterEach(() => jest.useRealTimers())`; trigger the code, then `await jest.advanceTimersByTimeAsync(<ms the code waits>)`; assert. | `vi.useFakeTimers()` / `vi.useRealTimers()`; `await vi.advanceTimersByTimeAsync(<ms>)`. |
| `clock_read` | `jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') })` then `jest.setSystemTime(...)` or advance timers. | `vi.useFakeTimers(); vi.setSystemTime(new Date(...))`. |
| `wait_for_effect` | Await the event: `await once(emitter, 'done')` from `node:events`, `await new Promise(r => stream.on('finish', r))`, or Testing Library `await waitFor(() => expect(...))` / `await screen.findByText(...)`. | Same, or `await vi.waitFor(() => ...)`. |
| `browser_wait` | Replace `page.waitForTimeout(n)` with a web-first assertion such as `await expect(page.getByText('Saved')).toBeVisible()` or `await page.waitForResponse(...)`. | Same. |

3. Async code under fake timers: use the `Async` helpers so pending promises run between timer callbacks. On Jest older than 29.5, call `jest.advanceTimersByTime(ms)` and then `await Promise.resolve()` as many times as the code chains promises; prefer upgrading the timer API call over guessing that count.
4. Testing Library with Jest fake timers: `waitFor` detects Jest fake timers and advances them. With Vitest, pass `advanceTimers: vi.advanceTimersByTime` to `userEvent.setup()` when using `user-event`.
5. Do NOT enable fake timers globally (`fakeTimers: { enableGlobally: true }` in Jest config) in this flow. Global changes affect every file at once; one file per change.
6. Do NOT reduce the wait value as the fix, and do NOT delete assertions.

### Output
One-file change.

### Quality Gate
- `git diff --stat` shows one test file changed.
- `grep -n "setTimeout(r\|waitForTimeout" <file>` no longer shows the removed wait.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Change applied.

### Actions
1. Run the file and record time.
2. Mutation check: change the production timer delay or remove the callback's effect, run the file, confirm the affected test FAILS, then `git checkout -- <prod file>`.
3. Run the full suite with the baseline command; it must pass.
4. Run the file once more in a full-suite context with `--randomize` (Jest 29.2+) or `--sequence.shuffle` (Vitest) to catch fake timers leaking into the next test because `useRealTimers` was missed.
5. Commit: `git commit -m "test: fake timers in <file>"`. Record the row.

### Output
Row in `node_sleep_fixes`.

### Quality Gate
- Mutation run shows the test as failed; reverted run passes.
- Full suite JSON or summary shows zero failures.

---

## Worked Example

Illustrative. Jest 29.7. Item: `src/api/client.test.ts`, `retries after 300ms`, line 58 `await new Promise(r => setTimeout(r, 300))`, production retry uses `setTimeout(retry, 300)`.

- Phase 1: kind `timer_driven`.
- Phase 2: `jest.useFakeTimers()` in `beforeEach`; the test calls `const p = client.get('/x')`, then `await jest.advanceTimersByTimeAsync(300)`, then `await expect(p).resolves.toEqual({ ok: true })`.
- Phase 3: file time 9.9 s to 0.7 s across 31 tests. Mutation: retry delay changed to `600` makes the test fail (promise not resolved after 300 ms). Full suite `1204 passed`.

---

## Exit Criteria

DONE when every `sleep` item is `done` with a one-file commit, a failing mutation run, a passing full suite and a shuffled run, or is recorded as not fixable with the reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Test hangs under fake timers | **Adjust**: code awaits a promise before scheduling the timer; use the `Async` advance helper or advance after awaiting the first step. |
| Phase 2 | Third-party library captured real `setTimeout` at import | **Adjust**: call `useFakeTimers` before importing the module under test (`jest.isolateModules` or dynamic `await import()` after enabling), or record not fixable. |
| Phase 3 | Other files fail after the change | **Return**: `useRealTimers` is missing in `afterEach`; add it and rerun. |
| Phase 3 | Mutation does not fail the test | **Stop**: revert; the test no longer checks the timing behavior. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
