# Worker Kill Redelivery Drill

**One-line description:** Runs a staging drill that enqueues a known set of jobs with idempotency keys, SIGKILLs and SIGTERMs workers mid-job, waits out the lease, and then proves with SQL counts that every job completed and no effect happened twice, or records exactly which jobs the chosen queue lost.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `idempotency_design` (object, required): Output of `bjq-idempotency-key-store`; names the effect table and key column to count.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`, with configured lease values.
- `staging_environment` (string, required): Name and access method of a non-production environment with the same queue, worker and database setup (for example a Kubernetes namespace `jobs-staging`).

---

## Outputs

- `drill_report` (object): The job set, each kill action with timestamps, the expected outcome per library, measured counts (completed, duplicated, missing), and pass or fail per scenario.

---

## Phase 1: Prepare the Drill

### Entry Criteria
- `staging_environment` is reachable and is not production (confirm the context: `kubectl config current-context`, `aws sts get-caller-identity`).

### Actions
1. Never run this drill in production. If the context names production, stop.
2. Pick one job type whose runtime is long enough to kill mid-run (from `job_duration_profile`; if all jobs are short, add a test-only job that sleeps then writes an effect row, deployed only to staging).
3. Generate N payloads with keys `drill:<run id>:<i>`; N is a user input. Record the run id.
4. Write the expected outcome per scenario for `queue_choice` before running, so the result is compared against a prediction:

| `queue_choice` | S1: SIGKILL a worker mid-job | S2: SIGTERM a worker mid-job |
|---|---|---|
| celery, `task_acks_late` on | Redelivered (RabbitMQ: on connection loss; Redis or SQS: after `visibility_timeout`) | Finishes before exit |
| celery, acks_late off | Job lost | Finishes before exit |
| rq | Job ends in the failed registry, not re-run | Finishes before exit |
| bullmq | Stalled after lock expiry, re-run | Finishes before exit (`worker.close()`) |
| sidekiq, basic fetch | Job lost | Finishes, or pushed back after `:timeout:` |
| sqs (delete after success) | Reappears after `VisibilityTimeout` | Finishes before exit |
| rabbitmq (manual ack) | Requeued when the connection closes | Finishes before exit |

### Output
Drill plan with predictions.

### Quality Gate
- The environment check output is pasted and does not name production.
- Each scenario has a written prediction before execution.

---

## Phase 2: Run the Scenarios

### Entry Criteria
- Plan approved by the requester.

### Actions
1. Enqueue the N jobs and record the enqueue time.
2. S1: once at least one job is running (check the library's active list: `celery -A proj inspect active`, `rq info`, `queue.getActive()`, Sidekiq Web Busy tab or `Sidekiq::WorkSet.new.size`, consumer logs for SQS and RabbitMQ), kill one worker hard:
   - Kubernetes: `kubectl -n <ns> delete pod <pod> --grace-period=0 --force`
   - Docker: `docker kill --signal=KILL <container>`
   - Process: `kill -9 <pid>` (for Celery prefork, kill the child that runs the task, found in `inspect active` output as `worker_pid`)
3. Record the job ids running at kill time.
4. S2: repeat with a graceful stop (`kubectl -n <ns> delete pod <pod>`, `docker stop <container>`, `kill -TERM <pid>`) while a job runs.
5. Wait for all retries and leases to pass: the longest lease from `job_duration_profile` plus the retry window. Do not end the wait early because the queue looks empty; leased jobs are invisible.

### Output
Timestamped action log.

### Quality Gate
- Each kill has a timestamp and the ids of jobs running at that moment.
- The wait duration is at least lease plus retry window, both stated.

---

## Phase 3: Count and Judge

### Entry Criteria
- Wait complete.

### Actions
1. Count with SQL on the effect table named in `idempotency_design`:
```sql
-- completed exactly once
SELECT count(*) FROM processed_jobs WHERE idempotency_key LIKE 'drill:<run id>:%' AND status = 'done';
-- duplicated effects (must be 0 rows)
SELECT idempotency_key, count(*) FROM <effect table> WHERE idempotency_key LIKE 'drill:<run id>:%' GROUP BY 1 HAVING count(*) > 1;
```
2. Missing = N minus completed. For each missing key, find where the job is: dead store, failed registry, still invisible, or gone.
3. Judge each scenario: PASS when completed = N and duplicates = 0. When the prediction was "Job lost" and the job is missing, record it as an accepted, known loss only if the requester accepted that behavior; otherwise FAIL with the fix (late acks, super_fetch, a broker with leases).
4. Clean up drill rows (`DELETE ... WHERE idempotency_key LIKE 'drill:<run id>:%'`) after the report is saved.

### Output
`drill_report`.

### Quality Gate
- Both SQL outputs are pasted.
- Each scenario shows prediction, observation and verdict.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `sqs`, `staging_environment` = `jobs-staging` namespace, N = 200 (requester), `VisibilityTimeout` 120 s with 60 s heartbeat, retry window 1458 s.

- Phase 1: `kubectl config current-context` prints `staging-eks`; predictions: S1 reappears after 120 s, S2 finishes.
- Phase 2: S1 at 14:02:10 killed `worker-5c7-x9` running `drill:r7:41`, `drill:r7:42`; S2 at 14:04:30 graceful. Waited 120 + 1458 = 1578 s.
- Phase 3:
```
 count
-------
   200
(0 rows)
```
S1 PASS (keys 41 and 42 completed at 14:04:13 on another pod), S2 PASS.

---

## Exit Criteria

DONE when both scenarios ran in staging against written predictions, completion and duplicate counts are measured with SQL, and each scenario has a verdict with any loss either accepted in writing or returned as a fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only production has the real setup | **Stop**: do not run; request a staging copy. |
| Phase 2 | No job is running when you try to kill | **Retry**: enqueue longer-running drill jobs and watch the active list before killing. |
| Phase 3 | Duplicates found | **Return**: send the job to `bjq-idempotency-key-store` with the duplicated keys. |
| Phase 3 | Missing jobs not predicted | **Return**: send to the stack config flow for `queue_choice` with the ids and kill timestamps. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
