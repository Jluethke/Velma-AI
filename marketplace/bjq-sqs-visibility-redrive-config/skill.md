# SQS Visibility and Redrive Config

**One-line description:** Configures an Amazon SQS job queue and its consumer: `VisibilityTimeout` sized from measured runtimes with a `ChangeMessageVisibility` heartbeat for long jobs, long polling with `WaitTimeSeconds`, a dead-letter queue through `RedrivePolicy` and `maxReceiveCount`, DLQ retention longer than source retention, FIFO deduplication when required, delete-after-success consumers in Python, Node or Ruby, and `ReportBatchItemFailures` for Lambda.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with the consumer code and infrastructure code (Terraform, CloudFormation, CDK).
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for `queue_choice` = `sqs`.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.
- `stack` (string, required): `python` (boto3), `node` (`@aws-sdk/client-sqs`), or `ruby` (`aws-sdk-sqs`).

---

## Outputs

- `sqs_config` (object): Queue attributes for source and DLQ with formulas, the infrastructure diff, consumer code changes, and verification output from the AWS CLI.

---

## Phase 1: Read Current Attributes

### Entry Criteria
- AWS CLI v2 is configured for the target account (`aws sts get-caller-identity` succeeds).

### Actions
1. Read every attribute of the source queue: `aws sqs get-queue-attributes --queue-url "$Q" --attribute-names All`. Record `VisibilityTimeout`, `MessageRetentionPeriod`, `ReceiveMessageWaitTimeSeconds`, `DelaySeconds`, `RedrivePolicy`, `FifoQueue`, `ContentBasedDeduplication`.
2. If `RedrivePolicy` exists, read the DLQ the same way and record its `MessageRetentionPeriod`.
3. Find where the queue is defined in code: `rg -n "aws_sqs_queue|AWS::SQS::Queue|new sqs.Queue|new Queue\(" <repo_path>`. All changes go there, not through the console, so they are not reverted on the next apply.
4. Read the SQS quotas page and the developer guide for current maximums of `VisibilityTimeout`, `MessageRetentionPeriod`, `DelaySeconds` and message size; record them with the page URL.

### Output
Current attributes, infrastructure file, cited quotas.

### Quality Gate
- `get-queue-attributes` output is pasted.
- The infrastructure file and resource name are recorded with file:line.

---

## Phase 2: Derive Attributes

### Entry Criteria
- Current attributes recorded.

### Actions
1. `VisibilityTimeout` (seconds): greater than the measured maximum M in `job_duration_profile` plus the consumer's delete time, so a message is not redelivered while still being processed. If M is close to or above the documented maximum, or the runtime varies widely, use a heartbeat instead: start with a shorter timeout and call `ChangeMessageVisibility` on the receipt handle at an interval shorter than the timeout until the job ends. The heartbeat interval and margin are user inputs.
2. Lambda consumers: AWS's Lambda documentation for SQS recommends a source queue visibility timeout of at least six times the function timeout. Use that rule and cite it.
3. `ReceiveMessageWaitTimeSeconds`: set to the documented maximum for long polling (or pass `WaitTimeSeconds` on every `ReceiveMessage`). Short polling returns empty responses and costs a request each.
4. `RedrivePolicy`: `{"deadLetterTargetArn": "<dlq arn>", "maxReceiveCount": "<max_attempts from retry_policy>"}`. Each receive counts, including receives that only changed visibility for backoff.
5. DLQ `MessageRetentionPeriod`: longer than the source's. For standard queues, the message keeps its original enqueue timestamp when moved, so a DLQ with the same retention expires messages early (SQS DLQ docs). FIFO source needs a FIFO DLQ.
6. FIFO only when `bjq-queue-selection-matrix` required per-key ordering or deduplication: `MessageGroupId` = the ordering key (one group serializes its messages); `MessageDeduplicationId` = `idempotency_key`, or `ContentBasedDeduplication: true`. Deduplication only covers the documented deduplication interval; the handler must still be idempotent.
7. Delays longer than the `DelaySeconds` maximum must be scheduled outside SQS (EventBridge Scheduler targeting the queue).

### Output
Attribute values with formulas and citations.

### Quality Gate
- `VisibilityTimeout > M` (or heartbeat interval < timeout) is shown with numbers.
- DLQ retention is shown greater than source retention.

---

## Phase 3: Fix the Consumer Loop

### Entry Criteria
- Attributes derived.

### Actions
1. The consumer deletes a message only after the job succeeded. Never delete right after receive.

