# Python Gunicorn and Uvicorn Worker Sizing for Container Limits

**One-line description:** Sets the gunicorn or uvicorn worker count from the pod's CPU request instead of the node's CPU count, checks that workers times measured per-worker memory fits the memory limit, and fixes the container-specific settings (`WEB_CONCURRENCY`, `--worker-tmp-dir /dev/shm`, `PYTHONUNBUFFERED`, graceful timeout below the termination grace period).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Application repository with the gunicorn config (`gunicorn.conf.py`) or the server command.
- `resourced_deployment` (string, required): Deployment path from `k8s-requests-limits-from-usage`.
- `usage_report` (object, required): Output of `k8s-resource-usage-measure`.

---

## Outputs

- `py_runtime_settings` (object): `server`, `worker_class`, `workers`, `threads`, `env` (name to value), `writable_paths`, `graceful_timeout_seconds`, `per_worker_rss_mib` (measured), `memory_fit` (workers times RSS plus master versus limit).

---

## Phase 1: Read What the Container Sees

### Entry Criteria
- `stack` == `python` and a pod of the app is running (any namespace).

### Actions
1. Show the CPU count Python sees versus the cgroup quota:
```bash
kubectl exec -n NS POD -- python -c "import os; print('cpu_count', os.cpu_count()); print('affinity', len(os.sched_getaffinity(0)))"
kubectl exec -n NS POD -- cat /sys/fs/cgroup/cpu.max
```
   `cpu.max` (cgroup v2) prints `<quota> <period>`, or `max <period>` when no CPU limit is set. `os.cpu_count()` returns the NODE's CPU count, not the quota. Gunicorn and many apps that compute workers from `multiprocessing.cpu_count()` therefore start too many workers.
2. Find the current worker setting: `grep -nE "workers|worker_class|threads|WEB_CONCURRENCY|cpu_count" gunicorn.conf.py Dockerfile` and the image CMD. Gunicorn's `workers` default comes from the `WEB_CONCURRENCY` environment variable, else 1.
3. Measure per-worker memory in the running pod. Slim images may lack `ps`; read `/proc` instead:
```bash
kubectl exec -n NS POD -- sh -c 'for p in /proc/[0-9]*; do n=$(tr "\0" " " < $p/cmdline); case "$n" in *gunicorn*|*uvicorn*) echo "$(basename $p) $(grep VmRSS $p/status)";; esac; done'
```
   Record master RSS and each worker RSS. Use the largest worker value as `per_worker_rss_mib`. Measure after the app has served traffic; idle workers are smaller.

### Output
Node CPU count, quota, current workers, per-worker RSS.

### Quality Gate
- Output of `cpu.max` and of the RSS command is recorded verbatim.

---

## Phase 2: Choose Worker Class and Count

### Entry Criteria
- Phase 1 complete.

### Actions
1. Worker class table:

| App type | Server and class | Concurrency source |
|---|---|---|
| WSGI (Flask, Django), CPU-bound handlers | gunicorn `sync` | processes |
| WSGI, handlers wait on I/O (database, HTTP calls) | gunicorn `gthread` with `--threads` | processes times threads |
| ASGI (FastAPI, Starlette, Django ASGI) | gunicorn with uvicorn worker class, or `uvicorn --workers` | processes, each runs an event loop |

