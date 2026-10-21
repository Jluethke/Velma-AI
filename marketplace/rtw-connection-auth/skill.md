# Realtime Connection Authentication

**One-line description:** Chooses and specifies how a WebSocket, SSE or long-polling connection is authenticated (cookie plus Origin allowlist, single-use connect ticket, or first-message token), how token expiry is enforced on a live connection, and how each subscription is authorized, with curl checks for cross-site hijacking and ticket reuse.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `transport_decision` (object, required): Output of `rtw-transport-decision`.
- `auth_provider` (string, required): How the app authenticates HTTP today: server session cookie, OIDC/OAuth access token (JWT or opaque) in an `Authorization` header, or API key for server clients. Include the token lifetime if known.
- `client_platforms` (string[], required): Clients that connect; browser vs native decides which headers can be set.

---

## Outputs

- `auth_design` (object): `{ method: "cookie_origin" | "ticket" | "first_message", origin_allowlist: [], ticket: { endpoint, store, ttl_source, single_use: true } | null, first_message_deadline_source | null, expiry_enforcement, subscription_authz, close_codes_used: [], checks: [ { command, expected } ] }`.

---

## Phase 1: Choose the Method

### Entry Criteria
- Inputs present.

### Actions
1. Know the constraints before choosing:
   - The browser `WebSocket` constructor cannot set an `Authorization` header. It only sends cookies and the `Sec-WebSocket-Protocol` list.
   - The browser `EventSource` cannot set headers either; it sends cookies when `withCredentials` is true or on the same origin.
   - WebSocket handshakes are not covered by CORS. A page on any site can open a WebSocket to your origin and the browser attaches your cookies. This is cross-site WebSocket hijacking (CSWSH). The defense is checking the `Origin` header on the server.
2. Walk this table and take the first row that matches:

| Row | Condition | `method` |
|---|---|---|
| A1 | `auth_provider` is a session cookie and all clients are browsers on known origins | `cookie_origin` |
| A2 | `auth_provider` is a bearer token and any client is a browser | `ticket` |
| A3 | All clients are native or server clients that can set headers | send `Authorization: Bearer` on the handshake; record `method = "ticket"` only if a proxy strips the header, else note "header" in `expiry_enforcement` notes |
| A4 | A2 applies but the team cannot add a ticket endpoint | `first_message` |

3. Do NOT put a long-lived access token in the URL query string. URLs land in proxy and load balancer access logs. A ticket is acceptable because it is single use and short lived.
4. Do NOT smuggle a bearer token inside `Sec-WebSocket-Protocol` unless the server echoes back only a fixed protocol name; some systems do this, but it puts the token in a header that proxies log and that the server must echo correctly.

### Output
Chosen `method` with the row that matched.

### Quality Gate
- `method` is one of the three strings and the matching row id is recorded.

---

## Phase 2: Specify the Method

### Entry Criteria
- Method chosen.

### Actions
1. Always: write `origin_allowlist` as exact scheme+host+port strings (for example `https://app.example.com`). Reject the upgrade with HTTP 403 when `Origin` is present and not in the list. Never use a suffix or regex match like `endsWith("example.com")`; `evil-example.com` passes it.
2. `cookie_origin`: the session cookie must be `Secure`, `HttpOnly`, and `SameSite=Lax` or `Strict`. Validate the session in the upgrade handler before sending 101.
3. `ticket`:
   - Add `POST /realtime/ticket` authenticated with the normal bearer token. It returns `{ ticket }`, a random value from a CSPRNG (the OWASP Session Management Cheat Sheet asks for at least 64 bits of entropy; 32 random bytes exceeds it) (`crypto.randomBytes(32)`, `secrets.token_urlsafe(32)`, `crypto/rand`).
   - Store `ticket -> { user_id, scopes }` in Redis with `SET realtime:ticket:<t> <json> EX <ttl> NX`. The TTL is a user decision; record it with its owner in `ttl_source`.
   - On upgrade, read `?ticket=` and consume it atomically with `GETDEL realtime:ticket:<t>` (Redis 6.2+). A missing value means reject with 401. GETDEL makes the ticket single use.
4. `first_message`: accept the upgrade, start a timer, and accept no message except `sys.auth` until it passes. On timeout or bad token, close with the auth code from `rtw-close-code-map`. The timer length is a user decision; record its source in `first_message_deadline_source`.
5. `expiry_enforcement`: record the token or session expiry in the connection state. When it passes, either (a) send a `sys.reauth_required` message and close with the expiry code if no new token arrives, or (b) close with the expiry code directly. The client reconnects through the ticket flow with a refreshed token.
6. `subscription_authz`: every `sub.subscribe` checks that the user may read that stream using the same authorization function the REST API uses. Authenticating the connection is not authorizing every channel.

### Output
Draft `auth_design`.

### Quality Gate
- The allowlist contains only exact origins (no wildcards).
- The ticket path uses `GETDEL` or an equivalent atomic read-and-delete, not GET then DEL.

---

## Phase 3: Write the Checks

### Entry Criteria
- Draft design exists and the server implements it.

### Actions
1. Base handshake command (call it `HS`): `curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ=="`.
2. Add these checks to `checks` and run each:
   - CSWSH: `HS -H "Origin: https://evil.example" "http://localhost:8080/ws?ticket=$T"` expects `HTTP/1.1 403`.
   - No credentials: `HS -H "Origin: https://app.example.com" http://localhost:8080/ws` expects `401`.
   - Ticket reuse: run the valid request twice with the same `$T`; the first expects `101`, the second expects `401`.
   - Forbidden channel: connect as user A and send `sub.subscribe` for user B's private stream with `websocat`; expect `sys.error` then the forbidden close code.
3. Add the curl checks to an integration test script so CI runs them.

### Output
`auth_design` with `checks`.

### Quality Gate
- Each check was run and its observed status line equals `expected` (paste the status lines).

---

## Worked Example

Illustrative only.

`auth_provider`: "OIDC access tokens, 15 minute lifetime, SPA in browser". Row A2 fires: `method = ticket`. TTL chosen by the product owner and recorded.

```
$ T=$(curl -s -X POST -H "Authorization: Bearer $AT" http://localhost:8080/realtime/ticket | jq -r .ticket)
$ HS -H "Origin: https://app.example.com" "http://localhost:8080/ws?ticket=$T" | head -1
HTTP/1.1 101 Switching Protocols
$ HS -H "Origin: https://app.example.com" "http://localhost:8080/ws?ticket=$T" | head -1
HTTP/1.1 401 Unauthorized
$ HS -H "Origin: https://evil.example" "http://localhost:8080/ws?ticket=$T2" | head -1
HTTP/1.1 403 Forbidden
```
Expiry: the server stores the access token `exp` from the ticket record and closes with 4002 when it passes.

---

## Exit Criteria

DONE when `auth_design` names one method, an exact origin allowlist, expiry enforcement and per-subscription authorization, and every check returned its expected status.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `auth_provider` unknown | **Return** to the owner; auth cannot be designed without it. |
| Phase 2 | Redis version below 6.2 (no GETDEL) | **Adjust**: use a Lua script or `MULTI`/`GET`/`DEL`/`EXEC`; confirm with `redis-cli INFO server`. |
| Phase 3 | Evil origin gets 101 | **Stop**: the Origin check is missing or uses a suffix match; fix before anything else. |
| Phase 3 | Reused ticket gets 101 | **Stop**: the consume is not atomic or not deleting. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
