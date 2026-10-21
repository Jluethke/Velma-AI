# Long Polling Endpoint with Cursor

**One-line description:** Implements an HTTP long-polling endpoint that holds a request until events newer than the client's cursor exist or a hold time derived from the smallest proxy idle timeout passes, returns events with the next cursor (or 204), and is verified with timed curl calls.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Service repository.
- `stack` (string, required): `node`, `python` or `go`.
- `protocol_spec` (object, required): From `rtw-message-envelope`.
- `auth_design` (object, required): From `rtw-connection-auth`. Long polling is ordinary HTTP, so the normal `Authorization` header or session cookie works.
- `network_path` (object[], required): Hops with idle timeouts (same input as `rtw-heartbeat-config`).
- `delivery_contract` (object, required): From `rtw-delivery-contract`.

---

## Outputs

- `long_poll_impl` (object): `{ route, hold_s, hold_derivation, response_shapes, curl_checks: [], test_summary }`.

---

## Phase 1: Define the Contract

### Entry Criteria
- Inputs present.

### Actions
1. Route: `GET /v1/poll?cursor=<cursor>&streams=<comma list>`. The cursor has the same meaning as `seq` per stream in `delivery_contract` (for multiple streams, `room:42=341,room:9=12`).
2. Response shapes:
   - `200 { events: [envelope...], cursor: "<next>" }` when at least one event with `seq > cursor` exists.
   - `204 No Content` when the hold time passes with no events. The client re-polls with the same cursor.
   - `409 { reason: "snapshot_required" }` when the cursor is older than the replay window.
   - `401`/`403` per `auth_design`; `429` with `Retry-After` when rate limited.
3. Derive `hold_s`: the request must finish before any hop's idle or read timeout fires, or the client sees a 504 from the proxy. Let `min_hop_s` be the smallest timeout in `network_path`. `hold_s` must satisfy `hold_s < min_hop_s`. Ask the owner how much margin to keep for server processing; record it. `hold_s = min_hop_s - margin`. Write the arithmetic into `hold_derivation`.
4. Add `Cache-Control: no-store` to every response so no proxy caches a poll result.

### Output
Contract and `hold_s`.

### Quality Gate
- `hold_s < min_hop_s` holds with the numbers shown.
- Every response shape lists its status code and body.

---

## Phase 2: Implement

### Entry Criteria
- Contract fixed.

### Actions
1. Algorithm, all stacks:
   1. Authenticate and authorize every stream in `streams`.
   2. Read events with `seq > cursor` from the replay store. If any, return 200 immediately.
   3. Otherwise subscribe to the live notification for those streams, then read the store once more (an event can arrive between step 2 and the subscribe; this second read closes that race).
   4. Wait for a notification or `hold_s`, whichever is first. On notification, read the store and return 200; on timeout, return 204.
   5. Always unsubscribe in a `finally`/`defer` block. Cancel the wait if the client disconnects.
2. Node (Express): use `req.on('close', cancel)`; implement the wait with a `Promise.race` of the notification promise and `setTimeout(hold_s * 1000)`; `clearTimeout` on both paths.
3. Python (FastAPI): `await asyncio.wait_for(event.wait(), timeout=hold_s)` inside `try/except asyncio.TimeoutError: return Response(status_code=204)`; check `await request.is_disconnected()` is handled by cancellation when the server supports it.
4. Go: `select { case <-notify: ...; case <-time.After(hold); w.WriteHeader(http.StatusNoContent); case <-r.Context().Done(): return }`. Make sure the server `WriteTimeout` is greater than `hold_s`, or set a per-request deadline with `http.NewResponseController`.
5. Do NOT use a sleep-and-requery loop with a short sleep; it turns every idle client into constant database load. Use the notification (Redis pub/sub or an in-process condition) from `rtw-redis-pubsub-fanout`.

### Output
Endpoint code.

### Quality Gate
- The build or import check for the stack exits 0 (`npx tsc --noEmit`, `python -m py_compile`, `go build ./...`).
- `grep -rn "sleep" <route file>` shows no polling sleep inside the handler.

---

## Phase 3: Verify with curl

### Entry Criteria
- Service running locally.

### Actions
1. Idle hold: `time curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $T" "http://localhost:PORT/v1/poll?cursor=room:42=341&streams=room:42"`. Expect `204` and a real time close to `hold_s`.
2. Wake-up: start the same curl, then publish an event to `room:42` from another terminal. Expect `200` within a short time and a body with `seq` 342 and `cursor` `room:42=342`.
3. Immediate return: poll with an old cursor such as `room:42=300` while events 301 to 342 exist. Expect `200` immediately.
4. Out of window: poll with a cursor older than the replay window. Expect `409`.
5. Through the proxy: repeat step 1 through the public URL. A `504` means `hold_s` is longer than a hop timeout; recheck `network_path`.
6. Paste each command and observed status into `curl_checks`.

### Output
`long_poll_impl`.

### Quality Gate
- Steps 1 to 4 return 204, 200, 200, 409 in that order.
- Step 5 returns 204, not 504.

---

## Worked Example

Illustrative only.

`network_path`: ALB 60 s, nginx `proxy_read_timeout` 60 s. Owner margin 5 s. `hold_s = 60 - 5 = 55`.
```
$ time curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $T" "http://localhost:8080/v1/poll?cursor=room:42=341&streams=room:42"
204
real    0m55.031s
$ curl -s -H "Authorization: Bearer $T" "http://localhost:8080/v1/poll?cursor=room:42=300&streams=room:42" | jq '.events | length, .cursor'
42
"room:42=342"
```

---

## Exit Criteria

DONE when the endpoint returns events newer than the cursor immediately, holds idle requests for a derived `hold_s` below every hop timeout, returns 204 or 409 per the contract, and the curl checks match through the proxy.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A hop timeout is unknown | **Stop**: `hold_s` cannot be derived; measure the hop or get its config first. |
| Phase 2 | Events published between read and subscribe are missed | **Adjust**: add the second store read after subscribing (Action 1.3). |
| Phase 3 | Proxy returns 504 | **Adjust**: lower `hold_s` or raise the hop timeout; record which. |
| Phase 3 | 200 returned with an empty `events` list | **Return** to the handler: an empty result must be 204. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
