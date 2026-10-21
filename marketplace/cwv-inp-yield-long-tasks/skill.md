# Yield and Break Up Long Tasks

**One-line description:** Cuts INP processing duration and input delay by splitting long event-handler tasks with `scheduler.yield()` and a `setTimeout` fallback, giving visual feedback before heavy work, moving non-urgent work (analytics, storage, prefetch) after the next paint, and removing forced synchronous layout, one handler at a time with a trace after each change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): App repository root.
- `inp_interaction_profile` (object[], required): From `cwv-inp-interaction-profile`; names the handler functions with file and line.
- `inp_bottleneck` (string, required): From `cwv-inp-interaction-profile`.

---

## Outputs

- `inp_patch` (object): The handler changed, the technique applied, the diff summary, and before/after interaction phases from the trace.

---

## Phase 1: Map the Handler

### Entry Criteria
- `inp_bottleneck` is `processing_duration` or `input_delay`. If it is `presentation_delay`, **Return** and route to `cwv-inp-react-render-cost` or DOM-size work.

### Actions
1. Open the file and line of the top function from `inp_interaction_profile`. Find the event handler that calls it (follow the call stack in the trace's Call Tree).
2. Write down, in order, what the handler does, and tag each step:
   | Tag | Examples |
   |---|---|
   | `visible` | Update the button state, show a spinner, change the visible result |
   | `deferrable` | Send analytics, write `localStorage`, prefetch, log, sync to server |
   | `chunkable` | Loop over many items, parse or format large data |
   | `layout-thrash` | Reads layout (`offsetHeight`, `getBoundingClientRect`, `scrollTop`) after writing styles in the same task |
3. For `input_delay`, the competing work is not in the handler: identify the task running when the user clicked (timers, script evaluation, hydration) from the trace and tag it `deferrable` or `chunkable` in its own source file.

### Output
Tagged step list.

### Quality Gate
- Each step in the handler has exactly one tag, with the file and line recorded.

---

## Phase 2: Apply One Technique

### Entry Criteria
- Tagged list exists.

### Actions
1. Add a yield helper in one shared module (create it if absent), per the pattern documented on web.dev ("Optimize long tasks"):
   ```js
   export function yieldToMain() {
     if (globalThis.scheduler?.yield) return scheduler.yield();
     return new Promise((resolve) => setTimeout(resolve, 0));
   }
   ```
   `scheduler.yield()` resumes ahead of other queued tasks; the `setTimeout` fallback goes to the back of the queue. Do not invent other `scheduler` methods; `scheduler.postTask` exists in Chromium but is a separate API.
2. Apply by tag, in this order of preference:
   | Tag | Change |
   |---|---|
   | `visible` then `deferrable` | Run the `visible` updates first, then `await yieldToMain();`, then the `deferrable` work. The browser can paint the feedback before the rest runs. |
   | `chunkable` | Process in batches: inside the loop, `await yieldToMain()` every N items or when `performance.now() - start` passes a budget. Both N and the budget are tuning values; start from the frame budget your trace shows and record the value chosen. |
   | `layout-thrash` | Batch reads before writes: read all layout values first, then write all styles. Or move the read to `requestAnimationFrame` before writes. |
   | competing timer or script work (input delay) | Wrap startup work in `requestIdleCallback` (with a `setTimeout` fallback for Safari) or split it with `yieldToMain()`. |
3. Make the handler `async` only where you add an `await`. If code after the handler relies on the work having finished synchronously (for example `event.preventDefault()` must be called before the first `await`), keep that part before the yield.
4. Change ONE handler per iteration. Do not refactor unrelated code in the same diff.
5. Run the project's tests: `npm test` (and type check `npx tsc --noEmit` if TypeScript). Do not modify or delete a test to make it pass; a failing test that awaited synchronous behavior means the change altered behavior and must be fixed.

### Output
Patched handler.

### Quality Gate
- `git diff --stat` shows the handler file and, at most, the yield helper module.
- `npm test` exits 0 with the same number of tests as before the change.

---

## Phase 3: Re-trace

### Entry Criteria
- Tests pass; production build succeeds.

### Actions
1. Rebuild and serve production. Repeat `cwv-inp-interaction-profile` Phase 2 with the same throttling and the same interaction.
2. In the Interactions track, compare phases to the before values. In the Main track, the old long task should now be several shorter tasks, with a paint (green frame) before the deferred part.
3. If processing duration did not drop, the yielded work was not the slow part; return to Phase 1 with the next function from the profile.

### Output
`inp_patch` with before/after phases.

### Quality Gate
- Before and after interaction durations are copied from the Interactions track under identical throttling.
- The trace shows a frame presented before the deferred work runs.

---

## Worked Example

Illustrative only. Handler `onAddToCart` in `src/cart/handlers.ts:30`.

Phase 1 tags: `setButtonState('adding')` visible; `recalcTotals(cart)` chunkable (loops 400 line items with `formatCurrency`); reads `totalsEl.offsetHeight` after setting styles: layout-thrash; `track('add_to_cart')` deferrable.

Phase 2 iteration 1:
```ts
async function onAddToCart(e) {
  e.preventDefault();
  setButtonState('adding');
  renderCartBadge(cart.count + 1);
  await yieldToMain();
  recalcTotals(cart);
  track('add_to_cart');
}
```
`npm test`: 212 passed, 212 before.

Phase 3: interaction 366 ms to 118 ms at 4x slowdown; the badge paints at 41 ms. Iteration 2 targets the forced layout in `recalcTotals`.

---

## Exit Criteria

DONE when the slow handler is split so visible feedback paints before heavy work, tests pass unchanged, and a re-trace shows the interaction duration under the same conditions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bottleneck is `presentation_delay` | **Return**: route to `cwv-inp-react-render-cost` or DOM-size reduction. |
| Phase 2 | A test fails after yielding | **Adjust**: keep order-dependent steps before the first `await`; never delete or weaken the test. |
| Phase 2 | `scheduler` type missing in TypeScript | **Adjust**: declare a minimal ambient type for `scheduler.yield` in a `.d.ts`; do not use `@ts-ignore` across the file. |
| Phase 3 | No improvement | **Retry**: pick the next function from the profile; the first was not the cost. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
