# Cache Event Invalidation Pipeline

**One-line description:** Builds event-based cache invalidation for data written outside the service, using a transactional outbox or Debezium CDC as the source and Redis Streams consumer groups (at-least-once) or Redis pub/sub (fire-and-forget, in-process copies only) as transport, with idempotent deletes and a measured end-to-end invalidation lag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository that will host the invalidation consumer.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`, used to map a changed row to cache keys.
- `invalidation_plan` (object[], required): Rows with strategy `event-based` from `cache-invalidation-strategy-select`.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `invalidation_consumer` (object): Event source, transport, consumer code location, row-to-key mapping, delivery guarantee, measured invalidation lag p50 and p99, and the test results including the consumer-restart test.

---

## Phase 1: Choose Source and Transport

### Entry Criteria
- `invalidation_plan` has at least one `event-based` row with its external writers listed.

### Actions
1. Choose the event source, first match:

   | Row | Condition | Source |
   |---|---|---|
   | 1 | All writers are services you can change | Transactional outbox: each writer inserts an `outbox` row (entity, id, version) in the SAME transaction as the data change; a relay reads and publishes it |
   | 2 | Some writers cannot be changed (other teams' jobs, manual SQL) and the database is Postgres or MySQL | CDC with Debezium reading the WAL or binlog (Postgres connector with `plugin.name=pgoutput`, which needs `wal_level=logical`) |
   | 3 | Neither is possible | Stop; event-based is not achievable; return to TTL-only with the staleness recorded |

2. Choose the transport, first match:

   | Row | Condition | Transport |
   |---|---|---|
   | 1 | Kafka already carries CDC events (Debezium usually writes to Kafka) | Consume the Kafka topic with a consumer group |
   | 2 | Invalidating a shared Redis cache | Redis Streams: `XADD`, consumer group with `XGROUP CREATE ... MKSTREAM`, `XREADGROUP`, `XACK` |
   | 3 | Only clearing in-process copies in many processes, TTL backstop exists | Redis pub/sub `PUBLISH`/`SUBSCRIBE`; messages sent while a subscriber is disconnected are lost, so the TTL is the bound for those |
   | 4 | Clearing in-process copies held in Redis-connected clients | Redis server-assisted client-side caching, `CLIENT TRACKING ON BCAST PREFIX <prefix>` (Redis 6 and later); check that your client library supports it |

### Output
Source and transport with table rows.

### Quality Gate
- Both choices cite a row number.
- For CDC, `SHOW wal_level;` output is recorded (must be `logical`).

---

## Phase 2: Build the Consumer

### Entry Criteria
- Source and transport chosen.

### Actions
1. Write the row-to-keys mapping as one function using the key builder module: given (entity, id, tenant), return every cache key that contains that row, including list or search keys. For list keys, prefer bumping a namespace generation (`INCR`) over finding each list key.
2. Consumer loop (Redis Streams example):
   - `XREADGROUP GROUP cache-inval <consumer-name> COUNT <n> BLOCK <ms> STREAMS inval-stream >`
   - For each message: compute keys, `DEL` (or `UNLINK` for large values) them, then `XACK inval-stream cache-inval <id>`.
   - On startup, first process this consumer's pending entries with `XREADGROUP ... STREAMS inval-stream 0` before reading `>`, so messages read but not acked before a crash are not lost.
   - `COUNT` and `BLOCK` values are user inputs.
3. Deletes must be idempotent and order-free: deleting twice or out of order is safe; never SET from the consumer.
4. Bound the stream: `XADD inval-stream MAXLEN ~ <n> * ...`. The bound must cover the longest consumer outage you want to survive at peak write rate; that number is a user input.
5. Python libraries: `redis-py` (`xreadgroup`, `xack`). Node: node-redis `xReadGroup`, `xAck`. Go: go-redis `XReadGroup`, `XAck`. Java: Spring Data Redis `StreamMessageListenerContainer`. Check the method names in the installed client's docs.
6. Tests: one test per case, against a real Redis in Docker: a message deletes its keys; a duplicate message is harmless; a consumer killed after read but before ack reprocesses the message on restart.

### Output
Consumer code and passing tests.

### Quality Gate
- All three tests pass, with output recorded.
- `redis-cli XINFO GROUPS inval-stream` shows `pending` 0 after the test run.

---

## Phase 3: Measure Lag

### Entry Criteria
- Consumer runs in staging.

### Actions
1. Stamp each event with the commit time (outbox `created_at`, or the Debezium `source.ts_ms`).
2. In the consumer, record `now - commit_time` per message into a histogram metric.
3. Run a staging write load and read the p50 and p99 of that histogram. This lag is the residual staleness window; compare it to `staleness_tolerance`.
4. Watch consumer backlog: `XINFO GROUPS inval-stream` field `lag` (Redis 7 and later) or `XPENDING inval-stream cache-inval`.

### Output
`invalidation_consumer`.

### Quality Gate
- p50 and p99 lag are recorded from the histogram, with the query used.
- p99 lag is at or under the entry's `staleness_tolerance`, or the gap is reported.

---

## Worked Example

Illustrative. Nightly price import in another repo, Postgres 16, shared Redis.

Phase 1: source row 2 (import job cannot change) with Debezium pgoutput; `SHOW wal_level;` prints `logical`. Transport row 1 (Kafka topic `shop.public.products`).

Phase 2: Python consumer maps `products` change `{id: 42}` to `shop:product:v3:42` and `INCR shop:gen:psearch`. Tests: 3 passed.

Phase 3: during a 50,000 row import, lag p50 0.8 s, p99 4.2 s, under the 30 s tolerance.

---

## Exit Criteria

DONE when every external write produces an invalidation that survives consumer restarts, deletes are idempotent, and the measured p99 lag is within tolerance or reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `wal_level` is not `logical` and cannot be changed | **Adjust**: use the outbox if writers can change, else **Stop** and return to TTL-only. |
| Phase 2 | Pending entries grow and never ack | **Adjust**: the consumer crashes on a malformed message; log and ack it to a dead-letter stream after recording. |
| Phase 2 | Pub/sub chosen for a shared cache | **Stop**: lost messages leave stale data until TTL; use Streams or Kafka. |
| Phase 3 | p99 lag above tolerance | **Return**: report the gap with the numbers; do not hide it with a shorter TTL claim. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
