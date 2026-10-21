# Node WebSocket Server with ws

**One-line description:** Implements a Node.js WebSocket endpoint with the `ws` library in `noServer` mode: authentication and Origin check in the HTTP `upgrade` handler, subprotocol selection, `maxPayload`, the README ping/pong heartbeat, `bufferedAmount` backpressure and mapped close codes, verified with a Vitest or Jest integration test against a real listening server.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Node.js service repository.
- `protocol_spec` (object, required): From `rtw-message-envelope`; gives `max_message_bytes` and the schema validation setup.
- `version_policy` (object, required): From `rtw-protocol-version-negotiation`; supported subprotocols.
- `auth_design` (object, required): From `rtw-connection-auth`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`.
- `backpressure_policy` (object, required): From `rtw-backpressure-policy`.
- `close_code_map` (object, required): From `rtw-close-code-map`.

---

## Outputs

- `server_impl` (object): `{ files_changed: [], ws_version, test_command, test_summary, upgrade_checks: [] }`.

---

## Phase 1: Prepare the Project

### Entry Criteria
- `repo_path` is a Node project with `package.json`.

### Actions
1. Run `node --version` and `npm ls ws`. If `ws` is missing, run `npm install ws`. For TypeScript also `npm install --save-dev @types/ws`. Record the installed major version in `ws_version`; the API below is for `ws` 8.x. If the major is not 8, read that version's `doc/ws.md` before writing code.
2. Find where the HTTP server is created: `grep -rnE "createServer|app\.listen\(" src/`. Express `app.listen()` returns the `http.Server`; keep that return value.
3. Do NOT create a second HTTP server on another port for WebSockets unless the deployment already routes that port. Attach to the existing server.
4. Create one new file, `src/realtime/server.ts` (or `.js`), and change only the server bootstrap file to call it. Two files total in this phase.

### Output
Dependencies installed and file locations chosen.

### Quality Gate
- `npm ls ws` prints one `ws@8.x.y` line with no `UNMET` or `invalid`.
- `git status --short` lists at most the two planned files plus `package.json` and the lockfile.

---

## Phase 2: Implement Upgrade, Auth and Heartbeat

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create the server with `new WebSocketServer({ noServer: true, maxPayload: protocol_spec.max_message_bytes, handleProtocols })`. `noServer` lets you authenticate before the 101 response. Do NOT use the `verifyClient` option; the `ws` docs discourage it in favor of the upgrade handler.
2. Register `httpServer.on('upgrade', async (req, socket, head) => { ... })`:
   - Attach `socket.on('error', onSocketError)` first, so a reset during auth does not crash the process.
   - Check `new URL(req.url, 'http://x').pathname` equals your path (for example `/ws`); otherwise `socket.destroy()`.
   - Check `req.headers.origin` against `auth_design.origin_allowlist`. On failure write `'HTTP/1.1 403 Forbidden\r\n\r\n'` to the socket and `socket.destroy()`.
   - Authenticate per `auth_design.method` (for tickets: `GETDEL` the `ticket` query parameter). On failure write `'HTTP/1.1 401 Unauthorized\r\n\r\n'` and destroy.
   - Check the offered subprotocols in `req.headers['sec-websocket-protocol']` against `version_policy.supported`; on no match write `400` and destroy, if that is the `reject_behavior`.
   - Call `wss.handleUpgrade(req, socket, head, (ws) => { socket.removeListener('error', onSocketError); wss.emit('connection', ws, req, user); })`.
3. In `wss.on('connection', (ws, req, user) => ...)`: set `ws.isAlive = true`, `ws.on('pong', () => { ws.isAlive = true; })`, attach `ws.on('error', log)` (an unhandled `'error'` event crashes Node), and send `sys.hello` with the negotiated `ws.protocol`.
4. Heartbeat: one `setInterval` per server, period `heartbeat_config.interval_s * 1000`, that walks `wss.clients`: if `ws.isAlive === false` then `ws.terminate()` and continue; else set `ws.isAlive = false` and `ws.ping()`. Clear the interval in `wss.on('close')`.
5. Inbound: `ws.on('message', (data, isBinary) => ...)` parses JSON inside `try`, validates against the c2s schema, applies the token bucket from `backpressure_policy.inbound_limit`, and on violation closes with the mapped code. Oversize frames are rejected by `maxPayload` with 1009 automatically.

### Output
Upgrade, auth and heartbeat code in `src/realtime/server.ts`.

### Quality Gate
- `npx tsc --noEmit` (TypeScript) or `node --check src/realtime/server.js` exits 0.
- The four curl checks in Phase 3 Action 1 return their expected status lines.

---

## Phase 3: Implement Backpressure and Test

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the handshake checks with the server started (`npm run dev` in another terminal). Base: `curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ=="`. Expect 403 for a bad Origin, 401 without credentials, 400 for an unsupported subprotocol, 101 for a valid request. Paste the four status lines into `upgrade_checks`.
2. Write one `send(ws, msg)` function and make it the only way to send:
   - If `ws.readyState !== WebSocket.OPEN`, return.
   - If `ws.bufferedAmount + size > backpressure_policy.queue.max_bytes`: for class `drop` discard and count; for `coalesce` keep a per-connection `Map<coalesce_key, msg>` flushed when `bufferedAmount` falls (check on the `ws.send` callback); for `must_deliver` call `ws.close(SLOW_CONSUMER, 'slow consumer')`.
   - Else `ws.send(JSON.stringify(msg))`.