| `stack` | Receive | Delete after success | Extend visibility |
|---|---|---|---|
| python | `sqs.receive_message(QueueUrl=q, MaxNumberOfMessages=10, WaitTimeSeconds=20, AttributeNames=['ApproximateReceiveCount'])` (use `MessageSystemAttributeNames` on newer boto3; check docs) | `sqs.delete_message(QueueUrl=q, ReceiptHandle=m['ReceiptHandle'])` | `sqs.change_message_visibility(QueueUrl=q, ReceiptHandle=h, VisibilityTimeout=t)` |
| node | `client.send(new ReceiveMessageCommand({ QueueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 20, MessageSystemAttributeNames: ['ApproximateReceiveCount'] }))` | `new DeleteMessageCommand({ QueueUrl, ReceiptHandle })` | `new ChangeMessageVisibilityCommand({ QueueUrl, ReceiptHandle, VisibilityTimeout })` |
| ruby | `sqs.receive_message(queue_url: q, max_number_of_messages: 10, wait_time_seconds: 20, message_system_attribute_names: ["ApproximateReceiveCount"])` | `sqs.delete_message(queue_url: q, receipt_handle: m.receipt_handle)` | `sqs.change_message_visibility(queue_url: q, receipt_handle: h, visibility_timeout: t)` |

   The values 10 and 20 are the documented maximums for batch size and long-poll wait.
2. On a retryable failure, compute the backoff delay from `retry_policy` using `ApproximateReceiveCount`, call change visibility with it, and do not delete. On a permanent failure, send the body to the DLQ with `SendMessage` and then delete the original.
3. Lambda consumers: enable `FunctionResponseTypes: ["ReportBatchItemFailures"]` on the event source mapping and return `{"batchItemFailures": [{"itemIdentifier": "<messageId>"}]}` for only the failed records; without it, one failure makes the whole batch visible again.
4. Change one file at a time and run the consumer tests after each change (use LocalStack or ElasticMQ for an SQS endpoint in tests).

### Output
Consumer changes.

### Quality Gate
- `rg -n "delete_message|DeleteMessageCommand" <repo_path>` shows each delete after the handler call, never before it.
- Lambda mappings show `ReportBatchItemFailures` in `aws lambda get-event-source-mapping --uuid <id>`.

---

## Phase 4: Apply and Verify

### Entry Criteria
- Infrastructure and consumer changes ready.

### Actions
1. Apply through the infrastructure tool with a plan first (`terraform plan`, `cdk diff`, `aws cloudformation deploy --no-execute-changeset`). Read the plan: only the queue attributes listed in Phase 2 change. A plan that replaces (destroys and recreates) a queue deletes its messages; stop if you see that.
2. Verify: `aws sqs get-queue-attributes --queue-url "$Q" --attribute-names VisibilityTimeout RedrivePolicy ReceiveMessageWaitTimeSeconds` and the DLQ retention.
3. Redrive check in a non-production queue: send a message that always fails, wait for `maxReceiveCount` receives, then `aws sqs get-queue-attributes --queue-url "$DLQ" --attribute-names ApproximateNumberOfMessages` shows it.

### Output
`sqs_config` with verification output.

### Quality Gate
- The plan shows in-place updates only.
- The redrive check shows the failing message in the DLQ.

---

## Worked Example

Illustrative only.

Input: `stack` = `python`, ECS consumer, `export_invoice` max 95 s, `retry_policy` max_attempts 6; current `VisibilityTimeout` 30, no DLQ.

- Phase 1: attributes show `VisibilityTimeout` 30 and no `RedrivePolicy`. Resource `aws_sqs_queue.invoices` at `infra/sqs.tf:1`.
- Phase 2: 30 < 95, so redelivery happens during normal runs. Chosen: heartbeat every 60 s extending to 120 s (requester values). `RedrivePolicy` maxReceiveCount 6. DLQ retention 1209600 (the documented maximum) > source 345600.
- Phase 3: delete moved after `export_invoice(...)` returns in `worker/consume.py:44`.
- Phase 4:
```
$ terraform plan
  ~ resource "aws_sqs_queue" "invoices" { ~ redrive_policy = ... }
  + resource "aws_sqs_queue" "invoices_dlq" {...}
Plan: 1 to add, 1 to change, 0 to destroy.
```

---

## Exit Criteria

DONE when the source queue has a derived visibility timeout or heartbeat, long polling, a redrive policy to a DLQ with longer retention, consumers delete only after success, Lambda mappings report item failures, and the redrive check succeeds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Queue created by hand, not in code | **Adjust**: import it into the infrastructure tool (`terraform import`) before changing it. |
| Phase 2 | Job runtime exceeds the visibility maximum even with heartbeats planned | **Adjust**: heartbeats can extend up to the documented maximum total; split the job or use a workflow service. |
| Phase 3 | Consumer is a third-party library (Celery SQS, Shoryuken) | **Return**: use that library's settings flow instead; this flow covers direct SDK consumers. |
| Phase 4 | Plan shows queue replacement | **Stop**: find the attribute that forces replacement (for example switching to FIFO requires a new queue) and plan a migration. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
