# Browser Detached DOM and Listener Leaks

**One-line description:** Repeats one UI action many times under Playwright or Puppeteer, tracks DOM node and JS listener counts, then uses Chrome DevTools heap snapshots filtered on "Detached" to find DOM trees removed from the page but still referenced from JavaScript, and names the holding reference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. URL, build, and the user action that seems to leak.
- `load_recipe` (object, required): From `leak-intake-load-recipe`. The scripted repeated action.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. C2 and C3 entries name the components to exercise first; each report entry records the hypothesis id it confirms, or "none".

---

## Outputs

- `detached_dom_report` (object[]): For each detached tree: root element tag and identifying attributes, node count, count growth per action, the retainer path from JavaScript to the detached root, and the source file:line of the holder.

---

## Phase 1: Measure Counts per Action

### Entry Criteria
- Chromium-based browser available (DevTools heap snapshots are a Chrome feature).
- A production-like build with source maps (minified names make retainers unreadable).

### Actions
1. Script the action loop. Puppeteer exposes counters directly with `page.metrics()`:
   ```js
   const m0 = await page.metrics();   // Nodes, JSEventListeners, JSHeapUsedSize
   for (let i = 0; i < N; i++) { await openDialog(page); await closeDialog(page); }
   await page.evaluate(() => window.gc && window.gc()); // launch with --js-flags=--expose-gc
   const m1 = await page.metrics();
   ```
   With Playwright, open a CDP session: `const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable'); const { metrics } = await cdp.send('Performance.getMetrics');` and read `Nodes`, `JSEventListeners`, `JSHeapUsedSize`.
2. Launch Chromium with `--js-flags=--expose-gc` so `window.gc()` forces collection before each reading. Without it, counts include garbage not yet collected.
3. Take readings at warmup, after N actions, after 2N actions.
4. Interactive alternative: DevTools > More tools > Performance monitor shows "DOM Nodes" and "JS event listeners" live; click the trash-can "Collect garbage" icon in the Memory tab before reading.
5. Classify:

   | Counter over the two windows | Meaning |
   |---|---|
   | `Nodes` grows by a steady amount per action | detached DOM leak |
   | `JSEventListeners` grows per action | listeners attached to nodes or `window` not removed |
   | `JSHeapUsedSize` grows, `Nodes` flat | plain JS object leak; use `leak-node-heap-snapshot-compare` procedure on the page |
   | all flat | no leak for this action |

### Output
Counts table at three checkpoints.

### Quality Gate
- The three metric readings are printed from the script and saved.

---

## Phase 2: Find Detached Trees in a Heap Snapshot

### Entry Criteria
- `Nodes` or `JSEventListeners` grows per action.

### Actions
1. Open the page with DevTools Memory tab. Do the action N times. Click "Collect garbage". Take a heap snapshot.
2. In the Summary view class filter box, type `Detached`. Rows such as `Detached HTMLDivElement` and `Detached HTMLTableRowElement` are nodes no longer in the document but still reachable.
3. If your Chrome version lists a "Detached elements" profiling type in the Memory tab, run it as well; it groups detached nodes by tree root. Check the DevTools docs for your Chrome version.
4. Pick the detached element type whose count is close to a multiple of N. Expand it and select one instance near the top of a tree (the dialog root, not a leaf `Text`).
5. Read the Retainers pane. Follow the strong path until you leave DOM types and reach a JavaScript object: a closure (`system / Context`), a component instance, an array in a store, a `Map` in a module.
6. Console helpers in DevTools: `queryObjects(HTMLDivElement)` lists live instances of a constructor; `getEventListeners(element)` lists listeners on one element. They are DevTools Console Utilities, not page APIs.

### Output
Detached tree types with retainer paths.

### Quality Gate
- The detached type's count is recorded from the snapshot, and a retainer path reaches a JavaScript object, not only DOM parents.

---

## Phase 3: Map the Holder to Source

### Entry Criteria
- Retainer path reaches a JavaScript holder.

### Actions
1. Click the holder link in the Retainers pane; with source maps DevTools shows the source file and line.
2. Match the framework pattern:

   | Framework | Typical holder | What is missing |
   |---|---|---|
   | React | `useEffect` that adds a listener or subscription | returned cleanup function removing it |
   | Vue | `mounted` adding listeners on `window` or a bus | removal in `beforeUnmount` (`beforeDestroy` in Vue 2) |
   | Angular | `subscribe()` on a long-lived Observable | `unsubscribe`, `takeUntilDestroyed()`, or the `async` pipe |
   | Vanilla or jQuery | element kept in a module array or cache; `$(el).data()` | delete the reference; `.remove()` instead of `detach()` |
   | Third-party widgets (charts, editors, maps) | widget instance holding its container | calling the widget's own `destroy()` or `dispose()` |

3. Record each holder file:line and the missing cleanup in `detached_dom_report`.

### Output
`detached_dom_report`.

### Quality Gate
- Each report entry has a source file:line from the source map and a framework row.

---

## Worked Example

Illustrative only.

Input: action "open and close the Order Details modal", React 18 app.

Phase 1: Puppeteer readings at 10, 110, 210 actions: `Nodes` 4,120 / 18,320 / 32,520 (142 per action); `JSEventListeners` 310 / 410 / 510 (1 per action).

Phase 2: snapshot after 100 actions, filter `Detached`: `Detached HTMLDivElement` x 2,300, `Detached HTMLButtonElement` x 400. Retainers for a modal root div: `stateNode` in `FiberNode` -> `context in system / Context` -> `handleKeyDown` -> `[]` in `listeners` of `window` keydown.

Phase 3: source map leads to `OrderModal.tsx:31 useEffect(() => { window.addEventListener('keydown', handleKeyDown) }, [])` with no cleanup return. Entry recorded.

---

## Exit Criteria

DONE when growing node or listener counts are measured per action and each detached tree is traced to a source file:line with the missing cleanup named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `window.gc` undefined | **Retry**: relaunch Chromium with `--js-flags=--expose-gc`. |
| Phase 1 | Counts flat but users report slowdown | **Return**: to `leak-intake-load-recipe`; the scripted action is not the leaking one. |
| Phase 2 | No `Detached` rows but `Nodes` grows | **Adjust**: nodes may still be attached but hidden (list never trimmed); search the live DOM size with `document.querySelectorAll('*').length`. |
| Phase 3 | Minified names, no source map | **Stop**: build with source maps first; do not guess from minified names. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
