# Feature Flag Cutover with Ramp and Kill Switch

**One-line description:** Moves traffic from the old path to the extracted module or service behind a feature flag (OpenFeature API over the team's provider, or the proxy split), ramps through user-approved percentages with sticky targeting, compares error rate and latency of both cohorts at each step against pre-written rollback rules, and flips the data writer only after the read path is fully cut over.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `routing_config` (object, optional): From `mex-strangler-proxy-routing`; present for `service`.
- `acl_adapter` (object, required): From `mex-anti-corruption-layer`.
- `parity_report` (object, required): From `mex-shadow-traffic-diff`; `parity_ok` must be true.
- `latency_report` (object, required): From `mex-latency-comparison`; verdict must be `within_slo` or `no_slo_given` with the user's go-ahead.
- `reconciliation_report` (object, optional): From `mex-backfill-and-reconcile`; required when data moved.
- `flag_provider` (string, optional): The team's flag system (for example Unleash, LaunchDarkly, flagd, ConfigCat, an in-house table). Absent means ask the user.
- `ramp_plan` (string, optional): The percentage steps and minimum dwell time per step, from the user. Absent means ask; do not invent steps.

---

## Outputs

- `cutover_flag` (object): Flag key, provider, default value, targeting rule and sticky attribute, the evaluation call sites, and the kill switch procedure.
- `rollout_log` (object[]): One row per ramp step: timestamp, percentage, cohort error rates and latency percentiles for old and new, the rollback rule results, and the decision (advance, hold, roll back).

---

## Phase 1: Create the Flag and Rollback Rules

### Entry Criteria
- `parity_report.parity_ok` is true and `latency_report` verdict allows proceeding.
- `reconciliation_report` shows zero mismatches if data moved.

### Actions
1. Create one flag with a descriptive key, for example `billing-read-path-new`, default `false` (old path). Separate flags for read path and write path: `billing-write-path-new` is created now but stays off.
2. Evaluate the flag through the OpenFeature API if the project uses it, so the provider can change without code changes:
   - python `client.get_boolean_value("billing-read-path-new", False, EvaluationContext(targeting_key=customer_id))`
   - node `await client.getBooleanValue('billing-read-path-new', false, { targetingKey: customerId })`
   - go `client.BooleanValue(ctx, "billing-read-path-new", false, openfeature.NewEvaluationContext(customerID, nil))`
   - java `client.getBooleanValue("billing-read-path-new", false, new ImmutableContext(customerId))`
   Otherwise use the provider's own SDK call. Check the SDK README for the installed version's exact signatures.
3. Sticky targeting: percentage rollout keyed on a stable ID (customer or account), never random per request, so one customer does not flip between paths. For `service` with a proxy split, the proxy's sticky key must be the same attribute.
4. Evaluate the flag in exactly one place per path (the facade or the proxy), not at every call site.
5. Write rollback rules before ramping, as comparisons between cohorts at the same time: roll back if the new cohort's error rate is higher than the old cohort's beyond the margin the user sets, or if the new cohort's latency percentile exceeds the SLO, or if any data reconciliation mismatch appears. Record the margins as user inputs.
6. Kill switch: setting the flag to `false` for everyone. Test it in staging and time how long until no request uses the new path.

### Output
Flag, evaluation sites, rollback rules, tested kill switch.

### Quality Gate
- `rg -n "billing-read-path-new"` shows one evaluation site per path.
- Kill switch drill time is recorded from staging.

---

## Phase 2: Ramp the Read Path

### Entry Criteria
- `ramp_plan` approved by the user.

### Actions
1. Enable for internal users or a test cohort first. Then follow `ramp_plan` step by step.
2. At each step, after the dwell time, query metrics split by cohort (tag requests with the flag variant: a log field, a metric label `variant`, or the `X-Backend` header in proxy logs). Example PromQL: `sum by (variant) (rate(http_requests_total{route="/api/invoices/{id}",status=~"5.."}[5m])) / sum by (variant) (rate(http_requests_total{route="/api/invoices/{id}"}[5m]))` (metric names depend on your instrumentation).
3. Apply the rollback rules. Advance only if every rule passes. Log the row in `rollout_log`.
4. On any rule failure, flip the kill switch first, investigate second.
5. Do not advance two steps at once, and do not skip the dwell time to finish sooner.

### Output
Read path at 100 percent.

### Quality Gate
- Every `rollout_log` row has both cohorts' numbers and a rule result.
- Final read step is 100 percent with all rules passing.

---

## Phase 3: Flip the Writer

### Entry Criteria
- Read path at 100 percent for the dwell time the user set.
- Sync strategy reverse direction (new to old) is ready if legacy readers still read old tables.

### Actions
1. The writer flip is all-or-nothing per aggregate: a percentage split of writers creates two writers for related rows. Use a flag that is either fully on or fully off, or split by a partition key whose rows never interact (for example per tenant), confirmed with the user.
2. Order: stop old-path writes and start new-path writes in one flag change; confirm the old-side sync now flows new to old; run `mex-backfill-and-reconcile` reconciliation immediately and again after the dwell time.
3. Rollback for writes: flip back, then reconcile writes made on the new side back into the old store before the old path resumes writing, or the old path reads stale data.

### Output
`cutover_flag`, `rollout_log`.

### Quality Gate
- Reconciliation after the writer flip shows zero mismatches outside the sync lag.
- `rollout_log` has a row for the writer flip with reconciliation results.

---

## Worked Example

Illustrative. Unleash through OpenFeature, `ramp_plan` from the user: internal, 1%, 5%, 25%, 50%, 100%, 24 h dwell each; error-rate margin 0.1 percentage points (user choice).

| Step | New 5xx | Old 5xx | New p99 | SLO | Decision |
|---|---|---|---|---|---|
| 1% | 0.02% | 0.03% | 251 ms | 300 ms | advance |
| 5% | 0.41% | 0.03% | 262 ms | 300 ms | roll back |

Kill switch at 5%: flag off, new-path requests reached zero in 40 s (cached flag refresh). Cause: unknown legacy status `X` rejected by the ACL; user chose to map it to `VOID`; fixed, re-ramped from 1%.

---

## Exit Criteria

DONE when reads are at 100 percent with every step logged against pre-written rules, the writer has been flipped with reconciliation passing, and the kill switch is drilled.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `ramp_plan` from the user | **Stop**: ask; do not invent percentages or dwell times. |
| Phase 2 | Cohort metrics not separable | **Stop**: add a `variant` label or log field first; a blended metric hides a failing cohort. |
| Phase 2 | A rollback rule fails | **Return**: flip the kill switch, log the row, fix, restart from the first step. |
| Phase 3 | Writer split by percentage requested | **Adjust**: explain the two-writer risk; use an all-or-nothing flip or a non-interacting partition key. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
