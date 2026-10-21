# Realtime Protocol Version Negotiation

**One-line description:** Sets up version negotiation for a realtime protocol using the `Sec-WebSocket-Protocol` subprotocol header (or a versioned path for SSE and long polling), defines the additive-change rules that do not need a new version, and verifies the negotiation with curl handshakes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `protocol_spec` (object, required): Output of `rtw-message-envelope`, with the envelope version `v` and the message type list.
- `transport_decision` (object, required): Output of `rtw-transport-decision`.

---

## Outputs

- `version_policy` (object): `{ mechanism: "subprotocol" | "path", supported: ["app.v1", ...], preferred, change_rules: [ ... ], reject_behavior, sunset_metric, handshake_checks: [ { request, expected_status, expected_header } ] }`.

---

## Phase 1: Classify the Change Rules

### Entry Criteria
- `protocol_spec` present.

### Actions
1. Copy this table into `version_policy.change_rules`. It decides when a change needs a new protocol version.

| Change | New version? | Why |
|---|---|---|
| Add an optional field to an s2c `data` | No | s2c schemas allow additional properties; old clients ignore it. |
| Add a new s2c message type | No, if clients ignore unknown `type` values | Requires the client rule "unknown type: log and drop". Confirm the client does this before relying on it. |
| Add a new c2s message type | No | Old clients never send it. |
| Make an optional field required | Yes | Old senders omit it. |
| Rename or remove a field | Yes | Old readers break. |
| Change a field's type or meaning | Yes | Never reuse a name with a new meaning. |
| Change ordering or delivery semantics | Yes | Client reconciliation code depends on them. |

2. Grep the client code for the `type` switch and confirm it has a default branch that drops unknown types: for TypeScript `grep -rn "switch (msg.type)" src/` then read the `default:` branch. If no default branch exists, record "add unknown-type drop before shipping any new s2c type" as the first task.

### Output
`change_rules` and the client unknown-type finding.

### Quality Gate
- The client grep result is pasted, with the file and line of the default branch or the note that it is missing.

---

## Phase 2: Choose the Mechanism

### Entry Criteria
- Change rules recorded.

### Actions
1. If `transport_decision.transport` is `websocket`: `mechanism = "subprotocol"`. Name versions `<app>.v<N>` (for example `orders.v1`). The browser sends a list: `new WebSocket(url, ["orders.v2", "orders.v1"])`; the server picks exactly one and echoes it in the `Sec-WebSocket-Protocol` response header; the browser exposes it as `socket.protocol`.
2. If the transport is `sse` or `long-polling`: `mechanism = "path"`, for example `/v1/events`. `EventSource` cannot set request headers, so a header-based version does not work from browsers.
3. Server-side selection per stack (record the one that applies):
   - Node `ws`: the `handleProtocols(protocols, request)` option receives a `Set` of offered names and returns the chosen string or `false`.
   - Go gorilla/websocket: `Upgrader.Subprotocols` lists names in server preference order; read the choice with `conn.Subprotocol()`.
   - Python FastAPI/Starlette: read offered names from `websocket.scope["subprotocols"]` and pass the choice as `await websocket.accept(subprotocol=choice)`.
4. Set `reject_behavior`: when the client offers no supported version, reject the HTTP upgrade with status 400 before the 101 (or accept and immediately close with an application close code from the 4000-4999 range defined in `rtw-close-code-map`). Pick one and record it. Do not accept the connection silently with no subprotocol when the client offered some: RFC 6455 says the client must fail the connection if the server selects a protocol the client did not offer, and browsers treat a missing selection as "no subprotocol", which hides the mismatch.
5. Set `sunset_metric`: a counter labeled by negotiated version (for example `realtime_connections_total{protocol="orders.v1"}`). A version is removed only when its counter stays at zero for a period the product owner sets; record that period as an open question if not given.

### Output
Mechanism, selection code location, reject behavior and sunset metric.

### Quality Gate
- `mechanism` is consistent with the transport (subprotocol only for websocket).
- `reject_behavior` names one exact status code or close code.

---

## Phase 3: Verify with Handshakes

### Entry Criteria
- Server has the selection code (or will get it in the stack server flow; then run this phase after that flow).

### Actions
1. Supported version offered:
   `curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Protocol: orders.v2, orders.v1" http://localhost:8080/ws`
   Expect `HTTP/1.1 101 Switching Protocols` and `Sec-WebSocket-Protocol: orders.v2`.
2. Only the old version offered: same command with `-H "Sec-WebSocket-Protocol: orders.v1"`. Expect 101 and `orders.v1` while v1 is supported.
3. Unsupported version: `-H "Sec-WebSocket-Protocol: orders.v0"`. Expect the `reject_behavior` result.
4. For path versioning: `curl -i -N --max-time 3 http://localhost:8080/v1/events` returns 200 with `content-type: text/event-stream`; `/v0/events` returns 404 or 410.
5. Store each request and expected result in `handshake_checks` so CI can replay them.

### Output
`version_policy`.

### Quality Gate
- Every check in `handshake_checks` was run and its observed status line matches the expected one.

---

## Worked Example

Illustrative only.

Transport websocket, Node `ws`. Supported `["orders.v2","orders.v1"]`, preferred `orders.v2`.

```
const wss = new WebSocketServer({ noServer: true,
  handleProtocols: (offered) => ["orders.v2", "orders.v1"].find(p => offered.has(p)) ?? false });
```
```
$ curl -i -N --max-time 3 ... -H "Sec-WebSocket-Protocol: orders.v2, orders.v1" http://localhost:8080/ws
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: orders.v2
```
With `orders.v0` only, the upgrade handler (configured to check offers first) wrote `HTTP/1.1 400 Bad Request` and destroyed the socket.

---

## Exit Criteria

DONE when `version_policy` lists supported versions, the mechanism, change rules, reject behavior and sunset metric, and every handshake check matched.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Client has no unknown-type default branch | **Adjust**: record it as a blocking task before any additive s2c change ships. |
| Phase 2 | A proxy strips `Sec-WebSocket-Protocol` | **Adjust**: switch to path versioning (`/v2/ws`) and record the proxy. |
| Phase 3 | Server echoes a protocol the client did not offer | **Stop**: browsers fail that connection; fix the selection code. |
| Phase 3 | curl hangs instead of returning | **Retry** with `--max-time 3`; a 101 followed by an open stream is the expected hang. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
