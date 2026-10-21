# Server-Sent Events Endpoint with Resume

**One-line description:** Implements an SSE endpoint that writes correctly framed `id:`/`event:`/`data:` records, sets the headers that stop proxy buffering and compression, sends comment keepalives, honors `Last-Event-ID` to resume from a sequence, and is verified with `curl -N` for streaming and resume behavior.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Service repository.
- `stack` (string, required): `node`, `python` or `go`.
- `protocol_spec` (object, required): From `rtw-message-envelope`.
- `auth_design` (object, required): From `rtw-connection-auth` (cookie or ticket; `EventSource` cannot send headers).
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`; gives the keepalive comment interval.
- `delivery_contract` (object, required): From `rtw-delivery-contract`; gives `seq` and the replay window.

---

## Outputs

- `sse_impl` (object): `{ files_changed: [], route, curl_checks: [ { command, observed } ], test_summary }`.

---

## Phase 1: Write the Framing and Headers

### Entry Criteria
- Inputs present.

### Actions
1. Wire format rules from the WHATWG HTML spec, section "Server-sent events":
   - A record is lines `field: value` ending with a blank line (`\n\n`).
   - `id: <seq>` sets the client's last event ID. Use the stream `seq` from `delivery_contract`, so a reconnect sends `Last-Event-ID: <seq>`. If one connection carries several streams, encode the cursor as one string (for example `room:42=341;room:9=12`) and parse it on resume.
   - `event: <type>` names the event; the browser dispatches it to `addEventListener('<type>')`, not to `onmessage`. Records without `event:` go to `onmessage`.
   - `data:` must not contain a raw newline. Serialize JSON on one line (`JSON.stringify`, `json.dumps(separators=(",", ":"))`, `json.Marshal`) or split into multiple `data:` lines.
   - `retry: <ms>` sets the browser's reconnect delay. Send it once at stream start only if the owner chose a value; otherwise leave the browser default and record that.
   - A line starting with `:` is a comment. Use `: ping\n\n` as the keepalive every `heartbeat_config.interval_s`.
2. Response headers:
   - `Content-Type: text/event-stream` (exactly; `EventSource` fails the connection on any other type).
   - `Cache-Control: no-cache`.
   - `X-Accel-Buffering: no` (tells nginx not to buffer this response).
   - Do NOT set `Connection: keep-alive` under HTTP/2; connection-specific headers are forbidden in HTTP/2. Under HTTP/1.1 it is harmless.
3. Exclude the route from compression middleware (`compression` in Express, `GZipMiddleware` in Starlette, `gziphandler` in Go). Compressors buffer output, so events arrive in bursts.

### Output
Framing function and header list.

### Quality Gate
- A unit test asserts that `frame({id: 5, event: "order.updated", data: {...}})` equals the exact string `id: 5\nevent: order.updated\ndata: {...}\n\n`.

---

## Phase 2: Implement Per Stack

### Entry Criteria
- Framing test passes.

### Actions
1. Node (Express): in the handler call `res.writeHead(200, headers)`, then `res.flushHeaders()`; write records with `res.write(frame)`. If `res.write` returns `false`, the socket buffer is full: stop writing until the `'drain'` event and apply the `backpressure` classes. On `req.on('close')` clear timers and unsubscribe.
2. Python (FastAPI): `return StreamingResponse(gen(request), media_type="text/event-stream", headers=headers)`. In `async def gen(request)`, loop: `if await request.is_disconnected(): break`; yield frames from the subscription queue with `asyncio.wait_for(queue.get(), timeout=interval_s)` and yield `": ping\n\n"` on timeout. The `sse-starlette` package (`EventSourceResponse`) is an alternative that handles pings; use it only if already a dependency.
3. Go (net/http): set headers on `w.Header()`, `w.WriteHeader(200)`, assert `flusher, ok := w.(http.Flusher)`; after each `fmt.Fprint(w, frame)` call `flusher.Flush()`. Exit on `<-r.Context().Done()`. Go 1.20+ also offers `http.NewResponseController(w).Flush()`. If the server sets `WriteTimeout`, it kills long streams: clear it for this route with `http.NewResponseController(w).SetWriteDeadline(time.Time{})` (Go 1.20+).
4. Resume, all stacks: read `Last-Event-ID` from the request header (and also from a `lastEventId` query parameter for clients that create a fresh `EventSource` after re-auth). Replay records with `seq > last` from the replay store before streaming live ones. If `last` is older than the replay window, send one `event: sys.snapshot_required` record and close.
5. Auth: the browser sends cookies; for tickets, read `?ticket=` on connect. On failure return 401 with no stream; `EventSource` then stops reconnecting and the client must handle `onerror` with `readyState === EventSource.CLOSED`.

### Output
SSE route in the chosen stack.

### Quality Gate
- `curl -s --max-time 2 -o /dev/null -w "%{http_code}\n" -b "session=..." http://localhost:PORT/events` prints `200` (curl exits 28 because of the timeout; that is expected for a stream). Do not use `curl -I`: HEAD does not exercise the stream.
- The same command without credentials prints `401`.

---

## Phase 3: Verify with curl

### Entry Criteria
- Service running locally.

### Actions
1. Streaming: `curl -N -s -H "Accept: text/event-stream" -b "session=..." http://localhost:PORT/events`. `-N` disables curl's own buffering. Expect records one by one and `: ping` every `interval_s`.
2. Headers: `curl -s -D - -o /dev/null --max-time 2 http://localhost:PORT/events` and confirm `content-type: text/event-stream` and no `content-encoding: gzip`, even when sending `-H "Accept-Encoding: gzip"`.
3. Resume: note an `id:` value N from step 1, publish two more events, then `curl -N -s -H "Last-Event-ID: N" ...`. The first records must be N+1 and N+2.
4. Through the proxy (if one exists): repeat step 1 through the public URL. Events arriving in bursts mean a buffering hop; fix in the proxy flow.
5. Paste each command and its first lines into `curl_checks`.

### Output
`sse_impl`.

### Quality Gate
- Step 2 shows the correct content type and no gzip.
- Step 3 replays exactly the missed ids in order.

---

## Worked Example

Illustrative only.

Stack go, stream `orders`.
```
$ curl -N -s -H "Accept: text/event-stream" -b "sid=abc" http://localhost:8080/events
retry: 3000
id: 341
event: order.updated
data: {"v":1,"type":"order.updated","stream":"orders","seq":341,"data":{"id":"o-77","status":"ready"}}

: ping

$ curl -N -s -H "Last-Event-ID: 341" -b "sid=abc" http://localhost:8080/events
id: 342
event: order.created
...
```
`retry: 3000` was sent because the owner chose 3000 ms.

---

## Exit Criteria

DONE when records are correctly framed, the route is uncompressed and unbuffered, keepalives arrive at the configured interval, and `Last-Event-ID` resume replays exactly the missed events.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | JSON payload contains newlines | **Adjust**: serialize on one line; never send raw multi-line `data:`. |
| Phase 2 | Go stream dies after a fixed time | **Adjust**: the server `WriteTimeout` is set; clear the deadline per request as in Action 3. |
| Phase 3 | Events arrive only when the connection closes | **Retry** after removing compression middleware for the route and checking flush calls. |
| Phase 3 | Resume repeats id N | **Adjust**: replay must use `seq > last`, not `>=`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
