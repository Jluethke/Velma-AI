# Kill Switch Propagation Drill

**One-line description:** Runs a timed drill that flips one flag off in a production-like environment and measures how long every consumer (server SDKs by streaming or polling, browser clients, caches, Relay Proxy or Unleash Edge) takes to serve the safe default, then writes the measured worst case into the on-call runbook.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rollback_automation` (object, required): Output of `ffr-auto-rollback-trigger`; gives the off command and the timestamps of the automated test.
- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`.

---

## Outputs

- `drill_report` (object): Every consumer with its update mechanism and configured interval, measured time from flip to safe default per consumer, the worst case, any consumer that never updated, and the runbook entry text.

---

## Phase 1: List Consumers and Their Update Paths

### Entry Criteria
- The flag exists in a production-like environment with real SDK consumers.

### Actions
1. List every process that evaluates the flag (services, workers, cron jobs, browser and mobile apps). Use the call sites from earlier flows and the provider's view of connected SDKs (LaunchDarkly shows SDK connections per environment; Unleash shows connected applications and instances).
2. For each consumer, write its update mechanism and the configured interval, reading the actual config:

| Mechanism | Where to read the interval |
|---|---|
| LaunchDarkly server SDK streaming | streaming is the default; check for `stream: false` or polling mode in SDK config |
| Unleash server SDK polling | `refreshInterval` (Node), `refresh_interval` (Python), `WithRefreshInterval` (Go), or the SDK's documented default |
| flagd RPC mode | stream from flagd; file changes picked up by flagd's file watch |
| flagd in-process mode | sync stream from the flagd sync source |
| Relay Proxy or Unleash Edge | its own upstream refresh setting plus the SDK's interval to it |
| Browser or mobile SDK | streaming if enabled, otherwise polling or only at startup or context change |
| Application cache of flag results | any memoization in your code (search for caching around evaluation calls) |

3. Flag any consumer that only reads flags at startup (for example a batch job or a mobile app without streaming). The kill switch does not reach it until restart. Record it.

### Output
Consumer table.

### Quality Gate
- Every consumer has a mechanism and an interval copied from config or from the SDK's documented default, with the source named.

---

## Phase 2: Run the Timed Flip

### Entry Criteria
- Consumer table complete; flag currently on for a known audience in the drill environment.

### Actions
1. Announce the drill to the on-call channel before starting. Run it in a production-like environment, or in production only for a flag whose off state is known safe (`flag_spec.safe_default`).
2. Start a probe per consumer type that logs the served variant with a timestamp every second. For services, a debug endpoint or log line from the evaluation details; for browsers, a headless browser script reading the rendered state.
3. Synchronize clocks: check that probe hosts run NTP (`timedatectl` on Linux shows "System clock synchronized: yes").
4. Flip the flag off with the exact command in `rollback_automation`. Record the flip time from the provider's audit log, not from your terminal.
5. Before flipping, write down an observation limit with the owner (how long you will wait before declaring a consumer "did not update"); it must be longer than the longest configured interval in the table. Keep probes running until every consumer shows the safe default or the limit passes.
6. Turn the flag back on only if the drill plan says so, and record it.

### Output
Per-consumer timestamps.

### Quality Gate
- The flip time is copied from the provider audit log.
- Each consumer has a first-safe-default timestamp or is marked "did not update within the observation limit", with the limit recorded.

---

## Phase 3: Compare and Write the Runbook Entry

### Entry Criteria
- Timestamps collected.

### Actions
1. For each consumer compute delay = first safe-default time minus flip time.
2. Compare each delay with its configured interval. A delay much longer than the interval points to an extra layer (cache, proxy, CDN). Find it before writing the runbook.
3. Worst case = the largest delay among consumers that updated. List the consumers that did not update separately with the action needed (restart, redeploy, app release).
4. Write the runbook entry: the off command, the worst-case delay measured, the consumers that need a restart, and the date of the drill. Put it where on-call reads runbooks.
5. Schedule nothing yourself; record "next drill date" as an owner decision.

### Output
`drill_report`.

### Quality Gate
- Every delay is computed from recorded timestamps (show the subtraction).
- The runbook entry exists at a named path or URL and contains the worst-case delay and the restart list.

---

## Worked Example

Illustrative only. Unleash, Node and Python services, React app via Unleash Edge.

| Consumer | Mechanism | Configured | Measured delay |
|---|---|---|---|
| checkout-api (Node) | poll | `refreshInterval` 15000 ms (from config) | 11 s |
| tax-worker (Python) | poll | SDK default per docs | 14 s |
| web (React via Edge) | Edge refresh + frontend poll | Edge and frontend SDK settings | 41 s |
| nightly-export (cron) | reads at start | n/a | did not update; next run picks it up |

Worst case for running consumers: 41 s (web). Runbook updated at `runbooks/checkout.md#kill-switch` with the off command, 41 s, and "nightly-export: restart not needed, next run reads new state".

---

## Exit Criteria

DONE when every consumer's update path is documented from config, a timed flip measured each delay against the provider's audit time, the worst case and non-updating consumers are known, and the runbook entry is written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Consumer list incomplete (unknown SDK connections) | **Adjust**: compare the provider's connected applications list with your list; add the missing ones. |
| Phase 2 | No production-like environment | **Return**: record an open question; a staging drill with fewer consumers understates the worst case. |
| Phase 2 | A consumer never updates | **Adjust**: record it; check whether it reads flags only at startup or has a cache. |
| Phase 3 | Delay far above the interval | **Adjust**: find the extra cache or proxy layer before publishing the runbook. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
