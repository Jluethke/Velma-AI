# Go WebSocket Server with gorilla/websocket

**One-line description:** Implements a Go WebSocket endpoint with `github.com/gorilla/websocket` using the one-reader-goroutine, one-writer-goroutine pattern: Origin and ticket checks before `Upgrade`, `Subprotocols`, `SetReadLimit`, ping ticker with read and write deadlines, a bounded send channel for backpressure, and mapped close codes, verified with `httptest` under `go test -race`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Go module (contains `go.mod`).
- `protocol_spec` (object, required): From `rtw-message-envelope`.
- `version_policy` (object, required): From `rtw-protocol-version-negotiation`.
- `auth_design` (object, required): From `rtw-connection-auth`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`.
- `backpressure_policy` (object, required): From `rtw-backpressure-policy`.
- `close_code_map` (object, required): From `rtw-close-code-map`.

---

## Outputs

- `server_impl` (object): `{ files_changed: [], gorilla_version, test_command, test_summary, race_clean: bool }`.

---

## Phase 1: Prepare the Module

### Entry Criteria
- `go.mod` exists at `repo_path`.

### Actions
1. Run `go version` and `go list -m github.com/gorilla/websocket`. If missing: `go get github.com/gorilla/websocket@latest`, then `go mod tidy`. Record the version.
2. Read the package rule that shapes the whole design (godoc, "Concurrency"): connections support one concurrent reader and one concurrent writer. `WriteControl`, `Close` and `SetWriteDeadline` are the exceptions that may be called concurrently with other methods per the docs. Two goroutines calling `WriteMessage` at once corrupts frames.
3. Plan the files: new `internal/realtime/conn.go` (client type, read pump, write pump), new `internal/realtime/handler.go` (upgrade handler), new `internal/realtime/handler_test.go`, and one line in the router file. Write one file at a time and run `go build ./...` after each.

### Output
Dependency and file plan.

### Quality Gate
- `go build ./...` exits 0 after adding the dependency.

---

## Phase 2: Implement Handler and Pumps

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. `var upgrader = websocket.Upgrader{ CheckOrigin: checkOrigin, Subprotocols: version_policy.supported }`. `checkOrigin(r)` returns true only for an exact match in `auth_design.origin_allowlist`. Do NOT write `CheckOrigin: func(r *http.Request) bool { return true }`; that disables the CSWSH defense. When `CheckOrigin` returns false, `Upgrade` replies 403 itself.
2. In the handler, before `upgrader.Upgrade(w, r, nil)`: consume the ticket (`rdb.GetDel(ctx, key)` in go-redis v9); on failure `http.Error(w, "unauthorized", http.StatusUnauthorized)` and return. Check the offered list with `websocket.Subprotocols(r)`; on no match return 400.
3. After `Upgrade`, create `c := &Client{conn: conn, send: make(chan []byte, backpressure_policy.queue.max_messages)}` and start `go c.writePump()` and `go c.readPump()`.
4. `readPump`:
   - `conn.SetReadLimit(int64(protocol_spec.max_message_bytes))` (oversize closes with 1009).
   - `conn.SetReadDeadline(time.Now().Add(interval + pongTimeout))` and `conn.SetPongHandler(func(string) error { return conn.SetReadDeadline(time.Now().Add(interval + pongTimeout)) })` using values from `heartbeat_config`.
   - Loop `_, data, err := conn.ReadMessage()`; on error, log with `websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure)` and exit. Validate, rate limit, dispatch.
   - `defer` unregister and `close(c.send)` exactly once (use `sync.Once`), so the write pump exits.
5. `writePump`:
   - `ticker := time.NewTicker(interval)`; `defer ticker.Stop(); defer conn.Close()`.
   - `select` on `msg, ok := <-c.send`: if `!ok` write a close frame and return; else `conn.SetWriteDeadline(time.Now().Add(writeWait))` and `conn.WriteMessage(websocket.TextMessage, msg)`.
   - On `<-ticker.C`: `conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(writeWait))`.
   - `writeWait` is a user decision (gorilla's chat example uses 10 s as an example value, not a library default); record its source.
6. Non-blocking enqueue used by publishers: `select { case c.send <- msg: default: overflow(c, msg, class) }`. `overflow` drops, coalesces, or for `must_deliver` sends `conn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(SlowConsumer, "slow consumer"), deadline)` then `conn.Close()`. Never block a publisher on `c.send <- msg` without `default`.

### Output
Handler and pump code.

### Quality Gate
- `go vet ./...` and `go build ./...` exit 0.
- `grep -rn "WriteMessage\|WriteJSON\|NextWriter" internal/realtime` shows calls only inside `writePump`.

---

## Phase 3: Test Under the Race Detector

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. In `handler_test.go`, start `srv := httptest.NewServer(router)`, build `url := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws?ticket=T"`, and dial with `websocket.Dialer{Subprotocols: []string{"app.v1"}}.Dial(url, http.Header{"Origin": {"https://app.example.com"}})`.
2. Tests:
   - valid dial: `resp.StatusCode == 101`, first message is `sys.hello`, `conn.Subprotocol() == "app.v1"`.
   - bad origin: `Dial` returns `websocket.ErrBadHandshake` and `resp.StatusCode == 403`.
   - reused ticket: second dial gets 401.
   - oversize message: write `max_message_bytes + 1` bytes; next read returns a `*websocket.CloseError` with `Code == 1009`.
   - slow consumer: a client that never reads, a publisher that enqueues `max_messages + 1` must-deliver messages; assert the server closed the connection with the slow-consumer code.
3. Run `go test -race -count=1 ./internal/realtime/...` and paste the result. `-race` is mandatory: the main bug class here is two writers on one connection.

### Output
`server_impl`.

### Quality Gate
- `go test -race` prints `ok` for the package and no `WARNING: DATA RACE`.

---

## Worked Example

Illustrative only.

```
func (c *Client) writePump() {
    ticker := time.NewTicker(c.cfg.Interval)
    defer func() { ticker.Stop(); c.conn.Close() }()
    for {
        select {
        case msg, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(c.cfg.WriteWait))
            if !ok { c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "")); return }
            if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil { return }
        case <-ticker.C:
            if err := c.conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(c.cfg.WriteWait)); err != nil { return }
        }
    }
}
```
```
$ go test -race -count=1 ./internal/realtime/...
ok   example.com/svc/internal/realtime  1.284s
```

---

## Exit Criteria

DONE when Origin, ticket and version are enforced before `Upgrade`, all data writes happen in one write goroutine, the read deadline tracks pongs, overflow never blocks a publisher, and `go test -race` passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project uses `github.com/coder/websocket` instead | **Stop** this flow; its API differs (context-based `Read`/`Write`); follow that library's docs. |
| Phase 2 | `panic: concurrent write to websocket connection` | **Adjust**: find the second writer with the grep in the gate and route it through `c.send`. |
| Phase 3 | DATA RACE reported | **Return** to Phase 2; never drop `-race` to get a pass. |
| Phase 3 | Test hangs on read | **Retry** with `conn.SetReadDeadline` in the test client. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
