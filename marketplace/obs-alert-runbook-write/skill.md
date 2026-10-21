# Alert Runbook Authoring

**One-line description:** Writes one runbook per alert at the exact path its `runbook_url` points to, with a fixed section layout (meaning, impact, first five minutes, diagnosis queries, mitigations, escalation, recovery check) where every diagnostic step is a copy-paste command or PromQL query, then checks that every alert's link resolves.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `alert_rules` (object, required): Output of `obs-burn-rate-alert-rules` (names, expressions, labels, `runbook_url`).
- `slo_spec` (object, required): Output of `obs-slo-error-budget-define` (SLI selectors and budget).
- `runbook_base_url` (string, required): Base URL used in `runbook_url`.

---

## Outputs

- `runbooks` (object): One file path per alert, the link check results, and a list of mitigation steps marked as needing owner confirmation.

---

## Phase 1: Map Alerts To Files

### Entry Criteria
- Every alert in `alert_rules` has a `runbook_url` starting with `runbook_base_url`.

### Actions
1. Extract names and URLs from the alert file:
`rg -n "alert:|runbook_url:" <rules_dir>/slo-checkout-api.alerts.yml`
2. Map each URL to a repo path by stripping `runbook_base_url` and prefixing the docs directory (for the worked example, `docs/runbooks/<AlertName>.md`).
3. Check none exists yet: `ls docs/runbooks/`. If a file exists, edit only its missing sections; do not rewrite content written by the team.

### Output
Alert to file map.

### Quality Gate
- Count of alerts equals count of mapped paths.

---

## Phase 2: Write Each Runbook

### Entry Criteria
- Map complete.

### Actions
1. Use this exact layout per file:
```markdown
# <AlertName>

## Meaning
<one sentence: which SLO, which window, what burn rate, from the alert expr>

## Impact
<who is affected; budget math: at this burn rate the 30d budget is gone in 720/14.4 = 50 hours>

## First five minutes
1. Acknowledge the page.
2. Open dashboard: <grafana URL with uid from obs-grafana-dashboard-provision>
3. Check for a deploy in the last hour: `kubectl rollout history deploy/checkout-api -n shop`
4. Check current error ratio: `slo:error_ratio:rate5m{slo="checkout-availability"}`

## Diagnosis
| Question | Query or command |
|---|---|
| Which routes fail? | `topk(5, sum by (http_route) (rate(http_server_request_duration_seconds_count{job="checkout-api",http_response_status_code=~"5.."}[5m])))` |
| Which status codes? | `sum by (http_response_status_code) (rate(http_server_request_duration_seconds_count{job="checkout-api"}[5m]))` |
| Which instances? | `sum by (instance) (rate(http_server_request_duration_seconds_count{job="checkout-api",http_response_status_code=~"5.."}[5m]))` |
| Error logs | log query for `level=error service=checkout-api` since the alert start time |
| A failing trace | trace search `service.name=checkout-api status=error` |

## Mitigation
| Condition | Action |
|---|---|
| Errors started with a deploy | `kubectl rollout undo deploy/checkout-api -n shop` |
| One instance failing | delete that pod: `kubectl delete pod <pod> -n shop` |
| Dependency failing (DB, payment API) | follow that dependency's runbook; link it here |

## Escalation
<team, channel, when>

## Recovery check
The alert resolves when the short window drops below threshold. Confirm `slo:error_ratio:rate5m` stays below 0.0144 for one full short window (5m) and the alert state in `/api/v1/alerts` is gone.
```
2. Diagnosis tables in runbooks must not contain the `|` character inside PromQL in a markdown table cell; if a query needs a regex alternation, put it in a fenced code block under the table instead.
3. Every command and query must be copy-paste runnable with real names from this service (job, namespace, deployment). Run each PromQL once now: `curl -s --data-urlencode "query=<q>" $PROM/api/v1/query | jq .status` must print `"success"`.
4. Mitigations that change production (rollback, pod deletion, scaling) are listed with the command; mark each one "owner confirmed: no" until the service owner approves it. Do not invent mitigations for systems you have not seen.
5. Write one file at a time.

### Output
Runbook files.

### Quality Gate
- Each file has all seven `##` sections: `rg -c "^## (Meaning|Impact|First five minutes|Diagnosis|Mitigation|Escalation|Recovery check)$" <file>` prints 7.
- Each PromQL in the file returned `"success"`.

---

## Phase 3: Publish And Check Links

### Entry Criteria
- All files written and committed to the branch that `runbook_base_url` serves.

### Actions
1. After the branch is merged or the docs are published, check every URL:
`for u in $(rg -o 'runbook_url: "([^"]+)"' -r '$1' <alerts file>); do printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"; done`
2. Private repositories return 404 or a login redirect without credentials; in that case check with the repo CLI (`gh api repos/<org>/<repo>/contents/docs/runbooks/<file>` returns JSON) and record which method was used.
3. Confirm Alertmanager notification templates include `runbook_url` (search the template: `rg -n "runbook_url" alertmanager*.yml templates/`). If absent, record it; the link does not reach the responder otherwise.

### Output
`runbooks`.

### Quality Gate
- Every URL returns 200 (or the repo API check succeeds), with the list pasted.
- The Alertmanager template check result is recorded.

---

## Worked Example

Illustrative only.

```
$ rg -n "alert:|runbook_url:" deploy/prometheus/rules/slo-checkout-api.alerts.yml | head -2
4:      - alert: CheckoutAvailabilityBurnRateFast
13:          runbook_url: "https://git.example.com/org/checkout/blob/main/docs/runbooks/CheckoutAvailabilityBurnRateFast.md"
$ rg -c "^## (Meaning|Impact|First five minutes|Diagnosis|Mitigation|Escalation|Recovery check)$" docs/runbooks/CheckoutAvailabilityBurnRateFast.md
7
$ for u in ...; do ...; done
200 https://git.example.com/org/checkout/blob/main/docs/runbooks/CheckoutAvailabilityBurnRateFast.md
200 https://git.example.com/org/checkout/blob/main/docs/runbooks/CheckoutAvailabilityBurnRateSlow.md
```
Impact line for row A: 720 h / 14.4 = 50 h until the 30-day budget is exhausted.

---

## Exit Criteria

DONE when every alert has a runbook at its URL with the seven sections, every query in it runs, production-changing mitigations are flagged for owner confirmation, and every link resolves.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An alert lacks `runbook_url` | **Return**: send back to `obs-burn-rate-alert-rules`. |
| Phase 2 | A query in the runbook fails | **Retry**: fix the selector against the live label names; rerun. |
| Phase 2 | Mitigation unknown for a dependency | **Adjust**: write "escalate to <owner>" and record the gap; do not invent steps. |
| Phase 3 | URL returns 404 after publish | **Adjust**: the path differs from the URL (case, extension); fix the file name, not the alert. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
