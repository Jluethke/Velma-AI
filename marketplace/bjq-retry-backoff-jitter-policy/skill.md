# Retry Backoff Jitter Policy

**One-line description:** Writes a per-job retry policy that classifies every error as retryable or permanent, computes capped exponential backoff with full jitter, checks that the whole retry window outlasts the outage it must survive and fits inside message retention, and maps the result onto the chosen library's real retry settings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `job_inventory` (object[], required): Output of `bjq-handler-side-effect-audit`; lists the external calls each job makes.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.
- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.
- `outage_tolerance` (object, optional): Per dependency, the longest outage the jobs must ride through without landing in the dead-letter queue, supplied by the service owner.

---

## Outputs

- `retry_policy` (object[]): Per job: error classification table, `base_delay_s`, `cap_s`, `max_attempts`, jitter mode, the computed retry window (minimum and maximum), and the exact library settings that implement it.

---

## Phase 1: Classify Errors

### Entry Criteria
- `job_inventory` lists each job's external calls.

### Actions
1. For each job, list the exceptions or error responses each external call can produce (read the client library's exception classes; do not invent names).
2. Classify each with this table. When an error is not in the table, classify it as retryable and mark it `unclassified` for review.

| Error | Class | Reason |
|---|---|---|
| Connection refused, connection reset, DNS failure, read timeout | Retryable | Transient network failure |
| HTTP 408, 429, 500, 502, 503, 504 | Retryable | Server or rate-limit condition (RFC 9110 defines these codes) |
| HTTP 429 or 503 with a `Retry-After` header | Retryable, and the next delay is at least the `Retry-After` value | RFC 9110 section 10.2.3 |
| HTTP 400, 401, 403, 404, 409, 422 | Permanent | Repeating the same request gives the same answer |
| Postgres SQLSTATE `40001` (serialization_failure), `40P01` (deadlock_detected) | Retryable | The transaction can succeed on retry |
| Postgres `23505` (unique_violation) on the idempotency key | Not an error: treat as already done and return success | See `bjq-idempotency-key-store` |
| Payload fails schema validation, unknown `schema_version` | Permanent | Bad input never fixes itself |
| Record referenced by the payload not found | Permanent, unless the enqueue can run before the record's transaction commits (then fix with the outbox, not retries) | |

3. Permanent errors must skip remaining retries. The mechanism per library: Celery: do not list the exception in `autoretry_for` and do not call `self.retry`; BullMQ: throw `UnrecoverableError` (exported by `bullmq`); Sidekiq: `sidekiq_retry_in { |count, exc| exc.is_a?(PermanentError) ? :kill : nil }` (`:kill` sends to the Dead set, `:discard` drops; returning `nil` uses the default delay); RQ: do not pass `retry=` for those, or catch and return; SQS and RabbitMQ: send to the dead-letter queue directly (RabbitMQ `basic.nack` with `requeue=false`; SQS: send to the DLQ and delete the original).

### Output
Error classification per job.

### Quality Gate
- Every external call in `job_inventory` has at least one classified error row.
- Every permanent class names the exact mechanism line for `queue_choice`.

---

## Phase 2: Compute Backoff and Window

### Entry Criteria
- Errors classified.

### Actions
1. Use full jitter from the AWS Architecture Blog post "Exponential Backoff And Jitter" (Marc Brooker): `delay(n) = random_uniform(0, min(cap, base * 2 ** n))` for attempt number n starting at 0. Full jitter spreads retries of many jobs that failed at the same moment, so they do not hit the recovering dependency in lockstep.
2. Take `base_delay_s`, `cap_s` and `max_attempts` from, in order: `outage_tolerance` and the dependency owner's guidance; else the library default (record which). Do not choose a number without a source. Known defaults to cite: Celery `retry_backoff_max` default 600 s, `retry_jitter` default True, `max_retries` default 3; Sidekiq default 25 retries; BullMQ `attempts` default 1 (no retry).
3. Compute the retry window bounds without jitter as the upper bound: `W_max = sum over n = 0..max_attempts-2 of min(cap, base * 2 ** n)` plus `(max_attempts) * max runtime` from `job_duration_profile`. With full jitter the expected window is about half the delay sum. Write both numbers.
4. Check three conditions and record pass or fail:
   - C1: `W_max` (and the expected window) is at least the outage in `outage_tolerance` for each dependency. If no tolerance was given, record it as an open question.
   - C2: For SQS, `W_max` is less than `MessageRetentionPeriod` (read with `aws sqs get-queue-attributes --attribute-names MessageRetentionPeriod`); a message that outlives retention is deleted silently, not dead-lettered.
   - C3: For RabbitMQ quorum queues, `max_attempts` is no more than the queue's delivery limit, or the message is dead-lettered early.
5. Do not retry inside the handler with a sleep loop in addition to queue retries. Nested retries multiply: 3 in-handler attempts times 5 queue attempts is 15 calls.

### Output
Numbers and C1 to C3 results per job.

### Quality Gate
- `W_max` is shown with its full arithmetic.
- C1 to C3 each read pass, fail or not applicable, with the value compared.

---

## Phase 3: Map to Library Settings

### Entry Criteria
- Numbers computed.

### Actions
1. Write the exact settings:

| `queue_choice` | Settings |
|---|---|
| celery | `@app.task(bind=True, autoretry_for=(ConnectionError, TimeoutError), retry_backoff=<base>, retry_backoff_max=<cap>, retry_jitter=True, max_retries=<max_attempts - 1>)`. Celery's jitter picks a delay between 0 and the computed value, which is full jitter. |
| rq | `retry=Retry(max=<max_attempts - 1>, interval=[<d0>, <d1>, ...])`. RQ has no jitter; precompute the list with jitter at enqueue time and note that it is fixed per job. Intervals need `rq worker --with-scheduler`. |
| bullmq | `{ attempts: <max_attempts>, backoff: { type: 'custom' } }` on add, plus Worker option `settings: { backoffStrategy: (attemptsMade) => Math.floor(Math.random() * Math.min(cap, base * 2 ** (attemptsMade - 1)) * 1000) }`. Built-in `type: 'exponential'` has no full jitter in its classic form; check the BullMQ docs for a `jitter` option in your installed version (`npm ls bullmq`) before using it. |
| sidekiq | `sidekiq_options retry: <max_attempts - 1>` and `sidekiq_retry_in { |count, exc| rand(0..[cap, base * 2**count].min) }`. Sidekiq's default formula already adds randomness; replace it only when the window check failed. |
| sqs | No native backoff. On failure, call `ChangeMessageVisibility` with the computed delay using `ApproximateReceiveCount - 1` as n, then return without deleting. `maxReceiveCount` in the RedrivePolicy equals `max_attempts`. |
| rabbitmq | No native backoff. Republish to a per-delay retry queue declared with `x-message-ttl` and `x-dead-letter-exchange` pointing back to the work exchange, then ack the original. Track attempts in a header such as `x-retry-count`; quorum queues also count deliveries in `x-delivery-count`. |

2. Record attempts versus retries: Celery `max_retries` and Sidekiq `retry` count retries (total runs = value + 1); BullMQ `attempts` and SQS `maxReceiveCount` count total runs.

### Output
`retry_policy`.

### Quality Gate
- Every job row contains a settings line for `queue_choice` that uses only option names present in the library's docs (cite the page).
- The attempts-versus-retries conversion is shown for every row.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `sqs`; job `sync_crm` calls a CRM API; `outage_tolerance` = CRM outages up to 30 minutes; max runtime 4 s; base 2 s and cap 300 s supplied by the CRM owner; `max_attempts` = 12.

- Phase 1: 429 with `Retry-After` retryable; 404 permanent (send to DLQ directly).
- Phase 2: the 11 delays without jitter are 2, 4, 8, 16, 32, 64, 128, 256, 300, 300, 300 = 1410 s; plus 12 x 4 s = 48 s; `W_max` = 1458 s (24.3 min). Expected with full jitter about 705 s of delay. C1 fails: even `W_max` is shorter than the 30-minute outage. The open question goes back to the CRM owner: raise `max_attempts` (each extra attempt at the cap adds 300 s) or accept DLQ redrive after long outages. C2: retention 345600 s > 1458 s, pass.
- Phase 3: `RedrivePolicy` `{"maxReceiveCount":"12", ...}`; consumer computes `delay = random.uniform(0, min(300, 2 * 2 ** (receive_count - 1)))` and calls `change_message_visibility(..., VisibilityTimeout=int(delay))`.

---

## Exit Criteria

DONE when every job has a classified error table, a computed retry window checked against outage tolerance and retention, and exact library settings.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Client library exceptions undocumented | **Adjust**: read the library source for raised classes and cite file:line. |
| Phase 2 | No source for base, cap or attempts | **Return**: report as open questions; use the library default only if the requester accepts it in writing. |
| Phase 2 | C1 cannot be met within retention | **Adjust**: rely on the dead-letter redrive (`bjq-dead-letter-redrive-runbook`) for long outages and record that. |
| Phase 3 | Option name not found in installed version docs | **Stop**: do not use it; pick the documented mechanism for that version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
