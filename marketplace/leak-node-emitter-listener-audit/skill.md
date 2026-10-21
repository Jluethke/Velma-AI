# Node.js EventEmitter, Timer and AbortSignal Listener Audit

**One-line description:** Counts listeners, timers and abort handlers in a live Node.js process per operation using `emitter.listenerCount`, `events.getEventListeners` and `--trace-warnings`, to prove or reject a listener or closure leak without silencing `MaxListenersExceededWarning`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. C2, C3 and C6 entries are the targets.
- `node_retainer_paths` (object[], required): From `leak-node-heap-snapshot-compare`. A path through `_events` or a `Timeout` points here.

---

## Outputs

- `node_listener_report` (object[]): For each emitter, signal or timer source: event name, listener count at each checkpoint, growth per operation, the stack trace of the registering call, and the matching removal call if one exists.

---

## Phase 1: Surface Warnings With Stacks

### Entry Criteria
- Node test instance can be restarted with flags.

### Actions
1. Restart with `node --trace-warnings server.js`. When an emitter passes its max listener count (default 10 per event, documented as `events.defaultMaxListeners`), Node prints `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 <event> listeners added to [<Emitter>]` and, with `--trace-warnings`, the stack of the `on()` call that crossed it.
2. Run the load for warmup plus a few hundred operations and collect stderr.
3. Never "fix" the warning with `emitter.setMaxListeners(0)` or `Infinity`, or `events.defaultMaxListeners = ...`. That only hides the evidence. Raising the max is correct only for an emitter that legitimately has a fixed, known number of listeners above 10, and that number must be written in a code comment.

### Output
Warning lines with registering stacks.

### Quality Gate
- stderr is saved to a file; `grep -c MaxListenersExceededWarning` on it is printed (zero is a valid result).

---

## Phase 2: Count Listeners per Operation

### Entry Criteria
- Phase 1 complete.

### Actions
1. Add a debug-only route or interval log on a branch that prints counts for every suspect emitter named in `node_retainer_paths` and `cause_hypotheses`:
   ```js
   const { getEventListeners } = require('node:events');
   console.log(JSON.stringify({
     ops: opsCounter,
     configChanged: configBus.listenerCount('config-changed'),
     events: configBus.eventNames().map(e => [String(e), configBus.listenerCount(e)]),
     abort: getEventListeners(sharedController.signal, 'abort').length,
     handles: process.getActiveResourcesInfo().length
   }));
   ```
   `events.getEventListeners` works for both EventEmitter and EventTarget (including `AbortSignal`) in Node 15.2 and later. `process.getActiveResourcesInfo()` lists active handles such as `Timeout` and `TCPSocketWrap` (Node 17.3 and later; check `node --help` or docs for your version).
2. Log at warmup, after N operations, after 2N operations.
3. Classify each counter:

   | Counter across the three checkpoints | Meaning |
   |---|---|
   | grows by about N each window | one listener or timer registered per operation and never removed: leak |
   | grows then stays constant | bounded set (one per connection in a pool, for example): not a leak |
   | constant | not involved |

4. For `Timeout` growth: search for `setInterval(` and `setTimeout(` on the request path whose handle is not stored and cleared. An uncleared `setInterval` keeps its closure, and everything the closure captures, alive forever.
5. For `abort` listener growth on a long-lived `AbortSignal`: each `signal.addEventListener('abort', fn)` without `{ once: true }` or `removeEventListener` keeps `fn` alive until the signal aborts, which may be never. `events.addAbortListener` (Node 20.5 and later) returns a disposable that removes the listener.

### Output
Per-counter growth table.

### Quality Gate
- Three log lines are saved, and each counter's growth per window is computed from them.

---

## Phase 3: Locate Registration and Missing Removal

### Entry Criteria
- At least one counter grows by about N per window.

### Actions
1. For each growing counter, find the registering call from the Phase 1 stack, or search: `rg -n "configBus\.(on|addListener|prependListener)\("`.
2. Find the matching removal: `rg -n "configBus\.(off|removeListener|removeAllListeners)\("`. A removal only works if it passes the same function reference. `emitter.off('x', () => ...)` with a new arrow function removes nothing.
3. Record in `node_listener_report`: registering file:line, removal file:line or "none", whether the listener closure captures request-scoped objects (read the function body for `req`, `res`, `ctx`, large buffers).

### Output
`node_listener_report`.

### Quality Gate
- Every growing counter has a registering file:line and an explicit removal status.

---

## Worked Example

Illustrative only.

Input: retainer path `configBus._events['config-changed']` -> closure -> `RequestContext`.

Phase 1: stderr shows `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 config-changed listeners added to [EventEmitter]` with stack `at new RequestContext (src/context.js:23:15)`.

Phase 2: logs `{"ops":5000,"configChanged":5012}`, `{"ops":25000,"configChanged":25012}`, `{"ops":45000,"configChanged":45012}`. Grows by 20,000 per 20,000 ops: leak.

Phase 3: `src/context.js:23 configBus.on('config-changed', () => this.reload())`. Removal search: none. The arrow function captures `this` (`RequestContext`, which holds `req`).

---

## Exit Criteria

DONE when every suspect listener, timer and abort handler has a measured count per checkpoint and growing ones have a registering location and removal status.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No warning printed but listeners still suspected | **Adjust**: the emitter may be an `EventTarget` or custom array; go straight to Phase 2 counting. |
| Phase 2 | `getEventListeners` not available | **Adjust**: use `emitter.listeners(event).length` for EventEmitter; upgrade Node for EventTarget counting. |
| Phase 2 | No counter grows | **Return**: to `leak-node-heap-snapshot-compare`; the holder is not a listener. |
| Phase 3 | Removal exists but uses a new function reference | **Adjust**: record it as "removal ineffective"; it counts as missing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
