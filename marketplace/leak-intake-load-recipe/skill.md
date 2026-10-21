# Leak Intake and Fixed Load Recipe

**One-line description:** Turns a vague "memory keeps going up" report into a written leak brief and a fixed, repeatable load recipe that counts completed operations, so every later measurement can be expressed as bytes per operation instead of bytes per hour.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `symptom_report` (string, required): What was observed, in the reporter's words: dashboards, alerts, OOM kills, restarts, the time span, and the version that first showed it.
- `stack` (string, required): One of `python`, `node`, `browser`, `jvm`, `go`, `cpp`. Selects stack-specific flows later in the chain.
- `target_process` (string, required): How to start the suspect process (command line, container image and args, or service name) or the PID of a running one.
- `load_driver` (string, optional): An existing load or replay command the team already uses (for example a k6 script path). When absent, Phase 2 picks one from the table.

---

## Outputs

- `leak_brief` (object): Stack, process identity, metric that grew, observed growth window, first bad version if known, memory limit in force, OOM evidence, and where the process runs (bare host, container, Kubernetes pod, browser tab).
- `load_recipe` (object): The exact load command, its fixed rate or iteration count, the warmup operation count, how completed operations are counted, and the command that stops the load cleanly.

---

## Phase 1: Pin Down the Symptom

### Entry Criteria
- `symptom_report`, `stack` and `target_process` are present.
- `stack` is one of the six allowed values. If not, stop and ask.

### Actions
1. Write down which metric grew. Use this table to name it exactly:

   | Reporter said | Metric to record | Where it comes from |
   |---|---|---|
   | "memory" on a Linux host | RSS (`VmRSS`) | `/proc/<pid>/status` |
   | "memory" in Kubernetes | cgroup `memory.current` (v2) or `memory.usage_in_bytes` (v1) | `kubectl top pod`, cAdvisor `container_memory_working_set_bytes` |
   | "heap" in Java | old generation used after full GC | `jstat -gc <pid>` column `OU` |
   | "heap" in Node | `heapUsed` | `process.memoryUsage()` |
   | "Private Bytes" on Windows | `PrivateMemorySize64` | `Get-Process -Id <pid>` |
   | "tab memory" in a browser | JS heap size and DOM node count | Chrome Task Manager, DevTools Performance monitor |

2. Collect OOM evidence if the report mentions crashes or restarts:
   - Linux host: `journalctl -k | grep -i -E "out of memory|killed process"` or `dmesg -T | grep -i "killed process"`.
   - Kubernetes: `kubectl describe pod <pod>` and read `Last State: Terminated` with `Reason: OOMKilled`; read `kubectl get pod <pod> -o jsonpath='{.spec.containers[*].resources.limits.memory}'` for the limit.
   - JVM: search logs for `java.lang.OutOfMemoryError` and note which kind (`Java heap space`, `Metaspace`, `Direct buffer memory`, `unable to create native thread`). Each kind points at a different area.
   - Node: search logs for `FATAL ERROR: Reached heap limit` or `JavaScript heap out of memory`.
3. Record the first version that showed growth if anyone knows it. Run `git log --oneline <last_good_tag>..<first_bad_tag>` and save the commit list into the brief; it is used to rank causes later.
4. Record where the process runs, because it decides which sampling commands work in the next flow.

### Output
Draft `leak_brief` with the metric, OOM evidence, environment and suspect commit range.

### Quality Gate
- The brief names one concrete metric from the table, not the word "memory" alone.
- Every OOM claim in the brief quotes a log line or `kubectl describe` field; a claim with no quote is removed.

---

## Phase 2: Choose the Load Driver

### Entry Criteria
- Draft `leak_brief` exists.

