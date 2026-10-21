# Progressive Rollout Stage Plan

**One-line description:** Turns a flag's targeting rules and guardrails into a written stage-by-stage rollout plan (audience, exposure percentage, minimum dwell time derived from the guardrail alert windows, go and no-go checks, and the exact rollback action per stage) that a person or automation can follow without making judgment calls.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `targeting_rules` (object, required): Output of `ffr-targeting-rules`.
- `guardrail_metrics` (object[], required): Output of `ffr-guardrail-metrics`.
- `stage_percentages` (number[], optional): Exposure percentages per stage chosen by the owner, for example a list ending in 100. If absent, the plan uses audience stages only and records the percentages as an open question.

---

## Outputs

- `rollout_plan` (object[]): Ordered stages, each with `stage`, `audience`, `percent`, `min_dwell`, `dwell_source`, `go_checks` (commands with expected output), `no_go_triggers`, `rollback_action` (exact command), and `approver`.

---

## Phase 1: Lay Out the Stages

### Entry Criteria
- `targeting_rules` has a stable bucketing key and stickiness check passed.

### Actions
1. Always start with these audience stages, in this order, before any percentage stage:

| Stage | Audience | Why |
|---|---|---|
| 0 | flag on in a test or staging environment only | proves the new path runs at all |
| 1 | internal users or the allow list from `targeting_rules` in production | real data, people who will report problems |

2. Then add one stage per value in `stage_percentages`, in ascending order. If `stage_percentages` is absent, stop adding stages and record the open question "stage percentages not chosen by owner". Do not fill in your own list.
3. For `permission` flags, there are no percentage stages; stages are named customer or plan groups.
4. For `experiment` flags, the split stage percentage must come from `ffr-ab-sample-size`. Insert one stage "experiment running" with that allocation and a fixed end date; do not ramp the experiment percentage while it runs, because changing allocation mid-test biases the comparison.
5. The final stage is 100 percent (or all target groups) followed by a "hold" stage before removal is allowed.

### Output
Stage skeleton.

### Quality Gate
- Stages 0 and 1 exist.
- Every percentage in the plan appears in `stage_percentages` or `ffr-ab-sample-size` output; no other numbers.

---

## Phase 2: Derive Dwell Time and Checks per Stage

### Entry Criteria
- Stage skeleton exists.

### Actions
1. Minimum dwell for each stage = the longest window of any Rule A guardrail alert in `guardrail_metrics` that can page (for the SRE Workbook page rows this is the 6 hour window when the 6x rule is used, or 1 hour if only the 14.4x rule is used). A stage shorter than its alert's long window cannot be judged by that alert. Record `dwell_source` as the alert name and window.
2. If a Rule B guardrail needs a minimum number of samples (from `ffr-canary-mann-whitney-judge` or `ffr-ab-sample-size`), the dwell is the larger of the alert window and the time to reach that sample count at this stage's traffic. Compute time = needed samples / (treatment requests per second at this percentage), using the request rate measured in `ffr-guardrail-metrics`.
3. Write `go_checks` as commands with expected output, for example:
   - `curl -s "$PROM/api/v1/alerts" | jq '[.data.alerts[] | select(.labels.flag_key=="checkout-new-tax-engine" and .state=="firing")] | length'` returns `0`.
   - The variant share query returns a treatment share within the reported standard error of the stage percentage.
4. Write `no_go_triggers`: any guardrail alert for this flag firing, any Rule B judge verdict of FAIL, or a new error type in logs tagged with the flag variant.
5. Write `approver`: the flag owner for stages 0 and 1; for later stages the owner or the automation in `ffr-auto-rollback-trigger` if it is set up.

### Output
Stages with dwell, checks, and triggers.

### Quality Gate
- Every stage has `min_dwell` with a `dwell_source` naming an alert window or a sample count calculation.
- Every `go_checks` entry is a runnable command with its expected output.

---

## Phase 3: Write Rollback per Stage and Review

### Entry Criteria
- Checks written.

### Actions
1. For every stage, the rollback action is the same: set exposure to 0 (serve the safe default to everyone). Write the exact command for the provider:
   - flagd: set `defaultVariant` to the safe variant and remove the `fractional` branch in `flags.flagd.json`, then commit and deploy, or apply the reverted `FeatureFlag` resource with `kubectl apply -f`.
   - Unleash: `curl -X POST -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/<project>/features/<flag>/environments/production/off"`.
   - LaunchDarkly: semantic patch with `{"environmentKey":"production","instructions":[{"kind":"turnFlagOff"}]}` and header `Content-Type: application/json; domain-model=launchdarkly.semanticpatch`, sent with `PATCH` to `/api/v2/flags/<project>/<flag>`.
2. Do not plan "roll back to the previous percentage". Partial rollback keeps exposing users to a regression while you investigate.
3. Do not plan to roll back by redeploying the old build. The flag exists to make rollback a config change.
4. Run the rollback command once in a test environment and confirm the flag serves the safe default to a sample key.
5. Store the plan next to the code (for example `docs/rollouts/checkout-new-tax-engine.md`) so reviewers see it in the same pull request.

### Output
`rollout_plan`.

### Quality Gate
- The rollback command ran in a test environment, and an evaluation afterward shows the safe default (pasted).
- Every stage lists the same rollback command.

---

## Worked Example

Illustrative only. Release flag, Unleash, `stage_percentages` given by the owner as [5, 25, 50, 100]. Guardrails: Rule A error ratio with 14.4x/1h and 6x/6h pages.

| Stage | Audience | Percent | Min dwell (source) | Rollback |
|---|---|---|---|---|
| 0 | staging | 100 | until stage tests pass | Unleash off in `staging` |
| 1 | `@example.com` users, production | n/a | 6h (6x page long window) | Unleash off in `production` |
| 2 | everyone | 5 | 6h | same |
| 3 | everyone | 25 | 6h | same |
| 4 | everyone | 50 | 6h | same |
| 5 | everyone | 100 | 6h, then hold one release cycle | same |

```
$ curl -s -X POST -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features/checkout-new-tax-engine/environments/staging/off" -o /dev/null -w "%{http_code}\n"
200
```

---

## Exit Criteria

DONE when the plan lists audience stages before percentage stages, uses only owner-supplied or sample-size-derived percentages, gives every stage a dwell time traced to an alert window or sample count, runnable go checks, and one tested rollback command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stage_percentages` missing | **Return**: plan stages 0 and 1 only; open question to the owner. |
| Phase 2 | No Rule A guardrail exists | **Adjust**: derive dwell from Rule B sample counts only and state it. |
| Phase 2 | Traffic too low to reach samples in a reasonable time | **Return**: report the computed time; the owner decides whether to accept it or raise the percentage. |
| Phase 3 | Rollback command fails in test | **Stop**: fix credentials or path before any production stage. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
