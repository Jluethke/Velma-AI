# Queue Depth and Age Alerts

**One-line description:** Exports queue depth, age of the oldest waiting job, retry backlog and dead-letter count for the chosen queue (CloudWatch `ApproximateAgeOfOldestMessage`, `rabbitmq_prometheus`, Sidekiq `Queue#latency`, BullMQ job counts, RQ and Celery Redis lists) and writes alert rules whose thresholds come from the latency SLO, not from guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `latency_slo` (object, required): Per queue, the longest acceptable wait from enqueue to start of processing (for example "emails start within 120 s"), and how long a breach must last before paging, as agreed with the service owner.
- `concurrency_plan` (object, required): Output of `bjq-concurrency-limit-sizing`; gives worker counts and expected throughput per queue.

---

## Outputs

- `monitoring_config` (object): Metric source per signal, the exporter or query that produces it, alert rules with thresholds traced to `latency_slo`, dashboard panel list, and a test showing each alert fires.

---

## Phase 1: Pick the Signals

### Entry Criteria
- `latency_slo` has a value for every queue.

### Actions
1. Monitor these four signals per queue. Age is the primary alert because it maps directly to the SLO; depth alone is ambiguous (10 000 jobs is fine for a fast queue and a breach for a slow one).

| Signal | Meaning | Alert rule |
|---|---|---|
| Oldest job age | How long the oldest waiting job has waited | Page when age > SLO for the breach duration in `latency_slo` |
| Depth | Jobs waiting | Dashboard only; ticket when depth keeps rising while workers are at full concurrency (capacity problem) |
| Retry backlog | Jobs waiting to retry | Ticket when it grows for the breach duration; a downstream dependency is failing |
| Dead-letter count | Jobs that exhausted retries | Ticket when greater than 0 (any dead job needs triage per `bjq-dead-letter-redrive-runbook`) |

2. Also record worker liveness (number of connected workers versus `concurrency_plan`) as a dashboard panel; zero workers with age rising is the common outage shape.

### Output
Signal list per queue.

### Quality Gate
- Every queue has all four signals listed.
- Every page threshold cites the `latency_slo` field it came from.

---

## Phase 2: Produce the Metrics

### Entry Criteria
- Signals chosen.

### Actions
1. Use the source for `queue_choice`:

| `queue_choice` | Depth | Oldest age | Retry / dead |
|---|---|---|---|
| sqs | CloudWatch `AWS/SQS` `ApproximateNumberOfMessagesVisible` | `ApproximateAgeOfOldestMessage` (seconds) | DLQ `ApproximateNumberOfMessagesVisible` |
| rabbitmq | Plugin `rabbitmq_prometheus` (port 15692), per-queue metrics from `/metrics/per-object` or `/metrics/detailed?family=queue_coarse_metrics`: `rabbitmq_detailed_queue_messages_ready` | No native age metric. Add a `timestamp` property at publish and have consumers export `now - timestamp` at receive as a histogram; or read the head message age from the management API (costly; avoid on large queues) | `jobs.dead` queue ready count |
| sidekiq | `Sidekiq::Queue.new(name).size` | `Sidekiq::Queue.new(name).latency` (seconds since the oldest job was enqueued) | `Sidekiq::RetrySet.new.size`, `Sidekiq::DeadSet.new.size` |
| bullmq | `await queue.getJobCounts('wait', 'prioritized', 'delayed', 'active', 'failed')` | `const [j] = await queue.getJobs(['wait'], 0, 0, true); age = (Date.now() - j.timestamp) / 1000` (verify ordering on your version by comparing the timestamps of the first two jobs) | `failed` count; retries are `delayed` jobs with `attemptsMade > 0` |
| rq | `Queue(name).count` | Oldest job id `q.get_job_ids(0, 1)`, then `Job.fetch(id).enqueued_at` | `FailedJobRegistry(queue=q).count`, `ScheduledJobRegistry` for retries |
| celery | Redis broker: `redis-cli LLEN <queue>` (default queue name `celery`). RabbitMQ broker: use the rabbitmq row. | Not in the message by default. Add a `before_task_publish` signal handler that sets a header `enqueued_at`, and export `now - enqueued_at` in a `task_prerun` handler as a histogram. | Failure table count (see dead-letter runbook) |

