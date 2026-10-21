# Automated Flag Rollback on Guardrail Alerts

**One-line description:** Connects firing guardrail alerts to an automatic flag-off action (Alertmanager webhook to a small receiver that calls the Unleash or LaunchDarkly API, a LaunchDarkly flag trigger URL, or a flagd GitOps revert), with idempotent off-only behavior, an audit trail, and a tested end-to-end fire.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rollout_plan` (object[], required): Output of `ffr-rollout-stage-plan`; holds the rollback command.
- `guardrail_metrics` (object[], required): Output of `ffr-guardrail-metrics`; alerts carry `flag_key` and `severity` labels.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `alerting_stack` (string, required): `alertmanager`, `grafana`, `datadog`, or `other`, plus the URL of the alert routing config.

---

## Outputs

- `rollback_automation` (object): The route and receiver config, the action mechanism per provider, the credential used and its scope, the audit location, and the transcript of one end-to-end test fire with measured time from alert to flag off.

---

## Phase 1: Choose the Rollback Mechanism

### Entry Criteria
- At least one guardrail alert with labels `flag_key` and `severity` exists.

### Actions
1. Pick the mechanism from this table:

| Provider | Mechanism | Credential |
|---|---|---|
| LaunchDarkly, plan includes flag triggers | Flag trigger (a unique URL that turns the flag off when called with POST); create it on the flag's Triggers tab with action "turn flag off" | the trigger URL itself is the secret |
| LaunchDarkly, guarded rollouts available | Guarded rollout with automatic rollback on metric regression, configured on the flag's rollout; this replaces the webhook path for that flag | LaunchDarkly-side config |
| LaunchDarkly, neither | receiver calls REST API semantic patch `turnFlagOff` | API token with writer role on that project only |
| Unleash | receiver calls `POST /api/admin/projects/<project>/features/<flag>/environments/<env>/off` | service account token with rights on that project only |
| flagd | receiver opens a revert pull request or commits the safe `defaultVariant`; for the OpenFeature Operator, patches the `FeatureFlag` resource | Git or Kubernetes service account limited to that file or resource |

2. Rollback automation only turns flags off (to the safe default). It never turns a flag on and never raises a percentage. Write this rule into the receiver's code and into the route config comment.
3. If several flags are in rollout at once, the alert's `flag_key` label decides which flag goes off. Alerts without `flag_key` never trigger automation; they page a human.

### Output
Mechanism and credential scope.

### Quality Gate
- The chosen row is recorded, and the credential is scoped to one project or resource (show the role or scope setting).
- The off-only rule is written in the config.

---

## Phase 2: Wire Alert to Action

### Entry Criteria
- Mechanism chosen.

### Actions
1. Alertmanager route (add under `route.routes` in `alertmanager.yml`):
```yaml
- matchers:
  - flag_key=~".+"
  - severity="page"
  receiver: flag-rollback
  continue: true
receivers:
- name: flag-rollback
  webhook_configs:
  - url: http://flag-rollback.ops.svc:8080/alert
    send_resolved: false
```
`continue: true` lets the normal paging route also fire, so a human is told. `send_resolved: false` stops a resolved alert from looking like a new request.
2. Validate: `amtool check-config alertmanager.yml` must report SUCCESS.
3. The receiver reads the Alertmanager webhook JSON (`alerts[].labels.flag_key`, `alerts[].status`), acts only when `status` is `firing`, and calls the provider. Example calls it must make:
```
# Unleash
curl -s -X POST -H "Authorization: $UNLEASH_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features/$FLAG/environments/production/off"
# LaunchDarkly semantic patch
curl -s -X PATCH "https://app.launchdarkly.com/api/v2/flags/$PROJECT/$FLAG" \
  -H "Authorization: $LD_API_TOKEN" -H "Content-Type: application/json; domain-model=launchdarkly.semanticpatch" \
  -d '{"environmentKey":"production","comment":"auto rollback: alert '"$ALERT"'","instructions":[{"kind":"turnFlagOff"}]}'
# LaunchDarkly flag trigger
curl -s -X POST "$LD_TRIGGER_URL"
```
4. Make it idempotent: turning off a flag that is already off must succeed and not error. Check the status code the provider returns for a no-op and treat it as success.
5. Log every action with time, alert name, flag key, environment, and the provider response. For LaunchDarkly put the alert name in `comment` so it shows in the flag's audit log; Unleash records the token's user in its event log.
6. Allow-list the flags the receiver may touch (from `rollout_plan`). A request for any other key is logged and ignored.

### Output
Route, receiver, and calls.

### Quality Gate
- `amtool check-config` reports SUCCESS (or the Grafana or Datadog equivalent validation passes).
- The receiver code contains no call that turns a flag on (`rg -n "/on\"|turnFlagOn" <receiver dir>` returns nothing).

---

## Phase 3: Fire It End to End

### Entry Criteria
- Receiver deployed in a test environment.

### Actions
1. Turn the flag on in the test environment.
2. Send a synthetic alert with `amtool alert add flag_guardrail_test flag_key=checkout-new-tax-engine severity=page --alertmanager.url=http://alertmanager:9093` (or post the same JSON to the Alertmanager API).
3. Measure: time the alert was created, time the receiver logged the action, time an evaluation of the flag returns the safe default. Record all three.
4. Send the same alert again; confirm the receiver logs a no-op success.
5. Send an alert with a `flag_key` not on the allow list; confirm it is ignored and logged.

### Output
`rollback_automation`.

### Quality Gate
- After the synthetic alert, a flag evaluation returns the safe default (pasted), and the three timestamps are recorded.
- The repeat alert produced a no-op success log line, and the unlisted key produced an ignore log line.

---

## Worked Example

Illustrative only. Unleash, Alertmanager.

```
$ amtool check-config alertmanager.yml
Checking 'alertmanager.yml'  SUCCESS
$ amtool alert add flag_guardrail_test flag_key=checkout-new-tax-engine severity=page --alertmanager.url=http://alertmanager.test:9093
$ kubectl logs deploy/flag-rollback -n ops --tail=3
2026-10-20T15:04:41Z firing flag_guardrail_test flag=checkout-new-tax-engine env=production action=off status=200
2026-10-20T15:05:12Z firing flag_guardrail_test flag=checkout-new-tax-engine env=production action=off status=200 noop=true
2026-10-20T15:05:40Z ignored flag=some-other-flag reason=not_allow_listed
```
Alert created 15:04:30 (Alertmanager group_wait applies), receiver acted 15:04:41, SDK evaluation returned `false` at 15:04:55 (Unleash SDK poll).

---

## Exit Criteria

DONE when firing guardrail alerts with a `flag_key` route to an off-only, allow-listed, idempotent action with a scoped credential and audit trail, and one end-to-end test measured alert-to-default time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Credential cannot be scoped to one project | **Return**: record the risk as an open question; do not use an org-wide admin token silently. |
| Phase 2 | Receiver gets resolved alerts and acts | **Adjust**: act only on `status == "firing"`. |
| Phase 3 | Flag still serves the new variant long after the action | **Adjust**: the delay is SDK polling or caching; measure it in `ffr-kill-switch-drill`. |
| Phase 3 | Provider API returns 401 or 403 | **Stop**: fix the credential scope before relying on automation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
