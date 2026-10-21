# WebSocket Load Test with k6

**One-line description:** Writes and runs a k6 WebSocket load test where each virtual user holds one connection: ramping to the target concurrency, sending protocol-valid messages, measuring connect time and message round trip with a custom Trend, enforcing thresholds taken from the SLO, and exporting a JSON summary for capacity analysis.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `server_url` (string, required): WebSocket URL of the environment under test, for example `wss://rt-staging.example.com/ws`.
- `protocol_spec` (object, required): From `rtw-message-envelope`; gives the messages to send and the subprotocol.
- `target_connections` (integer, required): Concurrent connections to reach.
- `slo_targets` (object, required): Owner-set targets, for example `{ connect_p95_ms, rtt_p95_ms, max_error_rate }`.
- `os_limits_report` (object, required): From `rtw-linux-connection-limits`; must have no `blocking` entries.

---

## Outputs

- `k6_summary` (object): `{ k6_version, script_path, command, summary_path, thresholds: {}, results: { ws_connecting_p95, rtt_p95, ws_sessions, errors }, thresholds_passed: bool, exit_code }`.

---

## Phase 1: Write the Script

### Entry Criteria
- `os_limits_report.blocking` is empty; never run against production without written approval.

### Actions
1. Run `k6 version` and record it. Pick the module:
   - k6 v1.0 and later: `import { WebSocket } from 'k6/websockets';` (event-based, browser-like API).
   - older releases: `k6/experimental/websockets` with the same API.
   - The legacy `k6/ws` module (`ws.connect(url, params, fn)`) blocks the VU inside the callback; use it only if the newer module is unavailable.
   Confirm the module name for your version in the k6 docs "k6/websockets" page before writing code.
2. Create `load/ws-test.js`:
   - `options.scenarios.hold = { executor: 'ramping-vus', startVUs: 0, stages: [ { duration: '<ramp>', target: <target_connections> }, { duration: '<hold>', target: <target_connections> }, { duration: '<down>', target: 0 } ], gracefulRampDown: '<s>' }`. Ramp, hold and down durations are owner inputs; record them.
   - In the default function: `const ws = new WebSocket(url, '<subprotocol>')`. In `ws.onopen`, send `sys.hello`-style auth if needed, then a `sys.ping` with `id` and send time on an interval (`ws.setInterval` exists in the newer module; check docs).
   - `ws.onmessage`: on `sys.pong` matching an `id`, add `Date.now() - sent` to `const rtt = new Trend('rt_msg_rtt', true)`.
   - `ws.onerror` and `ws.onclose`: count unexpected closes in `const unexpectedClose = new Counter('rt_unexpected_close')`.
   - Close the socket at the end of the iteration's hold time with `ws.close()` so sessions end cleanly.
3. Thresholds from `slo_targets` only:
   `thresholds: { ws_connecting: ['p(95)<<connect_p95_ms>'], rt_msg_rtt: ['p(95)<<rtt_p95_ms>'], rt_unexpected_close: ['count<=<allowed>'] }`. If a target is missing, leave that threshold out and add it to open questions; do not invent one.
4. Auth: fetch tickets in `setup()` only if they are reusable for the test; single-use tickets must be fetched per VU iteration with `http.post` before opening the socket.

### Output
`load/ws-test.js`.

### Quality Gate
- `k6 inspect load/ws-test.js` exits 0 and prints the scenario and thresholds.

---

## Phase 2: Calibrate, Then Run

### Entry Criteria
- Script inspects cleanly.

### Actions
1. Calibration run on one generator with a small target, for example by overriding stages: `k6 run -e TARGET=<small> load/ws-test.js`. Watch generator memory with `top` or `free -m`; k6 memory grows per VU. Compute VUs one generator can hold from this run, and split `target_connections` across generators if needed (k6 OSS has no built-in distributed mode; run several instances, or use the k6 Kubernetes operator, with `--execution-segment` to split one test).
2. Full run: `k6 run --summary-export=load/summary.json --out json=load/raw.json load/ws-test.js`. Check `k6 run --help` for the summary flags of your version; v1.x also has `--summary-mode`.
3. Record the exit code: `echo $?`. k6 exits 99 when a threshold fails. Any other non-zero means the test itself failed.
4. While it runs, record server metrics (CPU, RSS, open fds, event loop lag or goroutine count) on each node at each stage boundary.

### Output
`load/summary.json`, `load/raw.json`, exit code.

### Quality Gate
- `jq '.metrics.ws_sessions' load/summary.json` shows a session count consistent with the VU target.
- The exit code is recorded.

---

## Phase 3: Read the Results

### Entry Criteria
- Summary exists.

### Actions
1. Read these metrics from the end-of-test summary or `summary.json`:
   - `ws_connecting`: time to complete the handshake (p95, max).
   - `ws_session_duration`: should be close to the hold time; much shorter means sessions dropped.
   - `ws_sessions`: sessions started.
   - `ws_msgs_sent`, `ws_msgs_received`: received should track sent times the expected fan-out.
   - `rt_msg_rtt`, `rt_unexpected_close`: custom metrics.
   - `checks` and the threshold marks (a check mark or a cross per threshold).
2. If `ws_connecting` p95 rises sharply only during ramp, the server accepts connections slower than the ramp; compare with the backlog and CPU readings.
3. Fill `k6_summary.results` and `thresholds_passed` from `summary.json` values, not from memory of the console.
4. Do NOT rerun with looser thresholds to get a pass. A failed threshold is a result.

### Output
`k6_summary`.

### Quality Gate
- Every field in `results` cites the JSON path it came from.
- `thresholds_passed` matches the exit code (99 means false).

---

## Worked Example

Illustrative only.

`target_connections = 20000`, `slo_targets = { connect_p95_ms: 500, rtt_p95_ms: 200 }` (owner). Calibration: one generator held 5000 VUs within its memory, so four generators each run `--execution-segment "0:1/4"`, `"1/4:2/4"`, and so on.
```
$ k6 run --summary-export=load/summary.json load/ws-test.js
     ✓ ws_connecting.........: avg=88ms  p(95)=310ms
     ✗ rt_msg_rtt............: avg=95ms  p(95)=241ms
       ws_sessions...........: 5000
$ echo $?
99
```
Result: connect SLO met, RTT SLO missed during hold at 20000; passed to capacity analysis.

---

## Exit Criteria

DONE when the k6 script holds one connection per VU at the target, thresholds come only from `slo_targets`, the run produced `summary.json` with a recorded exit code, and results are read from the JSON.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Module `k6/websockets` not found | **Adjust**: use `k6/experimental/websockets` for older k6, per `k6 version`. |
| Phase 2 | Generator runs out of memory | **Adjust**: split across more generators with `--execution-segment`. |
| Phase 2 | Many `dial: cannot assign requested address` errors | **Return** to `rtw-linux-connection-limits`: port exhaustion on the generator. |
| Phase 3 | Threshold failed | **Return** the result to capacity analysis; do not loosen thresholds. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
