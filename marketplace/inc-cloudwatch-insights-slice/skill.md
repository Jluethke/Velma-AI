# Incident CloudWatch Logs Insights Slice

**One-line description:** Runs CloudWatch Logs Insights queries from the AWS CLI to bin errors per minute across the affected log groups, find error patterns that started at the onset, and pull request and trace IDs, while keeping scanned bytes bounded.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Affected services and declared_at.
- `metric_findings` (object, required): From `inc-promql-red-triage`; supplies the onset time.
- `log_group_names` (string[], required): CloudWatch log group names for the affected services, for example `/aws/lambda/checkout` or `/ecs/checkout`.

---

## Outputs

- `cloudwatch_log_findings` (object): {queries_used, errors_per_minute, onset_minute, new_patterns, sample_messages, request_ids, trace_ids}.

---

## Phase 1: Confirm Groups and Format

### Entry Criteria
- `aws sts get-caller-identity` succeeds in the right account and region.

### Actions
1. Confirm each group exists: `aws logs describe-log-groups --log-group-name-prefix <name> --query 'logGroups[].{n:logGroupName,retention:retentionInDays,bytes:storedBytes}'`.
2. Logs Insights charges by data scanned. Keep each query to the incident window and the named groups only. Do NOT query every log group in the account.
3. Read a sample: run a start-query with `fields @timestamp, @message | sort @timestamp desc | limit 5` (Phase 2 shows the commands) and note whether messages are JSON. Insights discovers JSON fields automatically, so `level` or `errorType` can be used directly.

### Output
Confirmed groups and format.

### Quality Gate
- Every group in `log_group_names` was returned by describe-log-groups.
- The sample shows at least one message.

---

## Phase 2: Bin Errors per Minute

### Entry Criteria
- Groups are confirmed.

### Actions
1. Compute epoch seconds: `START=$(date -u -d "<onset minus 1 hour, ISO>" +%s)` and `END=$(date -u +%s)` (on macOS use `date -j -u -f ...`; check `man date`).
2. Start the query:
   ```
   QID=$(aws logs start-query --log-group-names <g1> <g2> --start-time $START --end-time $END \
     --query-string 'fields @timestamp, @message | filter @message like /(?i)(error|exception|timeout)/ | stats count(*) as errors by bin(1m) | sort @timestamp asc' \
     --query queryId --output text)
   ```
   For JSON logs replace the filter with the level field, for example `filter level = "error"`.
3. Poll for results: `aws logs get-query-results --query-id $QID` until `status` is `Complete`. Status values include `Scheduled`, `Running`, `Complete`, `Failed`, `Cancelled`, `Timeout`.
4. Read `statistics.bytesScanned` in the response and record it.
5. Find onset_minute from the binned counts: first bin after which counts stay above the pre-onset bins.

### Output
errors_per_minute and onset_minute.

### Quality Gate
- `status` is `Complete` (a `Running` result can be partial).
- bytesScanned is recorded.

---

## Phase 3: Find New Patterns and IDs

### Entry Criteria
- onset_minute is known.

### Actions
1. Run the pattern query separately for before and after the onset:
   ```
   fields @message | filter @message like /(?i)error/ | pattern @message
   ```
   The `pattern` command clusters messages into templates with counts. If your account or region rejects it, use `parse @message /(?<errtype>[A-Za-z]+(Error|Exception))/ | stats count(*) by errtype`.
2. A template present after the onset and absent (or much rarer) before is a new pattern. List each with both counts.
3. Pull samples and IDs for each new pattern:
   - Lambda: `fields @timestamp, @requestId, @message | filter @message like /<pattern text>/ | limit 20`
   - JSON app logs: `fields @timestamp, trace_id, request_id, @message | filter ... | limit 20`
   - X-Ray trace IDs appear as `Root=1-...` in some messages; use `parse @message /Root=(?<xray>1-[0-9a-f]{8}-[0-9a-f]{24})/`.
4. Do NOT share raw messages with personal data in the channel.

### Output
`cloudwatch_log_findings`.

### Quality Gate
- new_patterns lists before and after counts for each pattern.
- request_ids or trace_ids is non-empty, or "no IDs in logs" is recorded.

---

## Worked Example

Illustrative only. Groups `/ecs/checkout`, `/ecs/pricing`. Onset 13:59:30Z.

- Phase 1: Both groups exist, retention 30 days. JSON messages with `level` and `trace_id`.
- Phase 2: Query with `filter level = "error" | stats count(*) as errors by bin(1m)` returns bins 13:57 = 2, 13:58 = 1, 13:59 = 205, 14:00 = 431. Status Complete; bytesScanned 1.9 GB. onset_minute 13:59Z.
- Phase 3: `pattern @message` after onset: template "upstream pricing-v2 timeout after <*> ms" count 1,960; before onset: absent. 20 trace IDs pulled with `fields trace_id`.

---

## Exit Criteria

DONE when errors per minute, onset, new patterns with before and after counts, samples and IDs are recorded, and bytes scanned are noted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | AccessDenied on logs:StartQuery | **Stop**: request the permission; do not use a broader role you were not given. |
| Phase 2 | Query status Timeout | **Adjust**: split the window in halves and rerun each. |
| Phase 3 | `pattern` not recognized | **Adjust**: use the `parse` plus `stats` form shown in Action 1. |
| Phase 3 | Too many distinct templates | **Adjust**: add a tighter filter on the service or endpoint field. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
