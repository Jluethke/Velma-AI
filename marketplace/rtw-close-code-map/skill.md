# Realtime Close Code Map

**One-line description:** Maps every reason a realtime connection ends to one RFC 6455 or application close code (or HTTP status for SSE and long polling) and to one fixed client reaction (reconnect with backoff, reconnect after re-auth, or stop), so server and client code agree on disconnect behavior.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `protocol_spec` (object, required): Output of `rtw-message-envelope`, including `max_message_bytes`.
- `transport_decision` (object, required): Output of `rtw-transport-decision`.

---

## Outputs

- `close_code_map` (object): `{ entries: [ { reason, code, sent_by, reason_text, client_action } ], never_send: [1005, 1006, 1015], file_path }`, where `client_action` is one of `reconnect_backoff`, `reconnect_jitter_only`, `reauth_then_reconnect`, `stop_and_report`, `stop_upgrade_required`.

---

## Phase 1: Load the Standard Codes

### Entry Criteria
- Inputs present.

### Actions
1. Copy the standard codes from RFC 6455 section 7.4.1 and the IANA WebSocket Close Code Number Registry into the map. Use this table; do not add codes from memory that are not in it.

| Code | Name | Who sends | Default client action |
|---|---|---|---|
| 1000 | Normal Closure | either | `stop_and_report` if unexpected, else nothing |
| 1001 | Going Away | server shutting down, or browser leaving page | `reconnect_backoff` |
| 1002 | Protocol Error | either | `stop_and_report` (a bug, reconnecting repeats it) |
| 1003 | Unsupported Data | either | `stop_and_report` |
| 1005 | No Status Received | reserved, never sent | treat like 1006 |
| 1006 | Abnormal Closure | reserved, never sent; the client sees it when TCP dropped without a Close frame | `reconnect_backoff` |
| 1007 | Invalid frame payload data | either | `stop_and_report` |
| 1008 | Policy Violation | server | see Phase 2 |
| 1009 | Message Too Big | either | `stop_and_report` (reconnecting and resending loops forever) |
| 1010 | Mandatory Extension | client | `stop_and_report` |
| 1011 | Internal Error | server | `reconnect_backoff` |
| 1012 | Service Restart | server | `reconnect_jitter_only` |
| 1013 | Try Again Later | server | `reconnect_backoff` |
| 1014 | Bad Gateway | gateway | `reconnect_backoff` |
| 1015 | TLS handshake failure | reserved, never sent | `stop_and_report` |

2. Set `never_send = [1005, 1006, 1015]`. Sending them in a Close frame is a protocol violation.
3. Note the reason text limit: a Close frame payload is at most 125 bytes, 2 of which are the code, so `reason_text` must be at most 123 bytes of UTF-8.

### Output
Standard section of the map.

### Quality Gate
- The map contains every code in the table above and no other 1xxx code.
- Every `reason_text` is at most 123 bytes: check with `node -e "console.log(Buffer.byteLength('<text>'))"`.

---

## Phase 2: Add Application Codes

### Entry Criteria
- Standard section present.

### Actions
1. Application codes live in 4000-4999 (RFC 6455 reserves this range for private use). Add one entry per application reason. Start from this list and remove rows that do not apply:

| Reason | Code | Client action |
|---|---|---|
| Auth token missing or invalid at connect | 4001 | `reauth_then_reconnect` |
| Auth token expired during the session | 4002 | `reauth_then_reconnect` |
| Forbidden: authenticated but not allowed | 4003 | `stop_and_report` |
| Unsupported protocol version | 4010 | `stop_upgrade_required` |
| Slow consumer: send queue overflow | 4020 | `reconnect_backoff`, then resume from last `seq` |
| Client exceeded inbound rate limit | 4029 | `reconnect_backoff` |
| Server-side resync required (replay window passed) | 4030 | `reconnect_jitter_only`, then request a full snapshot |

2. Use 1008 only when no application code above fits; 1008 alone tells the client nothing about whether re-auth helps.
3. For SSE and long polling there is no close code. Map the same reasons to HTTP status codes on the (re)connect request instead: 401 for 4001/4002, 403 for 4003, 410 for 4010, 429 for 4029 (with a `Retry-After` header), 503 for 1012/1013. Note that the browser `EventSource` stops reconnecting on any non-200 response or wrong content type; the client must create a new `EventSource` itself after re-auth.
4. Write the full map to a single file in the repo shared by server and client, for example `shared/realtime/close-codes.json` (or a generated `.ts` and `.go`/`.py` constant file from it). Record the path in `file_path`.

### Output
`close_code_map` file.

### Quality Gate
- Every application code is in 4000-4999 and unique: `node -e "const m=require('./shared/realtime/close-codes.json');const c=m.entries.map(e=>e.code);console.log(c.length===new Set(c).size)"` prints `true`.
- Every entry has exactly one `client_action` from the allowed list.

---

## Phase 3: Wire and Check Usage

### Entry Criteria
- Map file exists.

### Actions
1. Grep the server for every close call and list the code each uses:
   - Node: `grep -rnE "\.close\(|\.terminate\(" src/`
   - Go: `grep -rn "FormatCloseMessage\|\.Close()" .`
   - Python: `grep -rn "close(code" .`
2. Every literal code found must be in the map. Replace literal numbers with the shared constants one file at a time, running the test suite after each file.
3. Grep the client for the `onclose` / `close` handler and confirm it switches on `event.code` using the map, not on `event.reason` text.
4. A bare `terminate()` or socket destroy produces 1006 on the client; list each one and confirm it is intentional (dead peer after missed heartbeat).

### Output
Usage report appended to `close_code_map`.

### Quality Gate
- Zero literal close codes remain in server code outside the shared constants file (rerun the grep and paste the output).
- The test suite passes after the replacements (paste the summary line).

---

## Worked Example

Illustrative only.

Node server greps:
```
$ grep -rnE "\.close\(|\.terminate\(" src/
src/ws/auth.ts:41:    ws.close(1008, "bad token");
src/ws/heartbeat.ts:22:   ws.terminate();
```
`auth.ts:41` changes to `ws.close(CLOSE.AUTH_INVALID, "auth invalid")` with `AUTH_INVALID = 4001`; the client's `onclose` for 4001 calls `refreshToken()` then reconnects. `heartbeat.ts:22` stays a terminate: the peer is already dead and sending a Close frame would only wait. `npm test` printed `Tests: 48 passed, 48 total`.

---

## Exit Criteria

DONE when the shared map file lists every close reason with one code and one client action, no reserved code is sent, and server code uses only mapped constants.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code proposed outside the table and outside 4000-4999 | **Stop**: 3000-3999 is for registered libraries and frameworks; do not invent one. |
| Phase 2 | Reason text longer than 123 bytes | **Adjust**: shorten it; put details in a `sys.error` message sent before the close. |
| Phase 3 | Tests fail after replacing a literal | **Return** to the last passing file; the constant value differs from the literal used before. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
