# Incident Feature Flag Kill Switch

**One-line description:** Turns a feature flag off in one environment through the LaunchDarkly semantic patch API, the Unleash admin API or a flagd flag file, records the prior state so it can be restored, and proves the change reached running services by reading evaluations, not just the dashboard.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mitigation_choice` (object, required): From `inc-stabilize-decision-table` with action "flag_off" or "shed_load".
- `flag_provider` (string, required): One of `launchdarkly`, `unleash`, `flagd`, `other`.
- `flag_key` (string, required): The flag's key exactly as stored in the provider.
- `flag_environment` (string, required): Environment key, for example `production`.

---

## Outputs

- `flag_change_result` (object): {provider, flag_key, environment, state_before, state_after, api_response_status, changed_at_utc, propagation_evidence, restore_command}.

---

## Phase 1: Record the Current State

### Entry Criteria
- `mitigation_choice` is approved.
- The API token is in an environment variable (for example `LD_API_KEY` or `UNLEASH_ADMIN_TOKEN`), never pasted into the channel.

### Actions
1. Read the current flag state:
   - LaunchDarkly: `curl -sS -H "Authorization: $LD_API_KEY" "https://app.launchdarkly.com/api/v2/flags/<projectKey>/<flag_key>?env=<environment>" | jq '.environments["<environment>"] | {on, offVariation, fallthrough}'`
   - Unleash: `curl -sS -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/<projectId>/features/<flag_key>" | jq '.environments[] | {name, enabled}'`
   - flagd: open the flag definition file and copy the flag's `state` and `defaultVariant`.
   - other: open the flag in the provider UI and screenshot or copy the targeting state.
2. Confirm what "off" serves. In LaunchDarkly a flag that is off serves its `offVariation`; check that this variation is the safe old behavior. In Unleash a disabled toggle makes `isEnabled` return false. Do NOT assume "off" means "old code path" without reading the code that evaluates the flag.
3. Record state_before and write the restore command now.

### Output
state_before and restore command.

### Quality Gate
- state_before is copied from an API response or the file, not from memory.
- The code that evaluates `flag_key` was located (file and line) and confirms the off path is the safe path.

---

## Phase 2: Turn the Flag Off

### Entry Criteria
- state_before is recorded.

### Actions
1. Run exactly one:
   - LaunchDarkly (semantic patch):
     ```
     curl -sS -X PATCH "https://app.launchdarkly.com/api/v2/flags/<projectKey>/<flag_key>" \
       -H "Authorization: $LD_API_KEY" \
       -H "Content-Type: application/json; domain-model=launchdarkly.semanticpatch" \
       -d '{"environmentKey":"<environment>","comment":"<incident id> mitigation","instructions":[{"kind":"turnFlagOff"}]}'
     ```
   - Unleash: `curl -sS -X POST -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/<projectId>/features/<flag_key>/environments/<environment>/off"`
   - flagd: set `"state": "DISABLED"` or change `defaultVariant` to the safe variant in the flag file, then commit or sync it the way flagd is configured to load it (file watch, ConfigMap, or HTTP sync).
2. Read the HTTP status. LaunchDarkly returns 200 with the updated flag; Unleash returns 200. Any 4xx means it did not change.
3. If the environment requires approvals (LaunchDarkly approval workflows), the API returns an error or creates an approval request; get it approved, do not try another environment.
4. Do NOT change the flag in any environment other than `flag_environment`. Do NOT delete or archive the flag.

### Output
API response status and state_after.

### Quality Gate
- HTTP status is 200 (or the flagd file shows the new state).
- Re-running the Phase 1 read command shows the flag off.

---

## Phase 3: Prove Propagation

### Entry Criteria
- Provider shows the flag off.

### Actions
1. SDKs cache flags. Streaming SDKs update within seconds; polling SDKs update on their poll interval; some services read flags only at startup. Find which by reading the SDK initialization in the service's code (look for `stream`, `pollInterval`, `refreshInterval` options).
2. Prove the running service sees the change using one of:
   - The service's own log or metric for flag evaluations, if it emits one.
   - LaunchDarkly: the flag's Insights or evaluation graph in the UI for that environment.
   - Unleash: the toggle's metrics view (yes/no counts).
   - The user-visible behavior: the feature's endpoint or UI no longer shows the new behavior.
3. Watch the error metric from `metric_findings` for at least two scrape intervals after propagation.
4. If the service reads flags only at startup, a rolling restart is required: `kubectl rollout restart deployment/<name> -n <ns>`. Get IC approval first.

### Output
`flag_change_result`.

### Quality Gate
- propagation_evidence quotes an evaluation count, log line or endpoint response taken after the change time.
- A timeline `action` entry with the exact request exists.

---

## Worked Example

Illustrative only. LaunchDarkly, project `shop`, flag `new-pricing`, environment `production`.

- Phase 1: Read returns `{"on": true, "offVariation": 0, ...}`. Variation 0 is `false`. In `pricing/service.py` line 88, `if ld.variation("new-pricing", ctx, False):` guards the new calculator; false is the old path. Restore: semantic patch with `{"kind":"turnFlagOn"}`.
- Phase 2: PATCH returns 200 and the body shows `"on": false` under `production`.
- Phase 3: The Python SDK uses streaming (default). The flag's evaluation graph shows `false` for all evaluations from 14:16Z. Error ratio drops from 0.31 to 0.003 by 14:17Z.

---

## Exit Criteria

DONE when the flag is off in exactly one environment, the running services are proven to evaluate it off, and the restore command is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Off path is not the safe path | **Stop**: do not flip it; return to `inc-stabilize-decision-table`. |
| Phase 2 | 401 or 403 | **Stop**: use the provider UI with an authorized account; do not hunt for other tokens. |
| Phase 2 | 409 or approval required | **Retry**: request approval through the provider's workflow and record the approver. |
| Phase 3 | Evaluations still show on | **Adjust**: check SDK mode; if startup-only, perform the approved rolling restart. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
