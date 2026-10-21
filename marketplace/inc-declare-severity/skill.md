# Incident Declare and Classify Severity

**One-line description:** Turns a raw alert or customer report into a declared incident with a severity level chosen from a written severity matrix by explicit if/then rules, and opens the incident record that every later step writes to.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `alert_summary` (string, required): The triggering signal, pasted verbatim: alert name, alert labels, firing time, and the alert's runbook link if it has one, or the customer ticket text.
- `impact_signals` (object, required): What is known right now about impact: affected service names, affected customer-facing functions, regions, whether data loss or data exposure is suspected, and any SLO burn alert currently firing.
- `severity_matrix` (object, optional): The organization's written severity definitions (for example SEV1 to SEV4 or P1 to P5) with the criterion for each level. When absent, use the qualitative default table in Phase 2 and record that the organization has no matrix as an open question.

---

## Outputs

- `severity` (string): The chosen level label exactly as written in the matrix (for example "SEV2"), plus the one matrix row that justified it.
- `incident_record` (object): Incident ID, title, declared-at timestamp in UTC ISO 8601, severity, affected services, customer impact statement, status ("investigating"), and the list of open questions.

---

## Phase 1: Confirm It Is an Incident

### Entry Criteria
- `alert_summary` is present.
- `impact_signals` lists at least one affected service or customer function, or says "unknown".

### Actions
1. Record the current time in UTC: run `date -u +%Y-%m-%dT%H:%M:%SZ` and keep the output. Never write a local time zone into the record.
2. Confirm the signal is real before declaring. Run one independent check that does not use the alerting pipeline itself:
   - For an HTTP service: `curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" https://<public-endpoint>/<health-or-key-path>` three times.
   - For a metrics alert: open the alert's PromQL expression in the Prometheus or Grafana query UI and confirm the series is above the alert threshold now.
   - For a customer report: reproduce the reported action once, or find a second independent report.
3. Apply this table:

| Independent check result | Decision |
|---|---|
| Check confirms user-visible failure or degradation | Declare an incident now. Go to Phase 2. |
| Check passes, but the alert is still firing | Declare anyway if `impact_signals` names a customer-facing function; otherwise record "unconfirmed alert" and hand to the owning team's queue. |
| Check passes and the alert has resolved | Do not declare. Record the alert as a candidate false positive with the timestamps. |
| Data exposure or security compromise is suspected | Declare now regardless of the check, and notify the security contact named in `impact_signals` or the matrix. |

4. Do NOT wait to understand the cause before declaring. Declaring is cheap; a late declaration loses timeline and responders.

### Output
A yes or no declaration decision with the independent check output attached.

### Quality Gate
- The UTC timestamp from `date -u` is recorded.
- The output of the independent check command (status codes and timings, or the query result) is pasted, not summarized.

---

## Phase 2: Pick the Severity Level

### Entry Criteria
- Phase 1 decided to declare.

### Actions
1. If `severity_matrix` is present, read each level's criterion from the most severe to the least severe and stop at the FIRST level whose criterion matches a fact in `impact_signals`. Copy the matching row verbatim into `severity`.
2. If `severity_matrix` is absent, use this qualitative default, adapted from the public PagerDuty Incident Response documentation's severity descriptions, and match top to bottom:

| Fact in `impact_signals` | Level |
|---|---|
| Core customer-facing function is unavailable for all or most customers, OR data loss, OR confirmed data exposure | SEV1 |
| Core function is degraded or unavailable for a subset of customers or one region | SEV2 |
| Non-core function is unavailable, or a core function is degraded with a working workaround | SEV3 |
| Internal-only impact, no customer-visible effect | SEV4 |

3. When two levels seem to fit, pick the MORE severe one. A severity is lowered later with evidence; it is never raised late because someone hoped the impact was small.
4. Do NOT invent numeric criteria such as "more than N percent of requests". Use only numbers that are written in `severity_matrix`. If the matrix needs a number nobody has, add it to the open questions.

### Output
`severity` with the matching row.

### Quality Gate
- `severity` names exactly one level that appears in `severity_matrix` or in the default table.
- The justification quotes one fact from `impact_signals`.

---

## Phase 3: Open the Incident Record

### Entry Criteria
- `severity` is set.

### Actions
1. Create the incident ID. Use the organization's tool if it has one (for example the incident tool's create command or web form). Otherwise use `INC-<YYYYMMDD>-<HHMM>` from the UTC timestamp.
2. Write a title of the form "<symptom> in <service or function>", for example "Checkout returns HTTP 500 in eu-west-1". Do not put a guessed cause in the title.
3. Write a one-sentence customer impact statement that says WHO is affected and WHAT they cannot do.
4. Fill `incident_record` with: id, title, declared_at (UTC), severity, affected_services, customer_impact, status = "investigating", open_questions (list).
5. Post the record in the incident channel or tool so it is the single source of truth.

### Output
`incident_record`.

### Quality Gate
- `incident_record` has all eight fields, and `declared_at` ends in `Z`.
- The title contains no cause words such as "because" or "due to".

---

## Worked Example

Illustrative only. Input `alert_summary`: "CheckoutHighErrorRate firing since 14:02 UTC, labels {service=checkout, region=eu-west-1}". `impact_signals`: {services: ["checkout"], functions: ["place order"], region: "eu-west-1", data_loss: "unknown"}. No `severity_matrix`.

- Phase 1: `date -u +%Y-%m-%dT%H:%M:%SZ` prints `2026-10-20T14:06:11Z`. Three runs of `curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" https://shop.example.com/api/checkout/health` print `500 0.21`, `500 0.19`, `200 0.33`. User-visible failure confirmed: declare.
- Phase 2: No matrix. "Core function degraded for one region" matches the SEV2 row. `severity` = "SEV2: core function degraded for a subset of customers or one region". Open question added: "Organization has no written severity matrix."
- Phase 3: `incident_record` = {id: "INC-20261020-1406", title: "Checkout returns HTTP 500 in eu-west-1", declared_at: "2026-10-20T14:06:11Z", severity: "SEV2", affected_services: ["checkout"], customer_impact: "Some customers in eu-west-1 cannot place orders.", status: "investigating", open_questions: [...]}.

---

## Exit Criteria

DONE when the incident is declared or explicitly not declared with evidence, `severity` names one matrix row, and `incident_record` is posted where responders will see it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The independent check cannot reach the service at all | **Adjust**: treat "unreachable" as confirmed failure and declare. |
| Phase 1 | No independent check exists for this signal | **Adjust**: declare on the alert alone and add "no independent check" to open questions. |
| Phase 2 | `severity_matrix` criteria are ambiguous for this case | **Adjust**: choose the more severe level and record the ambiguity as an open question for the postmortem. |
| Phase 3 | Incident tool is down | **Adjust**: open the record in a plain shared document and post its link; copy it into the tool later. |
| Any | Pressure to skip declaring "until we know more" | **Stop**: declare now; Phase 1 says cause is not required. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
