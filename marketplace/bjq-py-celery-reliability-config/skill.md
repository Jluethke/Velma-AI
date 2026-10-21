# Celery Reliability Config

**One-line description:** Sets the Celery settings that decide whether a task survives a worker crash (`task_acks_late`, `task_reject_on_worker_lost`, `worker_prefetch_multiplier`), sizes hard and soft time limits and the Redis or SQS `visibility_timeout` from measured runtimes, wires the retry policy into task decorators, and verifies the effective config on a running worker.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing the Celery app module.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for `queue_choice` = `celery`.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.

---

## Outputs

- `celery_config` (object): The settings diff (file:line before and after), the derived value for each setting with its formula, and the output of `celery inspect conf` from a worker running the new config.

---

## Phase 1: Read the Current App and Broker

### Entry Criteria
- `celery` is in the project dependencies (`pip show celery` prints a version).

### Actions
1. Record the Celery version: `pip show celery | rg Version`. Some settings below exist only from a given version; check the "Configuration and defaults" page for that version before adding a setting.
2. Find the app object and config: `rg -n "Celery\(|config_from_object|app.conf" <repo_path>`. Django projects usually read settings with the `CELERY_` prefix (`app.config_from_object("django.conf:settings", namespace="CELERY")`), so `task_acks_late` is written `CELERY_TASK_ACKS_LATE` there.
3. Identify the broker from `broker_url` (or `CELERY_BROKER_URL`): `redis://` or `rediss://` = Redis, `amqp://` or `pyamqp://` = RabbitMQ, `sqs://` = SQS.
4. Print the effective values before changing anything:
```
python -c "from proj.celery import app; c=app.conf; print(c.task_acks_late, c.task_reject_on_worker_lost, c.worker_prefetch_multiplier, c.task_time_limit, c.task_soft_time_limit, c.broker_transport_options, c.task_serializer)"
```

### Output
Version, broker type and current values.

### Quality Gate
- The command above printed seven values and they are recorded.
- Broker type is one of Redis, RabbitMQ, SQS.

---

## Phase 2: Derive the Settings

### Entry Criteria
- Current values recorded.

### Actions
1. Delivery guarantees. Set:
   - `task_acks_late = True`: ack after the task returns, so a crash before the end causes redelivery (at-least-once) instead of loss (at-most-once, the default).
   - `task_reject_on_worker_lost = True`: when the child process is killed (SIGKILL, out-of-memory), the message is requeued. Celery's docs warn this can loop forever on a task that always kills its process; the dead-letter and retry limits from `retry_policy` must exist first.
   - `worker_prefetch_multiplier = 1` when any task's p95 runtime in `job_duration_profile` is long compared with others in the same queue; with the default (4) a worker reserves several messages and they wait behind a long task. If every task is short, keep the default and record why.
2. Time limits per task, from the measured maximum M in `job_duration_profile`:
   - `soft_time_limit` > M, so no normal run is interrupted. Headroom above M is a user input; record it.
   - `time_limit` > `soft_time_limit`, so the task can catch `SoftTimeLimitExceeded` and clean up before the hard kill.
   - Note: time limits are enforced by the prefork pool; with `-P eventlet` or `-P gevent` hard time limits are not enforced. Record the pool in use (`rg -n "\-P |--pool" <repo_path>`).
