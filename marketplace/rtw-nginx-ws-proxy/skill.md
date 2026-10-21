# nginx Reverse Proxy for WebSocket and SSE

**One-line description:** Configures nginx to proxy WebSocket upgrades (`proxy_http_version 1.1`, `Upgrade`/`Connection` map), unbuffered SSE, and read timeouts above the heartbeat window, adds sticky routing only when the transport needs it, sizes `worker_connections` for two sockets per proxied connection, and verifies with `nginx -t`, a curl handshake and an idle-survival test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `nginx_conf_path` (string, required): Path to the nginx config file or `conf.d` file that holds the server block for the realtime host.
- `transport_decision` (object, required): From `rtw-transport-decision`; gives the transport and `needs_sticky_sessions`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`; gives `proxy_idle_minimum_s`.

---

## Outputs

- `nginx_proxy_config` (object): `{ file, backup_file, directives_added: [], read_timeout_s, sticky: "none" | "ip_hash" | "hash", worker_connections, checks: [ { command, observed } ] }`.

---

## Phase 1: Read the Current Config

### Entry Criteria
- `nginx -v` runs; you can run `nginx -t` (often with `sudo`).

### Actions
1. Dump the effective config: `sudo nginx -T > /tmp/nginx-before.txt`. Search it: `grep -nE "proxy_read_timeout|proxy_http_version|Upgrade|worker_connections|worker_rlimit_nofile|proxy_buffering|gzip" /tmp/nginx-before.txt`.
2. Copy the file you will edit: `sudo cp <nginx_conf_path> <nginx_conf_path>.bak.$(date +%Y%m%d%H%M%S)`. Record it as `backup_file`. Edit only this one file.
3. Note the defaults that apply where a directive is absent (nginx docs): `proxy_http_version 1.0`, `proxy_read_timeout 60s`, `proxy_buffering on`, `worker_connections 512`. Each of these breaks realtime traffic if left alone.

### Output
Baseline dump and backup.

### Quality Gate
- `backup_file` exists (`ls -l` output pasted).
- The grep output is pasted.

---

## Phase 2: Write the Directives

### Entry Criteria
- Backup exists.

### Actions
1. In the `http` context (once), add the upgrade map:
   ```
   map $http_upgrade $connection_upgrade {
       default upgrade;
       ''      close;
   }
   ```
   `Upgrade` and `Connection` are hop-by-hop headers; nginx does not forward them unless you set them.
2. WebSocket location (if transport or fallback uses it):
   ```
   location /ws {
       proxy_pass http://realtime_upstream;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection $connection_upgrade;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_read_timeout <read_timeout_s>s;
       proxy_send_timeout <read_timeout_s>s;
   }
   ```
3. SSE location (if used):
   ```
   location /events {
       proxy_pass http://realtime_upstream;
       proxy_http_version 1.1;
       proxy_set_header Connection "";
       proxy_buffering off;
       proxy_cache off;
       gzip off;
       proxy_read_timeout <read_timeout_s>s;
   }
   ```
   The app's `X-Accel-Buffering: no` header also disables buffering; setting it here protects routes that forget it.
4. `read_timeout_s`: must be greater than `heartbeat_config.proxy_idle_minimum_s`. `proxy_read_timeout` is the time between two successive reads from the upstream, so heartbeats reset it. Choose a value above the minimum and record why; do not set very large values to "be safe", because they keep dead upstream connections open.
5. Sticky routing, from `transport_decision.needs_sticky_sessions`:
   - `false`: plain round-robin upstream. A WebSocket is one TCP connection and stays on one backend anyway.
   - `true`: in `upstream realtime_upstream { ... }` add `hash $cookie_<session_cookie> consistent;` when a stable cookie exists, else `ip_hash;` (which groups users behind one NAT onto one backend). The `sticky` directive is NGINX Plus only; do not use it on open-source nginx.
6. Capacity: each proxied connection uses two nginx connections (client side and upstream side). Set `worker_connections` (events context) to at least `2 * expected connections per worker` and `worker_rlimit_nofile` (main context) at or above that; record the expected count and its source.

### Output
Edited config.

### Quality Gate
- `sudo nginx -t` prints `syntax is ok` and `test is successful`.
- `sudo nginx -T | grep -n "proxy_http_version 1.1"` shows the new location.

---

## Phase 3: Reload and Verify

### Entry Criteria
- `nginx -t` passed.

### Actions
1. Reload without dropping connections: `sudo nginx -s reload` (or `sudo systemctl reload nginx`). Old workers keep serving their existing WebSocket connections until those close or `worker_shutdown_timeout` passes; set `worker_shutdown_timeout` if old workers pile up after repeated reloads (check with `ps -ef | grep "nginx: worker process is shutting down"`).
2. Handshake through nginx: `curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Origin: https://app.example.com" "https://HOST/ws?ticket=$T"`. Expect `101`. A `400` or `426` from the app means the Upgrade header was not forwarded.
3. SSE through nginx: `curl -N -s https://HOST/events` must print events one at a time.
4. Idle survival: connect with `websocat` and send nothing for longer than the old 60 s default (the server heartbeat must be running). The connection must stay open. Record start and end times.
5. Error log: `sudo tail -n 50 /var/log/nginx/error.log` shows no `upstream timed out` for the test connection.

### Output
`nginx_proxy_config`.

### Quality Gate
- Step 2 returns 101, step 3 streams, step 4 survives past 60 s, step 5 has no timeout lines (paste outputs).

---

## Worked Example

Illustrative only.

`proxy_idle_minimum_s = 58`; owner chose `read_timeout_s = 90` (above 58 with room for one late heartbeat). Sticky not needed.
```
$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
$ sudo nginx -s reload
$ curl -i -N --max-time 3 ... "https://rt.example.com/ws?ticket=$T" | head -1
HTTP/1.1 101 Switching Protocols
```
Idle test: connected 14:00:00, still open at 14:05:00 with pings every 29 s visible in the server log.

---

## Exit Criteria

DONE when nginx forwards upgrades with HTTP/1.1, SSE is unbuffered and uncompressed, read timeouts exceed the heartbeat window, connection limits account for two sockets per client, and the handshake, stream and idle checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `nginx -t` fails with "map directive is not allowed here" | **Adjust**: move the `map` block to the `http` context. |
| Phase 3 | Connections drop at 60 s | **Adjust**: `proxy_read_timeout` is not applied to that location, or another hop (LB) times out first; check `nginx -T` and `network_path`. |
| Phase 3 | `worker_connections are not enough` in error.log | **Adjust** `worker_connections` and `worker_rlimit_nofile`; reload. |
| Phase 3 | Anything breaks after reload | **Return** to the `backup_file`: copy it back, `nginx -t`, reload. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
