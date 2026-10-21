# Client Reconnect with Full-Jitter Backoff

**One-line description:** Implements a browser TypeScript WebSocket client wrapper that reacts to each close code per the shared map, reconnects with exponential backoff and full jitter, detects a dead connection with an app-level ping, resets the attempt counter only after the session is proven healthy, and resumes streams from the last applied sequence, tested with fake timers and mock-socket.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Client repository (TypeScript).
- `close_code_map` (object, required): From `rtw-close-code-map`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`; gives `client_app_ping` and `dead_peer_detect_s`.
- `delivery_contract` (object, required): From `rtw-delivery-contract`; gives the resume message format.
- `backoff_bounds` (object, required): `{ base_ms, cap_ms, max_attempts | null }` chosen by the product owner. These are product decisions; the flow does not pick them.

---

## Outputs

- `reconnect_client` (object): `{ file, state_machine, close_code_actions, test_command, test_summary }`.

---

## Phase 1: Define the State Machine

### Entry Criteria
- Inputs present; `backoff_bounds.base_ms` and `cap_ms` are numbers from the owner.

### Actions
1. States: `idle`, `connecting`, `open`, `healthy`, `waiting` (backoff timer running), `stopped`.
2. Transitions:

| From | Event | To | Action |
|---|---|---|---|
| idle | `connect()` | connecting | `new WebSocket(url, protocols)` (fetch a fresh ticket first if `auth_design` uses tickets) |
| connecting | `open` | open | send `sys.resume` with last seq per stream |
| open | first `sys.hello` and resume finished | healthy | `attempt = 0` |
| open or healthy | `close` with code C | per `close_code_map` action for C | see Action 3 |
| waiting | timer fires | connecting | |
| any | `navigator.onLine` false (`offline` event) | waiting | pause timer |
| waiting | `online` event | connecting | connect now, keep `attempt` |
| any | `disconnect()` by app | stopped | close with 1000 |

3. Close code actions from the map:
   - `reconnect_backoff`: `attempt += 1`, wait `delay = random(0, min(cap_ms, base_ms * 2 ** attempt))`. This is "Full Jitter" from the AWS Architecture Blog post "Exponential Backoff And Jitter".
   - `reconnect_jitter_only` (1012): wait `random(0, base_ms)` without increasing `attempt` beyond 1. The server already spreads closes.
   - `reauth_then_reconnect`: call the app's token refresh; on success connect; on failure go to `stopped` and emit `auth_failed`.
   - `stop_and_report` and `stop_upgrade_required`: go to `stopped` and emit an event the UI shows. Never loop on these.
4. Reset `attempt` only on reaching `healthy`, not on `open`. A server that accepts and then immediately closes would otherwise cause a tight loop with zero backoff.
5. If `max_attempts` is set and reached, go to `stopped` with `gave_up`.

### Output
State machine table written into the file header comment.

### Quality Gate
- Every action in `close_code_map` maps to exactly one transition.
- The delay formula is full jitter, `random(0, min(cap, base * 2^attempt))`, not `base * 2^attempt + small random`.

---

## Phase 2: Implement the Wrapper

### Entry Criteria
- State machine defined.

### Actions
1. Create one file `src/realtime/client.ts` exporting `class RealtimeClient` with `connect()`, `disconnect()`, `send(msg)`, `on(event, fn)`. Do not edit UI components in this step.
2. Dead-connection detection (browsers cannot send WebSocket ping frames): every `heartbeat_config.interval_s` send `sys.ping`; record `lastSeen = Date.now()` on every received message; if `Date.now() - lastSeen > dead_peer_detect_s * 1000`, call `ws.close()` and handle it as a 1006-style drop (`reconnect_backoff`). Calling `close()` on a dead TCP connection may take time to emit `close`; switch state immediately rather than waiting for the event.
3. Outgoing messages while not `healthy`: queue c2s messages that are safe to retry (have an `id` the server dedupes) and drop the rest with an error to the caller. Record which types are queued.
4. Resume: keep `lastSeq: Map<stream, number>` updated by the reducer (from `rtw-client-state-reconciliation` or the existing reducer); send it in `sys.resume` on every open.
5. Tab visibility: on `visibilitychange` to visible, if state is `waiting`, connect now. Browsers throttle timers in background tabs, so waits can be much longer than computed.
6. Inject `random` and the WebSocket constructor through the constructor (defaults `Math.random`, `globalThis.WebSocket`) so tests can control them.

### Output
`src/realtime/client.ts`.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -rn "new WebSocket(" src/` shows only `client.ts`.

---

## Phase 3: Test with Fake Timers

### Entry Criteria
- Wrapper compiles.

### Actions
1. Install test helpers if missing: `npm install --save-dev mock-socket` (provides `Server` and `WebSocket` mocks) and use the project's runner (Vitest `vi.useFakeTimers()` or Jest `jest.useFakeTimers()`).
2. Tests:
   - backoff growth: with `random = () => 1`, three 1006 drops produce waits `min(cap, base*2)`, `min(cap, base*4)`, `min(cap, base*8)`; advance timers and assert connect attempts at those times.
   - full jitter: with `random = () => 0`, the wait is 0.
   - no reset on open: server accepts then closes with 1011 before `sys.hello` five times; waits keep growing.
   - reset on healthy: after `sys.hello` and resume, the next drop waits `min(cap, base*2)` again.
   - 4001: refresh called once, then connect.
   - 1009 or 4010: state `stopped`, no further connect attempts after advancing timers by `cap_ms * 10`.
   - dead peer: server stops responding; after `dead_peer_detect_s` the client reconnects.
   - resume: after reconnect the first sent message is `sys.resume` with the right `lastSeq`.
3. Run `npx vitest run src/realtime/client.test.ts` (or Jest) and paste the summary.

### Output
`reconnect_client`.

### Quality Gate
- All eight tests pass; summary pasted.

---

## Worked Example

Illustrative only.

`backoff_bounds`: base 500 ms, cap 30000 ms (owner). With `random = () => 1`: waits 1000, 2000, 4000, ... capped at 30000.
```
private nextDelay(): number {
  const ceiling = Math.min(this.b.cap_ms, this.b.base_ms * 2 ** this.attempt);
  return Math.floor(this.random() * ceiling);
}
```
```
$ npx vitest run src/realtime/client.test.ts
 ✓ backoff growth  ✓ full jitter  ✓ no reset on open  ✓ reset on healthy
 ✓ 4001 reauth     ✓ stop codes   ✓ dead peer         ✓ resume
 Tests  8 passed (8)
```

---

## Exit Criteria

DONE when the client follows the close code map, uses full-jitter backoff bounded by owner values, resets only on a healthy session, detects dead connections with an app-level ping, resumes from the last sequence, and all eight tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `backoff_bounds` missing | **Stop**: ask the owner; do not pick numbers. |
| Phase 2 | Multiple places create sockets | **Adjust**: route them through `RealtimeClient` one call site at a time, running tests after each. |
| Phase 3 | Tests flaky with real timers | **Retry** with fake timers and injected `random`; never add sleeps to tests. |
| Phase 3 | Stop-code test shows reconnects | **Return** to the transition table; a stop action is falling through to backoff. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