3. Lease (Redis and SQS brokers only). Set `broker_transport_options = {"visibility_timeout": V}` with V greater than both (a) the largest `time_limit` and (b) the longest `countdown` or `eta` any code uses (`rg -n "countdown=|eta=" <repo_path>`). If V is not greater than (b), Redis redelivers the delayed task to another worker before its ETA arrives, which runs it more than once. For SQS, the visibility timeout set here overrides the queue attribute for messages Celery receives.
4. RabbitMQ broker: no visibility timeout; the server `consumer_timeout` closes a channel holding an unacked delivery longer than its value. With `task_acks_late = True` and long tasks or far ETAs, that value must exceed the longest of either. Read it with `rabbitmq-diagnostics environment | rg consumer_timeout`. Changing it is a broker change: report it rather than editing the broker here.
5. Serializer: `task_serializer = "json"`, `result_serializer = "json"`, `accept_content = ["json"]`.
6. Retries: apply each job's settings line from `retry_policy` to its decorator (`autoretry_for`, `retry_backoff`, `retry_backoff_max`, `retry_jitter`, `max_retries`). Do not add `autoretry_for=(Exception,)`; it retries permanent errors too.

### Output
Derived values with formulas.

### Quality Gate
- Each numeric setting shows the inequality it satisfies with both numbers.
- No task uses `autoretry_for=(Exception,)` (`rg -n "autoretry_for=\(Exception" <repo_path>` prints nothing).

---

## Phase 3: Apply and Verify

### Entry Criteria
- Values derived.

### Actions
1. Edit the single config module first, run the tests, then edit task decorators one file at a time, running tests after each file.
2. Run the test suite: `pytest -q`. Do not delete or skip tests to pass.
3. Start a worker with the new config locally or in staging: `celery -A proj worker -l INFO -c 2` and, in another shell, read the effective config from the running worker: `celery -A proj inspect conf --timeout 5 | rg "acks_late|reject_on_worker_lost|prefetch_multiplier|visibility_timeout|time_limit"`.
4. Quick crash check: enqueue a task that sleeps longer than you need to kill it, find the child PID with `celery -A proj inspect active`, send `kill -9 <child pid>`, and confirm in the log that the task is received again (`rg "Received task" worker.log | rg <task id>` shows two lines). With Redis, the second receive arrives only after V seconds; use a staging queue with a short V to check, then restore.

### Output
`celery_config` with diffs and verification output.

### Quality Gate
- `celery inspect conf` output from the running worker shows the new values (paste the lines).
- The crash check shows the same task id received twice.
- `pytest -q` exits 0.

---

## Worked Example

Illustrative only.

Input: broker `redis://`, `build_report` max runtime 3901.8 s, other tasks under 5 s; one call site uses `countdown=7200`; requester headroom 20 percent.

- Phase 1: the print command outputs `False False 4 None None {} json`: acks_late off (the default), no time limits, no transport options.
- Phase 2: `build_report`: `soft_time_limit` = 4683 (3901.8 x 1.2, rounded up), `time_limit` = 4743 (soft + 60 s cleanup, user supplied). V must exceed max(4743, 7200), so `visibility_timeout` = 7260 per user's 60 s margin. `worker_prefetch_multiplier = 1` because `build_report` shares the `default` queue with short tasks; also recorded: move it to its own queue.
- Phase 3:
```
$ celery -A shop inspect conf --timeout 5 | rg "acks_late|visibility"
    "task_acks_late": true,
    "broker_transport_options": {"visibility_timeout": 7260},
```

---

## Exit Criteria

DONE when the effective config on a running worker shows late acks, worker-lost requeue, derived time limits and lease, JSON serialization and retry decorators from `retry_policy`, and the crash check shows redelivery.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Config split across env vars and modules | **Adjust**: record each source; edit only the module that wins at runtime (confirm with `inspect conf`). |
| Phase 2 | Task cannot be made idempotent before acks_late is on | **Stop**: enabling late acks without idempotency trades lost tasks for duplicate effects; finish `bjq-idempotency-key-store` first. |
| Phase 2 | Pool is gevent or eventlet | **Adjust**: enforce time limits inside the task (timeouts on every I/O call) and record that Celery will not kill it. |
| Phase 3 | `inspect conf` times out | **Retry**: confirm the worker is connected (`celery -A proj inspect ping`), then rerun with a longer `--timeout`. |
| Phase 3 | Tests fail after the change | **Adjust**: fix the code or config; never weaken the tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
