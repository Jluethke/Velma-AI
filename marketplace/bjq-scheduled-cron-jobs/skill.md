# Scheduled Cron Jobs

**One-line description:** Sets up periodic jobs so each scheduled run happens once per period even with several app instances, using the library's real scheduler (Celery beat, rq-scheduler, BullMQ job schedulers, sidekiq-cron or Sidekiq Enterprise periodic jobs, EventBridge Scheduler for SQS), an explicit time zone, a period-based idempotency key, and an overlap guard.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `schedule_requirements` (object[], required): Per periodic job: name, cron expression or interval, time zone (IANA name such as `America/Chicago`), whether a missed run must be caught up, and whether two runs may overlap.
- `idempotency_design` (object, required): Output of `bjq-idempotency-key-store`; each scheduled job uses the per-period key form.

---

## Outputs

- `schedule_config` (object): Scheduler choice, the schedule definitions in code, the single-instance guarantee, overlap and catch-up handling per job, and verification output.

---

## Phase 1: Pick the Scheduler and Its Single-Instance Rule

### Entry Criteria
- `schedule_requirements` lists at least one job.

### Actions
1. Use the scheduler for `queue_choice` and record its single-instance rule:

| `queue_choice` | Scheduler | Single-instance rule |
|---|---|---|
| celery | Celery beat: `beat_schedule` with `celery.schedules.crontab(...)`, process `celery -A proj beat` | Run exactly one beat process. Two beats enqueue every run twice. In Kubernetes use a separate Deployment with `replicas: 1` and `strategy: Recreate`. Do not use `worker -B` in production (the docs mark it for development). |
| rq | `rq-scheduler` package (`rqscheduler` process, `scheduler.cron(...)`), or a system cron that calls an enqueue script | One `rqscheduler` process (it takes a lock; read its docs). Check whether your RQ major version ships built-in cron support before adding a package. |
| bullmq | Job schedulers: `queue.upsertJobScheduler(id, { pattern, tz } or { every }, { name, data })` (BullMQ 5.16 and later; older versions use the `repeat` job option) | Stored in Redis by id; calling upsert from every instance is safe because the id is unique. |
| sidekiq | `sidekiq-cron` gem (`Sidekiq::Cron::Job.load_from_hash` or `config/schedule.yml`) or Sidekiq Enterprise `config.periodic { |mgr| mgr.register(cron, "JobClass") }` | Both coordinate through Redis so only one process enqueues each tick. |
| sqs | Amazon EventBridge Scheduler schedule targeting the queue (`aws scheduler create-schedule ... --schedule-expression "cron(...)" --schedule-expression-timezone <tz>`) | Managed; no app process. Note EventBridge cron syntax has six fields and differs from Unix cron; read its docs. |
| rabbitmq | No built-in scheduler; use Kubernetes `CronJob` running a publish script, or system cron | Kubernetes `CronJob` with `concurrencyPolicy: Forbid`; still at-least-once (the CronJob docs say a job may be created twice in rare cases). |

2. Whatever the scheduler, every run may still happen twice (a failover, a manual trigger, the CronJob note above). The idempotency key closes that gap: `<job>:<period start in ISO 8601 with offset>` from `idempotency_design`.

### Output
Scheduler and rule recorded.

### Quality Gate
- The single-instance rule is written for the chosen scheduler with its doc source.
- Each job has a per-period idempotency key format.

---

## Phase 2: Define Schedules

### Entry Criteria
- Scheduler chosen.

