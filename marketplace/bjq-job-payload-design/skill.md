# Job Payload Design

**One-line description:** Rewrites each job's payload into a small, versioned, JSON-native envelope that carries identifiers instead of objects, an idempotency key and an enqueue timestamp, and lists every current payload that breaks those rules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `job_inventory` (object[], required): Output of `bjq-handler-side-effect-audit`, with enqueue call sites and arguments.
- `queue_choice` (string, required): One of `celery`, `rq`, `bullmq`, `sidekiq`, `sqs`, `rabbitmq`.

---

## Outputs

- `payload_schema` (object[]): Per job type: a JSON Schema (draft 2020-12) for the envelope and the `args` object, the source of `idempotency_key`, and a sample payload.
- `payload_violations` (object[]): Every enqueue site whose current arguments break a rule in Phase 1, with file:line and the rule number. Empty when none.

---

## Phase 1: Check Current Payloads Against the Rules

### Entry Criteria
- `job_inventory` lists enqueue sites with arguments.

### Actions
1. For each enqueue site, read the arguments and test them against these rules. Record each break in `payload_violations`.

| Rule | Requirement | Why |
|---|---|---|
| R1 | Pass identifiers (order id, user id), never ORM objects, model instances or full records. | The record can change between enqueue and run; the handler must load the current row. Celery with the `pickle` serializer and RQ (pickle by default) will silently accept objects. |
| R2 | Every value is JSON-native: string, number, boolean, null, array, object. No `datetime`, `Decimal`, `UUID` objects, symbols or class instances. Encode time as an ISO 8601 string with an offset, money as an integer in minor units or a decimal string. | Sidekiq requires JSON-native args (`Sidekiq.strict_args!` raises on others); BullMQ stores `JSON.stringify` output, so `Date` becomes a string and `Map` becomes `{}`. |
| R3 | Payload size stays under the broker limit from the queue's documentation. Large data (files, report rows) goes to object storage and the payload carries the key (claim check). | Oversized messages are rejected (SQS) or bloat Redis memory (Redis-backed queues). |
| R4 | No secrets or personal data beyond identifiers. | Payloads are visible in Flower, Sidekiq Web, Bull Board, the RabbitMQ management UI and in dead-letter queues. |
| R5 | No positional argument lists longer than the handler needs; prefer one `args` object with named keys. | Adding a positional argument breaks jobs already in the queue during a deploy. |

2. Measure size, do not estimate: serialize one realistic payload and count bytes. Python: `len(json.dumps(payload).encode())`. Node: `Buffer.byteLength(JSON.stringify(payload))`. Ruby: `JSON.generate(payload).bytesize`.

### Output
`payload_violations` list.

### Quality Gate
- Each violation has a file:line and a rule number R1 to R5.
- Each size check shows the command and the byte count it printed.

---

## Phase 2: Define the Envelope

### Entry Criteria
- Violations are listed.

### Actions
1. Use this envelope for every job type. Field names are fixed so monitoring and tests can rely on them:
```json
{
  "schema_version": 1,
  "job": "charge_order",
  "idempotency_key": "charge_order:order:8812",
  "enqueued_at": "2026-10-20T14:03:11Z",
  "args": { "order_id": 8812 }
}
```
2. Set `idempotency_key` from this decision table:

| Job meaning | Key source |
|---|---|
| Act once per business entity state (charge order 8812) | `<job>:<entity>:<id>` |
| Act once per event (webhook delivery, message id from the provider) | `<job>:<event id from the source>` |
| Act once per period (daily report) | `<job>:<period start in ISO 8601>` |
| Truly repeatable (refresh a cache) | `<job>:<id>` is still set, so duplicates can be collapsed, but the handler need not check it |

Never build the key from `uuid4()` or the current time at enqueue: a retried enqueue (for example after a timeout on publish) would produce a new key and defeat deduplication.
3. Write a JSON Schema for `args` per job with `"additionalProperties": false` and `required` listing every field the handler reads.
4. Handler rule for versions: the handler accepts `schema_version` N and N-1 during a deploy, and rejects anything else with a non-retryable error. Write this rule into the schema description.

### Output
Draft `payload_schema`.

### Quality Gate
- Every job in `job_inventory` has one schema entry.
- Every schema validates its own sample payload. Run `check-jsonschema --schemafile schema.json sample.json` (pip package `check-jsonschema`) or `npx ajv-cli validate -s schema.json -d sample.json` and record exit code 0. (The `jsonschema` package's own command line is deprecated; do not use it.)

---

## Phase 3: Map Envelope to the Queue Library

### Entry Criteria
- Draft `payload_schema` exists.

### Actions
1. Record where each envelope field goes for `queue_choice`:

| `queue_choice` | Serializer setting to confirm | Where `idempotency_key` also goes |
|---|---|---|
| celery | `task_serializer = "json"`, `accept_content = ["json"]` (check with `rg -n "serializer|accept_content"`) | `apply_async(task_id=<key>)` only if every key is unique per intended run; otherwise keep it in `args` |
| rq | pass the envelope as one dict argument; RQ pickles it, so R2 is enforced by the schema, not by RQ | `enqueue(..., job_id=<key>)` replaces a job with the same id; check RQ docs for your version before relying on it |
| bullmq | data is JSON | `queue.add(name, data, { jobId: <key> })` ignores the add while a job with that id still exists |
| sidekiq | args are JSON | keep in args; open source Sidekiq has no native dedupe |
| sqs | message body is the JSON string | FIFO queues: `MessageDeduplicationId=<key>` (dedupe window is documented in the SQS FIFO guide) |
| rabbitmq | body JSON, `content_type: application/json` | `message_id` property set to the key |

2. Do not rename existing job classes or queue names in this flow. Renames during a deploy orphan the jobs already enqueued.

### Output
`payload_schema` with library mapping, `payload_violations`.

### Quality Gate
- Each schema entry has a library mapping row for `queue_choice`.
- No job's `idempotency_key` source uses random or time-of-enqueue values (search the schema text for `uuid4`, `Date.now`, `SecureRandom`, `now()`: zero hits).

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `celery`; enqueue site `orders/views.py:57: charge_order.delay(order)` where `order` is a Django model.

- Phase 1: violation R1 at `orders/views.py:57` (model instance). The project uses `task_serializer = "pickle"` at `proj/celery.py:12`, so R2 is not enforced by the library.
```
>>> len(json.dumps({"order_id": 8812}).encode())
16
```
- Phase 2: schema for `charge_order` with `args.order_id` integer, `idempotency_key` = `charge_order:order:8812`.
- Phase 3: mapping row says set `task_serializer = "json"` and `accept_content = ["json"]`; new call `charge_order.delay(envelope)`.

---

## Exit Criteria

DONE when every job type has a validated envelope schema with a deterministic `idempotency_key` source and a library mapping, and every rule break at an enqueue site is listed in `payload_violations`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Arguments built dynamically and cannot be read statically | **Adjust**: add a temporary log line in a local branch that prints the serialized size, run the relevant test, record the number, then remove the line. |
| Phase 2 | No business identifier exists to build a key | **Return**: report the job as needing a source event id; the producer must supply one. |
| Phase 2 | Schema validation tool not installed | **Adjust**: install `check-jsonschema` in a virtual environment or use `npx ajv-cli`; do not skip validation. |
| Phase 3 | Switching the serializer would break jobs already queued | **Adjust**: deploy consumers that accept both formats first, drain the queue, then switch producers. Record the order of steps. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
