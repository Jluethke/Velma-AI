# Scale Socket.IO Across Nodes with a Redis Adapter

**One-line description:** Scales a Node.js Socket.IO v4 server across processes and hosts with `@socket.io/redis-streams-adapter` (or `@socket.io/redis-adapter`), decides between sticky sessions and WebSocket-only transport, sets `pingInterval`/`pingTimeout` from the heartbeat config, enables connection state recovery only with an adapter that supports it, and proves cross-node `io.to(room).emit` with two instances.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Node.js repository using `socket.io` v4 on the server.
- `transport_decision` (object, required): From `rtw-transport-decision`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`.
- `redis_url` (string, required): Redis connection URL.

---

## Outputs

- `socketio_impl` (object): `{ socketio_version, adapter, transports, sticky_required: bool, ping: { interval_ms, timeout_ms }, state_recovery: bool, files_changed: [], two_node_check }`.

---

## Phase 1: Choose Adapter and Transport Mode

### Entry Criteria
- `npm ls socket.io` shows a 4.x version.

### Actions
1. Record `npm ls socket.io socket.io-client`. Server and client majors must match (both 4.x).
2. Transport mode, from the Socket.IO docs "Using multiple nodes":
   - Default client transports start with HTTP long-polling and upgrade to WebSocket. Long-polling sends several HTTP requests per session, and each must reach the same node, so sticky sessions are required.
   - If every client can use WebSocket directly (`transport_decision.fallback` is `none`), set the client option `transports: ["websocket"]`; then sticky sessions are not required.
   - Otherwise keep polling and configure stickiness in the load balancer (`rtw-nginx-ws-proxy`, `rtw-haproxy-ws-proxy` or `rtw-aws-alb-ws` with `needs_sticky_sessions = true`). Within one host using Node `cluster`, use `@socket.io/sticky`.
   Record `transports` and `sticky_required`.
3. Adapter table:

| Need | Adapter | Notes |
|---|---|---|
| Rooms and broadcast across nodes, no recovery | `@socket.io/redis-adapter` | Uses Redis Pub/Sub; sharded Pub/Sub supported via its sharded variant on Redis 7 (check package docs). |
| Plus connection state recovery after short disconnects | `@socket.io/redis-streams-adapter` | Uses one Redis Stream; the classic Redis adapter does not support connection state recovery per the Socket.IO docs. |

4. Do NOT mix this with the hand-written fan-out from `rtw-redis-pubsub-fanout` for the same events; Socket.IO adds its own packet framing.

### Output
Adapter, transports and stickiness decision.

### Quality Gate
- `sticky_required` is false only when the client is forced to `transports: ["websocket"]` (grep the client for `transports:` and paste the line).

---

## Phase 2: Configure the Server

### Entry Criteria
- Decisions recorded.

### Actions
1. Install: `npm install redis @socket.io/redis-streams-adapter` (or `@socket.io/redis-adapter`).
2. Server setup (redis-streams adapter):
   ```
   const redisClient = createClient({ url: process.env.REDIS_URL });
   await redisClient.connect();
   const io = new Server(httpServer, {
     adapter: createAdapter(redisClient),
     pingInterval: <interval_ms>,
     pingTimeout: <timeout_ms>,
     connectionStateRecovery: { maxDisconnectionDuration: <ms>, skipMiddlewares: true }
   });
   ```
   For `@socket.io/redis-adapter`: `const pub = createClient(...); const sub = pub.duplicate(); await Promise.all([pub.connect(), sub.connect()]); io.adapter(createAdapter(pub, sub));` and omit `connectionStateRecovery`.
3. Heartbeat: Socket.IO v4 defaults are `pingInterval` 25000 ms and `pingTimeout` 20000 ms. Set `pingInterval = heartbeat_config.interval_s * 1000` and `pingTimeout = heartbeat_config.pong_timeout_s * 1000` so the proxy idle rule holds. Socket.IO's ping is an Engine.IO packet (data), so it keeps proxies alive.
4. `maxDisconnectionDuration`: how long the server keeps a disconnected session's rooms and missed packets. It is a product decision; record the owner. Recovery is best effort: check `socket.recovered` in the `connection` handler and run the full resync path when it is false.
5. Auth: put the ticket check in `io.use((socket, next) => ...)` reading `socket.handshake.auth`. With `skipMiddlewares: true`, recovered sessions skip middleware; set it to false if auth must rerun on recovery.
6. Origin: set `cors: { origin: [<exact origins>], credentials: true }`. Socket.IO's CORS option applies to the polling transport; also enforce an exact Origin allowlist with `allowRequest: (req, cb) => cb(null, ALLOWED.has(req.headers.origin))` so WebSocket upgrades are checked too.

### Output
Configured server.

### Quality Gate
- `npx tsc --noEmit` or `node --check` on the server entry exits 0.
- After one room emit, `redis-cli -u <redis_url> PUBSUB CHANNELS 'socket.io*'` lists channels (redis-adapter), or `redis-cli -u <redis_url> XLEN socket.io` returns a count above 0 (streams adapter; `socket.io` is the default stream name, confirm it in the package README). Do not use `KEYS` on a shared Redis.

---

## Phase 3: Prove Cross-Node Broadcast

### Entry Criteria
- Server builds.

### Actions
1. Start two instances: `PORT=3001 node server.js` and `PORT=3002 node server.js`.
2. With `socket.io-client` in a small script, connect A to 3001 and B to 3002 (`transports: ["websocket"]` for the direct test), both `join` room `r1` via a server event.
3. A emits; the server does `io.to("r1").emit("msg", ...)`. B must receive it. Record in `two_node_check`.
4. Cross-node utility check: `const sockets = await io.in("r1").fetchSockets()` on node 3001 returns both sockets (it queries other nodes through the adapter).
5. Recovery (streams adapter only): drop B's network for less than `maxDisconnectionDuration` (Toxiproxy or `socket.io.engine.close()`), emit two messages, reconnect; B's `socket.recovered` is true and it receives both messages.
6. With polling enabled behind the load balancer, connect 20 clients and check server logs for `Session ID unknown` (Engine.IO error code 1). Any occurrence means stickiness is broken.

### Output
`socketio_impl`.

### Quality Gate
- B receives A's room broadcast; `fetchSockets()` returns 2; recovery delivers both messages (streams adapter); zero `Session ID unknown` errors (paste outputs).

---

## Worked Example

Illustrative only.

`transport_decision.fallback = "long-polling"`, so polling stays on and sticky sessions are required (nginx `hash $cookie_io consistent` is not usable before the cookie exists, so `ip_hash` was chosen). Adapter: redis-streams for recovery. `heartbeat_config`: interval 29 s, pong timeout 20 s, so `pingInterval: 29000`, `pingTimeout: 20000`.
```
node A(3001) -> io.to("r1").emit("msg", {seq: 77})
client B(3002) received: msg {"seq":77}
fetchSockets on 3001: 2
B reconnected after 4 s: recovered=true, received seq 78, 79
```

---

## Exit Criteria

DONE when the adapter and transport mode are chosen from the tables, ping settings follow the heartbeat config, origin checks cover both transports, recovery is enabled only with a supporting adapter, and two-node broadcast, `fetchSockets` and stickiness checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Socket.IO v2 or v3 on the server | **Stop**: upgrade to v4 first; adapters and options differ. |
| Phase 2 | `connectionStateRecovery` set with the classic redis-adapter | **Adjust**: switch to the streams adapter or remove recovery. |
| Phase 3 | `Session ID unknown` errors | **Adjust**: stickiness missing; fix the load balancer or force WebSocket-only transport. |
| Phase 3 | B does not receive A's broadcast | **Retry** after confirming both nodes use the same `redis_url` and adapter; check `PUBSUB CHANNELS` or `XLEN`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
