# Incident Timeline Capture

**One-line description:** Builds and maintains the incident timeline in UTC from the incident channel, alert history, deploy history and command output, with each entry tagged by type and source so the detect, mitigate and resolve times can be read off it later.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): From `inc-declare-severity`; supplies the incident ID and declared_at time.
- `role_assignments` (object, required): From `inc-assign-incident-roles`; names the scribe and the channel.

---

## Outputs

- `timeline_log` (object[]): Ordered entries {time_utc, type, source, actor, text, evidence_link}. Type is one of: impact_start, detected, declared, action, observation, hypothesis, decision, comms, mitigated, resolved.

---

## Phase 1: Set Up the Log

### Entry Criteria
- `role_assignments` names a scribe.

### Actions
1. Create the timeline as a table with the six columns of `timeline_log`. Keep it in the incident tool or in a shared document linked in the pinned channel message.
2. Write all times in UTC ISO 8601 with seconds, for example `2026-10-20T14:06:11Z`. Get the current time with `date -u +%Y-%m-%dT%H:%M:%SZ`. When copying a time from a tool that shows local time, convert it and write the original value in the evidence column.
3. Add the first three entries now: `declared` (from `incident_record`), `detected` (the alert's first firing time from the alerting tool, not the time a human noticed), and the role assignment as a `decision`.

### Output
Timeline with the first three entries.

### Quality Gate
- Every time value ends in `Z`.
- A `detected` entry exists and its source is the alerting tool.

---

## Phase 2: Capture Live

### Entry Criteria
- Timeline exists.

### Actions
1. The scribe adds an entry for every one of these, within the update cadence, never "later":
   - Every production-changing command (who ran it, the exact command, the result).
   - Every hypothesis stated, with who stated it.
   - Every decision by the IC, with the alternatives that were rejected.
   - Every customer or stakeholder message sent.
2. Paste exact commands, for example `kubectl rollout undo deployment/checkout -n shop --to-revision=41`, not "rolled back".
3. Write observations as facts with a source: "p99 latency 2.4 s on Grafana panel Checkout/Latency at 14:20Z", not "latency seems better".
4. Do NOT edit or delete earlier entries. To correct one, add a new entry of type `observation` that says "Correction to <time> entry: ...".

### Output
Growing `timeline_log`.

### Quality Gate
- Every `action` entry contains a literal command or a UI path.
- No entry was deleted (the entry count only grows).

---

## Phase 3: Backfill From Systems of Record

### Entry Criteria
- Mitigation has happened or the incident is resolved.

### Actions
1. Pull the deploy and change history for the window from one hour before `detected` until now, using the tools in use:
   - Kubernetes: `kubectl rollout history deployment/<name> -n <ns>` and `kubectl get events -n <ns> --sort-by=.lastTimestamp`.
   - Helm: `helm history <release> -n <ns>`.
   - Argo CD: `argocd app history <app>`.
   - Git: `git log --since="<ISO time>" --until="<ISO time>" --format="%H %cI %an %s" origin/main`.
   - AWS: `aws cloudtrail lookup-events --start-time <ISO> --end-time <ISO> --max-results 50`.
2. Find `impact_start`: the earliest time the customer-facing SLI moved, read from a metrics graph or query_range output. It is usually earlier than `detected`.
3. Merge these into `timeline_log` sorted by time. Tag backfilled entries with the source tool.
4. Compute and add: time to detect = detected minus impact_start; time to mitigate = mitigated minus impact_start; time to resolve = resolved minus impact_start. Only compute an interval when both entries exist.

### Output
Final `timeline_log`.

### Quality Gate
- Entries are sorted by `time_utc` ascending (check by reading the column top to bottom).
- `impact_start`, `detected` and `declared` entries all exist, or the missing one is listed as an open question.

---

## Worked Example

Illustrative only. Incident INC-20261020-1406.

- Phase 1: Entries: 14:03:40Z detected (Alertmanager, CheckoutHighErrorRate), 14:06:11Z declared, 14:08:02Z decision (IC lee, ops dana).
- Phase 2: 14:21:15Z action, dana, `kubectl rollout undo deployment/checkout -n shop --to-revision=41`, output "deployment.apps/checkout rolled back". 14:27:00Z observation, "5xx ratio back to pre-incident level on Grafana Checkout/Errors".
- Phase 3: `kubectl rollout history deployment/checkout -n shop` shows revision 42 created 13:58Z. Grafana query_range shows the error ratio rose at 13:59:30Z: impact_start = 13:59:30Z. Time to detect = 4 min 10 s; time to mitigate = 27 min 30 s.

---

## Exit Criteria

DONE when `timeline_log` is sorted, in UTC, has impact_start, detected, declared, mitigated and resolved entries (or open questions for the missing ones), and every action has a literal command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No scribe is available | **Adjust**: the IC records decisions and actions only; the rest is backfilled in Phase 3. |
| Phase 2 | Commands were run in private terminals and not posted | **Return**: ask the ops lead for shell history (`history` output) and add the commands with their times. |
| Phase 3 | Event retention expired (Kubernetes events are short-lived) | **Adjust**: use the deploy tool and git history instead, and note that events were unavailable. |
| Phase 3 | Clocks disagree between tools | **Adjust**: record both times and the source of each; use the metrics server time as the reference. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
