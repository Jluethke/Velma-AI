# Interop Test Against a Reference Implementation

**One-line description:** Runs your implementation against an independent, widely deployed implementation of the other role (curl, nghttp2, OpenSSL s_client/s_server, websocat, quic-go, or the quic-interop-runner matrix) in both directions, captures every exchange to pcap, and records per-scenario pass or fail with the exact command lines so each result can be replayed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements_table` (object[], required): From `s2i-requirements-table`; scenarios are linked to requirement IDs.
- `reference_impl` (string, required): The peer implementation and version to interoperate with.
- `implementation_command` (string, required): How to start your implementation (server command with port, or client command with target URL).
- `implementation_role` (string, required): Your role; the reference plays the other one.
- `project_dir` (string, required): Repository root; results go to `project_dir/reports/interop/`.

---

## Outputs

- `interop_report` (object[]): Rows `{ "scenario", "direction", "ours", "peer", "peer_version", "command", "result", "req_ids", "capture" }`.
- `capture_files` (string[]): Paths of `.pcapng` captures and TLS key log files, one per scenario.

---

## Phase 1: Choose Peers and Scenarios

### Entry Criteria
- `reference_impl` named.

### Actions
1. Pick peers for the protocol. Use at least two independent ones when they exist:

   | Protocol | Client-side peers | Server-side peers |
   |---|---|---|
   | HTTP/1.1 | `curl -v --http1.1` | nginx, Apache httpd |
   | HTTP/2 | `curl -v --http2` or `--http2-prior-knowledge` (cleartext h2c), `nghttp -nv` | `nghttpd`, nginx with `http2 on` |
   | HTTP/3 / QUIC | `curl --http3` (if built with HTTP/3; check `curl -V` features), quic-go, ngtcp2 examples | same, plus the `quic-interop-runner` matrix |
   | TLS 1.3 | `openssl s_client -connect host:port -tls1_3 -msg` | `openssl s_server -accept <port> -tls1_3 -cert c.pem -key k.pem` |
   | WebSocket | `websocat ws://127.0.0.1:<port>/` | `websocat -s <port>` |
   | MQTT | `mosquitto_pub` / `mosquitto_sub` | `mosquitto` |

2. Record each peer's version (`curl -V`, `openssl version`, `nghttp --version`, `websocat --version`).
3. Build scenarios: for each requirement with `applies` yes and `testability` black_box that is observable between two parties (handshake, negotiation, flow control, close, error signaling), write one scenario: what the peer does, what is expected.
4. Every scenario runs in both directions when you implement both roles.

### Output
Scenario list with peers.

### Quality Gate
- Every scenario names a peer, its version, a direction, and at least one `req_id`.
- At least one scenario per negotiation feature the spec defines (versions, extensions, ALPN, subprotocols).

---

## Phase 2: Run with Captures

### Entry Criteria
- Scenario list.

### Actions
1. For TLS-based protocols, make both sides write session keys so captures can be decrypted: set `SSLKEYLOGFILE=reports/interop/keys-<scenario>.log` in the environment of the side that supports it (curl, Firefox, Chrome, and many libraries honor it; OpenSSL s_client has `-keylogfile`; check `openssl s_client -help`).
2. Start the capture before the exchange: `tshark -i lo -w reports/interop/<scenario>.pcapng -f 'tcp port <port> or udp port <port>'` (Linux loopback is `lo`; macOS is `lo0`; Windows needs the Npcap loopback adapter; list interfaces with `tshark -D`).
3. Start the server side, run the client side, and save its full stdout and stderr: `curl -v --http2-prior-knowledge http://127.0.0.1:8080/ 2>&1 | tee reports/interop/<scenario>.log`.
4. Stop the capture with Ctrl+C after the client exits.
5. Decide `result` from the observable outcome only: `PASS` if the expected application result happened and neither side logged a protocol error; `FAIL` otherwise; `PEER_ERROR` if the peer logs a protocol error about our bytes (that is our bug until proven otherwise).
6. Run one scenario at a time. Do not change code between scenarios of one round; collect all results first.

### Output
Logs and captures per scenario.

### Quality Gate
- Every scenario has a `.log` and a `.pcapng` with non-zero size (`ls -l reports/interop/`).
- Every TLS scenario has a non-empty key log file.

---

## Phase 3: Report

### Entry Criteria
- All scenarios run.

### Actions
1. Write `interop_report` as `reports/interop/report.json` and a Markdown table with one row per scenario and direction.
2. For each `FAIL` or `PEER_ERROR`, copy the decisive log lines (for example curl's `* HTTP/2 stream 1 was not closed cleanly: PROTOCOL_ERROR`) into the row.
3. Hand every capture path to `s2i-tshark-wire-check` via `capture_files`.
4. A failure where two independent peers agree against you is your bug. A failure with one peer only goes to the ambiguity log with both peers' behavior.

### Output
`interop_report`, `capture_files`.

### Quality Gate
- Every row has a replayable `command`.
- Every `FAIL` row quotes the decisive log line.

---

## Worked Example

Illustrative. Our HTTP/2 cleartext server, role server, peers curl and nghttp.

Phase 1: curl 8.x (`curl -V` shows `HTTP2` feature) and nghttp2 client. Scenarios: S1 prior-knowledge GET, S2 POST with a body larger than the initial flow-control window, S3 client sends RST_STREAM mid-response.

Phase 2:
```
$ tshark -i lo -w reports/interop/S2.pcapng -f 'tcp port 8080' &
$ curl -v --http2-prior-knowledge --data-binary @big.bin http://127.0.0.1:8080/upload 2>&1 | tee reports/interop/S2.log
...
* HTTP/2 stream 1 was not closed cleanly: FLOW_CONTROL_ERROR (err 3)
```
Phase 3: S2 `FAIL`, nghttp shows the same error, so it is our bug: the server did not send WINDOW_UPDATE. `req_ids`: REQ-6.9-xx. Capture handed to the wire check.

---

## Exit Criteria

DONE when every scenario has run in each applicable direction against pinned peer versions, with logs, captures, and key logs saved, and every failure is classified as ours or sent to the ambiguity log.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Peer lacks the feature (curl built without HTTP/3) | **Adjust**: use another peer from the table; record the missing feature. |
| Phase 2 | Capture is empty | **Adjust**: wrong interface; check `tshark -D` and rerun. |
| Phase 2 | No permission to capture | **Adjust**: add the user to the `wireshark` group or run tshark with the needed capability; do not run the implementation as root. |
| Phase 3 | Peers disagree with each other | **Return** to `s2i-ambiguity-log` with both behaviors. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
