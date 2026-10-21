# Realtime Capacity Report from Load Test Results

**One-line description:** Turns a k6 or Artillery realtime load test result plus server metrics into a capacity report: the concurrency where the first SLO or error limit broke, which resource saturated first, measured memory per connection, and the node count needed for the target, with every number traced to a file path or command output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `k6_summary` (object, optional): From `rtw-k6-ws-load-test`. Exactly one of `k6_summary` or `artillery_report` is present.
- `artillery_report` (object, optional): From `rtw-artillery-ws-load-test`.
- `slo_targets` (object, required): The same owner-set targets used in the test.
- `target_connections` (integer, required): Total concurrent connections the system must hold.

---

## Outputs

- `capacity_report` (object): `{ source, knee: { concurrency, time, broken_limit }, first_saturated_resource, memory_per_connection_bytes, connections_per_node_at_slo, nodes_needed, evidence: [ { claim, path_or_command } ], open_questions: [] }`.

---

## Phase 1: Find the Knee

### Entry Criteria
- Exactly one of `k6_summary` or `artillery_report` is present; if both, use the one named by the chain's `load_tool` and record that.

### Actions
1. Get a time series of concurrency and the SLO metrics:
   - k6: from `raw.json` (`--out json`), each line is a JSON point with `metric`, `data.time`, `data.value`. Extract with `jq -c 'select(.type=="Point" and (.metric=="vus" or .metric=="ws_connecting" or .metric=="rt_msg_rtt"))' load/raw.json`. Bucket by 10-second windows (or the reporting period you choose; record it) and compute p95 per bucket.
   - Artillery: use `.intermediate[]` in `report.json`; each entry is one period with counters and summaries.
2. The knee is the first bucket where any `slo_targets` limit is broken or the error count rises above zero (or above the owner's allowed error rate). Record its time, concurrency and which limit broke.
3. If no limit broke, the knee is "not reached"; capacity is at least the peak tested concurrency. Record it that way; do not extrapolate a knee.

### Output
`knee`.

### Quality Gate
- `knee` cites the bucket or period from the file (paste the JSON line).

---

## Phase 2: Find What Saturated

### Entry Criteria
- Knee found (or "not reached").

### Actions
1. Line up server metrics at the knee time for each node: CPU per core, RSS, open fds, network throughput, and runtime signals: Node event loop delay (`perf_hooks.monitorEventLoopDelay` histogram p99 exported by the app), Go goroutine count (`runtime.NumGoroutine` or `/debug/pprof/goroutine?debug=1` count), Python event loop lag (time between a scheduled callback's target and actual run, exported by the app).
2. Decision table, first matching row:

| Row | Observation at knee | `first_saturated_resource` |
|---|---|---|
| C1 | One core at 100% while others idle (Node or single-process Python) | `single_thread_cpu`: run one process per core (cluster/workers) behind the fan-out |
| C2 | All cores high | `cpu` |
| C3 | RSS near the container limit, or OOM kills in `kubectl describe pod` / `dmesg` | `memory` |
| C4 | `EMFILE` in logs or fds at the limit | `file_descriptors` |
| C5 | Redis CPU high or `PUBLISH` latency up (`redis-cli --latency`, `INFO commandstats`) | `redis_fanout` |
| C6 | Generator CPU or memory at limit | `load_generator`: the result is invalid; rerun with more generators |
| C7 | None of the above | `unknown`: add an open question and capture a profile at the knee next run |

3. Memory per connection: `(RSS at concurrency c2 - RSS at c1) / (c2 - c1)` from two hold points below the knee. Record both points.

### Output
`first_saturated_resource` and `memory_per_connection_bytes`.

### Quality Gate
- The chosen row cites at least one metric value with its source command or dashboard query.
- Row C6 is ruled out explicitly (generator CPU and memory values pasted).

---

## Phase 3: Size and Report

### Entry Criteria
- Saturation identified and not C6.

### Actions
1. `connections_per_node_at_slo` = knee concurrency divided by the number of server nodes in the test (if load was even across nodes; check per-node connection counts with `ss` or the app metric, and use the most loaded node otherwise).
2. `nodes_needed = ceil(target_connections / connections_per_node_at_slo)`. Add headroom only if the owner gives a headroom policy (for example N+1 for one node down, or room for reconnect storms after a deploy); record it. Note that a node failure moves its connections to the remaining nodes at once, so the N+1 check is `target_connections / (nodes_needed - 1) <= connections_per_node_at_slo`.
3. Write `evidence`: one line per claim with the file path and jq expression or command that produced it.
4. List what the test did not cover in `open_questions` (for example, message fan-out size larger than tested, mobile network latency, reconnect storm after a full outage).

### Output
`capacity_report`.

### Quality Gate
- `nodes_needed` arithmetic is shown.
- Every number in the report has an `evidence` entry.

---

## Worked Example

Illustrative only.

Source: k6, two server nodes, `rt_msg_rtt` SLO p95 under 200 ms (owner).
- Knee: bucket 14:21:30, VUs 17400, `rt_msg_rtt` p95 241 ms.
- Saturation: node-1 one core at 100%, others under 20%, event loop delay p99 180 ms: row C1 (`single_thread_cpu`).
- Memory: RSS 610 MB at 5000 and 1180 MB at 10000 conns per node: (1180 - 610) MB / 5000 = about 114 KB per connection.
- `connections_per_node_at_slo = 8700`; target 50000; `nodes_needed = ceil(50000 / 8700) = 6`; owner N+1 policy: 50000 / 5 = 10000 > 8700, so 7 nodes, or first fix C1 by running one process per core and retest.

---

## Exit Criteria

DONE when the report names the knee from the result file, the first saturated resource from the decision table with evidence, memory per connection from two measured points, and the node count with its arithmetic, and lists what was not tested.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Neither result present | **Stop**: run `rtw-k6-ws-load-test` or `rtw-artillery-ws-load-test` first. |
| Phase 2 | No server metrics captured during the test | **Return** to the load test flow; rerun with metrics captured at each stage. |
| Phase 2 | Row C6 (generator saturated) | **Stop**: discard the result and rerun with more generators. |
| Phase 3 | Uneven load across nodes | **Adjust**: size from the most loaded node and record the imbalance as an open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
