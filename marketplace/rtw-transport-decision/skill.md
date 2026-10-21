# Realtime Transport Decision Table

**One-line description:** Chooses WebSocket, Server-Sent Events (SSE) or HTTP long polling for one realtime feature by walking a fixed decision table over data direction, payload type, client platforms and network path, and records the fallback transport and the reason for each row that fired.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feature_spec` (string, required): Plain description of the realtime feature: who sends data to whom, message types, expected message rate per connection, payload type (text JSON or binary), and the latency the product owner wants.
- `client_platforms` (string[], required): Every client that will connect: browser names, iOS/Android native, server-to-server, CLI. Include known network constraints such as corporate HTTP proxies, mobile carriers, or a CDN in front of the origin.

---

## Outputs

- `transport_decision` (object): `{ transport: "websocket" | "sse" | "long-polling", fallback: "sse" | "long-polling" | "none", needs_sticky_sessions: bool, rows_fired: [ { row, answer, effect } ], open_questions: [] }`.

---

## Phase 1: Extract the Facts

### Entry Criteria
- `feature_spec` and `client_platforms` are present.

### Actions
1. Copy these six questions into your working notes and answer each one with a quote from `feature_spec` or `client_platforms`. If the text does not answer a question, write `UNKNOWN` and add the question to `open_questions`. Do not guess.
   - Q1. Does the client send messages to the server more often than it would send ordinary HTTP requests (for example every keystroke, cursor move, game input)? yes/no
   - Q2. Is any payload binary (audio, video frames, protobuf without base64)? yes/no
   - Q3. Must the feature work in a browser? yes/no
   - Q4. Is there a known HTTP proxy, antivirus or corporate gateway between clients and the origin that buffers responses or strips the `Upgrade` header? yes/no/UNKNOWN
   - Q5. Will a single browser tab open more than one stream to the same origin, and is the origin served over HTTP/1.1 only? yes/no
   - Q6. Must messages reach the user when the app is in the background on mobile? yes/no
2. Write the answers as a table with columns `question | answer | quoted source`.

### Output
Six answered questions with quoted sources.

### Quality Gate
- Every one of Q1 to Q6 has an answer of yes, no or UNKNOWN.
- Every yes/no answer has a quoted source line from the inputs.

---

## Phase 2: Walk the Decision Table

### Entry Criteria
- Phase 1 table exists.

### Actions
1. Start with `transport = "sse"` and `fallback = "long-polling"`. SSE is the default because it is plain HTTP, reconnects automatically in the browser `EventSource` API, and resumes with the `Last-Event-ID` header.
2. Apply the rows below in order. Each row that fires overwrites the fields it names. Record every row that fires in `rows_fired`.

| Row | Condition | Effect | Reason |
|---|---|---|---|
| R1 | Q1 = yes | `transport = "websocket"` | SSE is server-to-client only; client messages would need a separate HTTP request each. |
| R2 | Q2 = yes | `transport = "websocket"` | SSE carries UTF-8 text only (`text/event-stream`); binary would need base64. |
| R3 | Q5 = yes and transport is sse | Add open question: "Serve the origin over HTTP/2, or multiplex streams into one connection" | MDN documents a limit of 6 SSE connections per browser per domain over HTTP/1.1. |
| R4 | Q4 = yes | `fallback = "long-polling"` | Long polling is ordinary request/response and survives buffering proxies. |
| R5 | Q4 = UNKNOWN | `fallback = "long-polling"` and add open question naming the proxy to check | A missing fallback is the common cause of "works in the office, fails at the customer". |
| R6 | Q6 = yes | Add open question: "Use APNs/FCM push for background delivery" | No socket transport survives OS background suspension on iOS/Android. |
| R7 | Q3 = no and transport is sse | Keep sse, note that non-browser clients need an SSE parser library | Native clients have no built-in `EventSource`. |

3. Set `needs_sticky_sessions`:
   - `websocket` with no fallback: `false` (one TCP connection, one server).
   - any transport whose fallback is `long-polling` and whose server keeps per-session memory between polls: `true`.
   - `sse`: `false` when the client resumes with `Last-Event-ID` from a shared store; `true` otherwise.
4. Do NOT choose WebTransport, gRPC streaming or MQTT here. If `feature_spec` names one of them, add it to `open_questions` with the text "outside this table; evaluate separately".

### Output
`transport_decision` draft with `rows_fired`.

### Quality Gate
- `transport_decision.transport` is exactly one of the three allowed strings.
- Every entry in `rows_fired` names a row from the table above and the answer that triggered it.
- `needs_sticky_sessions` is a boolean and the rule from Action 3 that set it is recorded.

---

## Phase 3: Confirm Against the Clients

### Entry Criteria
- Draft decision exists.

### Actions
1. For each browser in `client_platforms`, open https://caniuse.com/websockets or https://caniuse.com/eventsource and record whether the chosen transport is supported. Copy the support status, not your memory of it.
2. For a WebSocket choice behind an unknown proxy, run the handshake through the real network path from one client network and record the status line:
   `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" https://HOST/ws`
   - `HTTP/1.1 101 Switching Protocols` means the path passes upgrades.
   - Any 4xx/5xx or a 200 with an HTML body means something in the path blocks or rewrites it: keep the long-polling fallback.
3. For an SSE choice, run `curl -N -H "Accept: text/event-stream" https://HOST/events` against any existing streaming endpoint (or a test endpoint that emits one event per second). Events printing one by one means no buffering; events arriving in a burst at the end means a buffering hop.
4. Finalize `transport_decision`.

### Output
Final `transport_decision`.

### Quality Gate
- Each browser in `client_platforms` has a support status copied from caniuse.
- If a curl probe was possible, its first response line is pasted into `rows_fired` notes.

---

## Worked Example

Illustrative only.

`feature_spec`: "Live order board for kitchen staff. Server pushes order created/updated JSON events, about one per few seconds. Staff tap 'done' which is a normal REST call." `client_platforms`: ["Chrome on Android tablets", "Safari on iPad"], restaurant Wi-Fi with an unknown captive gateway.

- Phase 1: Q1 no ("Staff tap 'done' which is a normal REST call"), Q2 no ("JSON events"), Q3 yes, Q4 UNKNOWN, Q5 no, Q6 no.
- Phase 2: start sse; R5 fires: fallback long-polling, open question "check the restaurant gateway". `needs_sticky_sessions = false` because resume uses `Last-Event-ID` against Redis Streams.
- Phase 3: caniuse shows EventSource supported in both. `curl -N -H "Accept: text/event-stream" https://orders.example.com/events` from the restaurant Wi-Fi printed `id: 101` then `id: 102` one second apart: no buffering.

Result: `{ transport: "sse", fallback: "long-polling", needs_sticky_sessions: false, rows_fired: [{row:"R5", answer:"Q4=UNKNOWN", effect:"fallback=long-polling"}] }`.

---

## Exit Criteria

DONE when `transport_decision` names one transport, one fallback, a sticky-session boolean, every fired row with its evidence, and every unanswered question in `open_questions`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | More than three questions are UNKNOWN | **Return** to the feature owner with the list; the table cannot decide on missing facts. |
| Phase 2 | `feature_spec` asks for WebTransport or gRPC streaming | **Stop** this table; record the request in `open_questions` and evaluate that protocol separately. |
| Phase 3 | curl probe returns non-101 through the real path | **Adjust**: keep `transport = "websocket"` only with `fallback = "long-polling"`, and record the blocking hop. |
| Phase 3 | caniuse shows the chosen transport unsupported on a listed client | **Adjust**: switch to the fallback for that client and record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
