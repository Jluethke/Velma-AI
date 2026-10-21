# Python Worker Graceful Shutdown

**One-line description:** Makes Celery, RQ and hand-written boto3 or pika consumer processes finish or hand back in-flight jobs on SIGTERM: signals reach the Python process as PID 1, the platform grace period is derived from time limits, and a pod-delete test shows a warm shutdown with exit code 0 instead of 137.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with the Dockerfile, process definitions and worker code.
- `queue_choice` (string, required): `celery`, `rq`, `sqs` or `rabbitmq` (Python consumers).
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`, with configured time limits.
- `deploy_platform` (string, required): `kubernetes`, `ecs`, `systemd` or `heroku`.

---

## Outputs

- `py_shutdown_config` (object): Signal path findings, worker signal behavior, the derived grace period with formula, file diffs, and the shutdown test transcript.

---

## Phase 1: Make Sure SIGTERM Reaches Python

### Entry Criteria
- The worker runs in a container or a service manager that sends SIGTERM on stop.

### Actions
1. Read the container entry: `rg -n "^(CMD|ENTRYPOINT)" <repo_path>/Dockerfile*`.
2. Apply this table:

| Found | Problem | Fix |
|---|---|---|
| Shell form: `CMD celery -A proj worker` | `/bin/sh -c` is PID 1 and does not forward SIGTERM; the worker is SIGKILLed at the deadline | Exec form: `CMD ["celery", "-A", "proj", "worker", "-l", "INFO"]` |
| Entry script ending in `celery ...` without `exec` | The script's shell is PID 1 | End the script with `exec celery ...` |
| Python is PID 1 and the worker forks children | Zombie children are not reaped by a non-init PID 1 | Add an init: `tini` as `ENTRYPOINT ["/usr/bin/tini", "--"]` in the image (works on every platform), or `docker run --init` for plain Docker |
| `honcho`, `supervisord` or a process manager as PID 1 | It must forward SIGTERM to children and wait | Read its stop settings (`stopsignal`, `stopwaitsecs` for supervisord) and record them |

3. Confirm in a running container: `docker exec <container> cat /proc/1/cmdline | tr '\0' ' '` shows the worker command (or tini followed by it).

### Output
Signal path finding and fix.

### Quality Gate
- `/proc/1/cmdline` output shows the worker or an init, not `sh -c`.

---

## Phase 2: Worker Behavior on SIGTERM

### Entry Criteria
- SIGTERM reaches the worker.

### Actions
1. Record the behavior for `queue_choice`:

| `queue_choice` | On first SIGTERM | What happens to unfinished work at SIGKILL |
|---|---|---|
| celery | Warm shutdown: stops consuming, waits for running tasks to finish, then exits. Reserved (prefetched, not started) messages are returned to the broker. Celery 5.5 adds a soft shutdown period (`worker_soft_shutdown_timeout`); read the docs for your version. | With `task_acks_late = True`, the running task is redelivered (RabbitMQ: when the connection drops; Redis/SQS: after `visibility_timeout`). With early acks, it is lost. |
| rq | Warm shutdown: finishes the current job, then exits. A second SIGTERM or SIGINT kills the work horse. | Job is moved to the failed registry later; not retried automatically (see `bjq-py-rq-reliability-config`). |
| sqs (boto3 loop) | Only what your code does. Add a handler. | Message reappears after its visibility timeout (not deleted). |
| rabbitmq (pika) | Only what your code does. Add a handler. | Unacked message is requeued when the connection closes. |

2. For hand-written loops, add a stop flag. Do not do work inside the signal handler:
```python
import signal, threading
stop = threading.Event()
signal.signal(signal.SIGTERM, lambda s, f: stop.set())
while not stop.is_set():
    resp = sqs.receive_message(QueueUrl=q, MaxNumberOfMessages=1, WaitTimeSeconds=20)
    for m in resp.get("Messages", []):
        handle(m); sqs.delete_message(QueueUrl=q, ReceiptHandle=m["ReceiptHandle"])
