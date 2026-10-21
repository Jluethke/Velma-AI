# Network Fault Tests for Realtime Clients with Toxiproxy

**One-line description:** Runs four scripted network faults through Toxiproxy between a realtime client and server (hard reset, silent black hole, slow consumer bandwidth limit, and latency) and checks that heartbeat detection, reconnect backoff, backpressure closes and state reconciliation each behave as configured.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `server_url` (string, required): Host and port of a locally running realtime server, for example `localhost:8080`.
- `backpressure_policy` (object, required): From `rtw-backpressure-policy`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`.
- `reconnect_client` (object, required): From `rtw-client-reconnect-backoff`.
- `reconciliation_impl` (object, required): From `rtw-client-state-reconciliation`.

---

## Outputs

- `chaos_report` (object): `{ toxiproxy_version, scenarios: [ { name, toxic_command, expected, observed, pass } ], all_pass: bool }`.

---

## Phase 1: Set Up the Proxy

### Entry Criteria
- The server runs at `server_url`.

### Actions
1. Install Toxiproxy from its GitHub releases (Shopify/toxiproxy) or `brew install toxiproxy`, or run the container `ghcr.io/shopify/toxiproxy`. Record `toxiproxy-server --version`.
2. Start `toxiproxy-server` (API on port 8474 by default).
3. Create the proxy: `toxiproxy-cli create -l localhost:18080 -u <server_url> rt`. Point the test client at `ws://localhost:18080/ws`.
4. Confirm: `toxiproxy-cli list` shows `rt` enabled, and one client connects through port 18080 and receives `sys.hello`.
5. Prepare a test harness (a Node script using the real client wrapper, or a Playwright page) that logs, with timestamps: close codes, reconnect attempts, received `seq` per stream, and final state.
6. Toxic flags vary by CLI version; run `toxiproxy-cli toxic add --help` and use the attribute names it lists.

### Output
Proxy `rt` and harness.

### Quality Gate
- `toxiproxy-cli list` output pasted; harness log shows `sys.hello` through the proxy.

---

## Phase 2: Run the Four Scenarios

### Entry Criteria
- Proxy works.

### Actions
1. S1 hard reset: `toxiproxy-cli toxic add -t reset_peer -a timeout=0 rt`. Expected: client sees close code 1006, reconnect attempts follow the backoff (first wait within `[0, min(cap, base*2)]`). Remove with `toxiproxy-cli toxic remove -n reset_peer_downstream rt` (the default toxic name is `<type>_<stream>`; check `toxiproxy-cli inspect rt`). Expected after removal: client reconnects, resumes, no seq gap.
2. S2 black hole (half-open connection): `toxiproxy-cli toxic add -t timeout -a timeout=0 rt`. With timeout 0, data stops and the connection is not closed. Expected: server detects the dead peer within `heartbeat_config.dead_peer_detect_s`; client detects within its app-ping window and reconnects once the toxic is removed. Record both detection times.
3. S3 slow consumer: `toxiproxy-cli toxic add -t bandwidth -a rate=<KB_per_s> --downstream rt` with a rate below the server's send rate during a publish burst (choose the rate from a measured burst size; record it). Expected for must-deliver traffic: server closes with the slow-consumer code (4020) once the queue bound is hit, client reconnects and resumes; for droppable traffic: drop counters rise, no close.
4. S4 latency: `toxiproxy-cli toxic add -t latency -a latency=<ms> -a jitter=<ms> rt` with values from the slowest client network the product supports (owner input). Expected: no disconnects as long as latency plus pong timeout stays inside the heartbeat window; message order per stream unchanged.
5. After each scenario, remove all toxics (`toxiproxy-cli inspect rt` must show none) and compare the client's final state with a fresh snapshot from the server: they must be equal.
6. Run each scenario once per transport the product ships (WebSocket and the fallback).

### Output
Scenario observations.

### Quality Gate
- For each scenario, the harness log shows the expected close code or counter and the final state equals the snapshot.

---

## Phase 3: Report and Automate

### Entry Criteria
- Scenarios run.

### Actions
1. Fill `chaos_report.scenarios` with the exact toxic command, expected result, observed result with timestamps, and pass/fail.
2. For each failure, name the flow that owns the fix: detection time wrong goes to `rtw-heartbeat-config`, tight reconnect loop to `rtw-client-reconnect-backoff`, no slow-consumer close to `rtw-backpressure-policy` and the stack server flow, state mismatch to `rtw-client-state-reconciliation`.
3. Automate: use a Toxiproxy client library (for example `toxiproxy-node-client`, `toxiproxy-python`, or the Go client in the Toxiproxy repo) inside the integration test suite, so these run in CI with a Toxiproxy service container.
4. Do NOT mark a scenario as passing because the client "eventually" reconnected; check the timing and codes against the expected values.

### Output
`chaos_report`.

### Quality Gate
- `all_pass` is true, or every failure names its owning flow.

---

## Worked Example

Illustrative only.

`heartbeat_config.dead_peer_detect_s = 49`, backoff base 500 ms, cap 30 s.
```
$ toxiproxy-cli create -l localhost:18080 -u localhost:8080 rt
Created new proxy rt
$ toxiproxy-cli toxic add -t timeout -a timeout=0 rt
Added downstream timeout toxic 'timeout_downstream' on proxy 'rt'
```
Harness: last message 10:00:00; server log `terminated dead peer` 10:00:41 (within 49 s); client app-ping timeout 10:00:47 and state `waiting`. After removal at 10:01:30 the client reconnected at 10:01:31, resumed from seq 220, received 221 to 236, and final state equaled the snapshot. S2 pass.

---

## Exit Criteria

DONE when all four faults ran through Toxiproxy for every shipped transport, each observed result matched the configured heartbeat, backoff, backpressure and reconciliation behavior, and the report names an owning flow for any failure.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Port 18080 in use | **Adjust**: pick another listen port and update the harness URL. |
| Phase 2 | Toxic attribute rejected | **Retry** after `toxiproxy-cli toxic add --help`; do not invent attributes. |
| Phase 2 | Client never reconnects after S1 | **Stop**: return to `rtw-client-reconnect-backoff` with the log. |
| Phase 3 | Final state differs from snapshot | **Return** to `rtw-client-state-reconciliation` with the seq log. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
