# Incident Node.js Diagnostic Report and Event Loop Check

**One-line description:** Collects runtime evidence from a live Node.js process using the built-in diagnostic report (signal-triggered), the event loop lag metric, and, only with approval, a short inspector CPU profile, then reads them to tell event loop blocking from libuv threadpool saturation from slow downstream I/O.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `debug_access` (object, required): From `inc-k8s-safe-debug-access`; shell location and pid_of_app.
- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; the rows this evidence must decide.

---

## Outputs

- `node_runtime_evidence` (object): {node_version, start_flags, report_files, javascript_stack, libuv_handle_counts, active_requests, heap_used_vs_limit, event_loop_lag_series, cpu_profile_file, hypotheses_affected}.

---

## Phase 1: Read How the Process Was Started

### Entry Criteria
- A shell that sees the Node process exists.

### Actions
1. Show the command line and flags: `cat /proc/<pid>/cmdline | tr '\0' ' '; echo` and `cat /proc/<pid>/environ | tr '\0' '\n' | grep -E '^NODE_OPTIONS|^UV_THREADPOOL_SIZE'`. Do not print the full environment into the channel; it may contain secrets.
2. Record whether these flags are present: `--report-on-signal`, `--report-signal`, `--report-directory`, `--heapsnapshot-signal`, `--max-old-space-size`.
3. Read UV_THREADPOOL_SIZE; when unset, Node's documented default size applies (see the Node.js docs for `UV_THREADPOOL_SIZE`). The threadpool runs `fs`, `dns.lookup`, some `crypto` and `zlib` work.
4. Query event loop lag if the service exports prom-client default metrics: `nodejs_eventloop_lag_seconds` (and `nodejs_eventloop_lag_p99_seconds` in newer prom-client versions; check the metric list from `inc-promql-red-triage` Phase 1). Pull it over the incident window with `query_range`.

### Output
Start flags, threadpool size, lag series.

### Quality Gate
- The flag list is recorded as present or absent for each of the five flags.
- The lag series is attached, or the record says the metric is not exported.

---

## Phase 2: Write a Diagnostic Report

### Entry Criteria
- Start flags are known.

### Actions
1. If `--report-on-signal` is present: send the signal (SIGUSR2 unless `--report-signal` changed it): `kill -USR2 <pid>`. The report is written as `report.<date>.<time>.<pid>.<seq>.json` in `--report-directory` or the working directory. Taking a report does not stop the process.
2. If the flag is absent, the report can only be triggered from inside the process (`process.report.writeReport()`); do NOT redeploy just to add it during the incident. Record "no report available" and continue to Phase 3 if a CPU profile is approved.
3. Copy the report out: `kubectl cp <ns>/<pod>:<path>/report.<...>.json ./report.json -c <debug container>` or from `/proc/<pid>/root/<path>` inside the debug container.
4. Read it with jq:
   ```
   jq '.header | {nodejsVersion, commandLine}' report.json
   jq '.javascriptStack' report.json
   jq '.javascriptHeap | {totalMemory, usedMemory, memoryLimit}' report.json
   jq '[.libuv[] | .type] | group_by(.) | map({type: .[0], n: length})' report.json
   ```
   The report also contains environment variables. Treat the file as sensitive and do not attach it to tickets unredacted.
5. Interpret:

| Evidence | Reading |
|---|---|
| Lag series high at onset, `javascriptStack` in app code | Event loop blocked by synchronous work (JSON.parse of large bodies, sync crypto, regex backtracking, sync fs) |
| Lag low, many `tcp` handles, latency high | Waiting on downstream I/O; check the trace fault span |
| Lag low, latency high on fs, dns or crypto paths | libuv threadpool saturation; count concurrent threadpool work versus pool size |
| `usedMemory` close to `memoryLimit` | Heap pressure; garbage collection pauses add lag; consider OOM risk |

### Output
Report file and a chosen reading.

### Quality Gate
- `jq` outputs for header, javascriptStack, javascriptHeap and libuv are pasted.
- One interpretation row is chosen with the evidence quoted.

---

## Phase 3: CPU Profile (Approval Required)

### Entry Criteria
- Phase 2 points to event loop blocking, and the IC approves (this opens a debugging port).

### Actions
1. Enable the inspector on a running process: `kill -USR1 <pid>`. On Linux Node starts the inspector bound to 127.0.0.1:9229. The inspector allows code execution, so it must never be exposed beyond localhost.
2. From your machine: `kubectl port-forward pod/<pod> -n <ns> 9229:9229`, open `chrome://inspect` in Chrome, select the target, open the Performance or Profiler panel, and record for a duration chosen by the ops lead.
3. Save the `.cpuprofile`. Read it: the heaviest self-time functions in "Bottom-Up" are the blocking code.
4. Stop the port-forward when done. The inspector stays enabled until the process restarts; record this and include the pod in the post-incident restart list.
5. Do NOT take a heap snapshot on a live serving process unless the IC approves: it blocks the event loop for the duration and needs extra memory roughly the size of the heap, which can trigger an OOM kill.

### Output
`node_runtime_evidence` with the profile.

### Quality Gate
- The `.cpuprofile` file exists and the top three self-time functions are recorded.
- The pod is on the restart list because the inspector was enabled.

---

## Worked Example

Illustrative only. Node 20 API pod, flags `--report-on-signal --report-directory=/tmp`.

- Phase 1: UV_THREADPOOL_SIZE unset. `nodejs_eventloop_lag_seconds` rose from 0.002 to 1.8 at 13:59Z.
- Phase 2: `kill -USR2 1` writes `/tmp/report.20261020.141502.1.001.json`. `javascriptStack.stack` top frame `at JSON.parse (<anonymous>)` then `at parseCatalog (/app/src/catalog.js:57:21)`. libuv: 212 tcp handles. Reading: event loop blocked by synchronous work.
- Phase 3: IC approves. `kill -USR1 1`, port-forward, 20 s profile. Bottom-Up: `JSON.parse` 71 percent self time from `parseCatalog`. Pod added to restart list.

---

## Exit Criteria

DONE when the start flags, lag series and (if available) a diagnostic report are read, an interpretation row is chosen, and any approved profile is saved with the inspector risk recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot read `/proc/<pid>` | **Return**: to `inc-k8s-safe-debug-access` with `--target` set to the app container. |
| Phase 2 | No report appears after the signal | **Adjust**: check `--report-directory` is writable; if the flag is absent, record that and move on. |
| Phase 2 | Process died after the signal | **Stop**: SIGUSR2 without `--report-on-signal` may be handled by app code or ignored; record it and read logs. |
| Phase 3 | IC declines the inspector | **Return**: decide hypotheses from the report and lag series alone. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
