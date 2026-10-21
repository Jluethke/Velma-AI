# Dead-Letter Redrive Runbook

**One-line description:** Writes and rehearses the runbook for jobs that exhausted their retries: where they land for each library (SQS DLQ, RabbitMQ DLX queue, Sidekiq Dead set, BullMQ failed set, RQ FailedJobRegistry, a Celery failure table), how to group them by error, and the exact commands to inspect, redrive in bounded batches, or discard them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy`; defines when a job becomes dead.
- `stack` (string, required): `python`, `node` or `ruby`; selects the scripting language for inspection snippets.

---

## Outputs

- `dlq_runbook` (object): Dead-job location, inspect command, grouping query, redrive command with batch control, discard command, the decision table, and the rehearsal transcript.

---

## Phase 1: Locate Dead Jobs

### Entry Criteria
- `retry_policy` exists, so "dead" has a definition.

### Actions
1. Fill the location and inspect command for `queue_choice`:

| `queue_choice` | Where dead jobs live | Inspect |
|---|---|---|
| sqs | DLQ named in the source `RedrivePolicy` | `aws sqs get-queue-attributes --queue-url "$DLQ" --attribute-names ApproximateNumberOfMessages`; sample bodies with `aws sqs receive-message --queue-url "$DLQ" --max-number-of-messages 10 --visibility-timeout 30` (they return to the DLQ after 30 s; do not delete) |
| rabbitmq | Queue bound to the dead-letter exchange (for example `jobs.dead`); each message carries an `x-death` header with reason and source queue | `rabbitmqctl list_queues name messages | rg dead`; read messages with `rabbitmqadmin get queue=jobs.dead count=10 ackmode=reject_requeue_true` (check `rabbitmqadmin --help` for the syntax of your version) |
| sidekiq | Dead set (Redis sorted set `dead`) | `bundle exec rails runner 'require "sidekiq/api"; ds=Sidekiq::DeadSet.new; p ds.size; ds.first(10).each { |j| p [j.klass, j["error_class"], j["error_message"], j.at] }'` |
| bullmq | Failed set of each queue | `const failed = await queue.getFailed(0, 99); failed.forEach(j => console.log(j.id, j.name, j.failedReason, j.attemptsMade))` |
| rq | `FailedJobRegistry` per queue | `rq info --url "$REDIS_URL"` then iterate `FailedJobRegistry(queue=q).get_job_ids()` and print `Job.fetch(id).exc_info` (last line) |
| celery | No built-in dead store. With a RabbitMQ broker, use a DLX on the task queue and raise `celery.exceptions.Reject(requeue=False)`. With Redis or SQS, add a `task_failure` signal handler or a base task `on_failure` that writes the envelope, exception class and traceback to a `failed_jobs` table. | `SELECT job_name, error_class, count(*) FROM failed_jobs WHERE redriven_at IS NULL GROUP BY 1, 2 ORDER BY 3 DESC` |

2. If `queue_choice` is `celery` and no dead store exists, record "dead jobs are only in logs and the result backend" as a finding and add the `task_failure` handler as a change. Write the handler so it never raises.

### Output
Location and inspect commands.

### Quality Gate
- The inspect command was run in staging and its output pasted.
- For Celery, the dead store exists or the finding is recorded.

---

## Phase 2: Triage Rules

### Entry Criteria
- Dead jobs can be listed.

### Actions
1. Group dead jobs by (job name, error class). Never redrive a group before reading at least one full error message and payload from it.
2. Decide per group with this table:

| Group cause | Action |
|---|---|
| Dependency outage that has ended (timeouts, 5xx, connection errors) | Redrive |
| Bug in handler code, fix deployed and verified | Redrive after the fix's deploy is confirmed on all workers |
| Bug not fixed yet | Hold; do not redrive (it fails again and burns retries) |
| Permanent input error (schema invalid, record deleted, 4xx) | Discard after recording the ids and reason, or hand to a person who owns the data |
| Unknown cause | Hold; redrive one job as a probe, read its result, then decide |

3. Before any redrive, confirm the handler is idempotent for that job (`bjq-idempotency-key-store`). A dead job may have done part of its work.

### Output
Decision table filled per group.

### Quality Gate
- Every group in the listing has one action.
- Every Redrive group names the deploy or recovery evidence (commit SHA running on workers, status page entry).

---

## Phase 3: Redrive and Discard Commands

### Entry Criteria
- Decisions made.

### Actions
1. Use the library command. Batch size and rate are user inputs; record them. Redriving everything at once into a queue whose dependency just recovered can cause the outage again.

| `queue_choice` | Redrive | Discard |
|---|---|---|
| sqs | `aws sqs start-message-move-task --source-arn <dlq arn> --destination-arn <source arn> --max-number-of-messages-per-second <rate>`; watch with `aws sqs list-message-move-tasks --source-arn <dlq arn>`; stop with `aws sqs cancel-message-move-task --task-handle <handle>`. To redrive only one group, receive, filter in a script, `send-message` to the source, then `delete-message` from the DLQ. | `delete-message` with the receipt handle for selected messages; `purge-queue` removes all and is irreversible |
| rabbitmq | Shovel (plugin `rabbitmq_shovel` enabled): `rabbitmqctl set_parameter shovel redrive-email '{"src-protocol":"amqp091","src-uri":"amqp://","src-queue":"jobs.dead","dest-protocol":"amqp091","dest-uri":"amqp://","dest-queue":"jobs.email","src-delete-after":"queue-length"}'`, which moves the messages present when it starts and then removes itself. | Consume with ack in a script that logs ids |
| sidekiq | Per job: `Sidekiq::DeadSet.new.select { |j| j.klass == "ChargeJob" && j["error_class"] == "Net::ReadTimeout" }.first(<batch>).each(&:retry)`; all: `retry_all` (use only after triage) | `.each(&:delete)` on the selected entries |
| bullmq | `await job.retry('failed')` for selected jobs; check the docs for `queue.retryJobs({ state: 'failed', count })` in your version for bulk | `await job.remove()`; bulk `await queue.clean(<grace ms>, <limit>, 'failed')` |
| rq | `rq requeue --queue <q> <job_id> ...` (selected ids) or `--all` after triage | `FailedJobRegistry(queue=q).remove(job, delete_job=True)` (check the signature for your version) |
| celery | Script reads `failed_jobs` rows for the group, re-sends each envelope with `apply_async`, sets `redriven_at = now()` in the same loop | `UPDATE failed_jobs SET discarded_at = now(), discard_reason = $1 WHERE id = ANY($2)` |

2. After each batch, check the dead store count and the error rate of the redriven job before sending the next batch.

### Output
Command set in `dlq_runbook`.

### Quality Gate
- Every command in the runbook was checked against `--help` or the official docs page, cited.
- Discard steps log ids and reasons before deleting.

---

## Phase 4: Rehearse in Staging

### Entry Criteria
- Runbook drafted.

### Actions
1. Create three dead jobs in staging: one that fails from a simulated outage (point the dependency URL at a closed port), one with invalid input, one probe.
2. Follow the runbook as written, without improvising: inspect, group, redrive the outage group after restoring the URL, discard the invalid-input job.
3. Record each command and its output. Fix the runbook text where a command differed from reality, then repeat the rehearsal once more from the fixed text.

### Output
`dlq_runbook` with rehearsal transcript.

### Quality Gate
- After rehearsal, the dead store count is 0 and the redriven job completed (its effect is visible once, checked by idempotency key).
- The transcript contains the exact commands from the runbook text.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `sqs`, `stack` = `python`; DLQ `invoices-dlq` holds 214 messages after a 40-minute tax-API outage.

- Phase 1: `ApproximateNumberOfMessages: 214`; sampled bodies show `error: ReadTimeout tax-api`.
- Phase 2: one group (`export_invoice`, `ReadTimeout`), cause ended per the tax API status page; action Redrive.
- Phase 3:
```
$ aws sqs start-message-move-task --source-arn arn:aws:sqs:us-east-1:111122223333:invoices-dlq --destination-arn arn:aws:sqs:us-east-1:111122223333:invoices --max-number-of-messages-per-second 5
{ "TaskHandle": "eyJ0YXNr..." }
$ aws sqs list-message-move-tasks --source-arn arn:aws:sqs:us-east-1:111122223333:invoices-dlq
{ "Results": [ { "Status": "COMPLETED", "ApproximateNumberOfMessagesMoved": 214, ... } ] }
```
The rate 5 per second was set by the invoice service owner.

---

## Exit Criteria

DONE when the runbook names where dead jobs live, how to group them, a triage table, bounded redrive and logged discard commands for `queue_choice`, and a staging rehearsal that ends with an empty dead store.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dead store has no payloads (Celery with Redis, no handler) | **Adjust**: add the failure table now; past failures are recoverable only from logs. |
| Phase 2 | Group cause unclear after reading samples | **Adjust**: redrive one job as a probe and read its new failure. |
| Phase 3 | Redriven jobs fail again at a high rate | **Stop**: cancel the move task or stop the script; return to triage. |
| Phase 3 | Message move task fails with a permissions error | **Return**: the role needs the SQS permissions listed in the redrive docs; request them. |
| Phase 4 | Rehearsal deviates from the runbook text | **Retry**: correct the text and rehearse again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
