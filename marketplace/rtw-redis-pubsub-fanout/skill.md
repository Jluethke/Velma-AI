# Redis Pub/Sub Fan-out Across Server Nodes

**One-line description:** Scales a realtime server horizontally by having each node hold one Redis subscriber connection with reference-counted channel subscriptions, publishing from any node, and delivering to local sockets, with the at-most-once limits of Redis Pub/Sub stated and a two-node test proving cross-node delivery.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Service repository.
- `stack` (string, required): `node`, `python` or `go`.
- `delivery_contract` (object, required): From `rtw-delivery-contract`; decides whether Pub/Sub alone is enough.
- `redis_url` (string, required): Redis connection URL for development and tests, for example `redis://localhost:6379/0`.

---

## Outputs

- `fanout_impl` (object): `{ channel_naming, client_library, files_changed: [], two_node_check: { command, observed }, pubsub_limits_acknowledged: [], cluster_mode: "standalone" | "cluster-sharded" }`.

---

## Phase 1: Confirm Pub/Sub Fits

### Entry Criteria
- Inputs present; `redis-cli -u <redis_url> PING` prints `PONG`.

### Actions
1. Record these Redis Pub/Sub properties (Redis docs, "Redis Pub/Sub") in `pubsub_limits_acknowledged`:
   - At-most-once: a message published while a subscriber is disconnected is lost for that subscriber. There is no replay.
   - `PUBLISH` returns the number of clients that received the message (on the node it was sent to); 0 means nobody was subscribed.
   - A slow subscriber is disconnected when its output buffer passes `client-output-buffer-limit pubsub` (default `32mb 8mb 60`). Read the current value with `redis-cli CONFIG GET client-output-buffer-limit`.
   - A connection in subscribe mode (RESP2) can only run subscribe-family commands, `PING` and `QUIT`; use a separate connection for normal commands.
2. Decide with `delivery_contract.replay_required`:
   - `false`: Pub/Sub alone is enough.
   - `true`: use Pub/Sub only as the live wake-up signal and Redis Streams as the source of truth; continue here, then run `rtw-redis-streams-replay`.
3. Cluster: if `redis-cli -u <redis_url> CLUSTER INFO` returns `cluster_state:ok`, classic `PUBLISH` is broadcast to every node of the cluster. For Redis 7.0+ use sharded Pub/Sub (`SPUBLISH`/`SSUBSCRIBE`), which routes by channel hash slot. Set `cluster_mode` accordingly.

### Output
Fit decision and `cluster_mode`.

### Quality Gate
- The `client-output-buffer-limit` value is pasted from `CONFIG GET` (or noted as not readable on a managed service, with the provider docs value).

---

## Phase 2: Implement Subscribe and Publish

### Entry Criteria
- Phase 1 complete.

### Actions
1. Channel naming: `rt:<stream>` (for example `rt:room:42`). Use exact channels, not `PSUBSCRIBE` patterns, unless one node truly needs every channel; pattern matching runs for every published message.
2. One subscriber connection per process, with a local map `channel -> set of local sockets`:
   - First local socket joins `rt:room:42`: `SUBSCRIBE rt:room:42`. Later sockets only add to the set.
   - Last local socket leaves: `UNSUBSCRIBE rt:room:42`.
   - Do NOT open one Redis subscriber per WebSocket. Ten thousand sockets would open ten thousand Redis connections.
3. Library calls per `stack` (check the installed version's docs):
   - Node, node-redis v4+: `const sub = client.duplicate(); await sub.connect(); await sub.subscribe('rt:room:42', (message, channel) => deliverLocal(channel, message));` Publishing uses the normal client: `await client.publish(channel, payload)`.
   - Node, ioredis: `sub.subscribe('rt:room:42'); sub.on('message', (channel, message) => ...)`.
   - Python, redis-py asyncio: `pubsub = r.pubsub(); await pubsub.subscribe('rt:room:42'); async for m in pubsub.listen(): if m['type'] == 'message': ...`. Run the listener as one background task started in the app lifespan.
   - Go, go-redis v9: `ps := rdb.Subscribe(ctx, "rt:room:42"); ch := ps.Channel(); for m := range ch { deliverLocal(m.Channel, m.Payload) }`; add channels later with `ps.Subscribe(ctx, more...)`.
4. Local delivery goes through the per-connection send function from the stack server flow, so backpressure rules still apply.
5. Publishing: any node may publish the envelope (already carrying `seq` from the sequence assigner). Never publish before the database commit that created the event, or clients see events that roll back.
6. Reconnect: on subscriber connection loss, resubscribe every channel in the local map after reconnecting, and mark every local stream "possibly gapped" so clients resume (or receive a resync) per `delivery_contract`.

### Output
Fan-out code.

### Quality Gate
- `redis-cli -u <redis_url> PUBSUB NUMSUB rt:room:42` returns 1 per running node with a local socket in that room (each node has one subscriber connection).
- `grep -rn "subscribe(" src/` (or the stack equivalent) shows subscribe calls only in the fan-out module.

---

## Phase 3: Prove Cross-Node Delivery

### Entry Criteria
- Fan-out implemented.

### Actions
1. Start two instances on different ports against the same Redis: for example `PORT=8081 npm start` and `PORT=8082 npm start` (or the uvicorn / Go equivalents).
2. Connect client A to 8081 and client B to 8082, both subscribed to `room:42`, using `websocat` (`websocat ws://localhost:8081/ws?ticket=...`) or the project's test client.
3. Send a message from A. B must receive it. Record the result in `two_node_check`.
4. Direct publish check: `redis-cli -u <redis_url> PUBLISH rt:room:42 '{"v":1,"type":"sys.test","id":"t1","data":{}}'` must print `(integer) 2` (two node subscribers) and both clients receive it.
5. Subscriber recovery: restart Redis (`docker restart <redis>`), wait for reconnect logs, publish again; both clients must receive it, and each client must have received a resume or resync signal.
6. Automate steps 1 to 4 as an integration test in CI with a Redis service container.

### Output
`fanout_impl`.

### Quality Gate
- Step 4 prints `(integer) 2`.
- Step 5 delivers after the Redis restart (paste the client output).

---

## Worked Example

Illustrative only.

Stack python. Two uvicorn processes on 8081 and 8082.
```
$ redis-cli PUBSUB NUMSUB rt:room:42
1) "rt:room:42"
2) (integer) 2
$ redis-cli PUBLISH rt:room:42 '{"v":1,"type":"sys.test","id":"t1","data":{}}'
(integer) 2
```
Client B on 8082 printed `{"v":1,"type":"sys.test","id":"t1","data":{}}`. `delivery_contract.replay_required = true`, so `rtw-redis-streams-replay` runs next.

---

## Exit Criteria

DONE when each node has one subscriber connection with reference-counted channels, publishes happen after commit, Pub/Sub limits are recorded, and the two-node and Redis-restart checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Managed Redis disables `CONFIG GET` | **Adjust**: read the provider's documented value and cite it. |
| Phase 2 | "ERR only (P|S)SUBSCRIBE / (P|S)UNSUBSCRIBE / PING / QUIT allowed" | **Adjust**: a normal command went to the subscriber connection; use the separate client. |
| Phase 3 | PUBLISH returns 0 | **Retry** after checking channel names match exactly (`PUBSUB CHANNELS 'rt:*'`). |
| Phase 3 | Messages lost after Redis restart | **Return** to Action 6: resubscribe and signal resume. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