### Actions
1. If `load_driver` is given, use it and go to Phase 3.
2. Otherwise pick from this table by workload type. Do not pick a tool that is not installed; check with `<tool> --version` first.

   | Workload | Driver | Fixed-rate form |
   |---|---|---|
   | HTTP service | `k6` | `constant-arrival-rate` executor with `rate` and `duration` in the script |
   | HTTP service | `vegeta` | `echo "GET http://127.0.0.1:8080/x" \| vegeta attack -rate=<R>/s -duration=<D>` |
   | HTTP service | `wrk2` | `wrk -R <R> -d <D> http://127.0.0.1:8080/x` (`-R` exists in wrk2, not in classic wrk) |
   | Queue consumer | replay of captured messages | publish the same message file in a loop with a counter |
   | CLI or batch job | shell loop | `for i in $(seq 1 N); do ./tool args; done` inside one long-lived process if the leak is in-process |
   | Library function | test harness loop | call the function N times in one process and print the counter |
   | Browser page | Playwright or Puppeteer | script that repeats one user action (open and close a dialog, navigate away and back) N times |

3. Prefer a fixed arrival rate over "as fast as possible". A saturated run changes the allocation rate between runs, so two runs cannot be compared.
4. The request mix must be the same request or the same captured set every run. Random payload generators make growth look like noise.

### Output
Selected driver and its fixed-rate or fixed-iteration command.

### Quality Gate
- `<tool> --version` for the chosen driver printed a version.
- The command contains an explicit rate or iteration count, not a default "max" mode.

---

## Phase 3: Write the Recipe

### Entry Criteria
- Driver chosen.

### Actions
1. Make the operation count observable. One of:
   - The driver's own summary (k6 `iterations` and `http_reqs`, vegeta `vegeta report` `Requests [total]`).
   - An application counter (a Prometheus counter, a log line every N operations).
   - The loop counter printed by the harness.
2. Define a warmup operation count from a user answer or, if the user has none, from the point where the first-run sampling shows the caches and JIT have filled (record it after the first run of `leak-rss-growth-confirm`, and mark it "provisional" until then). Do not make up a number.
3. Write the stop command (Ctrl+C on the driver, `kill -INT <pid>` for the loop). The process under test must keep running after the load stops so post-load samples can be taken.
4. Run the recipe once against the target for a short smoke run. Confirm the counter moves and the process does not crash.
5. Save `load_recipe` as a small JSON object with keys `command`, `rate_or_iterations`, `warmup_ops`, `op_counter_source`, `stop_command`.

### Output
`leak_brief` and `load_recipe`.

### Quality Gate
- The smoke run printed a nonzero operation count from `op_counter_source`.
- `load_recipe` has all five keys, and `warmup_ops` is either a number with its source or the string "provisional".

---

## Worked Example

Illustrative only.

Input: `symptom_report` = "orders-api pods restart about every 2 days, Grafana memory climbs in a straight line", `stack` = `python`, `target_process` = `gunicorn -w 1 orders.wsgi:app -b 127.0.0.1:8000`.

Phase 1: `kubectl describe pod orders-api-7d9c` shows `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`; limit `512Mi`. Metric = cgroup `memory.current`, and RSS of the gunicorn worker on a local reproduction. Suspect range: `git log --oneline v2.3.0..v2.4.0` lists 14 commits.

Phase 2: k6 is installed (`k6 v0.52.0`). Script uses `executor: 'constant-arrival-rate', rate: 50, timeUnit: '1s', duration: '20m'` against `POST /orders/quote` with one fixed JSON body.

Phase 3: `load_recipe` = `{"command": "k6 run quote.js", "rate_or_iterations": "50/s for 20m", "warmup_ops": "provisional", "op_counter_source": "k6 summary http_reqs", "stop_command": "Ctrl+C on k6"}`. Smoke run printed `http_reqs......: 3000`.

---

## Exit Criteria

DONE when `leak_brief` names an exact metric with evidence and `load_recipe` is a fixed, counted, stoppable load that ran once without crashing the target.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` not one of the six values | **Stop**: ask the user which runtime owns the growing process. |
| Phase 1 | No log or metric shows growth at all | **Return**: send back to the reporter for a screenshot or metric query; do not hunt a leak nobody measured. |
| Phase 2 | Chosen driver not installed | **Adjust**: pick the next row for the same workload, or install it from the official package source. |
| Phase 3 | Smoke run crashes the target | **Stop**: that is a functional bug, not a leak; report it separately. |
| Phase 3 | Operation counter does not move | **Retry**: fix the counter source before continuing; growth without an op count cannot be normalized. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
