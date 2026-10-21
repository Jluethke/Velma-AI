# RabbitMQ Quorum Queue and Ack Config

**One-line description:** Configures RabbitMQ job queues as quorum queues with a dead-letter exchange and delivery limit set by policy, publisher confirms and persistent messages on the producer, manual acks with a bounded prefetch on the consumer in Python (pika), Node (amqplib) or Ruby (Bunny), and checks `consumer_timeout` against measured runtimes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with producer and consumer code.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for `queue_choice` = `rabbitmq`.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.
- `stack` (string, required): `python`, `node` or `ruby`.

---

## Outputs

- `rabbitmq_config` (object): Queue declarations and policies, producer and consumer code changes, the `consumer_timeout` check, and `rabbitmqctl` verification output.

---

## Phase 1: Inspect the Broker

### Entry Criteria
- `rabbitmqctl` or `rabbitmqadmin` can reach the broker (staging first).

### Actions
1. Record the server version: `rabbitmq-diagnostics server_version`. Quorum queue features (delivery limit default, at-least-once dead lettering) vary by version; read the "Quorum Queues" guide for that version.
2. List queues with type and counters: `rabbitmqctl list_queues name type durable messages_ready messages_unacknowledged consumers arguments`.
3. List policies: `rabbitmqctl list_policies`.
4. Read the effective `consumer_timeout`: `rabbitmq-diagnostics environment | rg consumer_timeout` (in milliseconds). If absent, the server default from the "Consumers" guide applies; record it.
5. Record any classic queue used for jobs. Classic mirrored queues were removed in RabbitMQ 4.0; quorum queues are the replicated type.

### Output
Version, queues, policies, consumer timeout.

### Quality Gate
- `list_queues` output is pasted.
- `consumer_timeout` value and its source (config or default) are recorded.

---

## Phase 2: Declare Queues and Policies

### Entry Criteria
- Broker inspected.

### Actions
1. Declare job queues as durable quorum queues: argument `x-queue-type: quorum`. The queue type cannot be changed after declaration; migrating a classic queue means declaring a new queue and moving traffic.
2. Set dead lettering and delivery limit by policy, not by queue arguments, so they can change later without redeclaring:
```
rabbitmqctl set_policy jobs-dlx "^jobs\." '{"dead-letter-exchange":"jobs.dlx","delivery-limit":<max_attempts>}' --apply-to quorum_queues
```
   Check `rabbitmqctl set_policy --help` for the `--apply-to` values your version accepts (`queues` works everywhere).
3. Declare `jobs.dlx` (type `fanout` or `direct`) and a durable quorum queue `jobs.dead` bound to it.
4. Optional at-least-once dead lettering for quorum queues: policy keys `dead-letter-strategy: at-least-once` together with `overflow: reject-publish`; without it, dead lettering itself is at-most-once. Read the Quorum Queues guide before enabling.
5. Delayed retries (no native backoff): for each delay in `retry_policy`, declare `jobs.retry.<seconds>` with `x-message-ttl` = delay in ms and `x-dead-letter-exchange` = the work exchange. A failing consumer publishes the message to the retry queue and acks the original. Do not use per-message TTL on a shared retry queue: messages expire only from the head, so a long TTL blocks shorter ones behind it.
6. `consumer_timeout`: must exceed the measured maximum M in `job_duration_profile` for the longest job, or the broker closes the channel with `PRECONDITION_FAILED` and redelivers. If it does not, report the required change to the broker owner; per-queue override via the `consumer-timeout` policy key exists in recent versions (check the guide).

### Output
Declarations and policies.

### Quality Gate
- `rabbitmqctl list_queues name type` shows `quorum` for each job queue (in staging after applying).
- `rabbitmqctl list_policies` shows the DLX policy matching the job queues.

---

## Phase 3: Producer and Consumer Code

### Entry Criteria
- Queues declared.

### Actions
1. Producer: persistent messages plus publisher confirms. Consumer: manual ack, prefetch, ack after success, `nack` without requeue on permanent failure.