3. Replace direct `ws.send(` calls: `grep -rn "\.send(" src/realtime` must show only the line inside `send()`.
4. Write `src/realtime/server.test.ts` that starts the real HTTP server on port 0 (`server.listen(0)`, read `server.address().port`), connects with the `ws` client `new WebSocket(url, ['app.v1'], { headers: { Origin } })`, and asserts: receives `sys.hello`; an invalid c2s message gets the mapped close code in the client `'close'` event; a server with a short test heartbeat interval terminates a client whose pong is suppressed (create the client with the `autoPong: false` option, which exists only in later `ws` 8.x releases; confirm it in `node_modules/ws/doc/ws.md` before using it, and if absent, stub the client's `pong` method instead).
5. Run `npx vitest run src/realtime` or `npx jest src/realtime` and paste the summary.
6. Do NOT mock `ws` in these tests; the point is the real handshake.

### Output
`server_impl`.

### Quality Gate
- The test run summary shows 0 failed.
- The grep in Action 3 returns exactly one `ws.send(` line.

---

## Worked Example

Illustrative only.

```
// src/realtime/server.ts (excerpt)
const wss = new WebSocketServer({ noServer: true, maxPayload: 65536,
  handleProtocols: (p) => ['orders.v2','orders.v1'].find(x => p.has(x)) ?? false });
httpServer.on('upgrade', async (req, socket, head) => {
  socket.on('error', onSocketError);
  if (!ALLOWED_ORIGINS.has(req.headers.origin ?? '')) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); return socket.destroy(); }
  const user = await consumeTicket(new URL(req.url!, 'http://x').searchParams.get('ticket'));
  if (!user) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, ws => { socket.removeListener('error', onSocketError); wss.emit('connection', ws, req, user); });
});
```
```
$ npx vitest run src/realtime
 ✓ src/realtime/server.test.ts (4 tests) 812ms
 Tests  4 passed (4)
```

---

## Exit Criteria

DONE when the upgrade handler enforces Origin, auth and version before 101, the heartbeat terminates dead peers, all sends go through the backpressure function, and the integration test passes against a real listening server.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ws` major version is not 8 | **Adjust**: read that version's docs; option names such as `autoPong` may not exist. |
| Phase 2 | Process crashes with an unhandled `'error'` event | **Adjust**: add `ws.on('error')` and the socket error handler; rerun. |
| Phase 3 | Test hangs | **Retry** after closing the client and `server.close()` in `afterAll`; open handles keep the runner alive. |
| Phase 3 | A test fails | **Return** to the code; never delete or skip the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
