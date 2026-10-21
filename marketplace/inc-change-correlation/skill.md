# Incident Change Correlation

**One-line description:** Lists every deploy, config change, feature flag change, infrastructure change and dependency event in the window before the metric onset, and ranks them by how close they landed to the onset and whether they touched the first-moving service.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Affected services and declared_at.
- `timeline_log` (object[], required): From `inc-timeline-capture`; supplies impact_start if already known.
- `metric_findings` (object, required): From `inc-promql-red-triage`; supplies the onset time and the first-moving service.
- `platform` (string, required): One of `kubernetes`, `ecs`, `vm`, `serverless`. Selects which commands to run.
- `recent_changes` (object[], optional): Changes people already know about (pasted deploy notifications, change tickets).

---

## Outputs

- `change_correlation` (object[]): Candidate changes ranked: {time_utc, kind, target, author_or_system, revision_or_id, minutes_before_onset, touches_first_mover, rollback_command}.

---

## Phase 1: Collect Changes

### Entry Criteria
- `metric_findings` has an onset time.

### Actions
1. Set the window from 24 hours before the onset to now. Write both ends in UTC.
2. Run the commands for `platform`. Run only commands for tools that exist (`command -v kubectl helm argocd aws gh` shows which do).

| Platform | Commands |
|---|---|
| kubernetes | `kubectl rollout history deployment/<name> -n <ns>` for each affected service; `kubectl get replicasets -n <ns> -o custom-columns=NAME:.metadata.name,CREATED:.metadata.creationTimestamp,REV:.metadata.annotations.deployment\.kubernetes\.io/revision --sort-by=.metadata.creationTimestamp`; `kubectl get events -A --sort-by=.lastTimestamp`; `helm history <release> -n <ns>` if Helm is used; `argocd app history <app>` if Argo CD is used |
| ecs | `aws ecs describe-services --cluster <c> --services <s> --query 'services[0].deployments'` |
| vm | the deploy tool's history, plus `last -F` and the configuration management run log on the host |
| serverless | `aws lambda list-versions-by-function --function-name <f>` and `aws lambda get-alias --function-name <f> --name <alias>` |
| any (AWS) | `aws cloudtrail lookup-events --start-time <ISO> --end-time <ISO> --max-results 50` |
| any (git) | `git log --since=<ISO> --until=<ISO> --format="%H %cI %an %s" origin/main` in each affected repository |

3. Collect feature flag changes from the flag tool's audit log (LaunchDarkly, Unleash, Flagsmith and similar all keep one; open it in the UI and filter by time).
4. Collect dependency events: the cloud provider's status page and the status pages of third-party APIs the service calls.
5. Add every item from `recent_changes`.

### Output
Raw list of changes with times.

### Quality Gate
- Each command for the chosen platform was run, and its output (or "command not available") is attached.
- The flag audit log was checked and its result recorded, even if empty.

---

## Phase 2: Rank the Candidates

### Entry Criteria
- Raw list exists.

### Actions
1. For each change compute minutes_before_onset = onset minus change time. Drop changes that happened after the onset; they cannot be the trigger (keep them in a separate "after onset" list for the timeline).
2. Set touches_first_mover = true when the change targets the first-moving service from `metric_findings` or one of its direct dependencies.
3. Rank with these rules in order:
   - touches_first_mover true ranks above false.
   - Then smaller minutes_before_onset ranks higher.
   - Then a change that rolled out gradually (canary percentage increase) ranks higher if the error rate grew in steps that line up with the rollout steps.
4. For each of the top three, write the exact rollback command, for example `kubectl rollout undo deployment/checkout -n shop --to-revision=41`, `helm rollback checkout 17 -n shop --wait`, or "turn flag new-pricing off in production".
5. Do NOT conclude a change is the cause. This flow ranks candidates; the hypothesis flows test them.

### Output
`change_correlation`.

### Quality Gate
- Every ranked item has a numeric minutes_before_onset that is zero or positive.
- The top three each have a literal rollback command or a flag action.

---

## Worked Example

Illustrative only. Onset 13:59:30Z, first mover checkout, platform kubernetes.

- Phase 1: `kubectl rollout history deployment/checkout -n shop` shows revisions 41 and 42. The ReplicaSet for revision 42 was created at 13:58:02Z. `helm history` not used. Flag audit log: `new-pricing` set to 25 percent at 11:10Z. CloudTrail: an RDS parameter group change at 09:40Z.
- Phase 2: Ranked: (1) checkout revision 42, 1.5 min before onset, touches first mover, rollback `kubectl rollout undo deployment/checkout -n shop --to-revision=41`; (2) flag `new-pricing`, 169 min before, touches checkout; (3) RDS parameter change, 259 min before, touches a dependency.

---

## Exit Criteria

DONE when every change in the window is listed with its time, the before-onset changes are ranked by the rules, and the top three have rollback actions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No permission for a history command | **Adjust**: ask someone with access to run it and paste the output; record who ran it. |
| Phase 1 | Kubernetes events have expired | **Adjust**: rely on ReplicaSet creation times, which persist while the ReplicaSet exists. |
| Phase 2 | No change found before the onset | **Return**: record "no correlated change"; the cause may be load, data or a dependency. |
| Phase 2 | Many changes cluster at the onset | **Adjust**: keep all of them in the ranked list and let `inc-hypothesis-draft` design a test that separates them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
