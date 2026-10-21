# Python WebSocket Server with FastAPI and Uvicorn

**One-line description:** Implements a FastAPI (Starlette) WebSocket endpoint served by uvicorn: Origin and ticket checks before `accept()`, subprotocol selection, uvicorn ping settings, a bounded `asyncio.Queue` sender task per connection for backpressure, and mapped close codes, verified with `fastapi.testclient.TestClient` and pytest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Python service repository.
- `protocol_spec` (object, required): From `rtw-message-envelope`.
- `version_policy` (object, required): From `rtw-protocol-version-negotiation`.
- `auth_design` (object, required): From `rtw-connection-auth`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`.
- `backpressure_policy` (object, required): From `rtw-backpressure-policy`.
- `close_code_map` (object, required): From `rtw-close-code-map`.

---

## Outputs

- `server_impl` (object): `{ files_changed: [], versions: { fastapi, starlette, uvicorn, websockets }, run_command, test_command, test_summary }`.

---

## Phase 1: Prepare the Project

### Entry Criteria
- `repo_path` contains a FastAPI app (`grep -rn "FastAPI(" .` finds it).

### Actions
1. Activate the project's virtual environment, then run `pip show fastapi starlette uvicorn websockets` and record versions. If `websockets` or `wsproto` is not installed, uvicorn cannot serve WebSockets: install with `pip install "uvicorn[standard]"` (which brings `websockets`) and add it to the requirements file the project already uses.
2. Plan exactly two files: new `app/realtime/ws.py` and the one file that creates `app` (add `app.include_router(...)`).
3. Do NOT run with `--workers N` and keep connection state in a module-level dict and assume it is shared. Each worker is a separate process; cross-process fan-out is the job of `rtw-redis-pubsub-fanout`.

### Output
Versions recorded and files planned.

### Quality Gate
- `python -c "import websockets, uvicorn, fastapi; print('ok')"` prints `ok`.

---

## Phase 2: Implement the Endpoint

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Declare `@router.websocket("/ws")` with `async def ws_endpoint(websocket: WebSocket):`.
2. Before `accept()` (closing before accept makes uvicorn answer the handshake with HTTP 403):
   - `origin = websocket.headers.get("origin")`; if not in `auth_design.origin_allowlist`, `await websocket.close(code=1008)` and return.
   - Read `websocket.query_params.get("ticket")` and consume it with Redis `GETDEL`; on failure close and return.
   - `offered = websocket.scope.get("subprotocols", [])`; pick the first of `version_policy.supported` present in `offered`; on none, close and return.
3. `await websocket.accept(subprotocol=choice)`, then send `sys.hello`.
4. Backpressure, one sender task per connection:
   - `queue = asyncio.Queue(maxsize=backpressure_policy.queue.max_messages)`.
   - `async def sender(): while True: msg = await queue.get(); await websocket.send_text(msg)`.
   - `def offer(msg, cls)`: try `queue.put_nowait(msg)`; on `asyncio.QueueFull`: `drop` returns, `coalesce` replaces the queued item with the same key (keep a dict key -> latest and enqueue only the key), `must_deliver` schedules `websocket.close(code=SLOW_CONSUMER)`.
   - Never call `websocket.send_text` from anywhere except `sender()`.
5. Receive loop: `while True: raw = await websocket.receive_text()`, inside `try/except WebSocketDisconnect: break`. Validate size and schema, apply the token bucket, dispatch.
6. In `finally:` cancel the sender task, remove subscriptions, and log the close code. Uvicorn's `--ws-max-size` (default 16777216 bytes) is the transport limit; set it to `protocol_spec.max_message_bytes` on the command line.
7. Heartbeat: the uvicorn `websockets` implementation sends protocol pings. Run with `uvicorn app.main:app --ws websockets --ws-ping-interval <interval_s> --ws-ping-timeout <pong_timeout_s> --ws-max-size <max_message_bytes>` and record it in `run_command`. Do NOT also write a ping loop in the endpoint.

### Output
Endpoint in `app/realtime/ws.py`.

### Quality Gate
- `python -m py_compile app/realtime/ws.py` exits 0.
- `grep -n "send_text\|send_json\|send_bytes" app/realtime/ws.py` shows calls only inside `sender()`.

---

## Phase 3: Test

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Write `tests/test_realtime_ws.py` using `from fastapi.testclient import TestClient` and `with client.websocket_connect("/ws?ticket=T", subprotocols=["app.v1"], headers={"origin": "https://app.example.com"}) as ws:`. Patch the ticket store with a fake that returns a user once.
2. Tests to write:
   - valid connect receives `sys.hello` (`ws.receive_json()`).
   - bad origin: `pytest.raises(WebSocketDisconnect)` around `websocket_connect` and assert `exc.code == 1008` (import from `starlette.websockets`).
   - reused ticket is rejected the same way.
   - invalid c2s message: send it, then `ws.receive_json()` raises `WebSocketDisconnect` with the mapped code.
   - overflow: unit-test `offer()` directly with a queue of size 1 for each class.
3. Run `pytest tests/test_realtime_ws.py -q` and paste the summary line.
4. Start the real server with `run_command` and run the curl handshake (`curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Origin: https://evil.example" http://127.0.0.1:8000/ws`). Expect `HTTP/1.1 403 Forbidden`. TestClient does not exercise uvicorn, so this curl check is required.

### Output
`server_impl`.

### Quality Gate
- pytest summary shows 0 failed.
- The curl status line for the bad origin is `403` and for a valid ticket is `101`.

---

## Worked Example

Illustrative only.

```
@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    if websocket.headers.get("origin") not in ALLOWED_ORIGINS:
        await websocket.close(code=1008); return
    user = await consume_ticket(websocket.query_params.get("ticket"))
    if user is None:
        await websocket.close(code=CLOSE.AUTH_INVALID); return
    choice = next((p for p in SUPPORTED if p in websocket.scope.get("subprotocols", [])), None)
    if choice is None:
        await websocket.close(code=CLOSE.UNSUPPORTED_VERSION); return
    await websocket.accept(subprotocol=choice)
```
```
$ pytest tests/test_realtime_ws.py -q
.....                                                     [100%]
5 passed in 0.41s
$ uvicorn app.main:app --ws websockets --ws-ping-interval 29 --ws-ping-timeout 20 --ws-max-size 65536
```

---

## Exit Criteria

DONE when the endpoint rejects bad origins, bad tickets and unsupported versions before accept, sends only through the bounded sender task, runs with uvicorn ping and size flags, and both pytest and the curl checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | uvicorn logs "No supported WebSocket library detected" | **Adjust**: install `uvicorn[standard]` or `websockets`; rerun. |
| Phase 2 | `--ws-ping-interval` rejected | **Retry** after `uvicorn --help`; older versions may lack it, then upgrade uvicorn. |
| Phase 3 | Test passes but curl shows 101 for a bad origin | **Stop**: the check is in a code path TestClient skips; move it before `accept()`. |
| Phase 3 | A test fails | **Return** to the endpoint code; do not mark the test xfail. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
