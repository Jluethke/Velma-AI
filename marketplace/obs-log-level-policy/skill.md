# Log Level And Field Policy

**One-line description:** Writes a log level policy with a decision table for ERROR, WARN, INFO and DEBUG, a required JSON field set that includes correlation IDs, a redaction list, and the OpenTelemetry severity number mapping, then audits the codebase against it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signal_plan` (object, required): Output of `obs-signal-inventory`, used for the stack and the component list.

---

## Outputs

- `log_level_policy` (object): `levels[]` (name, otel_severity_number range, rule, examples), `required_fields[]`, `redact_keys[]`, `level_env_var`, `default_level`, `audit_findings[]` (file:line, current level, policy level, reason).

---

## Phase 1: Write The Level Decision Table

### Entry Criteria
- `signal_plan` parses and has `stack` and `service_name`.

### Actions
1. Copy this decision table into the policy unchanged. Each log call site gets the FIRST row whose question is answered yes.

| Order | Question about the event | Level | OTel SeverityNumber range |
|---|---|---|---|
| 1 | Did the operation fail and the caller got an error (5xx, failed job, dropped message)? | ERROR | 17 to 20 |
| 2 | Did something go wrong but the operation still succeeded (retry succeeded, fallback used, deprecated config read)? | WARN | 13 to 16 |
| 3 | Is it a lifecycle event (start, ready, shutdown, config loaded with secrets removed) or the single per-request access line? | INFO | 9 to 12 |
| 4 | Is it detail needed only while diagnosing (payload sizes, branch taken, cache hit)? | DEBUG | 5 to 8 |
| 5 | None of the above | Do not log | n/a |

The SeverityNumber ranges come from the OpenTelemetry Logs Data Model.
2. Add these rules verbatim:
   - Log an error once, at the boundary that handles it. Do not log and rethrow; that produces duplicate ERROR lines for one failure.
   - A 4xx caused by client input is INFO in the access line, not ERROR.
   - Never log at ERROR inside a loop without the loop's aggregate count; log once with `count`.
   - Production default level is INFO. The level is read from the environment variable `LOG_LEVEL` at startup.
3. Set `level_env_var` to `LOG_LEVEL` and `default_level` to `INFO` unless `signal_plan.open_questions` already records a different organizational standard.

### Output
Level table and rules.

### Quality Gate
- The table has exactly five rows in the order shown.
- `default_level` and `level_env_var` are set.

---

## Phase 2: Define Required Fields And Redaction

### Entry Criteria
- Level table written.

### Actions
1. Set `required_fields` to this list. Field names match what the OpenTelemetry Java agent MDC injection and the OpenTelemetry pino instrumentation emit, so logs from all stacks join on the same keys.

| Field | Format | Source |
|---|---|---|
| `timestamp` | RFC 3339, UTC | logger |
| `level` | lowercase string | logger |
| `message` or `event` | string | call site |
| `service` | equals `service_name` | static |
| `request_id` | string | incoming `X-Request-ID` header, else generated UUID4 |
| `trace_id` | 32 lowercase hex | active OpenTelemetry span context |
| `span_id` | 16 lowercase hex | active OpenTelemetry span context |

2. Set `redact_keys` to at least: `authorization`, `cookie`, `set-cookie`, `password`, `passwd`, `secret`, `token`, `api_key`, `access_token`, `refresh_token`, `ssn`, `card_number`. The basis is the OWASP Logging Cheat Sheet "data to exclude" list. Add any key named in `signal_plan.open_questions` as sensitive.
3. Record that `trace_id` and `span_id` are absent when no span is active; the field is omitted, never set to zeros.

### Output
Field list and redaction list.

### Quality Gate
- `required_fields` contains all seven names.
- `redact_keys` contains at least the twelve names listed.

---

## Phase 3: Audit Existing Call Sites

### Entry Criteria
- Policy fields written.

### Actions
1. Set `SERVICE_REPO` to `signal_plan.service_repo`. Count existing log calls per level. Run only the command for the stack.

   - python: `rg -n "\b(log|logger|LOG)\.(debug|info|warning|warn|error|exception|critical)\(" -g '*.py' "$SERVICE_REPO"`
   - node: `rg -n "\b(log|logger|console)\.(debug|info|warn|error|fatal|trace)\(" -g '*.{js,ts}' -g '!node_modules' "$SERVICE_REPO"`
   - go: `rg -n "\b(slog|log|logger)\.(Debug|Info|Warn|Error)(Context)?\(|log\.(Print|Fatal|Panic)" -g '*.go' "$SERVICE_REPO"`
   - java: `rg -n "\b(log|logger|LOG)\.(trace|debug|info|warn|error)\(" -g '*.{java,kt}' "$SERVICE_REPO"`

2. Find the log-and-rethrow pattern. Python: `rg -n -A3 "except .*:" -g '*.py' | rg -B1 "logger\.(error|exception)" | rg "raise"`. For other stacks, read every ERROR site from step 1 and check whether the next statement rethrows.
3. Find secrets in log calls: `rg -n -i "(log|logger)\.\w+\(.*(password|token|secret|authorization)" "$SERVICE_REPO"`.
4. For each mismatch, add an `audit_findings` row: file:line, current level, policy level, reason. Do not edit the call sites in this flow; the stack logging flows apply changes one file at a time.

### Output
`log_level_policy` with `audit_findings`.

### Quality Gate
- Each `audit_findings` row cites a file:line printed by one of the commands.
- The secret search output is pasted; every hit is either an audit finding or noted as a false positive with the reason.

---

## Worked Example

Illustrative only.

Input: `signal_plan` for `checkout-api`, stack `python`.

Phase 3 output:
```
$ rg -n "\blogger\.(error|exception)\(" -g '*.py' /src/checkout-api
app/routes/orders.py:41:        logger.error("payment failed", exc_info=True)
app/clients/pay.py:22:        logger.error("retrying payment call")
$ rg -n -i "logger\.\w+\(.*token" /src/checkout-api
app/auth.py:17:    logger.debug(f"token={token}")
```

Findings:
```json
[{"ref":"app/clients/pay.py:22","current":"ERROR","policy":"WARN","reason":"retry in progress, operation not yet failed (row 2)"},
 {"ref":"app/auth.py:17","current":"DEBUG","policy":"remove value","reason":"token is in redact_keys"}]
```

---

## Exit Criteria

DONE when `log_level_policy` has the five-row level table, seven required fields, the redaction list, and an audit list where every row cites a real file:line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Organization already has a written level policy | **Adjust**: map its levels onto the table rows and record the mapping; do not keep two policies. |
| Phase 2 | The service must log a field on the redact list for audit reasons | **Return**: record as an open question for the data owner; keep it redacted until answered. |
| Phase 3 | Too many hits to review (thousands of call sites) | **Adjust**: audit only ERROR and WARN sites and the secret search; record the remainder as an open item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