| `stack` | Confirms and persistence | Consumer |
|---|---|---|
| python (pika) | `ch.confirm_delivery()`; `ch.basic_publish(exchange, key, body, properties=pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent, content_type="application/json", message_id=key))`; an unroutable or nacked publish raises | `ch.basic_qos(prefetch_count=N)`; `ch.basic_consume(queue, on_message_callback=cb, auto_ack=False)`; `ch.basic_ack(method.delivery_tag)`; `ch.basic_nack(method.delivery_tag, requeue=False)` |
| node (amqplib) | `const ch = await conn.createConfirmChannel(); ch.publish(ex, key, buf, { persistent: true, messageId: k }); await ch.waitForConfirms();` | `await ch.prefetch(N); ch.consume(q, onMsg, { noAck: false }); ch.ack(msg); ch.nack(msg, false, false);` |
| ruby (Bunny) | `ch.confirm_select; ex.publish(body, routing_key: key, persistent: true, message_id: k); ch.wait_for_confirms` | `ch.prefetch(N); q.subscribe(manual_ack: true) { |di, props, body| ...; ch.ack(di.delivery_tag) }`; `ch.reject(di.delivery_tag, false)` |

2. Prefetch N bounds unacked messages per consumer; it is sized in `bjq-concurrency-limit-sizing`. An unbounded prefetch (0) lets one consumer hoard the queue.
3. `requeue=True` on failure puts the message back at the head immediately: a poison message then loops as fast as the consumer can fail it. Use requeue only for shutdown; failures go through retry queues or the DLX. On quorum queues the delivery limit eventually dead-letters a looping message.
4. Edit one file at a time; run the consumer tests against a RabbitMQ container (`docker run --rm -p 5672:5672 rabbitmq:4-management`) after each change.

### Output
Code changes.

### Quality Gate
- `rg -n "auto_ack=True|noAck: true|manual_ack: false" <repo_path>` returns nothing for job consumers.
- Every publish path shows a confirm call.

---

## Phase 4: Verify

### Entry Criteria
- Code and declarations applied in staging.

### Actions
1. Publish one message that always fails permanently; confirm it reaches `jobs.dead`: `rabbitmqctl list_queues name messages | rg jobs.dead`.
2. Publish one message that fails retryably twice; confirm it passes through the retry queues and is acked (queue counts return to 0).
3. Kill a consumer with an unacked message (`kill -9 <pid>`); `rabbitmqctl list_queues name messages_ready messages_unacknowledged` shows it back in ready after the connection closes.
4. Run the full test suite; do not weaken tests.

### Output
`rabbitmq_config` with verification output.

### Quality Gate
- Each of the three checks shows the expected counts in pasted output.

---

## Worked Example

Illustrative only.

Input: `stack` = `node`, RabbitMQ 4.0, queue `jobs.email` classic, consumer uses `noAck: true`; `retry_policy` delays 5, 30, 120 s, max_attempts 4.

- Phase 1: `jobs.email  classic  true  0  0  2`; `consumer_timeout` not set, default applies.
- Phase 2: new `jobs.email.v2` with `x-queue-type: quorum`; policy `delivery-limit: 4`, DLX `jobs.dlx`; retry queues `jobs.retry.5`, `jobs.retry.30`, `jobs.retry.120`.
- Phase 3: consumer switched to `{ noAck: false }` with `ch.prefetch(N)` and ack after send.
- Phase 4:
```
$ rabbitmqctl list_queues name type messages | rg jobs
jobs.email.v2   quorum  0
jobs.dead       quorum  1
```

---

## Exit Criteria

DONE when job queues are quorum queues with a DLX and delivery limit by policy, producers use confirms and persistence, consumers ack manually with bounded prefetch, `consumer_timeout` exceeds the longest job or is reported, and the three checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No management access | **Return**: request read access or the outputs of the listed commands from the broker owner. |
| Phase 2 | Existing classic queue must keep its name | **Adjust**: drain it while new producers write to the quorum queue, then delete and redeclare under the old name in a maintenance window. |
| Phase 3 | Library is Celery or another framework on RabbitMQ | **Return**: use the framework flow; this one covers direct AMQP clients. |
| Phase 4 | Message never dead-letters | **Stop**: check the policy pattern matches the queue name (`rabbitmqctl list_queues name policy`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
