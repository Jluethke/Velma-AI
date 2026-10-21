# Long Animation Frames INP Attribution

**One-line description:** Adds Long Animation Frames (LoAF) script attribution to field INP beacons, so each slow interaction reports the script URL, function name, invoker and forced layout time that blocked the main thread, including third-party scripts the lab never reproduces.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Path to the app repository root.
- `rum_endpoint` (string, required): The same endpoint used by `cwv-rum-web-vitals-setup`.
- `rum_instrumentation` (object, required): Output of `cwv-rum-web-vitals-setup`: the reporting module path and the installed `web-vitals` version.

---

## Outputs

- `loaf_instrumentation` (object): The added fields in the INP beacon (`loafScripts` array with `sourceURL`, `sourceFunctionName`, `invoker`, `invokerType`, `duration`, `forcedStyleAndLayoutDuration`), the cap on scripts per beacon, and the verification evidence.

---

## Phase 1: Confirm API Support and Source

### Entry Criteria
- `rum_instrumentation` names an existing reporting module.

### Actions
1. Confirm the browser exposes the API: in Chrome DevTools Console run `PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')`. It prints `true` in Chromium browsers that ship LoAF; Firefox and Safari print `false`, so field LoAF data comes only from Chromium users.
2. Check whether your `web-vitals` version already attaches LoAF entries to INP attribution: `grep -n "longAnimationFrameEntries" node_modules/web-vitals/dist/modules/types/inp.d.ts`.
   | grep result | Use |
   |---|---|
   | Field found | Read `metric.attribution.longAnimationFrameEntries` inside the existing `send` function (Phase 2, path A). |
   | Not found | Add your own `PerformanceObserver` (Phase 2, path B). |
3. Also grep for summary fields some versions add (`longestScript`, `totalScriptDuration`). Use only fields the `.d.ts` declares.

### Output
Chosen path (A or B).

### Quality Gate
- The console check result is recorded.
- The grep output for `inp.d.ts` is recorded and the path follows the table.

---

## Phase 2: Attach Script Attribution to the INP Beacon

### Entry Criteria
- Path chosen.

### Actions
1. Edit ONLY the reporting module named in `rum_instrumentation`.
2. Path A (field present). Inside `send`, when `metric.name === 'INP'`, add:
   ```ts
   const frames = metric.attribution.longAnimationFrameEntries || [];
   const scripts = frames.flatMap((f: any) => f.scripts || [])
     .sort((x: any, y: any) => y.duration - x.duration)
     .slice(0, 5)
     .map((s: any) => ({
       sourceURL: s.sourceURL, sourceFunctionName: s.sourceFunctionName,
       invoker: s.invoker, invokerType: s.invokerType,
       duration: Math.round(s.duration),
       forcedStyleAndLayoutDuration: Math.round(s.forcedStyleAndLayoutDuration),
     }));
   ```
   and add `loafScripts: scripts` to the JSON body.
3. Path B (no field). Buffer frames yourself and pick the ones that overlap the INP interaction:
   ```ts
   const loafs: PerformanceEntry[] = [];
   new PerformanceObserver((l) => { loafs.push(...l.getEntries()); if (loafs.length > 50) loafs.splice(0, loafs.length - 50); })
     .observe({ type: 'long-animation-frame', buffered: true });
   // in send(), for INP: interaction starts at metric.entries[0].startTime and lasts metric.entries[0].duration
   const e = metric.entries[0];
   const hit = loafs.filter((f: any) => f.startTime < e.startTime + e.duration && f.startTime + f.duration > e.startTime);
   ```
   then build `scripts` from `hit` exactly as in path A.
4. The cap of 5 scripts per beacon is a payload-size choice, not a standard. Record it in `loaf_instrumentation` as a tunable; raise it if beacons stay small.
5. Strip query strings from `sourceURL` before sending (`s.sourceURL.split('?')[0]`) so tokens in script URLs do not reach the RUM store.

### Output
Updated reporting module.

### Quality Gate
- `npm run build` exits 0.
- `git diff --stat` shows only the reporting module changed.

---

## Phase 3: Verify in a Production Build

### Entry Criteria
- Build succeeds.

### Actions
1. Serve the production build. In DevTools Performance panel, set CPU throttling to 4x slowdown (the CPU multiplier Lighthouse uses for its default mobile run) so frames exceed the 50 ms long-frame threshold defined by the LoAF spec.
2. Click an element that runs JavaScript. Hide the tab.
3. Inspect the INP beacon payload in the Network panel. Expect `loafScripts` with at least one entry whose `sourceURL` is a real script file.
4. Read entries with this table:
   | `invokerType` | Meaning |
   |---|---|
   | `event-listener` | Your or a library's event handler ran; `invoker` reads like `BUTTON#buy.onclick` |
   | `user-callback` | A callback such as `setTimeout` or `requestAnimationFrame` |
   | `resolve-promise` / `reject-promise` | Work after an awaited promise |
   | `classic-script` / `module-script` | Script evaluation (often a third-party tag loading during the interaction) |
5. Note: `sourceURL` is empty for scripts from cross-origin frames and for some inline scripts; record those as `(unattributed)`, do not guess the source.

### Output
`loaf_instrumentation` with a sample payload.

### Quality Gate
- A captured INP beacon contains a non-empty `loafScripts` array under 4x CPU throttling.
- No `sourceURL` in the payload contains `?`.

---

## Worked Example

Illustrative only. `web-vitals` 5.x, `inp.d.ts` declares `longAnimationFrameEntries`: path A.

Phase 3 payload captured after clicking "Add to cart" at 4x slowdown:
```json
{"name":"INP","value":344,"interactionTarget":"button#add-to-cart","inputDelay":12,"processingDuration":281,"presentationDelay":51,
 "loafScripts":[{"sourceURL":"https://shop.example.com/assets/cart-4f1a.js","sourceFunctionName":"recalcTotals","invoker":"BUTTON#add-to-cart.onclick","invokerType":"event-listener","duration":243,"forcedStyleAndLayoutDuration":61},
                {"sourceURL":"https://www.googletagmanager.com/gtm.js","sourceFunctionName":"","invoker":"BUTTON#add-to-cart.onclick","invokerType":"event-listener","duration":32,"forcedStyleAndLayoutDuration":0}]}
```
Reading: `recalcTotals` spends 243 ms, of which 61 ms is forced layout; the tag manager adds 32 ms in its own click listener.

---

## Exit Criteria

DONE when INP beacons carry a capped, query-stripped `loafScripts` array built from fields the installed library declares (or from a dedicated observer), verified in a production build.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | API unsupported in the test browser | **Stop**: test in current Chrome; LoAF is Chromium-only. |
| Phase 2 | Build fails after edit | **Adjust**: fix the one edited file; do not touch other modules. |
| Phase 3 | `loafScripts` always empty | **Retry**: raise CPU throttling and pick an interaction that runs script; if still empty, confirm the observer is registered before the click (path B). |
| Phase 3 | Beacon too large and dropped by `sendBeacon` (returns false) | **Adjust**: lower the script cap; the `fetch` keepalive fallback has a body size limit too. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
