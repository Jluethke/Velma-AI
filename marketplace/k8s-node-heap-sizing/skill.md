# Node.js Heap and Process Sizing for Container Limits

**One-line description:** Measures the V8 heap limit and the non-heap memory a Node.js process actually uses inside the pod, sets `--max-old-space-size` through `NODE_OPTIONS` so the heap fails before the cgroup OOM killer fires, and decides between one process per pod and the cluster module from the CPU request.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Application repository.
- `resourced_deployment` (string, required): Deployment path from `k8s-requests-limits-from-usage`.
- `usage_report` (object, required): Output of `k8s-resource-usage-measure`.

---

## Outputs

- `node_runtime_settings` (object): `node_version`, `heap_limit_before_mib`, `non_heap_peak_mib` (measured), `max_old_space_size_mib`, `process_model` (`single` or `cluster`), `uv_threadpool_size`, `env` (name to value), `writable_paths`.

---

## Phase 1: Measure Heap Limit and Non-Heap Memory

### Entry Criteria
- `stack` == `node`, a pod is running and has served representative traffic.

### Actions
1. Read the heap limit V8 chose inside the pod, and the cgroup memory limit:
```bash
kubectl exec -n NS POD -- node -e "const v8=require('v8');console.log('heap_size_limit_mib',(v8.getHeapStatistics().heap_size_limit/1048576).toFixed(0));console.log(process.version)"
kubectl exec -n NS POD -- cat /sys/fs/cgroup/memory.max
```
   This starts a NEW node process with the same image and environment, so `NODE_OPTIONS` in the env applies. `memory.max` prints bytes, or `max` when no limit is set.
2. Compare: if `heap_size_limit_mib` is at or above the memory limit in MiB, the process can grow until the kernel OOM-kills it (exit 137, no JavaScript stack trace). Do not rely on V8 picking a container-aware default; measure it as above on the deployed Node version.
3. Measure the running process's non-heap memory. Add a temporary diagnostic route or use an existing metrics endpoint that exposes `process.memoryUsage()`. If `prom-client` default metrics are enabled, read `nodejs_heap_size_total_bytes`, `nodejs_external_memory_bytes` and `process_resident_memory_bytes`. Non-heap = `rss - heapTotal`. Record the peak under load as `non_heap_peak_mib`.
4. Record the UV threadpool size: `kubectl exec -n NS POD -- printenv UV_THREADPOOL_SIZE` (empty means the libuv default of 4).

### Output
Heap limit, memory limit, non-heap peak.

### Quality Gate
- `heap_size_limit_mib`, `memory.max` and `non_heap_peak_mib` are copied from command or metric output.

---

## Phase 2: Compute the Settings

### Entry Criteria
- Phase 1 numbers recorded.

### Actions
1. `max_old_space_size_mib = floor(memory_limit_mib - non_heap_peak_mib - young_generation_mib)`, where `young_generation_mib` is the measured semi-space use (`v8.getHeapSpaceStatistics()` entry `new_space` `space_size`) in MiB. Every term is measured; do not substitute a percentage rule of thumb.
2. If the result is below the heap the app needs (`usage_report` heap peak, or `nodejs_heap_size_used_bytes` peak), the memory limit is too small: **Return** to `k8s-requests-limits-from-usage`.
3. Process model:

| CPU request (cores) | App type | `process_model` |
|---|---|---|
| 1 or less | any | `single`: one Node process per pod; scale with replicas and HPA |
| More than 1 | CPU-bound JavaScript | `cluster` (`node:cluster` or worker_threads) with one worker per whole core of the request, OR lower the request to 1 and add replicas (preferred: simpler, HPA-friendly) |
| More than 1 | I/O-bound | `single`; the extra cores are unused by one event loop, so lower the request |

4. Do not use PM2 inside the container as a process manager; Kubernetes restarts the container, and PM2 in front of Node hides crash exits and signals. If PM2 is required by the team, use `pm2-runtime`, which is built for containers, and record it.
5. `UV_THREADPOOL_SIZE`: keep the default unless the app does heavy `fs`, `crypto.pbkdf2`, `zlib` or `dns.lookup` work and a profile shows threadpool queueing; record any change with that evidence.
6. Settings:
   - `NODE_OPTIONS=--max-old-space-size=<max_old_space_size_mib>` in the Deployment `env`. If `NODE_OPTIONS` already exists, append; do not overwrite other flags.
   - Optional diagnostics: `--heapsnapshot-near-heap-limit=1` writes a heap snapshot to the working directory as the limit nears; add that directory to `writable_paths` and an `emptyDir` with a `sizeLimit` chosen by the owner.
   - `NODE_ENV=production` if the app or framework reads it.

### Output
Computed settings.

### Quality Gate
- The `max_old_space_size_mib` arithmetic is written with each measured term.
- `max_old_space_size_mib` is below the memory limit in MiB.

---

## Phase 3: Apply and Prove the Failure Mode

### Entry Criteria
- Settings computed. Change one file at a time.

### Actions
1. Add `NODE_OPTIONS` to the Deployment and roll out to a non-production namespace.
2. Re-run the Phase 1 heap command; `heap_size_limit_mib` must be close to `max_old_space_size_mib` (V8 adds the young generation on top of the old space flag, so it reads somewhat higher).
3. Run the load test; watch `kubectl top pod -n NS --containers`.
4. Read how a pod died if it restarts:

| Signal in `kubectl describe pod` and `kubectl logs --previous` | Meaning | Action |
|---|---|---|
| `FATAL ERROR: ... JavaScript heap out of memory`, exit code 134 | V8 heap limit hit first: the setting works; the app needs more heap or has a leak | Investigate the leak with the heap snapshot; raise both heap and memory limit only with measured data |
| `Reason: OOMKilled`, exit code 137, no JS stack | Non-heap memory (Buffers, native addons) exceeded the remainder | Re-measure `non_heap_peak_mib`; lower the heap flag |

### Output
`node_runtime_settings`.

### Quality Gate
- Heap limit read from the pod after rollout is recorded and is below the memory limit.
- No OOMKilled restarts during the load test (`kubectl get pod -n NS` RESTARTS column 0).

---

## Worked Example

Illustrative only. Express API on Node 20, memory limit `512Mi`, CPU request `250m`.

Phase 1:
```
$ kubectl exec -n web api-7b9-x2 -- node -e "..."
heap_size_limit_mib 2096
v20.18.0
$ kubectl exec -n web api-7b9-x2 -- cat /sys/fs/cgroup/memory.max
536870912
```
Heap limit 2096 MiB is above the 512 MiB limit. Measured non-heap peak 118 MiB, young generation 16 MiB.

Phase 2: `512 - 118 - 16 = 378`. `NODE_OPTIONS=--max-old-space-size=378`. CPU request 0.25 cores, so `single`.

Phase 3: heap limit after rollout reads 410 MiB; load test peak RSS 455 MiB; RESTARTS 0.

---

## Exit Criteria

DONE when the V8 heap limit is set below the container memory limit from measured non-heap usage, the process model matches the CPU request, and a load test causes no OOMKilled restarts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `node` binary not runnable via `exec` (custom entrypoint wrapper) | **Adjust**: use the metrics endpoint values only and record the gap. |
| Phase 1 | `memory.max` prints `max` | **Return**: no memory limit set; finish `k8s-requests-limits-from-usage` first. |
| Phase 2 | Computed heap smaller than the heap the app uses | **Return**: to `k8s-requests-limits-from-usage` with the numbers. |
| Phase 3 | Exit 134 heap OOM under normal load | **Stop**: treat as a leak or undersized limit; collect a heap snapshot before changing numbers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
