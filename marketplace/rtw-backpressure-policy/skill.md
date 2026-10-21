# Realtime Backpressure Policy

**One-line description:** Assigns every realtime message type an overflow class (drop, coalesce by key, or must-deliver), sizes the per-connection send queue from a memory budget and the maximum message size, and fixes the slow-consumer action and inbound rate limit, so one slow client can never grow server memory without bound.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `protocol_spec` (object, required): Output of `rtw-message-envelope` with `message_types` (including `droppable`) and `max_message_bytes`.
- `feature_spec` (string, required): The realtime feature description, for fan-out size and message rate.

---

## Outputs

- `backpressure_policy` (object): `{ classes: [ { type, class: "drop" | "coalesce" | "must_deliver", coalesce_key } ], queue: { max_messages, max_bytes, derivation }, slow_consumer_action, slow_consumer_close_code, inbound_limit: { messages_per_s, burst, source }, metrics: [] }`.

---

## Phase 1: Classify Message Types

### Entry Criteria
- `protocol_spec` present.

### Actions
1. Why this matters: a server writes to a socket faster than a slow client (mobile on weak signal, backgrounded tab) reads. Without a bound, the library buffers unsent frames in memory per connection until the process runs out of memory.
2. For each s2c message type, apply the first matching rule:

| Rule | Condition | Class |
|---|---|---|
| B1 | `droppable = true` and only the newest value matters (typing indicator, cursor, live price tick) | `drop` |
| B2 | The message carries the full current state of one entity (`order.updated` with the whole order) | `coalesce`, `coalesce_key = stream + entity id`: keep only the newest queued message per key |
| B3 | Anything else (chat message, ledger event, notification) | `must_deliver` |

3. Control types: `sys.pong` and `sys.ack` are `must_deliver`; `sys.ping` is `drop`.

### Output
Class table.

### Quality Gate
- Every s2c type in `protocol_spec.message_types` has exactly one class.
- Every `coalesce` row names a `coalesce_key` made of fields present in the type schema.

---

## Phase 2: Size the Queue

### Entry Criteria
- Classes assigned.

### Actions
1. Ask the owner for `memory_budget_per_connection_bytes`: how much RAM one connection's outbound queue may use. Record their answer and who gave it. If no answer, derive it from the host: `(host RAM reserved for the process - baseline RSS at zero connections) / target connections per node`, and record each number with its source (`free -b`, `ps -o rss= -p <pid>`, capacity target). Do not invent a value.
2. `queue.max_bytes = memory_budget_per_connection_bytes`.
3. `queue.max_messages = floor(queue.max_bytes / protocol_spec.max_message_bytes)`. If this is 0, the budget is smaller than one maximum message: lower `max_message_bytes` or raise the budget; record the decision.
4. Write both formulas and numbers into `queue.derivation`.

### Output
Queue bounds.

### Quality Gate
- `queue.max_messages >= 1` and the derivation shows each input with its source.

---

## Phase 3: Fix Overflow and Inbound Rules

### Entry Criteria
- Queue bounds exist.

### Actions
1. Overflow behavior when a new message arrives and the queue is full, by class:
   - `drop`: discard the new message (or the oldest of the same type); increment `realtime_dropped_total{type}`.
   - `coalesce`: if a message with the same `coalesce_key` is queued, replace it in place; otherwise treat as `must_deliver`.
   - `must_deliver`: the client cannot keep up. Apply `slow_consumer_action`.
2. `slow_consumer_action` is always "close the connection with the slow-consumer close code from `rtw-close-code-map` (4020) and let the client resume from its last `seq`". Do not block the publisher waiting for one slow socket: in a fan-out, one blocked write stalls every other subscriber on that loop or goroutine.
3. Signals each stack exposes (used by the stack server flows):
   - Node `ws`: `ws.bufferedAmount` is the number of bytes queued but not yet sent. Check it before `ws.send()`.
   - Python asyncio: Starlette does not expose the transport buffer; use a bounded `asyncio.Queue(maxsize=max_messages)` per connection with one sender task, and `put_nowait()` raising `asyncio.QueueFull` signals overflow.
   - Go gorilla: a buffered `chan []byte` of size `max_messages` per connection drained by one writer goroutine; a `select` with a `default:` branch detects a full channel. Set `conn.SetWriteDeadline` before every write so a stuck TCP write also fails.
4. Inbound limit: c2s messages are rate limited per connection with a token bucket. `messages_per_s` and `burst` come from the owner or from the product's existing REST rate limits; record the `source`. Exceeding the limit closes with 4029. The server must also enforce `max_message_bytes` on reads (library read limit), which closes with 1009.
5. `metrics`: `realtime_send_queue_depth` (histogram or gauge per node), `realtime_dropped_total{type}`, `realtime_coalesced_total{type}`, `realtime_slow_consumer_closes_total`, `realtime_inbound_limited_total`.

### Output
`backpressure_policy`.

### Quality Gate
- Each class has an overflow behavior written as one sentence.
- `inbound_limit.source` names a person or an existing config file, not "default".
- Five metric names are listed.

---

## Worked Example

Illustrative only.

Types: `cursor.moved` (droppable), `doc.snapshot` (full doc state), `comment.added`.
- Classes: `cursor.moved` drop; `doc.snapshot` coalesce on `stream + doc_id`; `comment.added` must_deliver.
- Owner budget: 262144 bytes per connection. `max_message_bytes = 65536` (set in the envelope flow). `max_messages = floor(262144 / 65536) = 4`.
- A phone on a weak signal falls behind during a comment burst; the fifth `comment.added` finds the queue full of must-deliver items; server closes with 4020; the client reconnects and sends `sys.resume {"room:9": 341}`; replay fills the gap.
- Inbound: owner copies the REST limit from `config/ratelimits.yaml`: 20 per second, burst 40.

---

## Exit Criteria

DONE when every s2c type has a class, the queue bound is derived from sourced numbers, overflow and slow-consumer actions are fixed, and inbound limits cite their source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A type is both droppable and must-deliver per the owner | **Return** to the owner; it cannot be both. |
| Phase 2 | Owner gives no memory budget and no capacity target exists | **Stop**: record both as open questions; the queue cannot be sized. |
| Phase 3 | Team wants to block the publisher instead of closing slow clients | **Adjust**: allow blocking only for a single-subscriber stream; record the risk for fan-out. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
