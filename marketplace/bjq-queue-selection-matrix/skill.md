# Queue Selection Matrix

**One-line description:** Picks one job queue technology (Celery, RQ, BullMQ, Sidekiq, Amazon SQS or RabbitMQ) from written workload requirements by first eliminating every option that violates a hard constraint, then ranking the survivors by stack fit and existing infrastructure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_requirements` (object, required): Written answers to the requirement questions in Phase 1: longest job runtime, largest payload, longest delay before a job may run, ordering needs, routing needs, hosting (AWS, other cloud, on-premises), and whether jobs must be created in the same database transaction as business data.
- `stack` (string, required): Language of the worker code: `python`, `node` or `ruby`.
- `existing_infrastructure` (string[], optional): Brokers and data stores already run in production, for example `["redis 7.2", "postgres 16", "aws"]`.

---

## Outputs

- `queue_choice` (string): Exactly one of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`. Downstream flows branch on this value.
- `selection_matrix` (object[]): One row per candidate: candidate, each hard constraint with pass or fail and the documentation source, elimination reason, and rank among survivors.

---

## Phase 1: Collect Hard Requirements

### Entry Criteria
- `workload_requirements` and `stack` are present.

### Actions
1. Copy these seven questions into a table and fill each answer from `workload_requirements`. Leave a cell as `UNKNOWN` if the input does not answer it. Do not guess.
   1. Longest expected job runtime (seconds).
   2. Largest job payload (bytes) after serialization.
   3. Longest delay between enqueue and earliest run (seconds).
   4. Ordering: none, per entity key (for example per customer), or global.
   5. Routing: one queue per job type is enough, or topic/fanout routing to several consumers is needed.
   6. Hosting: AWS, other cloud, on-premises.
   7. Transactional enqueue: must a job exist if and only if a database transaction commits?
2. If any answer is `UNKNOWN`, list it in `selection_matrix` under `open_questions` and continue. Treat an unknown as "does not constrain" for elimination, and flag the final choice as provisional.
3. Record `stack` and `existing_infrastructure` at the top of the table.

### Output
A filled requirement table with explicit `UNKNOWN` cells.

### Quality Gate
- All seven questions appear with an answer or `UNKNOWN`.
- No answer was invented: each filled cell can be traced to a sentence in `workload_requirements`.

---

## Phase 2: Eliminate by Hard Constraints

### Entry Criteria
- Requirement table exists.

### Actions
1. Apply the stack filter. A worker library only runs in its language:

| Candidate | Worker language | Keep when `stack` is |
|---|---|---|
| Celery | Python | `python` |
| RQ | Python | `python` |
| BullMQ | Node.js (TypeScript) | `node` |
| Sidekiq | Ruby | `ruby` |
| Amazon SQS | any (AWS SDK) | any |
| RabbitMQ | any (AMQP 0-9-1 client) | any |

2. Apply the limit filter using the official documentation of each candidate. Read the current value from the cited page and paste it into the matrix. Do not use a remembered number.

| Constraint | Where the limit lives | Rule |
|---|---|---|
| Job runtime vs. lease | SQS: `VisibilityTimeout` maximum on the SQS quotas page. RabbitMQ: `consumer_timeout` in rabbitmq.conf (server default documented in the RabbitMQ "Consumers" guide). BullMQ: `lockDuration` (renewed automatically while the worker is alive). Celery on Redis or SQS: `broker_transport_options['visibility_timeout']`. | If runtime exceeds a hard maximum that cannot be raised, mark FAIL unless the job can be split. |
| Payload size | SQS message size quota page; Redis maximum string size in Redis docs; RabbitMQ `max_message_size` in rabbitmq.conf. | If payload exceeds the limit, mark "needs claim check" (store body in object storage, enqueue the key). Not an elimination by itself. |
| Enqueue delay | SQS `DelaySeconds` maximum in the SQS developer guide. | If the longest delay exceeds it, SQS needs an external scheduler (EventBridge Scheduler). Mark "needs scheduler". |
| Ordering per key | SQS FIFO `MessageGroupId`; RabbitMQ single active consumer (`x-single-active-consumer`); BullMQ Pro groups (paid); Sidekiq and RQ have no per-key ordering primitive. | If per-key ordering is required, mark FAIL for candidates without a primitive. |
| Topic or fanout routing | RabbitMQ exchanges; SQS via SNS fanout. | If required, Celery, RQ, BullMQ and Sidekiq get "needs extra broker" (Celery only when its broker is RabbitMQ). |
| Durability of Redis-backed queues | Redis persistence docs (AOF `appendfsync` options). | RQ, BullMQ, Sidekiq and Celery-on-Redis lose acknowledged enqueues on a Redis crash unless AOF is on. Record whether the Redis in `existing_infrastructure` runs AOF. If unknown, add to open questions. |

