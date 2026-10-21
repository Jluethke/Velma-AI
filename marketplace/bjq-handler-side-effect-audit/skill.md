# Handler Side-Effect Audit

**One-line description:** Finds every background job handler and every enqueue call site in a repository with exact grep patterns per queue library, lists each external side effect the handler performs, and classifies each one as safe or unsafe under at-least-once delivery.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.

---

## Outputs

- `job_inventory` (object[]): One row per job type: job name, handler file and line, enqueue call sites (file:line), arguments, side effects with their class (A to E below), and current protection, if any.
- `unsafe_handlers` (object[]): Rows from `job_inventory` that have at least one side effect of class C, D or E with no protection. Empty when none.

---

## Phase 1: Locate Handlers and Enqueue Sites

### Entry Criteria
- `repo_path` exists and is readable.

### Actions
1. Run the search for `queue_choice` from the table below with ripgrep (`rg -n`). Exclude vendored code with `--glob '!node_modules' --glob '!vendor' --glob '!.venv'`.

| `queue_choice` | Handler pattern | Enqueue pattern |
|---|---|---|
| celery | `rg -n "@(shared_task|app\.task|celery\.task)"` | `rg -n "\.(delay|apply_async|delay_on_commit|s|si)\("` then keep lines that name a task found as a handler |
| rq | functions passed to enqueue (see enqueue pattern) | `rg -n "\.enqueue(_in|_at|_call)?\("` |
| bullmq | `rg -n "new Worker\("` | `rg -n "\.add(Bulk)?\("` near a `new Queue(` import |
| sidekiq | `rg -n "include Sidekiq::(Job|Worker)"` and `rg -n "< ApplicationJob"` | `rg -n "\.perform_(async|in|at|bulk)\("` and `rg -n "\.perform_later\("` |
| sqs | `rg -n "receive_message|ReceiveMessageCommand|receive_message\("` and Lambda handlers with `rg -n "Records"` | `rg -n "send_message(_batch)?|SendMessage(Batch)?Command"` |
| rabbitmq | `rg -n "basic_consume|\.consume\(|subscribe\("` | `rg -n "basic_publish|\.publish\(|sendToQueue"` |

2. For each handler, record the job name, file, line, and the function signature.
3. Match each enqueue site to a handler by job name. An enqueue site with no handler is a bug: record it as `orphan_enqueue`. A handler with no enqueue site is recorded as `unused_handler` (it may be scheduled by cron; Phase 2 does not change it).
4. Do not open more than one file at a time for editing. This flow edits nothing; it only reads.

### Output
Draft `job_inventory` with handlers and enqueue sites.

### Quality Gate
- The row count equals the number of distinct handler matches from the search command (rerun it and compare).
- Every row has a file:line that opens to the handler definition.

---

## Phase 2: List and Classify Side Effects

### Entry Criteria
- Draft `job_inventory` exists.

### Actions
1. Read each handler body and every function it calls inside the repository (follow calls one level at a time until you reach I/O). List each I/O operation.
2. Classify each I/O operation with this table. At-least-once delivery means every handler can run more than once for one enqueue, and can stop at any line.

| Class | Operation | Safe on repeat? |
|---|---|---|
| A | Read only (SELECT, GET, file read) | Yes |
| B | Naturally idempotent write: `UPDATE ... SET status = 'x' WHERE id = ?`, PUT of a full resource, upsert keyed by a natural key, S3 PutObject to a fixed key | Yes |
| C | Non-idempotent DB write: `INSERT` without a unique key, `UPDATE ... SET n = n + 1`, append to a list | No |
| D | External call with money or a human-visible effect: payment, email, SMS, push notification, webhook to a customer | No |
| E | Enqueue of another job (fan-out) | No, the child is enqueued again on each retry |

