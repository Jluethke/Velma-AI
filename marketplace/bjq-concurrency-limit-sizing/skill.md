# Concurrency Limit Sizing

**One-line description:** Sizes worker concurrency from Little's law and the measured runtime, caps it by every downstream limit (database connections, API rate limits), and maps the result onto the library's real per-process and global controls: Celery `--concurrency` and `rate_limit`, RQ worker count, BullMQ `concurrency`, `limiter` and global concurrency, Sidekiq `:concurrency:` and capsules, SQS Lambda `MaximumConcurrency`, RabbitMQ prefetch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `job_inventory` (object[], required): Output of `bjq-handler-side-effect-audit`; shows which jobs touch which downstream systems.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.
- `downstream_limits` (object, required): Per downstream system its hard limit: database `max_connections` and connections reserved for web servers, each API's documented rate limit and concurrent request limit, and the expected job arrival rate per queue (jobs per second at peak).

---

## Outputs

- `concurrency_plan` (object): Per queue: required concurrency from Little's law, each downstream cap with arithmetic, the chosen value, and the exact settings (file and key) that enforce it, with notes on which controls are per process and which are global.

---

## Phase 1: Required Concurrency

### Entry Criteria
- `downstream_limits` includes the peak arrival rate per queue.

### Actions
1. Little's law: average jobs in progress L = arrival rate lambda (jobs/s) x average runtime W (s). Use the mean runtime per job type from the durations files of `job_duration_profile` (compute it with `python -c "import statistics,sys; print(statistics.mean(float(x) for x in open(sys.argv[1])))" durations_<job>.txt`).
2. For a queue that carries several job types, sum lambda x W per type.
3. L is the minimum concurrency that keeps up on average. Running exactly L means the queue grows during any burst; how much spare capacity to add is a user decision tied to the age SLO in `bjq-queue-depth-age-alerts`. Record it as an input.

### Output
L per queue with arithmetic.

### Quality Gate
- Each queue shows lambda, W, and L with the multiplication written out.
- lambda comes from `downstream_limits`, not from a guess.

---

## Phase 2: Downstream Caps

### Entry Criteria
- L computed.

### Actions
1. Database cap. Read the server limit: Postgres `psql -c 'SHOW max_connections'` and `SHOW superuser_reserved_connections`; MySQL `SHOW VARIABLES LIKE 'max_connections'`. Available for workers = max_connections - reserved - connections used by web servers and other clients (from `downstream_limits`). Count how many connections each worker unit holds:

| `queue_choice` | Connections per worker unit |
|---|---|
| celery prefork | each child process holds its own pool (Django: one connection per process while `CONN_MAX_AGE` > 0; SQLAlchemy: up to `pool_size + max_overflow` per process) |
| celery gevent or eventlet | one process, many greenlets: up to the pool size of that process |
| rq | one per worker process (each job runs in a forked work horse that opens its own connection) |
| bullmq | one Node process: up to the `pg` Pool `max` (node-postgres default documented as 10) regardless of `concurrency` |
| sidekiq | one process with `:concurrency:` threads: Active Record pool must be at least `:concurrency:` (set `pool` in `database.yml`) |
| sqs Lambda | one connection per concurrent execution unless an RDS Proxy is used |
| rabbitmq consumers | per consumer process pool size |

   DB cap = available connections / connections per worker unit, rounded down.
