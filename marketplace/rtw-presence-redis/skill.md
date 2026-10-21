# Presence Tracking with Redis Sorted Sets

**One-line description:** Implements who-is-online presence across server nodes with one Redis sorted set per room scored by last heartbeat time from the Redis clock, a TTL derived from the heartbeat interval, per-user aggregation across devices, debounced leave events, and cleanup that survives a node crash.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Service repository.
- `stack` (string, required): `node`, `python` or `go`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`; gives `interval_s` and `tolerated_missed`.
- `redis_url` (string, required): Redis connection URL.

---

## Outputs

- `presence_impl` (object): `{ key_naming, ttl_s, ttl_derivation, leave_grace_s, lua_scripts: [], files_changed: [], checks: [] }`.

---

## Phase 1: Design the Data Model

### Entry Criteria
- Inputs present.

### Actions
1. Keys:
   - `pr:<room>`: sorted set; member `<user_id>:<conn_id>`; score = last-seen time in milliseconds.
   - Online users are derived by grouping members by the `user_id` prefix. A user with two tabs has two members and stays online until both expire.
2. Derive `ttl_s`: a connection is alive if it refreshed within `interval_s * (tolerated_missed + 1)`. Set `ttl_s` to that value. Write the arithmetic in `ttl_derivation`.
3. Clock: take "now" from Redis (`TIME` inside the Lua script), not from each node. Node clocks differ; one fast clock would keep its users online forever or expire others early.
4. Do NOT use a plain key per connection with `EXPIRE` plus `KEYS pr:*` to list them. `KEYS` blocks Redis; Redis docs warn against it in production. A sorted set answers "who is in this room" with one range read.
5. `leave_grace_s`: how long to wait after a user's last member disappears before announcing "left", so a reconnect after a network blip does not flicker offline/online. This is a product decision; record the owner and value. If none, set it equal to `ttl_s` and record the open question.

### Output
Data model with `ttl_s` and `leave_grace_s`.

### Quality Gate
- `ttl_s = interval_s * (tolerated_missed + 1)` with numbers shown.
- Every timestamp in the design comes from Redis `TIME`.

---

## Phase 2: Implement with Lua Scripts

### Entry Criteria
- Design fixed.

### Actions
1. `touch.lua` (called on connect and on every heartbeat or pong, per connection and room):
   `local t = redis.call('TIME'); local now = t[1]*1000 + math.floor(t[2]/1000); local isNew = redis.call('ZADD', KEYS[1], now, ARGV[1]); redis.call('PEXPIRE', KEYS[1], ARGV[2]); return isNew`
   with `KEYS[1] = pr:<room>`, `ARGV[1] = user:conn`, `ARGV[2] = ttl_s*1000` (every touch pushes the key expiry forward, so the whole key disappears only when no connection in the room refreshed within `ttl_s`).
2. `sweep.lua` (run on a timer every `interval_s` by every node; it is idempotent):
   `local t = redis.call('TIME'); local now = t[1]*1000 + math.floor(t[2]/1000); local dead = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', now - ARGV[1]); if #dead > 0 then redis.call('ZREM', KEYS[1], unpack(dead)) end; return dead`
   with `ARGV[1] = ttl_s*1000`. Returned members are connections that died without a clean close (node crash, half-open TCP).
3. Clean disconnect: `ZREM pr:<room> user:conn` immediately.
4. Join/leave events: after `touch` returns 1, check whether the user had other members (`ZRANGEBYSCORE` filtered by prefix, or keep a second hash `pu:<room>` with per-user connection counts updated in the same scripts). Publish `presence.joined` only for the user's first connection. For leaves, schedule a check after `leave_grace_s`; publish `presence.left` only if the user still has zero members then.
5. Room list for a newly joined client: `ZRANGEBYSCORE pr:<room> <now - ttl_ms> +inf`, grouped by user. Send as a `presence.snapshot` message, then apply join/leave deltas.
6. Load scripts once with `SCRIPT LOAD` (or the client library's script helper: node-redis `defineScript`, redis-py `register_script`, go-redis `redis.NewScript`) and call with `EVALSHA`.
7. Cluster: one room uses one key per script call, so scripts are slot-safe. If you add the `pu:<room>` hash, use hash tags `pr:{room}` and `pu:{room}`.

### Output
Presence module and scripts.

### Quality Gate
- `redis-cli -u <redis_url> --eval touch.lua pr:room:42 , u1:c1 120000` returns 1 then 0 on a second run.
- Build check for the stack exits 0.

---

## Phase 3: Verify Behavior

### Entry Criteria
- Presence module running on two nodes.

### Actions
1. Two tabs for user u1 (one per node), one for u2. Run `redis-cli ZRANGE pr:room:42 0 -1 WITHSCORES`: three members. The room list shows two users.
2. Close one u1 tab cleanly: two members remain; no `presence.left` for u1.
3. Kill one node with `kill -9 <pid>` (no clean close). Within `ttl_s + interval_s`, the sweep removes that node's members; `presence.left` fires only after `leave_grace_s` and only for users with no other member.
4. Blip: drop a client's network for less than `leave_grace_s` (use toxiproxy `toggle` or disable Wi-Fi) and reconnect: no left/joined pair is published.
5. Record each observation with timestamps in `checks`.

### Output
`presence_impl`.

### Quality Gate
- Steps 1 to 4 produce the stated member counts and events (paste `ZRANGE` output and the client event log).

---

## Worked Example

Illustrative only.

`heartbeat_config`: `interval_s = 29`, `tolerated_missed = 1`, so `ttl_s = 58`. Owner sets `leave_grace_s = 10`.
```
$ redis-cli ZRANGE pr:room:42 0 -1 WITHSCORES
1) "u1:c-a"
2) "1729433001123"
3) "u1:c-b"
4) "1729433002456"
5) "u2:c-c"
6) "1729433003789"
```
After `kill -9` of node B (holding `u1:c-b`), the sweep 61 s later returned `["u1:c-b"]`; u1 still had `u1:c-a`, so no `presence.left` was sent.

---

## Exit Criteria

DONE when presence uses Redis time, a derived TTL, per-user aggregation, debounced leaves and an idempotent sweep, and the four behavior checks pass including a hard node kill.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Heartbeat config missing | **Stop**: TTL cannot be derived without the interval. |
| Phase 2 | Script fails with a "write commands not allowed after non deterministic commands" error | **Adjust**: this happens on Redis below 5.0, which replicates scripts verbatim; call `redis.replicate_commands()` first in the script, or upgrade; check `redis_version` with `INFO server`. |
| Phase 3 | Users never go offline after a node kill | **Return** to the sweep timer; confirm every node runs it. |
| Phase 3 | Online/offline flicker on reconnect | **Adjust** `leave_grace_s` with the owner; do not remove the debounce. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