2. Export to Prometheus with an existing exporter where one exists and is maintained (for example a Sidekiq Prometheus exporter gem, BullMQ's built-in `metrics` option for completed and failed counts, an RQ exporter, a Celery exporter); otherwise write a small exporter process that runs the queries above on an interval and serves `/metrics` with the official Prometheus client library for your language. Name metrics `job_queue_depth`, `job_queue_oldest_age_seconds`, `job_retry_backlog`, `job_dead_total` with a `queue` label.
3. Do not run expensive scans (listing all jobs) on every scrape. The queries above read one element or a counter.

### Output
Metric source and exporter per signal.

### Quality Gate
- `curl -s http://<exporter>:<port>/metrics | rg job_queue_oldest_age_seconds` (or `aws cloudwatch get-metric-statistics` for SQS) prints a value for every queue.

---

## Phase 3: Alert Rules and Test

### Entry Criteria
- Metrics visible.

### Actions
1. Prometheus rule (values from `latency_slo`):
```yaml
groups:
- name: job-queues
  rules:
  - alert: JobQueueAgeOverSLO
    expr: job_queue_oldest_age_seconds{queue="emails"} > 120
    for: 10m
    labels: { severity: page }
  - alert: JobDeadLetters
    expr: job_dead_total > 0
    labels: { severity: ticket }
```
   Validate with `promtool check rules rules.yml`.
2. SQS with CloudWatch: `aws cloudwatch put-metric-alarm --alarm-name emails-age --namespace AWS/SQS --metric-name ApproximateAgeOfOldestMessage --dimensions Name=QueueName,Value=emails --statistic Maximum --period 60 --evaluation-periods <breach minutes> --threshold <SLO seconds> --comparison-operator GreaterThanThreshold --alarm-actions <sns arn>`. SQS publishes these metrics at one-minute granularity, so `--period 60` is the finest useful period.
3. Test each alert in staging: stop all workers for the queue, enqueue jobs, and wait past SLO plus breach duration; confirm the alert fires (`amtool alert query` or the CloudWatch alarm state `ALARM` via `aws cloudwatch describe-alarms --alarm-names emails-age`). Start workers and confirm it resolves.
4. Test the dead-letter alert by producing one dead job.

### Output
`monitoring_config` with rules and test transcript.

### Quality Gate
- `promtool check rules` prints `SUCCESS` (or the alarm describe output shows the expected threshold).
- Each alert was observed firing and resolving in staging, with timestamps.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `sidekiq`; `latency_slo`: `critical` 30 s for 5 min, `default` 600 s for 15 min.

- Phase 1: four signals per queue; page on age.
- Phase 2: exporter loop reads `Sidekiq::Queue.new("critical").latency` every scrape.
```
$ curl -s localhost:9394/metrics | rg oldest
job_queue_oldest_age_seconds{queue="critical"} 0.84
job_queue_oldest_age_seconds{queue="default"} 12.1
```
- Phase 3: rules with `> 30 for: 5m` and `> 600 for: 15m`; `promtool check rules rules.yml` prints `SUCCESS: 3 rules found`; staging test with workers scaled to 0 fired `JobQueueAgeOverSLO{queue="critical"}` at 5 min 40 s after the first enqueue.

---

## Exit Criteria

DONE when every queue exports depth, oldest age, retry backlog and dead count, the page alert threshold equals the SLO, and each alert has been seen firing and resolving in staging.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No SLO agreed | **Return**: request it from the service owner; ship dashboards without paging until then. |
| Phase 2 | No age signal available (RabbitMQ, Celery) | **Adjust**: add the enqueue timestamp at publish and measure at receive; record that age is measured at pickup, so a stalled consumer shows no new samples (alert on absent samples too). |
| Phase 2 | Exporter scrape slows Redis | **Adjust**: increase scrape interval or cache values; never scan whole queues. |
| Phase 3 | Alert never fires in test | **Retry**: check the metric labels match the rule selector with a direct query. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
