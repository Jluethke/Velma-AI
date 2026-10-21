# Protocol State Machine Extraction

**One-line description:** Extracts the protocol state machine from the spec's diagrams and prose into a complete state-by-event transition table, fills every cell from spec text or marks it as a gap, and renders it with Graphviz so each transition can be tested and each missing cell logged as an ambiguity.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `requirements_table` (object[], required): From `s2i-requirements-table`.

---

## Outputs

- `state_machine` (object): `{ "states": [], "initial", "terminal": [], "events": [], "transitions": [{"from","event","guard","to","actions","source","req_ids"}] }`, plus `spec/state_machine.csv` and `spec/state_machine.dot`.
- `state_gaps` (object[]): Every (state, event) pair with no spec-defined result: `{ "state", "event", "searched_sections" }`.

---

## Phase 1: Find States and Events

### Entry Criteria
- Spec text available.

### Actions
1. Search for an existing diagram or state list: `grep -nE 'state|State|STATE' spec/rfcNNNN.txt | head -50`. Known locations: RFC 9113 Section 5.1 (HTTP/2 stream states), RFC 9293 Section 3.3.2 (TCP), RFC 8446 Appendix A (TLS 1.3 client and server), RFC 6455 Sections 4 and 7 (WebSocket CONNECTING, OPEN, CLOSING, CLOSED), RFC 9000 Section 3 (QUIC stream states).
2. Copy the state names exactly as written, including case and qualifiers ("half-closed (local)").
3. Build the event list from three places: (a) labels on diagram arrows, (b) message or frame types the spec defines (each "receive X" and "send X" is a separate event), (c) timers and API calls ("timeout", "application closes").
4. Mark the initial state and every terminal state.
5. If the spec has no states at all, **Return** empty outputs; this flow does not apply.

### Output
State list and event list.

### Quality Gate
- Every state in the spec diagram appears in `states` with the same spelling.
- Every frame or message type defined by the spec appears as both a send and a receive event, or a note says why one direction cannot happen.

---

## Phase 2: Fill the Transition Matrix

### Entry Criteria
- States and events.

### Actions
1. Create `spec/state_machine.csv` with header `from,event,guard,to,actions,source,req_ids`. Generate one row per (state, event) pair; with S states and E events there are S x E rows before guards.
2. Fill each row from the spec, one state at a time. Cite the section for every filled row in `source`.
3. Use these rules for rows the diagram does not show:
   - The prose often gives a catch-all ("receiving any frame other than HEADERS or PRIORITY on a stream in this state MUST be treated as a connection error"). Apply it to every matching event and cite it.
   - If a row is only implied by a diagram arrow with no prose, fill it and add "diagram only" to `source`.
   - If neither prose nor diagram covers the row, leave `to` empty and add the pair to `state_gaps` with the sections you searched.
4. Link `req_ids` from `requirements_table` rows whose `condition` names this state or event.
5. Do not invent an "ERROR" state that the spec does not name; use the spec's own error action ("connection error PROTOCOL_ERROR", "Fail the WebSocket Connection") in `actions`.

### Output
Filled matrix and `state_gaps`.

### Quality Gate
- Row count (excluding header) is at least S x E: `tail -n +2 spec/state_machine.csv | wc -l`.
- Every row has either a `to` value with a `source`, or appears in `state_gaps`.

---

## Phase 3: Render and Check

### Entry Criteria
- Filled matrix.

### Actions
1. Write `spec/state_machine.dot` with one edge per filled row: `"idle" -> "open" [label="recv HEADERS"];`.
2. Render: `dot -Tsvg spec/state_machine.dot -o spec/state_machine.svg` (Graphviz). Compare the picture with the spec diagram arrow by arrow.
3. Reachability check: every state except the initial one must have at least one incoming edge, and every non-terminal state at least one outgoing edge. Any failure is either a transcription error (fix it) or a spec gap (log it).
4. Write `state_machine` JSON to `spec/state_machine.json`.

### Output
`state_machine`, `state_gaps`.

### Quality Gate
- `dot -Tsvg` exits 0.
- Every arrow in the spec's diagram corresponds to one CSV row (count them).
- Reachability check result recorded.

---

## Worked Example

Illustrative. RFC 9113 Section 5.1, HTTP/2 stream states, server role.

Phase 1: States: idle, reserved (local), reserved (remote), open, half-closed (local), half-closed (remote), closed. Events include recv/send of HEADERS, PUSH_PROMISE, DATA, RST_STREAM, PRIORITY, WINDOW_UPDATE, CONTINUATION, plus END_STREAM flag variants.

Phase 2 rows:
```
from,event,guard,to,actions,source,req_ids
idle,recv HEADERS,no END_STREAM,open,,9113 5.1,REQ-5.1-04
idle,recv HEADERS,END_STREAM,half-closed (remote),,9113 5.1,REQ-5.1-04
idle,recv DATA,,,connection error PROTOCOL_ERROR,9113 5.1 (idle: other frames),REQ-5.1-06
half-closed (remote),recv DATA,,,stream error STREAM_CLOSED,9113 5.1,REQ-5.1-15
```
Phase 3: `dot -Tsvg spec/state_machine.dot -o spec/state_machine.svg` renders; all seven states are reachable.

---

## Exit Criteria

DONE when every (state, event) pair is either a cited transition or a recorded gap, the Graphviz render matches the spec diagram, and the reachability check passes or its failures are logged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec has states for both roles in one diagram | **Adjust**: build one matrix per role and name the files `state_machine_client.csv` and `state_machine_server.csv`. |
| Phase 2 | S x E is too large to fill by hand | **Adjust**: group events that the spec treats identically (cite the catch-all sentence), but keep one row per group per state. |
| Phase 3 | `dot` not installed | **Adjust**: install Graphviz (`apt install graphviz`, `brew install graphviz`, `winget install graphviz`); do not skip the render. |
| Phase 3 | Unreachable state | **Return** it to Phase 2: re-read the spec for the missing edge before logging a gap. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
