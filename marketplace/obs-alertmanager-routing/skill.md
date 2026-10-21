# Alertmanager Routing For SLO Alerts

**One-line description:** Adds an Alertmanager route subtree that sends `severity="page"` SLO alerts to the paging receiver and `severity="ticket"` to the ticket receiver, groups by `alertname` and `slo`, inhibits the ticket alert while a page for the same SLO fires, puts `runbook_url` into the notification, and proves routing with `amtool check-config` and `amtool config routes test`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `alert_rules` (object, required): Output of `obs-burn-rate-alert-rules`.
- `alertmanager_config_path` (string, required): Path to `alertmanager.yml` in the repo (or the Alertmanager config Secret source).

---

## Outputs

- `alert_routing` (object): The route and inhibit snippets added, `amtool check-config` output, route test results per severity, and a live test alert result.

---

## Phase 1: Read The Existing Tree

### Entry Criteria
- `amtool` is installed (ships with Alertmanager releases): `amtool --version`.
- `amtool check-config "$alertmanager_config_path"` succeeds BEFORE any change. If it fails, stop; do not mix your change with an existing error.

### Actions
1. Print the current tree: `amtool config routes show --config.file="$alertmanager_config_path"`.
2. List receivers: `rg -n "^\s*- name:" "$alertmanager_config_path"`.
3. Ask the user which existing receivers are the paging and ticket receivers. Do not create receivers with guessed integration keys or webhook URLs.

### Output
Current tree and the two receiver names.

### Quality Gate
- The `routes show` output and the two receiver names confirmed by the user are pasted.

---

## Phase 2: Add Routes, Grouping And Inhibition

### Entry Criteria
- Receivers known.

### Actions
1. Add a child route under the root `route.routes` list. Place it BEFORE any catch-all child, because Alertmanager uses the first matching child unless `continue: true` is set:
```yaml
    - matchers: ['slo=~".+"']
      group_by: ['alertname', 'slo']
      routes:
        - matchers: ['severity="page"']
          receiver: oncall-pager
        - matchers: ['severity="ticket"']
          receiver: team-tickets
```
2. `group_by` timing keys (`group_wait`, `group_interval`, `repeat_interval`) are inherited from the root if not set. Keep the inherited values unless the user asks to change them; the Alertmanager defaults are documented in its configuration reference.
3. Add inhibition at the top level so the ticket alert is muted while a page alert for the same SLO fires:
```yaml
inhibit_rules:
  - source_matchers: ['severity="page"']
    target_matchers: ['severity="ticket"']
    equal: ['slo']
```
`equal: ['slo']` is required; without it, any page would mute every ticket alert for every SLO.
4. `matchers` syntax needs Alertmanager 0.22 or later; older configs use `match` / `match_re`. Keep the syntax the file already uses.
5. Notification content: confirm the receiver template shows the annotation. For a Slack receiver, for example, the `text` field can include `{{ range .Alerts }}{{ .Annotations.runbook_url }}{{ end }}`. Edit only if the user confirms the receiver template is in this file.

### Output
Edited config.

### Quality Gate
- `amtool check-config "$alertmanager_config_path"` prints `SUCCESS` for the config and lists the receivers.

---

## Phase 3: Test Routing

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Static route tests:
```
amtool config routes test --config.file="$alertmanager_config_path" alertname=CheckoutAvailabilityBurnRateFast severity=page slo=checkout-availability
amtool config routes test --config.file="$alertmanager_config_path" alertname=CheckoutAvailabilityBurnRateTicket severity=ticket slo=checkout-availability
amtool config routes test --config.file="$alertmanager_config_path" alertname=SomethingElse severity=page
```
Expected receivers: `oncall-pager`, `team-tickets`, and for the last one the receiver it went to before your change (proves you did not capture unrelated alerts).
2. After deploying the config, send a live test alert to a non-production Alertmanager or with a test label the receivers ignore, per the user's choice:
`amtool alert add alertname=RoutingTest severity=ticket slo=routing-test --annotation=runbook_url=https://example.invalid --alertmanager.url=$AM_URL`
then `amtool alert query alertname=RoutingTest --alertmanager.url=$AM_URL`.
3. Do not send test alerts to the production pager without the user's explicit approval.

### Output
`alert_routing`.

### Quality Gate
- Each route test prints the expected receiver name.
- The unrelated-alert test prints the same receiver as before the change.

---

## Worked Example

Illustrative only.

```
$ amtool check-config deploy/alertmanager/alertmanager.yml
Checking 'deploy/alertmanager/alertmanager.yml'  SUCCESS
Found:
 - global config
 - route
 - 1 inhibit rules
 - 3 receivers
 - 0 templates
$ amtool config routes test --config.file=deploy/alertmanager/alertmanager.yml alertname=CheckoutAvailabilityBurnRateFast severity=page slo=checkout-availability
oncall-pager
$ amtool config routes test --config.file=deploy/alertmanager/alertmanager.yml alertname=SomethingElse severity=page
default-email
```

---

## Exit Criteria

DONE when the config checks clean, page and ticket SLO alerts reach their receivers in route tests, unrelated alerts keep their previous receiver, and tickets are inhibited per SLO while a page fires.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Config fails check before any change | **Stop**: report the existing error to its owner. |
| Phase 1 | User has no paging receiver | **Return**: record it; SLO pages cannot be delivered until one exists. |
| Phase 3 | SLO alert routes to the catch-all | **Adjust**: the new child is after the catch-all; move it earlier. |
| Phase 3 | Unrelated alerts now reach the new receivers | **Adjust**: the `slo=~".+"` matcher is missing on the parent route; restore it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