### Actions
1. Write each schedule with an explicit time zone. Celery: `timezone = "America/Chicago"` in config (beat uses it for `crontab`); BullMQ: `tz` in the scheduler options; sidekiq-cron: append the zone to the cron string as its README documents; EventBridge: `--schedule-expression-timezone`. Never rely on the server's local time.
2. Daylight saving time: a run at 02:30 local time does not exist on the spring-forward day and occurs twice on the fall-back day in zones with DST. If a job must run once per calendar day, schedule it outside 01:00 to 03:00 local or in UTC. Record the choice.
3. Overlap guard for jobs that must not overlap: take a database advisory lock at the start (Postgres `SELECT pg_try_advisory_lock(<job id hash>)`; return immediately if false; release with `pg_advisory_unlock` at the end) or a Redis lock with a TTL longer than the measured maximum runtime. The idempotency key prevents two runs of the same period; the lock prevents the next period's run from starting while the previous is still going.
4. Catch-up: most schedulers skip ticks missed while they were down (BullMQ and Celery beat do not replay every missed tick; read the docs). If a job must catch up, make the job itself compute "periods since last success" from a `last_success_period` row and process each.
5. Write the schedule definitions in code (not in a UI only) so they are reviewed and versioned. One file per scheduler.

### Output
Schedule definitions.

### Quality Gate
- Every schedule entry shows a time zone.
- Every no-overlap job has a lock call at its first line of work (cite file:line).

---

## Phase 3: Verify

### Entry Criteria
- Definitions written.

### Actions
1. Validate cron expressions by printing the next run times, not by reading them:
   - Python: `python -c "from celery.schedules import crontab; from datetime import datetime, timezone; s=crontab(minute=0, hour=3); print(s.remaining_estimate(datetime.now(timezone.utc)))"`
   - Node: `node -e "const { CronExpressionParser } = require('cron-parser'); const it = CronExpressionParser.parse('0 3 * * *', { tz: 'America/Chicago' }); for (let i=0;i<3;i++) console.log(it.next().toString())"` (the API name differs between cron-parser major versions; check its README).
   - Ruby (fugit, used by sidekiq-cron): `ruby -e 'require "fugit"; c=Fugit::Cron.parse("0 3 * * * America/Chicago"); puts c.next_time.to_s'`
   - EventBridge: `aws scheduler get-schedule --name <name>` and read `ScheduleExpression`.
2. Confirm single instance: Celery `kubectl get pods -l app=celery-beat` shows one pod; sidekiq-cron jobs appear once in the Cron tab of Sidekiq Web; BullMQ `await queue.getJobSchedulers()` lists each id once.
3. Duplicate-run test: trigger the same period twice by hand and assert one effect (count rows by idempotency key).
4. Run tests; do not skip or delete them.

### Output
`schedule_config` with verification output.

### Quality Gate
- Next-run output for each schedule matches the intended local times.
- Duplicate-run test shows one effect.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `celery`; `nightly_invoice_report` at 03:00 America/Chicago, no overlap, catch up required.

- Phase 1: one beat Deployment with `replicas: 1`, `strategy: Recreate`; key `nightly_invoice_report:2026-10-20T00:00:00-05:00`.
- Phase 2:
```python
app.conf.timezone = "America/Chicago"
app.conf.beat_schedule = {"nightly-invoice-report": {"task": "billing.tasks.nightly_invoice_report", "schedule": crontab(minute=0, hour=3)}}
```
03:00 is outside the DST shift window in Chicago (02:00 local). Advisory lock at `billing/tasks.py:88`; catch-up loop over periods since `last_success_period`.
- Phase 3: `kubectl get pods -l app=celery-beat` shows `celery-beat-6d9f7-x2k4p  1/1 Running`; duplicate trigger test passes with one report row.

---

## Exit Criteria

DONE when every periodic job has a schedule in code with an explicit time zone, a scheduler with a documented single-instance rule, a per-period idempotency key, overlap and catch-up handling where required, and verified next-run times.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Several beat processes found running | **Stop**: scale to one before adding schedules; check for duplicate runs already in data. |
| Phase 2 | Requirement says "every 1st business day" or similar | **Adjust**: schedule daily and let the job decide whether today qualifies; cron cannot express it. |
| Phase 3 | Next-run output differs from intent | **Retry**: fix the expression or time zone and rerun the print. |
| Phase 3 | Duplicate-run test shows two effects | **Return**: send the job to `bjq-idempotency-key-store`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