```
   Shutdown latency includes one long-poll wait (up to `WaitTimeSeconds`). For pika with `BlockingConnection`, call `channel.stop_consuming()` from the handler via `connection.add_callback_threadsafe` and let the current callback finish and ack.
3. Use `MaxNumberOfMessages=1` (or prefetch 1) for long jobs, so a stopping worker does not hold extra messages invisible until their timeout expires.

### Output
Signal behavior and code change per worker.

### Quality Gate
- Every hand-written consumer has a SIGTERM handler that only sets a flag (`rg -n "signal.signal\(signal.SIGTERM" <repo_path>`).

---

## Phase 3: Derive the Grace Period and Test

### Entry Criteria
- Workers handle SIGTERM.

### Actions
1. Grace period G must satisfy: G > (preStop hook duration, if any) + T + (ack and connection close time), where T is the largest hard time limit (Celery `time_limit`, RQ `job_timeout`) or, without limits, the measured maximum from `job_duration_profile`.
2. Where G is set:

| `deploy_platform` | Setting | Documented ceiling |
|---|---|---|
| kubernetes | `spec.terminationGracePeriodSeconds` (default 30) | none fixed; long values delay node drains |
| ecs | container `stopTimeout` | read the ECS task definition docs for the maximum |
| systemd | `TimeoutStopSec=` in the unit; `KillSignal=SIGTERM` | none fixed |
| heroku | not configurable | Heroku sends SIGTERM and then SIGKILL after its documented shutdown window |

3. If T exceeds what the platform allows, shutdown will SIGKILL long jobs: they must be redelivered (late acks) and idempotent. Record this as accepted behavior with the job names.
4. Test on Kubernetes (staging): start a task that runs for less than G but longer than a few seconds, then `kubectl delete pod <pod>` and follow logs `kubectl logs -f <pod>`. Expect for Celery `worker: Warm shutdown (MainProcess)` followed by the task's `succeeded in` line before exit. Read the exit code from the previous container if restarted: `kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'`. 0 = clean; 137 = SIGKILL (128 + 9); 143 = SIGTERM was not handled (128 + 15).
5. Change one file at a time; rerun the test after each.

### Output
`py_shutdown_config` with formula and transcript.

### Quality Gate
- G formula shows each term with its value.
- Test transcript shows the warm shutdown line, the in-flight task finishing, and exit code 0 (or 143 explained as a non-handled path to fix).

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `celery`, `deploy_platform` = `kubernetes`; Dockerfile `CMD celery -A shop worker -l INFO`; largest `time_limit` 300 s; grace 30.

- Phase 1: shell form found; changed to exec form. `/proc/1/cmdline` now prints `/usr/local/bin/python /usr/local/bin/celery -A shop worker -l INFO`.
- Phase 2: Celery warm shutdown; `task_acks_late = True` already set.
- Phase 3: G > 0 + 300 + 5 (requester's close margin), set `terminationGracePeriodSeconds: 310`.
```
$ kubectl delete pod worker-7c9d-abcde &
$ kubectl logs -f worker-7c9d-abcde
worker: Warm shutdown (MainProcess)
Task shop.tasks.export[1f0e...] succeeded in 212.41s: None
```

---

## Exit Criteria

DONE when SIGTERM reaches every Python worker, each worker stops taking new work and finishes or returns in-flight jobs, the grace period exceeds the largest time limit (or the gap is recorded), and a delete test shows a clean exit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Base image lacks tini | **Adjust**: install it with the distro package manager or use `docker run --init` / Kubernetes with an image that includes it. |
| Phase 2 | Worker exits immediately on SIGTERM, killing tasks | **Stop**: check for a custom handler or `-P solo` misconfiguration; Celery warm shutdown must be visible in logs. |
| Phase 3 | Exit code 137 in test | **Adjust**: G is too short or SIGTERM is not delivered; recheck Phase 1 and the formula. |
| Phase 3 | Platform ceiling below T | **Return**: report the jobs that will be redelivered on every deploy. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
