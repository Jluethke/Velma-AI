# HAProxy Configuration for WebSocket and SSE

**One-line description:** Configures HAProxy in HTTP mode for long-lived realtime connections: `timeout tunnel` above the heartbeat window, `timeout client-fin`/`server-fin`, cookie or source stickiness only when needed, `hard-stop-after` so reloads do not leave old processes holding sockets forever, and `maxconn` sized for the target, verified with `haproxy -c`, a curl handshake and the runtime API.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `haproxy_cfg_path` (string, required): Path to `haproxy.cfg` (commonly `/etc/haproxy/haproxy.cfg`).
- `transport_decision` (object, required): From `rtw-transport-decision`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`; gives `proxy_idle_minimum_s`.

---

## Outputs

- `haproxy_proxy_config` (object): `{ file, backup_file, haproxy_version, timeouts: {}, stickiness, hard_stop_after, maxconn, checks: [] }`.

---

## Phase 1: Read the Current Config

### Entry Criteria
- `haproxy -v` runs.

### Actions
1. Record `haproxy -v` in `haproxy_version`. The directives below exist in HAProxy 2.x; for 1.x read that version's configuration manual.
2. Back up: `sudo cp <haproxy_cfg_path> <haproxy_cfg_path>.bak.$(date +%Y%m%d%H%M%S)`.
3. List current timeouts and limits: `grep -nE "timeout|maxconn|hard-stop-after|balance|cookie|mode" <haproxy_cfg_path>`.
4. Know how HAProxy times a WebSocket: before the upgrade, `timeout client`, `timeout server` and `timeout http-request` apply. After the 101 response, the connection is a tunnel and `timeout tunnel` replaces client/server timeouts (HAProxy configuration manual, `timeout tunnel`). If `timeout tunnel` is unset, the client/server timeouts keep applying, and a short `timeout client` kills idle sockets. SSE never upgrades, so for SSE `timeout server` and `timeout client` apply for the whole stream.

### Output
Baseline and backup.

### Quality Gate
- Backup file listed with `ls -l`; grep output pasted.

---

## Phase 2: Write the Directives

### Entry Criteria
- Backup exists.

### Actions
1. In the realtime `backend` (or `defaults` if all traffic is realtime), with `mode http`:
   ```
   timeout tunnel  <tunnel_s>s
   timeout client-fin <fin_s>s
   timeout server-fin <fin_s>s
   ```
   `tunnel_s` must exceed `heartbeat_config.proxy_idle_minimum_s`; record the chosen value and reason. `client-fin`/`server-fin` bound how long a half-closed connection lingers; take the value from the owner or keep the existing `timeout client` value, and record which.
2. For an SSE backend, set `timeout server` and the frontend `timeout client` above `proxy_idle_minimum_s` as well, since no tunnel phase exists. Put SSE in its own backend selected by an ACL (`acl is_sse path_beg /events`, `use_backend be_sse if is_sse`) so short timeouts stay on normal API traffic.
3. Stickiness from `transport_decision.needs_sticky_sessions`:
   - `false`: `balance roundrobin` or `balance leastconn`. `leastconn` suits long-lived connections because it counts open connections per server.
   - `true`: `cookie SRV insert indirect nocache` in the backend and `cookie s1` on each `server` line; or `balance source` when clients cannot keep cookies (non-browser). Record which.
4. In `global`: `hard-stop-after <s>`. On reload, the old process keeps running until its connections close; WebSockets may never close on their own, so old processes accumulate. `hard-stop-after` ends them after the given time. The value must be at least the app's graceful drain window (from `rtw-graceful-drain`); record the source.
5. `maxconn` in `global` and on each `frontend`: at least the target concurrent connections from the capacity plan; record the source. Each connection uses two file descriptors (client and server side); HAProxy computes its fd limit from `maxconn` when started as root.
6. Do NOT add `option http-server-close` or `option httpclose` hoping to "fix" WebSockets; HAProxy 2.x handles the upgrade in HTTP mode without them.

### Output
Edited config.

### Quality Gate
- `haproxy -c -f <haproxy_cfg_path>` prints `Configuration file is valid`.

---

## Phase 3: Reload and Verify

### Entry Criteria
- Config check passed.

### Actions
1. Reload: `sudo systemctl reload haproxy`. Confirm with `systemctl status haproxy` that the reload succeeded.
2. Handshake: `curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Origin: https://app.example.com" "https://HOST/ws?ticket=$T"` returns 101.
3. Idle survival: open a `websocat` connection with server heartbeats running and leave it idle for longer than the old `timeout client`. It must stay open.
4. Runtime API (if a stats socket is configured, for example `stats socket /run/haproxy/admin.sock mode 660 level admin`): `echo "show info" | sudo socat stdio /run/haproxy/admin.sock | grep -E "CurrConns|Maxconn"` and `echo "show sess" | sudo socat stdio /run/haproxy/admin.sock | head`. The test connection appears with its age.
5. Reload behavior: with a connection open, reload twice; `ps -ef | grep haproxy` shows old processes that disappear by `hard-stop-after`.

### Output
`haproxy_proxy_config`.

### Quality Gate
- Steps 2 and 3 pass; step 4 shows `CurrConns` including the test connection; step 5 shows old processes exiting within `hard-stop-after` (paste `ps` output before and after).

---

## Worked Example

Illustrative only.

```
backend be_ws
    mode http
    balance leastconn
    timeout tunnel 90s
    timeout client-fin 30s
    timeout server-fin 30s
    server ws1 10.0.1.11:8080 check
    server ws2 10.0.1.12:8080 check
```
`tunnel_s = 90` chosen above `proxy_idle_minimum_s = 58`. `hard-stop-after 60s` because the app drain window is 45 s.
```
$ haproxy -c -f /etc/haproxy/haproxy.cfg
Configuration file is valid
$ echo "show info" | sudo socat stdio /run/haproxy/admin.sock | grep CurrConns
CurrConns: 1
```

---

## Exit Criteria

DONE when `timeout tunnel` (or SSE backend timeouts) exceed the heartbeat window, stickiness matches the transport, `hard-stop-after` bounds old processes, and the handshake, idle and reload checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | HAProxy 1.x | **Adjust**: read the 1.x manual; `timeout tunnel` exists since 1.5 but defaults and options differ. |
| Phase 2 | `haproxy -c` reports an unknown keyword | **Retry** after checking the manual for the installed version; do not guess keyword names. |
| Phase 3 | Old processes pile up after reloads | **Adjust**: `hard-stop-after` missing or too large. |
| Phase 3 | Connection closes at the old client timeout | **Adjust**: `timeout tunnel` is in a section the backend does not inherit; move it into the backend. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