3. If transactional enqueue is required, add the note "requires outbox (see `bjq-transactional-outbox-enqueue`)" to every candidate. No broker in this list joins a database transaction.
4. Write each FAIL with its source URL or doc section in `selection_matrix`.

### Output
Matrix rows with pass, fail or note per constraint.

### Quality Gate
- Every FAIL cites a documentation page or config key.
- No candidate is eliminated for a reason that is not in the constraint table.

---

## Phase 3: Rank Survivors and Choose

### Entry Criteria
- At least one candidate survives Phase 2.

### Actions
1. Rank survivors with this ordered rule list. Apply the first rule that separates them:
   1. A candidate whose broker is already in `existing_infrastructure` beats one that adds a new stateful service.
   2. If hosting is AWS and no broker exists, SQS beats self-hosted brokers (no broker to operate).
   3. If routing or fanout is required, RabbitMQ beats Redis-based libraries.
   4. If `stack` is `python`: Celery beats RQ when the requirements need any of: periodic schedules via beat, task chains or chords, a non-Redis broker, per-task time limits with soft limits. Otherwise RQ wins because it has fewer moving parts.
   5. If `stack` is `node`: BullMQ. If `stack` is `ruby`: Sidekiq.
2. Set `queue_choice` to the top-ranked candidate.
3. Do not choose two queues. If the requirements truly need two (for example fanout plus Python tasks), choose the one that runs the job code, and add the other as an open question.

### Output
`queue_choice` and the ranked `selection_matrix`.

### Quality Gate
- `queue_choice` is exactly one of the six allowed strings.
- The rank rule that decided the choice is written in the matrix row of the winner.

---

## Worked Example

Illustrative only.

Input: `stack` = `python`; `existing_infrastructure` = `["redis 7.2 (AOF on)", "postgres 16"]`; requirements: runtime up to 20 minutes, payload 2 KB, delay up to 1 hour, no ordering, no fanout, hosting on-premises, transactional enqueue yes, nightly report schedule.

- Phase 1: all seven answered; no `UNKNOWN`.
- Phase 2: BullMQ and Sidekiq fail the stack filter. SQS fails hosting (on-premises). RabbitMQ passes but adds a new service. Celery and RQ pass. All survivors get "requires outbox".
- Phase 3: rule 1 removes RabbitMQ in favor of Redis-based options. Rule 4: the nightly schedule needs beat, so Celery beats RQ.

```
queue_choice: celery
selection_matrix[celery]: decided_by = "rule 4: periodic schedule needs celery beat"; notes = ["requires outbox", "set broker_transport_options visibility_timeout > 1200 s runtime"]
```

---

## Exit Criteria

DONE when `queue_choice` holds one allowed value and `selection_matrix` shows every candidate with its eliminations, citations and the deciding rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` is not python, node or ruby | **Stop**: these flows cover only those three worker stacks; report the stack as unsupported. |
| Phase 1 | Most answers are `UNKNOWN` | **Return**: send the open questions back to the requester before ranking. |
| Phase 2 | Every candidate fails | **Return**: report the conflicting constraints (for example a 48-hour job on a lease-limited queue) and ask whether the job can be split. |
| Phase 2 | Documentation page for a limit cannot be found | **Adjust**: mark the cell `UNVERIFIED` and add it to open questions; do not fill in a remembered number. |
| Phase 3 | Two candidates tie after all rules | **Adjust**: pick the one with fewer new services and record the tie in the matrix. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
