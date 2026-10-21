# Node.js Heap Snapshot Comparison

**One-line description:** Captures three V8 heap snapshots of a Node.js process (through `--inspect` and Chrome DevTools, or headless with `--heapsnapshot-signal`), compares them in the DevTools Comparison view sorted by Size Delta, and reads the Retainers pane to name the object that keeps the growth alive.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Start command and environment.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`.

---

## Outputs

- `node_snapshot_diff` (object[]): Top constructors by Size Delta between snapshots 2 and 3, with `# New`, `# Deleted`, `# Delta`, `Size Delta`, and whether the same constructors grew between 1 and 2.
- `node_retainer_paths` (object[]): For each growing constructor, the retainer path from a GC root (or a named long-lived object) to a sample instance, written hop by hop as `object.property`.

---

## Phase 1: Prepare Capture

### Entry Criteria
- `node --version` prints a version. `--heapsnapshot-signal` needs Node 12 or later; `v8.writeHeapSnapshot()` needs Node 11.13 or later.
- Free memory on the host at least equal to the current heap size: writing a snapshot can need about as much memory again, and can crash a process near its limit.

### Actions
1. Choose a capture method:

   | Situation | Method |
   |---|---|
   | Local or SSH-tunneled access, interactive | `node --inspect=127.0.0.1:9229 server.js`, then open `chrome://inspect` in Chrome, click "inspect" under Remote Target, go to the Memory tab |
   | Headless host or container | `node --heapsnapshot-signal=SIGUSR2 server.js`, then `kill -USR2 <pid>`; the file `Heap.<date>.<time>.<pid>.<tid>.<seq>.heapsnapshot` is written to the working directory |
   | You control the code | call `require('v8').writeHeapSnapshot()` from a debug-only route; it returns the file name |
   | Process dies with heap OOM | `node --heapsnapshot-near-heap-limit=2 server.js` writes up to 2 snapshots as the heap nears its limit |

2. Never bind `--inspect` to `0.0.0.0` on a reachable network. The inspector allows arbitrary code execution. Use `127.0.0.1` and `ssh -L 9229:127.0.0.1:9229 host`.
3. For a Kubernetes pod: `kubectl port-forward pod/<pod> 9229:9229` with `--inspect=127.0.0.1:9229`, or use the signal method and `kubectl cp <pod>:/app/Heap...heapsnapshot .`.

### Output
Capture method ready.

### Quality Gate
- One trial snapshot is written and its size is printed with `ls -la *.heapsnapshot` (or DevTools lists "Snapshot 1").

---

## Phase 2: Three-Snapshot Run

### Entry Criteria
- Capture works.

### Actions
1. Warm up with `load_recipe` until `warmup_ops`. Take snapshot 1. DevTools and the V8 snapshot writer run a garbage collection first, so only reachable objects are recorded.
2. Run N operations. Take snapshot 2.
3. Run N more operations. Take snapshot 3.
4. Load all three into the Chrome DevTools Memory tab (right-click in the profile list, "Load", or the Load button) if captured headless.

### Output
Three loaded snapshots.

### Quality Gate
- DevTools shows three snapshots with sizes; the sizes are recorded and snapshot 3 is larger than snapshot 1.

---

## Phase 3: Compare and Read Retainers

### Entry Criteria
- Three snapshots loaded.

### Actions
1. Select snapshot 3. In the view dropdown choose "Comparison" and compare against snapshot 2. Sort by "Size Delta" descending.
2. Repeat for snapshot 2 against snapshot 1. Keep only constructors with a positive `# Delta` in both comparisons and of the same order. These are the leak candidates.
3. Skip these rows at first; they are usually consequences, not causes: `(compiled code)`, `(system)`, `(string)`, `(concatenated string)`, `(array)`, `(closure)` without a named function. Look for your own class names, `Object` shapes with your property names, `Array`, `Map`, `Promise`, `Socket`, `Timeout`, `ArrayBuffer`.
4. Alternative view: in snapshot 3 Summary view, use the filter dropdown "Objects allocated between Snapshot 1 and Snapshot 2". Objects allocated in that window and still alive in snapshot 3 are strong leak candidates.
5. Expand a candidate constructor and click one of the newest instances. The Retainers pane at the bottom shows who holds it. Read from the instance upward: each row is `property in Holder`. Follow the row with the smallest Distance value toward the root. Stop at the first long-lived object you recognize (a module-level Map, a singleton, an EventEmitter's `_events`, a `Timeout` in the timer list).
6. Grey retainer rows named `WeakMap` or `(weak)` do not keep objects alive by themselves; follow the strong path.
7. Write each retainer path as hops, for example `cache (Map in module scope) -> Map entry -> RequestContext -> req`.

### Output
`node_snapshot_diff`, `node_retainer_paths`.

### Quality Gate
- `node_snapshot_diff` rows quote `# Delta` and `Size Delta` values exactly as shown in both comparisons.
- Each retainer path ends at a named long-lived holder, not at `(GC roots)` alone.

---

## Worked Example

Illustrative only.

Input: `stack` = `node`, Express API, H1 = C2 (listener added per request).

Phase 1: `node --heapsnapshot-signal=SIGUSR2 server.js` in a container; trial `kill -USR2 1` writes `Heap.20261020.141203.1.0.001.heapsnapshot` (61 MB).

Phase 2: snapshots at 5,000, 25,000, 45,000 requests; sizes 58 MB, 96 MB, 134 MB.

Phase 3: 3 vs 2 Comparison: `RequestContext` `# New` 20,000, `# Deleted` 0, `# Delta` +20,000, `Size Delta` +31.2 MB; `Function` +20,000. 2 vs 1 shows the same. Retainers for one `RequestContext`: `context in system / Context` -> `listener in Array` -> `config-changed in Object` (`_events`) -> `configBus` (EventEmitter, module `config.js`). Path: `configBus._events['config-changed'][i]` closure -> `RequestContext`.

---

## Exit Criteria

DONE when growing constructors are confirmed across both comparisons and each has a retainer path ending at a named long-lived holder.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Snapshot write crashes the process (OOM) | **Adjust**: take snapshots earlier in the run with a smaller heap, or raise memory on a test instance only. |
| Phase 1 | Cannot reach port 9229 | **Adjust**: use `--heapsnapshot-signal` and copy the file; do not open the port publicly. |
| Phase 3 | Only `(string)` or `(array)` grow | **Adjust**: open a large instance and read its retainers; the owner is a named object above it. |
| Phase 3 | Growth is in `ArrayBuffer` or `Buffer` external memory | **Adjust**: sort by Retained Size and follow `backing_store` owners; also check streams not destroyed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
