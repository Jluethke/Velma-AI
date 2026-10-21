# Realtime Heartbeat Configuration

**One-line description:** Derives the heartbeat interval and dead-peer timeout for a realtime connection from the smallest idle timeout on the network path (proxy, load balancer, CDN, NAT), and maps them to the exact ping/pong settings of the server library and to an app-level ping for browsers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `transport_decision` (object, required): Output of `rtw-transport-decision`.
- `network_path` (object[], required): Every hop between client and server in order, for example `[{hop:"Cloudflare", idle_timeout_s:null, configurable:false}, {hop:"AWS ALB", idle_timeout_s:60, configurable:true}, {hop:"nginx", idle_timeout_s:null, configurable:true}]`. Use `null` when the value is not known yet.

---

## Outputs

- `heartbeat_config` (object): `{ path_min_idle_s, limiting_hop, interval_s, pong_timeout_s, tolerated_missed, dead_peer_detect_s, server_setting, client_app_ping, proxy_idle_minimum_s, derivation }`.

---

## Phase 1: Fill In Every Hop Timeout

### Entry Criteria
- `network_path` present.

### Actions
1. For each hop with `idle_timeout_s = null`, look up its documented default or its current configuration. Use these sources and paste the value you read:
   - nginx: `proxy_read_timeout` default 60s (nginx docs, ngx_http_proxy_module). Current value: `nginx -T | grep -n proxy_read_timeout`.
   - AWS ALB: `idle_timeout.timeout_seconds` default 60. Current value: `aws elbv2 describe-load-balancer-attributes --load-balancer-arn <arn> --query "Attributes[?Key=='idle_timeout.timeout_seconds']"`.
   - HAProxy: `timeout tunnel` (applies after the upgrade). No default; if unset, `timeout client`/`timeout server` apply. Current value: `grep -n "timeout" /etc/haproxy/haproxy.cfg`.
   - Cloudflare proxied traffic: read the current WebSocket and proxy read timeout on the Cloudflare docs page for your plan; do not assume.
   - Kubernetes ingress-nginx: annotation `nginx.ingress.kubernetes.io/proxy-read-timeout` (value in seconds). Read it with `kubectl get ingress <name> -o yaml`.
   - Corporate NAT or mobile carrier: usually unknown. Record `null` with the note "unknown, not configurable".
2. Set `path_min_idle_s` to the smallest known value among hops that are NOT configurable. If every hop is configurable, use the smallest known value overall. Record which hop it is as `limiting_hop`.
3. If any non-configurable hop is still `null`, add an open question and use the smallest known value for now.

### Output
Complete hop table with `path_min_idle_s` and `limiting_hop`.

### Quality Gate
- Every known timeout cites a command output or a docs page.
- `limiting_hop` names one hop from `network_path`.

---

## Phase 2: Derive the Interval

### Entry Criteria
- `path_min_idle_s` known.

### Actions
1. Ask the owner for `tolerated_missed` (k): how many consecutive heartbeats may be lost or delayed while the path stays open. Record their answer; if none is given, use k = 1 and record "k=1 assumed: at least one spare heartbeat per idle window" as an open question.
2. Derive `interval_s`: the path stays open only if at least one frame crosses each hop within its idle window, even after k misses. So `interval_s * (k + 1) < path_min_idle_s`. Take `interval_s = floor((path_min_idle_s - 1) / (k + 1))`. Write the arithmetic into `derivation`.
3. `pong_timeout_s`: the time to wait for a pong before declaring the peer dead. If the server library has a documented default and it is below `interval_s`, keep it and cite it (Python `websockets` `ping_timeout` default 20 s; uvicorn `--ws-ping-timeout` default 20.0). Otherwise set it equal to `interval_s` so a missed pong is detected at the next tick.
4. `dead_peer_detect_s = interval_s + pong_timeout_s`. This is the worst-case time before the server frees a half-open connection.
5. `proxy_idle_minimum_s`: every configurable hop must have an idle timeout strictly greater than `interval_s * (k + 1)`. Downstream proxy flows read this value.

### Output
Derived numbers with `derivation` text.

### Quality Gate
- `interval_s * (tolerated_missed + 1) < path_min_idle_s` holds (show the numbers).
- `dead_peer_detect_s` equals `interval_s + pong_timeout_s`.

---

## Phase 3: Map to Library Settings

### Entry Criteria
- Numbers derived.

### Actions
1. Fill `server_setting` for the stack in use:
   - Node `ws`: no built-in heartbeat. Use a `setInterval` every `interval_s`: if `ws.isAlive === false` call `ws.terminate()`, else set `ws.isAlive = false` and call `ws.ping()`; set `ws.isAlive = true` in the `'pong'` handler. This pattern is from the `ws` README. With this pattern the pong timeout equals the interval.
   - Python `websockets`: `serve(handler, host, port, ping_interval=<interval_s>, ping_timeout=<pong_timeout_s>)`.
   - Uvicorn (FastAPI/Starlette): `uvicorn app:app --ws-ping-interval <interval_s> --ws-ping-timeout <pong_timeout_s>`.
   - Go gorilla/websocket: a ticker every `interval_s` calling `conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(writeWait))`; `conn.SetReadDeadline(time.Now().Add(interval+pongTimeout))` and reset it in `conn.SetPongHandler`.
   - SSE: send a comment line `: ping\n\n` every `interval_s`. Comments are ignored by `EventSource` but keep every hop busy.
   - Long polling: no heartbeat; the hold time must be below `path_min_idle_s` instead (handled in `rtw-long-polling-endpoint`).
2. Fill `client_app_ping`: browsers answer server pings automatically but JavaScript cannot send ping frames or see pongs. If the client must detect a dead server faster than the OS TCP timeout, the client sends `sys.ping` every `interval_s` and treats no `sys.pong` (or any message) within `dead_peer_detect_s` as dead, then closes and reconnects.
3. Do NOT enable both a library ping and a hand-written ping loop on the same side; you get double traffic and two timers that disagree.

### Output
`heartbeat_config`.

### Quality Gate
- `server_setting` contains the exact parameter names for one stack.
- `grep -rn "ping_interval\|ws-ping-interval\|ws.ping(\|PingMessage" .` after implementation shows exactly one heartbeat mechanism per side.

---

## Worked Example

Illustrative only.

`network_path`: ALB (60 s, configurable), nginx (60 s default, configurable), office NAT (unknown). All known hops configurable; `path_min_idle_s = 60`, `limiting_hop = "ALB"`. Owner says k = 1.

- `interval_s = floor((60 - 1) / 2) = 29`.
- Stack Python with uvicorn: `pong_timeout_s = 20` (uvicorn default, below 29, kept).
- `dead_peer_detect_s = 49`.
- `proxy_idle_minimum_s`: hops must exceed 58 s; ALB and nginx at 60 pass.
- `server_setting`: `uvicorn app.main:app --ws-ping-interval 29 --ws-ping-timeout 20`.
- Open question: office NAT timeout unknown.

---

## Exit Criteria

DONE when every hop timeout is sourced, the interval satisfies the derivation inequality, and one server setting plus the client app-ping rule are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A non-configurable hop timeout is unknown | **Adjust**: proceed with known values, record the open question, and measure it later with an idle test (`websocat` connected with heartbeats disabled, time until close). |
| Phase 2 | Derived interval is below 1 s | **Stop**: a hop has a very short idle timeout; raise it or change transport. |
| Phase 3 | Library parameter name not found in installed version | **Retry** after reading the library docs for the installed version (`pip show websockets`, `npm ls ws`); do not invent parameters. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
