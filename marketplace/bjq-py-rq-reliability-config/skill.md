# RQ Reliability Config

**One-line description:** Configures Python RQ jobs for safe retries and recovery: per-job `job_timeout`, `Retry(max, interval)` with a worker started `--with-scheduler`, `result_ttl` and `failure_ttl`, deterministic `job_id`, and a requeue procedure for jobs abandoned by a dead worker, verified with `rq info` and a burst worker.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing the enqueue calls.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for `queue_choice` = `rq`.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.

---

## Outputs

- `rq_config` (object): Per-job enqueue options with formulas, the worker command line, the abandoned-job recovery procedure, and verification output.

---

## Phase 1: Inventory Enqueue Options and Worker Command

### Entry Criteria
- `pip show rq` prints a version.

### Actions
1. Record the RQ version (`pip show rq | rg Version`) and the redis-py version (`pip show redis`). RQ behavior around abandoned jobs and scheduling changed across major versions; read the docs for the installed major version.
2. List enqueue calls with their options: `rg -n "\.enqueue(_in|_at|_call)?\(" <repo_path>`. For each, record `job_timeout`, `retry`, `result_ttl`, `failure_ttl`, `job_id`, `on_failure`.
3. Find how workers start (Procfile, systemd unit, Kubernetes manifest, Dockerfile): `rg -n "rq worker" <repo_path>`. Record whether `--with-scheduler` is present. Without it, `Retry(interval=...)`, `enqueue_in` and `enqueue_at` jobs are never moved back to the queue.

### Output
Table of enqueue options and worker command.

### Quality Gate
- Every enqueue call from the search is in the table.
- The worker start command is quoted with file:line.

---

## Phase 2: Set Per-Job Options

### Entry Criteria
- Inventory complete.

### Actions
1. `job_timeout`: greater than the measured maximum M in `job_duration_profile`; headroom is a user input. The work horse is killed when the timeout passes and the job fails with a timeout error. If no `job_timeout` is passed, RQ uses its default timeout (read the value in the RQ jobs docs for your version and record it); compare it with M.
2. `retry`: from `retry_policy`: `Retry(max=N, interval=[...])`. The interval list has one entry per retry (a shorter list reuses its last value; confirm in the docs for your version).
3. `failure_ttl`: how long failed jobs stay in `FailedJobRegistry`. Must be at least the time the team needs to notice and requeue (a user input; record the RQ default from the docs if not overridden).
4. `result_ttl`: keep short unless results are read; results use Redis memory. Use `0` when the result is never read.
5. `job_id`: pass the envelope's `idempotency_key` only when a job with that id should replace or be blocked by an earlier one; read the RQ docs on duplicate `job_id` behavior for your version, and test it (Phase 3), before relying on it for dedupe.
6. `on_failure` callback (RQ 1.9 and later; check docs) may record the failure to monitoring; it must not raise.
7. Edit one enqueue call at a time and run its test after each change.

### Output
New enqueue options with formulas.

### Quality Gate
- Every `job_timeout` shows `> M` with both numbers.
- Every job with retries has a worker started with `--with-scheduler`.

---

## Phase 3: Recover Abandoned Jobs and Verify

### Entry Criteria
- Options applied.

### Actions
1. Understand the crash case: if a worker process is killed while a job runs, RQ does not retry that job automatically. The job leaves `StartedJobRegistry` when its entry expires and lands in `FailedJobRegistry` (check your version's docs for the exact error recorded). It is not lost, but it is not re-run either.
2. Recovery procedure to put in `rq_config`:
```
rq info --url "$REDIS_URL"                       # queue sizes and workers
python -c "from redis import Redis; from rq import Queue; from rq.registry import FailedJobRegistry; r=Redis.from_url('$REDIS_URL'); reg=FailedJobRegistry(queue=Queue('default', connection=r)); print(len(reg), reg.get_job_ids()[:20])"
rq requeue --url "$REDIS_URL" --queue default <job_id> ...   # specific jobs
rq requeue --url "$REDIS_URL" --queue default --all          # only after checking the failures are transient
```
   Check `rq requeue --help` for the flags in your version before running it.
3. Graceful stop: `SIGTERM` (or `SIGINT`) tells the worker to finish the current job and exit; a second signal kills the work horse. Your orchestrator's grace period must exceed the largest `job_timeout` (see `bjq-py-graceful-shutdown`).
4. Verify with a burst worker against a local Redis (`docker run --rm -p 6379:6379 redis:7`):
   - Enqueue a job that raises a retryable error twice then succeeds.
   - Run `rq worker --burst --with-scheduler default` repeatedly until the queue is empty, or use `SimpleWorker([q], connection=r).work(burst=True, with_scheduler=True)` in a test.
   - Confirm `job.get_status()` is `finished` and `job.retries_left` reached the expected value.
5. Run the full test suite (`pytest -q`). Do not weaken tests.

### Output
`rq_config` with procedure and verification output.

### Quality Gate
- The burst run output shows the job retried and then `Job OK`.
- `rq info` output after the run shows the queue at 0 jobs.
- `pytest -q` exits 0.

---

## Worked Example

Illustrative only.

Input: job `resize_image`, measured max 41.2 s, `retry_policy` = 3 retries at 10, 30, 90 s; worker command `rq worker default` in `Procfile:2`.

- Phase 1: no `--with-scheduler` at `Procfile:2`; `enqueue(resize_image, key)` passes no options, so RQ's default timeout applies.
- Phase 2: `q.enqueue(resize_image, envelope, job_timeout=60, retry=Retry(max=3, interval=[10, 30, 90]), result_ttl=0, failure_ttl=<user value>)`; `Procfile:2` becomes `worker: rq worker --with-scheduler default`. 60 is 41.2 plus the requester's stated headroom.
- Phase 3:
```
$ rq worker --burst --with-scheduler default
default: tasks.resize_image(...) (8f1c...)
... ConnectionError ... Retrying in 10 seconds
default: tasks.resize_image(...) (8f1c...)
default: Job OK (8f1c...)
$ rq info
default      | 0
```

---

## Exit Criteria

DONE when every RQ job has a timeout above its measured maximum, retries backed by a worker running `--with-scheduler`, explicit TTLs, a written abandoned-job recovery procedure, and a burst-worker run showing retry then success.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Workers started by a custom script | **Adjust**: read the script; find where `Worker(...)` is built and whether `with_scheduler=True` is passed to `work()`. |
| Phase 2 | A job legitimately runs for hours | **Adjust**: split it into chunks that each fit a timeout, or move it to a library with lease renewal; record the decision. |
| Phase 3 | `rq requeue --all` would replay permanent failures | **Stop**: requeue by id after reading each `exc_info`; permanent failures go to the dead-letter runbook. |
| Phase 3 | Burst run never retries | **Retry**: confirm `--with-scheduler` was passed and the scheduler lock is not held by a stale process (`rq info` lists schedulers in recent versions). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
