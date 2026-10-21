# Incident Confirm Stabilization

**One-line description:** Decides whether the applied mitigation actually stopped customer impact by rerunning the exact PromQL from triage over a before and after window, applying a fixed rule table, and either declaring "mitigated" or sending the team back to the decision table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mitigation_choice` (object, required): From `inc-stabilize-decision-table`; names the action and its expected effect.
- `rollback_result` (object, optional): From `inc-k8s-rollout-undo`, when a rollback ran.
- `flag_change_result` (object, optional): From `inc-feature-flag-off`, when a flag changed.
- `scale_result` (object, optional): From `inc-k8s-scale-out`, when scaling ran.
- `traffic_shift_result` (object, optional): From `inc-traffic-shift`, when traffic moved.
- `metric_findings` (object, required): From `inc-promql-red-triage`; the queries and pre-incident baselines.
- `prometheus_url` (string, required): Prometheus query API base URL.

---

## Outputs

- `stabilization_status` (object): {state ("mitigated", "partially_mitigated", "not_mitigated"), mitigation_completed_at_utc, sli_before, sli_after, baseline, rule_row, next_step}.

---

## Phase 1: Pick the Comparison Windows

### Entry Criteria
- At least one of `rollback_result`, `flag_change_result`, `scale_result`, `traffic_shift_result` is present.

### Actions
1. Take mitigation_completed_at_utc from the present result (completed_at_utc or changed_at_utc). If more than one is present, use the latest.
2. Define windows of equal length L, where L is at least four scrape intervals (the same rule as the triage range window):
   - BEFORE: the L minutes ending at mitigation start.
   - AFTER: the L minutes starting one L after mitigation completion (this skips the transition while pods restart and caches warm).
3. Take the customer-facing SLI queries (error ratio and latency quantile) from `metric_findings`. Use the same text exactly; a different query cannot be compared.

### Output
Two windows and the query list.

### Quality Gate
- Both windows have equal length and do not overlap.
- Query strings are byte-for-byte the ones in `metric_findings`.

---

## Phase 2: Measure

### Entry Criteria
- Windows are set.

### Actions
1. For each query, compute the average over each window with an instant query evaluated at the window end:
   ```
   curl -sS -G "$PROM/api/v1/query" \
     --data-urlencode 'query=avg_over_time((<sli query>)[<L>:<scrape interval>])' \
     --data-urlencode "time=<window end, RFC 3339>" | jq -r '.data.result[0].value[1]'
   ```
   The `[<L>:<step>]` form is a PromQL subquery; it is valid only around an expression, as shown.
2. Record sli_before, sli_after and the baseline from `metric_findings` for each query.
3. Also check that the mitigation did not move the problem: rerun the error ratio for the healthy slice (traffic shift) or the dependency (scale out).

### Output
Numbers for before, after and baseline.

### Quality Gate
- Every value is a number copied from a `jq` output line, not estimated from a graph.

---

## Phase 3: Apply the Rule and Report

### Entry Criteria
- Numbers are recorded.

### Actions
1. Apply this table using the baseline as the reference. The tolerance band around the baseline comes from the service's SLO alert definition if one exists; otherwise the IC states it and it is recorded as an open question.

| Error ratio after | Latency after | State | Next step |
|---|---|---|---|
| Within tolerance of baseline | Within tolerance of baseline | mitigated | Post "monitoring" status; start diagnosis with `inc-hypothesis-draft` |
| Clearly lower than before but above tolerance | any | partially_mitigated | Keep the mitigation; return to `inc-stabilize-decision-table` for an additional action |
| Not lower than before | any | not_mitigated | Undo the mitigation with its rollback command; return to the decision table with the next row |
| Within tolerance | Worse than before | partially_mitigated | Check saturation on the receiving side; consider scale out |

2. Add a `mitigated` timeline entry only when state is "mitigated", with the time the AFTER window confirmed it.
3. Tell the comms lead the new state so the status page moves to "monitoring".
4. Do NOT declare "resolved" here. Resolved requires a verified fix (`inc-fix-verification`); mitigated means impact stopped.

### Output
`stabilization_status`.

### Quality Gate
- `rule_row` matches exactly one table row.
- When state is "mitigated", a `mitigated` timeline entry exists.

---

## Worked Example

Illustrative only. Rollback finished at 14:23:40Z. Scrape interval 15s, L = 5m.

- Phase 1: BEFORE 14:16:00Z to 14:21:00Z; AFTER 14:28:40Z to 14:33:40Z. Query: the checkout error ratio from `metric_findings`.
- Phase 2: `avg_over_time((<error ratio>)[5m:15s])` at 14:21:00Z returns `0.298`; at 14:33:40Z returns `0.0021`. Baseline 0.002. SLO alert tolerance from the burn-rate rule: treated as within tolerance by the IC.
- Phase 3: Row 1: mitigated. Timeline entry 14:33:40Z mitigated. Comms posts "monitoring". Next step `inc-hypothesis-draft`.

---

## Exit Criteria

DONE when `stabilization_status` has one state chosen by one table row with before, after and baseline numbers, and the next step is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No mitigation result is present | **Stop**: nothing to confirm; return to `inc-stabilize-decision-table`. |
| Phase 2 | Query returns an empty result | **Adjust**: the label set may have changed (new pods, new version label); drop the changed label from the selector and record the edit. |
| Phase 3 | Numbers are noisy and the state is unclear | **Retry**: measure a second AFTER window of the same length and use both. |
| Phase 3 | State is not_mitigated after the third mitigation | **Return**: escalate to the IC to page additional experts. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
