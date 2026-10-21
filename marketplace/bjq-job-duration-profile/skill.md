# Job Duration Profile

**One-line description:** Measures real per-job runtime distributions (count, p50, p95, p99, maximum) from worker logs or the queue's own job records for the chosen library, so visibility timeouts, lock durations, time limits and shutdown grace periods are sized from data instead of guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root, used to find time limit settings already in code.
- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `job_inventory` (object[], required): Output of `bjq-handler-side-effect-audit`; names the job types to profile.
- `log_source` (string, required): Where worker output can be read: a log file path, a `kubectl logs` selector, a CloudWatch Logs group name, or a Redis URL for libraries that keep job records.

---

## Outputs

- `job_duration_profile` (object[]): One row per job type: sample count, sample window (start and end time), p50, p95, p99 and maximum runtime in seconds, the current configured time limit and lease values with file:line, and a `too_few_samples` flag.

---

## Phase 1: Extract Runtimes

### Entry Criteria
- `log_source` is readable from this machine.

### Actions
1. Use the extraction method for `queue_choice`. Write one runtime in seconds per line to `durations_<job>.txt` in a scratch directory outside the repository.

| `queue_choice` | Source of truth | Extraction |
|---|---|---|
| celery | Worker INFO log line `Task <name>[<id>] succeeded in <seconds>s` | `rg -o "Task (\S+)\[[^\]]+\] succeeded in ([0-9.]+)s" -r '$1 $2' worker.log`, then split by task name |
| rq | Job hash fields `started_at`, `ended_at` for jobs still in `FinishedJobRegistry` (kept only for `result_ttl`) | Python: `from rq.registry import FinishedJobRegistry`; for each id in `FinishedJobRegistry(queue=q).get_job_ids()`, `j = Job.fetch(id, connection=r)`, print `j.func_name`, `(j.ended_at - j.started_at).total_seconds()` |
| bullmq | Job fields `processedOn`, `finishedOn` (milliseconds) on completed jobs still retained per `removeOnComplete` | `const jobs = await queue.getJobs(['completed'], 0, -1); for (const j of jobs) console.log(j.name, (j.finishedOn - j.processedOn) / 1000)` |
| sidekiq | Default log lines contain `class=<Job>` and `elapsed=<seconds>` on the `done` line | `rg -o "class=(\S+) .*elapsed=([0-9.]+) INFO: done" -r '$1 $2' sidekiq.log` |
| sqs, rabbitmq | Only the application logs runtime | If no runtime log line exists, add one structured line per job (`job_done job=<name> duration_s=<float>`) in a branch, deploy to staging, and collect; record that the profile is from staging |

2. Include failed runs too: failures that end by timeout are the longest runs. Celery logs `raised unexpected` and `TimeLimitExceeded`; Sidekiq logs `fail` with `elapsed=`; BullMQ failed jobs have `processedOn` and `finishedOn` as well (`queue.getJobs(['failed'])`).
3. Record the sample window (first and last timestamp seen).

### Output
One durations file per job type.

### Quality Gate
- `wc -l durations_<job>.txt` is printed for each job and matches the sample count recorded.
- The extraction command and its first three output lines are recorded.

---

## Phase 2: Compute the Distribution

### Entry Criteria
- Durations files exist.

### Actions
1. Compute with Python's standard library (no estimation by eye):
```
python -c "import statistics,sys; d=sorted(float(x) for x in open(sys.argv[1])); q=statistics.quantiles(d,n=100,method='inclusive'); print(f'n={len(d)} p50={q[49]:.3f} p95={q[94]:.3f} p99={q[98]:.3f} max={d[-1]:.3f}')" durations_charge_order.txt
```
2. If a job has fewer samples than 100, the p99 is not meaningful (with n < 100 the 99th percentile is interpolated between the top values). Set `too_few_samples: true` and use the maximum as the sizing value.
3. The sizing value for downstream flows is the maximum observed runtime, not p99, because a lease shorter than any real run causes a duplicate delivery of that run.

### Output
Distribution row per job.

### Quality Gate
- Every row shows the exact command output line `n=... p50=... p95=... p99=... max=...`.
- `too_few_samples` is set for every job with n < 100.

---

## Phase 3: Record Current Limits Next to the Data

### Entry Criteria
- Distribution rows exist.

### Actions
1. Find configured limits in code and config with these searches and record value plus file:line:

| `queue_choice` | Search |
|---|---|
| celery | `rg -n "time_limit|soft_time_limit|visibility_timeout|acks_late" <repo_path>` |
| rq | `rg -n "job_timeout|default_timeout" <repo_path>` (RQ's default job timeout is documented in the RQ jobs docs; record it if no override) |
| bullmq | `rg -n "lockDuration|stalledInterval|maxStalledCount" <repo_path>` |
| sidekiq | `rg -n ":timeout:|timeout:" <repo_path>/config/sidekiq.yml` and `rg -n "Timeout" <repo_path>/app/jobs` |
| sqs | `aws sqs get-queue-attributes --queue-url <url> --attribute-names VisibilityTimeout` |
| rabbitmq | `rabbitmq-diagnostics environment | rg consumer_timeout` |

2. For each job, flag `LEASE_TOO_SHORT` when the configured lease (visibility timeout, lock duration, consumer timeout) is less than or equal to the maximum observed runtime and there is no heartbeat that extends it. BullMQ renews its lock while the worker event loop is free, so for BullMQ flag instead any job whose handler blocks the event loop (synchronous CPU work) for longer than `lockDuration`.
3. Do not change any setting in this flow. Changes happen in the stack-specific config flows.

### Output
`job_duration_profile`.

### Quality Gate
- Every row has a configured lease value with file:line or the cited library default.
- Every `LEASE_TOO_SHORT` flag shows both numbers it compared.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `celery`, `log_source` = `/var/log/celery/worker.log`.

Phase 1:
```
$ rg -o "Task (\S+)\[[^\]]+\] succeeded in ([0-9.]+)s" -r '$1 $2' /var/log/celery/worker.log | rg "^shop.tasks.build_report " | cut -d' ' -f2 > durations_build_report.txt
$ wc -l durations_build_report.txt
412 durations_build_report.txt
```
Phase 2:
```
n=412 p50=38.104 p95=611.900 p99=1450.220 max=3901.775
```
Phase 3: `rg` finds `broker_transport_options = {"visibility_timeout": 3600}` at `shop/celery.py:18`. Max 3901.8 s exceeds 3600 s with no heartbeat, so the row is flagged `LEASE_TOO_SHORT`. On Redis, Celery redelivers the task to another worker while the first is still running.

---

## Exit Criteria

DONE when every job type in `job_inventory` has a measured distribution (or a recorded reason it has no samples) and its current lease and time limit values side by side.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Logs rotated or retention too short | **Adjust**: widen the source (log archive, CloudWatch Logs Insights query over a longer range) and record the window used. |
| Phase 1 | Job records already removed (`result_ttl`, `removeOnComplete`) | **Adjust**: use worker logs, or temporarily raise retention in staging and collect again. |
| Phase 1 | Job type has zero samples | **Return**: list it with `samples: 0` and ask for an expected maximum runtime from the job owner, labeled as an estimate. |
| Phase 2 | Distribution has a few huge outliers | **Adjust**: keep them; they are real runs. Inspect their logs and record the cause next to the row. |
| Phase 3 | Setting comes from an environment variable | **Adjust**: read the deployed value (`kubectl get deploy <name> -o yaml`, ECS task definition) and record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