2. Core count to use: `C` = the pod's CPU request in cores from `resourced_deployment` (or the CPU limit if one is set and smaller). Never use `os.cpu_count()` inside the container.
3. Starting worker count: gunicorn's documentation suggests `(2 x num_cores) + 1` as a starting point for sync workers. Use `num_cores = C`, rounding `C` up to a whole number with a minimum of 1. For ASGI event-loop workers no tool-documented formula exists; start at the whole-core count of `C`, record it as an open question, and let the Phase 3 load test decide. Both values are starting points, not answers.
4. Memory fit: `master_rss + workers * per_worker_rss_mib` must be below `limits.memory`. If not, reduce workers until it fits and record the reduced value; do not raise the memory limit here (that is `k8s-requests-limits-from-usage`).
5. Settings to write:
   - `WEB_CONCURRENCY=<workers>` in the Deployment `env` (or `workers = int(os.environ["WEB_CONCURRENCY"])` in `gunicorn.conf.py`).
   - `--worker-tmp-dir /dev/shm` (gunicorn docs recommend it in containers: the worker heartbeat file otherwise lives in `/tmp`, which may be disk-backed or read-only).
   - `PYTHONUNBUFFERED=1` so `print` and logging reach `kubectl logs` immediately.
   - `PYTHONDONTWRITEBYTECODE=1` when the root filesystem will be read-only.
   - `--graceful-timeout` (gunicorn default 30 seconds) must stay below `terminationGracePeriodSeconds`; record the value as `graceful_timeout_seconds`.
   - `writable_paths`: `/tmp` plus `PROMETHEUS_MULTIPROC_DIR` if `prometheus_client` multiprocess mode is used.
6. Do not add `--max-requests` to hide a memory leak without recording it as a leak in the run notes.

### Output
Chosen class, workers, threads, env.

### Quality Gate
- `workers` is computed from `C`, with the arithmetic written out.
- `memory_fit` shows master plus workers times RSS below the memory limit, in MiB.

---

## Phase 3: Apply and Load-Check

### Entry Criteria
- Settings chosen. Change one file at a time.

### Actions
1. Add `env` entries to the Deployment and the `--worker-tmp-dir` flag to the gunicorn command or config.
2. Roll out in a non-production namespace and confirm the worker count: run the Phase 1 `/proc` command; the number of worker lines must equal `workers`.
3. Run the load test the team uses (or `load_test_command` from earlier flows) and watch `kubectl top pod -n NS --containers` during it. Record peak memory; it must stay below `limits.memory`.
4. Check for worker timeouts: `kubectl logs -n NS POD | grep -E "WORKER TIMEOUT|Worker exiting|SIGKILL"` must print nothing.

### Output
`py_runtime_settings`.

### Quality Gate
- Worker line count equals `workers`.
- The grep for `WORKER TIMEOUT` printed nothing during the load test.

---

## Worked Example

Illustrative only. Django on gunicorn `sync`, node has 16 CPUs, pod requests `500m`, memory limit `480Mi`.

Phase 1:
```
$ kubectl exec -n shop orders-5c7f-2kq7l -- python -c "import os; print('cpu_count', os.cpu_count())"
cpu_count 16
$ kubectl exec -n shop orders-5c7f-2kq7l -- cat /sys/fs/cgroup/cpu.max
max 100000
```
Config used `workers = multiprocessing.cpu_count() * 2 + 1`, so 33 workers. Worker RSS 61 Mi, master 38 Mi: 38 + 33 * 61 = 2051 Mi, far above 480 Mi.

Phase 2: `C = 0.5`, rounded up to 1. `(2 x 1) + 1 = 3` workers. Fit: 38 + 3 * 61 = 221 Mi, below 480 Mi.

Phase 3: worker lines 3; load test peak 236 Mi; no `WORKER TIMEOUT` lines.

---

## Exit Criteria

DONE when workers derive from the CPU request, memory fits the limit with measured RSS, container settings are in the Deployment, and a load check shows no worker timeouts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cpu.max` missing | **Adjust**: cgroup v1 node; read `/sys/fs/cgroup/cpu/cpu.cfs_quota_us` and `cpu.cfs_period_us`. |
| Phase 2 | Even one worker does not fit memory | **Return**: to `k8s-requests-limits-from-usage` with the measured RSS. |
| Phase 3 | `WORKER TIMEOUT` under load | **Adjust**: handlers block longer than `--timeout` (default 30 seconds); switch to `gthread` for I/O waits or fix the slow handler. Do not raise the timeout without a measured reason. |
| Phase 3 | Latency worse with fewer workers | **Adjust**: raise the CPU request and recompute; more workers than cores only adds contention. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
