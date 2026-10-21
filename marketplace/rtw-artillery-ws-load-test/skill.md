# WebSocket Load Test with Artillery

**One-line description:** Writes and runs an Artillery test with the `ws` engine (or the Socket.IO engine for Socket.IO servers), derives the arrival rate needed to reach the target concurrency from session length with Little's law, enforces SLO limits with the `ensure` settings, and exports a JSON report for capacity analysis.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `server_url` (string, required): WebSocket base URL, for example `wss://rt-staging.example.com`.
- `protocol_spec` (object, required): From `rtw-message-envelope`.
- `target_connections` (integer, required): Concurrent connections to reach.
- `slo_targets` (object, required): Owner-set targets (error rate, latency percentiles).
- `os_limits_report` (object, required): From `rtw-linux-connection-limits`; must have no `blocking` entries.

---

## Outputs

- `artillery_report` (object): `{ artillery_version, script_path, command, report_path, phases: [], arrival_derivation, results: { vusers_created, vusers_failed, errors: {}, custom_latency_p95 | null }, ensure_passed: bool, exit_code }`.

---

## Phase 1: Derive the Load Shape

### Entry Criteria
- `os_limits_report.blocking` is empty.

### Actions
1. Run `npx artillery version` (or `artillery version`) and record it. Install locally if missing: `npm install --save-dev artillery`.
2. Artillery models virtual users that arrive at a rate and each run one scenario from start to end. With the `ws` engine, one VU opens one connection for the length of its scenario. Concurrency therefore follows Little's law: `L = lambda * W`, where `L` = concurrent connections, `lambda` = `arrivalRate` per second, `W` = scenario duration in seconds (sum of `think` steps and loops).
3. Choose `W` (session length) with the owner, for example how long a real user stays connected in the test. Then `arrivalRate = ceil(target_connections / W)`. Write the arithmetic in `arrival_derivation`.
4. Phases: a warm-up with `arrivalRate` rising to the derived value (`rampTo`), then a hold phase with `duration` at least `W` so concurrency actually reaches `L`. Durations come from the owner; record them.

### Output
Phase plan and `arrival_derivation`.

### Quality Gate
- `arrivalRate * W >= target_connections` with numbers shown.
- Hold phase `duration >= W`.

---

## Phase 2: Write and Run the Script

### Entry Criteria
- Phase plan fixed.

### Actions
1. Create `load/ws-test.yml`:
   ```
   config:
     target: "<server_url>"
     phases:
       - duration: <warm_s>
         arrivalRate: 1
         rampTo: <arrivalRate>
       - duration: <hold_s>
         arrivalRate: <arrivalRate>
     ws:
       subprotocols: ["<subprotocol>"]
   scenarios:
     - engine: ws
       flow:
         - connect: "/ws?ticket={{ ticket }}"
         - send: '{"v":1,"type":"sub.subscribe","id":"{{ $uuid }}","data":{"stream":"room:1"}}'
         - loop:
             - send: '{"v":1,"type":"sys.ping","id":"{{ $uuid }}","data":{}}'
             - think: <interval_s>
           count: <n>
   ```
   Key names for subprotocols, `connect`, and template helpers differ between Artillery versions; open the Artillery docs page "WebSocket engine" for your version and adjust before running. Do not keep a key the docs do not list.
2. Socket.IO servers: use `engine: socketio` with `emit` steps instead (Artillery "Socket.IO engine" docs); a raw `ws` client cannot speak the Socket.IO protocol.
3. Tickets: if single use, fetch them with a `beforeScenario` function in a `processor` JS file, or a preceding HTTP step if your version supports mixing engines; record the approach.
4. SLO enforcement: add an `ensure` block in `config` (built into Artillery 2.x as the ensure plugin) using only `slo_targets`, for example `maxErrorRate: <max_error_rate>`. Add percentile checks only for metric names that appear in your report output.
5. Validate the YAML parses: `npx artillery run --dry-run load/ws-test.yml` if your version lists `--dry-run` in `npx artillery run --help`; otherwise run a single short phase.
6. Run: `npx artillery run --output load/report.json load/ws-test.yml`. Record the exit code with `echo $?`; a failed `ensure` check makes Artillery exit non-zero.

### Output
`load/report.json` and exit code.

### Quality Gate
- `load/report.json` exists and `jq '.aggregate.counters["vusers.created"]' load/report.json` prints a number.

---

## Phase 3: Read the Report

### Entry Criteria
- Report exists.

### Actions
1. From `.aggregate.counters` read `vusers.created`, `vusers.completed`, `vusers.failed`, and every `errors.*` key (for example `errors.ECONNRESET`, `errors.ETIMEDOUT`). List all error keys: `jq '.aggregate.counters | with_entries(select(.key|startswith("errors.")))' load/report.json`.
2. From `.aggregate.summaries` read the percentile objects that exist (keys vary by engine and version; list them with `jq '.aggregate.summaries | keys' load/report.json`). Do not report a metric that is not in the file.
3. From `.intermediate[]` (one entry per reporting period), find the first period where errors appear or a latency percentile crosses the SLO, and record its timestamp and the concurrency at that time (`vusers.created` minus completed and failed, cumulative).
4. HTML report: `artillery report` is deprecated in recent Artillery 2.x releases; check `npx artillery --help`. Use the JSON as the source of truth.
5. Fill `artillery_report.results` with JSON paths cited.

### Output
`artillery_report`.

### Quality Gate
- Every value in `results` cites the JSON path it came from.
- `ensure_passed` matches the exit code.

---

## Worked Example

Illustrative only.

`target_connections = 6000`, owner session length `W = 300 s`. `arrivalRate = ceil(6000 / 300) = 20`. Phases: warm 120 s ramping 1 to 20, hold 600 s at 20.
```
$ npx artillery run --output load/report.json load/ws-test.yml
...
vusers.created: ................ 14400
vusers.completed: .............. 14212
vusers.failed: ................. 188
errors.ECONNRESET: ............. 188
$ jq '.intermediate[] | select(.counters["errors.ECONNRESET"] != null) | .period' load/report.json | head -1
"1729433400000"
```
First resets appeared at about 5800 concurrent connections.

---

## Exit Criteria

DONE when the arrival rate is derived from the target with Little's law, the script uses only documented keys for the installed version, `ensure` limits come from `slo_targets`, and results are read from `report.json` with cited paths.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner gives no session length | **Stop**: concurrency cannot be derived from an arrival rate alone. |
| Phase 2 | Unknown key warning or schema error | **Retry** after checking the version's docs; remove keys you cannot find there. |
| Phase 2 | Every VU fails with a 400 handshake | **Adjust**: wrong subprotocol or missing ticket; test one connection with `websocat` first. |
| Phase 3 | Expected metric key absent | **Adjust**: report only keys present; note the gap as an open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
