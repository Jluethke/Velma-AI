# Realtime Ordering and Delivery Contract

**One-line description:** Writes the ordering and delivery guarantees of a realtime protocol as a testable contract: the ordering scope (per stream), who assigns sequence numbers, at-most-once vs at-least-once delivery with client-side dedupe, gap detection, the replay window, and when a full snapshot replaces replay.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `protocol_spec` (object, required): Output of `rtw-message-envelope` (`stream`, `seq`, `id` fields).
- `backpressure_policy` (object, required): Output of `rtw-backpressure-policy`; `must_deliver` types need a delivery guarantee.

---

## Outputs

- `delivery_contract` (object): `{ ordering_scope, seq_assigner, guarantee_per_class, dedupe: { key, window }, gap_rule, replay_required: bool, replay_window: { kind: "count" | "time", value, source }, snapshot_endpoint, contract_tests: [] }`.

---

## Phase 1: Fix the Ordering Scope

### Entry Criteria
- Inputs present.

### Actions
1. Ordering is promised only within one `stream` (for example one room, one document, one user's inbox). Never promise global ordering across streams; it needs a single sequencer for the whole system.
2. Choose `seq_assigner`, the single writer that numbers messages in a stream. Take the first row that fits:

| Row | Situation | `seq_assigner` |
|---|---|---|
| S1 | Events already come from a database table with a monotonic id per stream (outbox table) | the database: the outbox row id or a per-stream counter column updated in the same transaction |
| S2 | Messages go through Redis Streams | the stream entry ID returned by `XADD` (`<ms>-<n>`); compare as two integers, not as strings |
| S3 | Messages go through Kafka | the partition offset, with one stream mapped to one partition by key |
| S4 | Only Redis Pub/Sub, no store | `INCR seq:<stream>` in Redis before `PUBLISH`, done in one Lua script so number and publish cannot be split |

3. Do NOT number messages on each WebSocket server node. Two nodes produce two independent sequences and the client sees duplicates or gaps.
4. Do NOT order by `ts`. Clocks on different nodes disagree.

### Output
`ordering_scope` and `seq_assigner`.

### Quality Gate
- `seq_assigner` names one row from the table and one exact mechanism.

---

## Phase 2: Fix Delivery Guarantees

### Entry Criteria
- Ordering scope fixed.

### Actions
1. Map classes to guarantees:
   - `drop` and `coalesce` classes: at-most-once. Loss is acceptable because a newer message replaces the lost one.
   - `must_deliver`: at-least-once. The server may send a message twice (after reconnect and replay); the client applies it once.
2. "Exactly-once" is not offered. It is at-least-once delivery plus idempotent apply. Write that sentence into the contract.
3. `dedupe.key` = envelope `id`. `dedupe.window`: the client keeps the last applied `seq` per stream; any message with `seq <= last_seq` is a duplicate and is dropped. This needs no id set when `seq` is gap-free per stream.
4. `gap_rule`: when a message arrives with `seq > last_seq + 1`, the client stops applying that stream, buffers the message, and sends `sys.resume { stream: last_seq }`. If the replay does not fill the gap, the client fetches a snapshot.
5. `replay_required = true` if any type is `must_deliver`; otherwise `false`.
6. `replay_window`: how far back the server can replay. It is limited by storage (stream trim length or retention time). The value comes from the owner; record it with its `source`. Past the window, the server answers `sys.resume` with the resync close code (4030) or a `sys.snapshot_required` message.
7. `snapshot_endpoint`: an HTTP GET returning the stream's current state plus the `seq` it reflects, for example `GET /streams/room:42/snapshot -> { seq: 341, state: {...} }`.

### Output
Draft `delivery_contract`.

### Quality Gate
- Every class in `backpressure_policy` maps to at-most-once or at-least-once.
- `snapshot_endpoint` returns a `seq` field (read the handler or its OpenAPI entry).

---

## Phase 3: Write the Contract Tests

### Entry Criteria
- Draft contract exists.

### Actions
1. Add these tests to the client test suite (they test the client reducer, no network needed). Write them before the reducer exists if needed; they must fail first.
   - T1 duplicate: apply seq 1, 2, 2, 3. State equals applying 1, 2, 3.
   - T2 gap: apply 1, 2, 4. The reducer emits a resume request for `last_seq = 2` and does not apply 4 yet.
   - T3 gap filled: then apply 3, 4. State equals 1, 2, 3, 4 and the buffer is empty.
   - T4 out-of-window: resume answered by snapshot at seq 10; then apply 9 (dropped) and 11 (applied).
   - T5 different streams interleaved: `a:1, b:1, a:2, b:2` applies all four; ordering is only checked per stream.
2. Run them with the project's runner (`npx vitest run`, `npx jest`, `pytest`, `go test ./...`) and paste the summary line.
3. Do NOT weaken a test to pass. If T2 fails because the reducer applies seq 4 early, fix the reducer.

### Output
`delivery_contract` with `contract_tests`.

### Quality Gate
- All five tests exist and pass; the runner summary is pasted.

---

## Worked Example

Illustrative only.

Chat with an outbox table. `seq_assigner` = S1: `messages.room_seq` set by `UPDATE rooms SET last_seq = last_seq + 1 WHERE id = $1 RETURNING last_seq` inside the insert transaction. `chat.message_posted` is must_deliver, so `replay_required = true`. Owner sets the replay window to the last 1000 messages per room (`source`: product owner). Snapshot: `GET /rooms/42/snapshot -> {seq: 5120, messages:[...last 50]}`.

```
$ npx vitest run src/realtime/reducer.test.ts
 ✓ T1 duplicate  ✓ T2 gap  ✓ T3 gap filled  ✓ T4 out-of-window  ✓ T5 streams
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

---

## Exit Criteria

DONE when the contract names the ordering scope, one sequence assigner, a guarantee per class, the dedupe and gap rules, a sourced replay window and a snapshot endpoint, and the five contract tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No single writer exists per stream | **Adjust**: add the S4 Lua `INCR`+`PUBLISH` script before going further. |
| Phase 2 | Owner requires exactly-once | **Return** with the sentence from Action 2 and the idempotent-apply design. |
| Phase 3 | A contract test fails | **Retry** after fixing the reducer; never edit the expected values. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
