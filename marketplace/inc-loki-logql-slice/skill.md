# Incident Loki LogQL Error Slice

**One-line description:** Uses `logcli` and LogQL against Grafana Loki to count errors per minute for the affected services, extract the top error messages that started at the metric onset, and pull trace IDs from those lines for trace correlation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Affected services and declared_at.
- `metric_findings` (object, required): From `inc-promql-red-triage`; supplies the onset time and the first-moving service.
- `loki_selector` (string, required): The stream selector for the affected service, for example `{namespace="shop", app="checkout"}`. Labels must exist in Loki.

---

## Outputs

- `loki_log_findings` (object): {queries_used, errors_per_minute, onset_minute, new_messages (messages present after onset and absent before), sample_lines, trace_ids}.

---

## Phase 1: Confirm Access and Labels

### Entry Criteria
- `logcli` is installed (`logcli --version` prints a version) and `LOKI_ADDR` is set to the Loki URL (plus `LOKI_USERNAME`/`LOKI_PASSWORD` or `LOKI_BEARER_TOKEN` if required, per logcli docs).

### Actions
1. List labels and values to confirm the selector: `logcli labels` then `logcli labels app` (replace `app` with the label in your selector).
2. Check one line comes back: `logcli query '<loki_selector>' --since=5m --limit=5`.
3. Find the log format from that output: JSON (starts with `{`), logfmt (`key=value` pairs) or plain text. This picks the parser in Phase 2: `| json`, `| logfmt`, or `|~ "<regex>"` line filters for plain text.
4. Do NOT run a query without a time range and a `--limit`. Unbounded queries over a busy stream can overload Loki during the incident.

### Output
Confirmed selector and parser.

### Quality Gate
- The test query returned at least one line.
- The parser choice matches the printed line format.

---

## Phase 2: Count and Locate the Error Onset

### Entry Criteria
- Selector and parser are confirmed.

### Actions
1. Set FROM to one hour before the metric onset and TO to now, in RFC 3339 UTC.
2. Count error lines per minute:
   - JSON logs: `logcli query 'sum(count_over_time(<loki_selector> | json | level=~"(?i)error|fatal" [1m]))' --from="$FROM" --to="$TO" --step=1m --output=raw`
   - Plain text: `logcli query 'sum(count_over_time(<loki_selector> |~ "(?i)error|exception|panic" [1m]))' --from="$FROM" --to="$TO" --step=1m`
   The label holding severity may be `level`, `severity` or `lvl`; use the one the Phase 1 sample shows.
3. Find onset_minute: the first minute after which the count stays above the pre-onset counts. Compare it with the metric onset; if the log onset is earlier, record it as a new lead.
4. If `--step` is rejected by your logcli version, check `logcli query --help` for the step flag name and use that.

### Output
errors_per_minute series and onset_minute.

### Quality Gate
- errors_per_minute covers the whole FROM to TO range.
- onset_minute is read from the series values, with the value before and after quoted.

---

## Phase 3: Extract New Messages and Trace IDs

### Entry Criteria
- Onset minute is known.

### Actions
1. Group error messages before and after the onset (replace `msg` with the message field name):
   ```
   logcli query 'topk(20, sum by (msg) (count_over_time(<loki_selector> | json | level=~"(?i)error" [<window>])))' --from="$FROM" --to="<onset>" 
   logcli query 'topk(20, sum by (msg) (count_over_time(<loki_selector> | json | level=~"(?i)error" [<window>])))' --from="<onset>" --to="$TO"
   ```
   Use a window equal to the length of each range. A message in the after list but not in the before list is a new message.
2. For messages containing IDs or numbers that make each line unique, normalize with `| pattern` or `| regexp` before grouping, or group by a stable field such as `error_type`.
3. Pull sample lines for each new message: `logcli query '<loki_selector> | json | msg="<message>"' --from="<onset>" --to="$TO" --limit=20 --output=jsonl > samples.jsonl`.
4. Extract trace IDs from samples: `jq -r '.line | fromjson? | .trace_id // .traceId // empty' samples.jsonl | sort -u | head -20`. Field names vary; read one sample line to find the right one.
5. Do NOT paste lines containing customer personal data or secrets into the incident channel; redact before sharing.

### Output
`loki_log_findings`.

### Quality Gate
- new_messages lists each message with its after-onset count and a before-onset count (zero allowed).
- trace_ids is non-empty, or the record says the logs carry no trace ID field.

---

## Worked Example

Illustrative only. Selector `{namespace="shop", app="checkout"}`, JSON logs with `level`, `msg`, `trace_id`. Metric onset 13:59:30Z.

- Phase 1: `logcli labels app` lists `checkout`. Sample line `{"level":"error","msg":"payment client timeout","trace_id":"4bf92f3577b34da6a3ce929d0e0e4736",...}`. Parser `| json`.
- Phase 2: Counts per minute: 2, 1, 3 before 13:59; 180, 410, 455 from 13:59 onward. onset_minute 13:59Z, matching the metric onset.
- Phase 3: Before onset top message "cart not found" (3). After onset "context deadline exceeded calling pricing-v2" (1,210), absent before: new message. 20 trace IDs extracted from `samples.jsonl`.

---

## Exit Criteria

DONE when error counts per minute, the log onset, the new messages after onset, sample lines and trace IDs are recorded in `loki_log_findings`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | 401 from Loki | **Stop**: get credentials from the platform owner; do not query through another tenant. |
| Phase 2 | "max query length" or "too many outstanding requests" | **Adjust**: shorten FROM to TO and run several smaller ranges. |
| Phase 3 | Grouping by msg returns thousands of unique values | **Adjust**: group by a stable field or normalize with `| pattern`. |
| Phase 3 | Lines carry no trace ID | **Return**: record it; `inc-trace-tempo-traceql` will search by service and time instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