3. Record existing protection per side effect, if any: a unique constraint (show the migration or `\d table` line), an idempotency key passed to the provider (for example the `Idempotency-Key` header on Stripe requests), a dedupe check, or a `jobId` / `MessageDeduplicationId` on the child enqueue.
4. Record also the ack timing per library, because it decides whether partial work is replayed:
   - Celery: default acks before execution (`task_acks_late` is False by default), so a crash loses the task rather than replaying it. Note the setting value found with `rg -n "acks_late"`.
   - RQ: a job whose worker dies is not retried automatically; it ends in a failed or abandoned state (check the RQ docs for your installed version with `pip show rq`).
   - Sidekiq (open source fetch): a job in progress when the process is killed with SIGKILL is lost; jobs still running at the end of the shutdown timeout are pushed back to Redis and run again.
   - BullMQ, SQS, RabbitMQ with manual ack: the job is delivered again after a stalled lock, visibility timeout or channel close.

### Output
`job_inventory` with classified side effects.

### Quality Gate
- Every handler has at least one side effect row or the explicit note `no I/O`.
- Every class C, D, E row has a `protection` field that is either a cited line of code or `none`.

---

## Phase 3: Emit Unsafe Handlers

### Entry Criteria
- Classified `job_inventory` exists.

### Actions
1. Copy every handler with a class C, D or E side effect whose protection is `none` into `unsafe_handlers`.
2. Order `unsafe_handlers` by worst class: D first, then C, then E.
3. Do not fix anything in this flow. Fixes belong to `bjq-idempotency-key-store` and `bjq-transactional-outbox-enqueue`.

### Output
`job_inventory`, `unsafe_handlers`.

### Quality Gate
- Count of `unsafe_handlers` equals the count of unprotected C/D/E handlers in `job_inventory` (recount by reading both lists).
- No file in `repo_path` was modified (`git -C <repo_path> status --porcelain` prints nothing new).

---

## Worked Example

Illustrative only.

Input: `repo_path` = `/srv/shop`, `queue_choice` = `sidekiq`.

Phase 1 command and output:
```
$ rg -n "include Sidekiq::Job" /srv/shop/app
app/jobs/charge_order_job.rb:1:class ChargeOrderJob; include Sidekiq::Job
app/jobs/send_receipt_job.rb:1:class SendReceiptJob; include Sidekiq::Job
$ rg -n "\.perform_async\(" /srv/shop/app
app/models/order.rb:42:    ChargeOrderJob.perform_async(id)
app/jobs/charge_order_job.rb:9:    SendReceiptJob.perform_async(order_id)
```

Phase 2 classification for `ChargeOrderJob`:
- `Stripe::PaymentIntent.create(amount:, customer:)` -> class D, protection `none` (no `idempotency_key:` option passed).
- `order.update!(status: "paid")` -> class B.
- `SendReceiptJob.perform_async(order_id)` -> class E, protection `none`.

Phase 3 output:
```
unsafe_handlers: [ {job: "ChargeOrderJob", file: "app/jobs/charge_order_job.rb", classes: ["D", "E"]},
                   {job: "SendReceiptJob", file: "app/jobs/send_receipt_job.rb", classes: ["D"]} ]
```

---

## Exit Criteria

DONE when every handler found by the search command is in `job_inventory` with classified side effects, and every unprotected class C, D or E side effect is listed in `unsafe_handlers`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Search finds zero handlers | **Adjust**: confirm `queue_choice` matches the dependency file (`requirements.txt`, `package.json`, `Gemfile.lock`); if handlers are wrapped by a framework (Active Job, Django Q), search for that wrapper instead. |
| Phase 1 | Enqueue site uses a dynamic job name | **Adjust**: record it as `dynamic_enqueue` with the expression, and list the possible names if they are constants in the same file. |
| Phase 2 | Handler calls a library whose I/O cannot be seen | **Adjust**: classify by the library's documented behavior and cite its docs; if undocumented, classify as C. |
| Phase 3 | Repository changed during the audit | **Retry**: rerun Phase 1 on the new commit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
