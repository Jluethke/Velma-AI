# Redis Streams Replay for Reconnecting Clients

**One-line description:** Stores every must-deliver realtime event in a per-stream Redis Stream with `XADD` and a trim policy, uses the entry ID as the resume cursor, answers a reconnecting client's `sys.resume` with an exclusive `XRANGE` from its last ID, and returns a resync signal when the ID has been trimmed away.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Service repository.
- `stack` (string, required): `node`, `python` or `go`.
- `delivery_contract` (object, required): From `rtw-delivery-contract`; gives `replay_window`.
- `fanout_impl` (object, required): From `rtw-redis-pubsub-fanout`; the live path this flow backs up.
- `redis_url` (string, required): Redis connection URL.

---

## Outputs

- `replay_impl` (object): `{ key_naming, trim_policy, cursor_format, files_changed: [], checks: [ { command, observed } ] }`.

---

## Phase 1: Design Keys and Trimming

### Entry Criteria
- `redis-cli -u <redis_url> INFO server | grep redis_version` shows 6.2 or later (needed for exclusive ranges and `MINID`). If lower, see Error Handling.

### Actions
1. Key: `rs:<stream>` (for example `rs:room:42`), one Redis Stream per ordering scope.
2. Cursor: the entry ID `<milliseconds>-<sequence>` returned by `XADD`. It is unique and increasing within the key. Compare IDs by splitting on `-` and comparing both parts as integers; string comparison is wrong (`"9-0" > "10-0"` as strings).
3. Trim policy from `delivery_contract.replay_window`:
   - `kind = "count"`: `XADD rs:room:42 MAXLEN ~ <value> * env <json>`. The `~` allows Redis to trim in whole macro nodes, which is cheaper; the stream may hold somewhat more than `<value>` entries.
   - `kind = "time"`: `XADD rs:room:42 MINID ~ <now_ms - window_ms> * env <json>` (Redis 6.2+).
4. If the envelope `seq` is assigned elsewhere (outbox), store it as a field (`seq <n>`) and still use the stream ID for range reads; record both in `cursor_format`.

### Output
Key, cursor and trim design.

### Quality Gate
- `trim_policy` uses `MAXLEN ~` or `MINID ~` with the value from `delivery_contract.replay_window` and its source.

---

## Phase 2: Implement Write and Resume

### Entry Criteria
- Design fixed.

### Actions
1. Write path: after the database commit, `XADD` the envelope, then `PUBLISH` the same payload (with the returned ID as `seq`) for live delivery. Do both in one Lua script (`EVAL`/`EVALSHA`, or a Redis 7 function): `local id = redis.call('XADD', KEYS[1], 'MAXLEN', '~', ARGV[1], '*', 'env', ARGV[2]); redis.call('PUBLISH', KEYS[2], id .. ' ' .. ARGV[2]); return id`. `MULTI`/`EXEC` cannot do this because the published payload needs the ID that `XADD` returns. In Redis Cluster both keys must hash to the same slot, so use a hash tag such as `rs:{room:42}` and `rt:{room:42}`.
2. Resume path on `sys.resume { "room:42": "1729433000000-3" }`:
   1. Authorize the stream.
   2. Read the oldest retained ID: `XINFO STREAM rs:room:42` (field `first-entry`) or `XRANGE rs:room:42 - + COUNT 1`.
   3. If the client ID is older than the first retained ID, the gap cannot be filled: send `sys.snapshot_required` (or close with the resync code from `rtw-close-code-map`) and stop.
   4. Otherwise `XRANGE rs:room:42 (1729433000000-3 + COUNT <page>`. The `(` prefix makes the start exclusive. Page through with the last returned ID until fewer than `<page>` entries return. `<page>` is a user decision; record it.
   5. Send replayed entries through the normal send function, then mark the connection live.
3. Live/replay race: subscribe the connection to the live channel BEFORE running the `XRANGE`, buffer live messages during replay, then drop buffered ones with ID <= the last replayed ID. Without this, events published during replay are lost.
4. Library calls (check installed docs): node-redis `client.xAdd(key, '*', fields, { TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold } })` and `client.xRange(key, '(' + id, '+', { COUNT })`; redis-py `await r.xadd(key, fields, maxlen=n, approximate=True)` and `await r.xrange(key, min='(' + id, max='+', count=n)`; go-redis v9 `rdb.XAdd(ctx, &redis.XAddArgs{Stream: key, MaxLen: n, Approx: true, Values: m})` and `rdb.XRangeN(ctx, key, "("+id, "+", n)`.
5. Do NOT use `XREAD BLOCK ... $` as the replay mechanism; `$` means "only new entries from now" and skips everything the client missed.

### Output
Write and resume code.

### Quality Gate
- `grep -rn "XRANGE\|xRange\|xrange\|XRangeN" src/` shows the exclusive `(` start.
- Build check for the stack exits 0.

---

## Phase 3: Verify Replay and Trimming

### Entry Criteria
- Code running against `redis_url`.

### Actions
1. Publish five events to `room:42`. Run `redis-cli XRANGE rs:room:42 - +` and note the second ID, `ID2`.
2. Exclusive range: `redis-cli XRANGE rs:room:42 "(ID2" +` returns exactly three entries.
3. Client resume: connect a client with `sys.resume {"room:42":"ID2"}`; it must receive events 3, 4, 5 in order and no duplicate of event 2.
4. Trim: set a small test trim value, publish enough events to trim, run `redis-cli XLEN rs:room:42` and `redis-cli XINFO STREAM rs:room:42`, then resume from an ID older than `first-entry`. Expect `sys.snapshot_required`.
5. Race: during a replay of many entries, publish a new event; the client must receive it exactly once, after the replayed entries.
6. Record each command and observed output in `checks`.

### Output
`replay_impl`.

### Quality Gate
- Step 2 returns three entries; step 3 receives exactly events 3 to 5; step 4 returns the resync signal; step 5 shows no loss and no duplicate.

---

## Worked Example

Illustrative only.

```
$ redis-cli XADD rs:room:42 MAXLEN ~ 1000 '*' env '{"type":"chat.message_posted",...}'
"1729433000000-0"
$ redis-cli XRANGE rs:room:42 "(1729433000000-1" +
1) 1) "1729433000000-2"
   2) 1) "env"
      2) "{...}"
2) ...
$ redis-cli XINFO STREAM rs:room:42
 ...
 "first-entry"
 1) "1729432990000-0"
```
A client resuming from `1729432000000-0` (older than `first-entry`) received `{"type":"sys.snapshot_required","data":{"stream":"room:42"}}` and fetched the snapshot endpoint.

---

## Exit Criteria

DONE when every must-deliver event is stored with a sourced trim policy, resume replays exactly the missed entries with an exclusive range, trimmed cursors trigger a snapshot, and the live/replay race delivers each event once.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Redis older than 6.2 | **Adjust**: use `MAXLEN ~` only, and emulate exclusive start by incrementing the ID's sequence part by one; upgrade when possible. |
| Phase 2 | Memory grows without bound | **Stop**: an `XADD` path lacks the trim argument; grep every `XADD`. |
| Phase 3 | Duplicate of the resume ID delivered | **Adjust**: the range start is inclusive; add the `(` prefix. |
| Phase 3 | Event published during replay is lost | **Return** to Action 3: subscribe before replay and buffer. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