2. API caps. For each API with a documented rate limit R (requests/s) and requests per job k: job rate cap = R / k. Convert to a concurrency cap with Little's law: cap = (R / k) x W. With a documented concurrent-request limit C: cap = C / (concurrent calls per job).
3. Final value = min(L plus the user's spare capacity, every cap). If the minimum is a cap below L, the queue cannot keep up at peak: record it as a capacity finding, not a configuration fix.

### Output
Caps and chosen value per queue.

### Quality Gate
- Each cap shows the server command output or the documentation URL for its limit.
- The chosen value is the arithmetic minimum, shown.

---

## Phase 3: Map to Controls

### Entry Criteria
- Chosen values exist.

### Actions
1. Write the settings, noting per-process versus global scope:

| `queue_choice` | Per-process control | Global (cluster-wide) control |
|---|---|---|
| celery | `celery -A proj worker --concurrency N -Q <queue>`; `worker_prefetch_multiplier` | No global concurrency limit. `rate_limit="10/m"` on a task is per worker instance, not global; divide the global rate by the number of workers or enforce it in the API client. |
| rq | number of `rq worker` processes (each runs one job at a time) | process count across hosts |
| bullmq | `new Worker(name, fn, { concurrency: N })` | `limiter: { max, duration }` on the Worker is enforced per queue across all workers; `await queue.setGlobalConcurrency(N)` caps active jobs across workers (check docs for your version) |
| sidekiq | `:concurrency:` in `config/sidekiq.yml`; Sidekiq 7 capsules give separate concurrency per queue set: `config.capsule("api") { |c| c.concurrency = N; c.queues = %w[api] }` | No global limit in open source; Sidekiq Enterprise rate limiters (`Sidekiq::Limiter.concurrent`) |
| sqs | consumer processes x in-flight per process | Lambda event source mapping `ScalingConfig.MaximumConcurrency` (documented minimum 2) |
| rabbitmq | `basic_qos(prefetch_count=N)` per consumer channel | number of consumers x prefetch |

2. Total cluster concurrency = per-process value x number of processes or pods. Autoscaling changes that number: the DB cap must hold at the autoscaler's maximum replicas (`kubectl get hpa`, ECS service max). Record maximum replicas and recompute.
3. Change one config file, run tests, deploy to staging.
4. Verify under load in staging: generate the peak arrival rate with a load script, then read the database connection count (`SELECT count(*) FROM pg_stat_activity WHERE application_name LIKE '<worker app name>%'`) and the API's 429 count from logs.

### Output
`concurrency_plan`.

### Quality Gate
- Peak-load connection count is at or below the DB cap (both numbers pasted).
- Zero 429 responses during the load run, or the count is recorded as a finding.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `sidekiq`; queue `sync`: lambda 12 jobs/s at peak, mean W 0.8 s; Postgres `max_connections` 200, reserved 3, web uses 120; CRM API 50 req/s, 2 requests per job; HPA max 4 pods.

- Phase 1: L = 12 x 0.8 = 9.6, round up to 10. Requester asks for 50 percent spare: 15.
- Phase 2: DB available = 200 - 3 - 120 = 77; at 4 pods, per-pod cap = floor(77 / 4) = 19. API: (50 / 2) x 0.8 = 20. Chosen = min(15, 19, 20) = 15 cluster-wide, which is 4 per pod at 4 pods (16 total, still under both caps).
- Phase 3: the `sync` worker deployment runs only that queue with `:concurrency: 4` in `config/sidekiq.yml`; `database.yml` `pool` set to at least 4 for that process (the sum of all capsule concurrencies in a process must not exceed the pool).
```
$ psql -c "select count(*) from pg_stat_activity where application_name like 'sidekiq%'"
 count
-------
    16
```
16 <= 77 available: pass.

---

## Exit Criteria

DONE when each queue has a concurrency value derived from Little's law, capped by every downstream limit at maximum replicas, mapped to the correct per-process and global controls, and checked under staging load.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Arrival rate unknown | **Return**: request peak arrival rate from metrics (enqueue counter) before sizing. |
| Phase 2 | A cap is below L | **Return**: report the capacity gap; options are fewer calls per job, a bigger DB, a connection pooler (PgBouncer), or a higher API tier. |
| Phase 3 | Library lacks a global limit (Celery, Sidekiq OSS) | **Adjust**: enforce the API limit in the client with a shared token bucket in Redis, or dedicate one worker process to that queue. |
| Phase 3 | Load test shows connection count above cap | **Stop**: lower concurrency before production; check for leaked connections in handlers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
