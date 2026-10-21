# Incident Stabilize First Decision Table

**One-line description:** Chooses one mitigation (rollback, feature flag off, scale out, traffic shift, shed load, or restart) from a decision table driven by the change correlation and saturation evidence, so the service is stabilized before anyone looks for root cause.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Affected services and customer impact.
- `severity` (string, required): Severity level.
- `metric_findings` (object, required): From `inc-promql-red-triage`; onset order and saturation series.
- `change_correlation` (object[], required): From `inc-change-correlation`; ranked candidate changes with rollback commands.

---

## Outputs

- `mitigation_choice` (object): {action, target, exact_command_or_ui_step, expected_effect, rollback_of_mitigation, evidence_row, approved_by}. `action` is one of: rollback, flag_off, scale_out, traffic_shift, shed_load, restart, none.

---

## Phase 1: Read the Evidence Into the Table

### Entry Criteria
- `metric_findings` and `change_correlation` exist.

### Actions
1. Answer these five questions with yes, no or unknown, quoting the evidence for each:
   - Q1: Is the top-ranked change in `change_correlation` before the onset AND does it touch the first-moving service?
   - Q2: Is that change a feature flag change, or is the changed code path behind a flag that can be turned off?
   - Q3: Do saturation series in `metric_findings` (CPU throttling, memory near limit, OOM kills, pending pods, connection pool exhaustion) show onset at or before the error onset?
   - Q4: Is the failure limited to one region, zone, cluster or deployment slice while another healthy one exists with spare capacity?
   - Q5: Did request rate rise sharply at the onset (a traffic spike) rather than stay flat?
2. Do NOT start a debugging session before this table is filled. Stabilize first; root cause comes after the customer impact stops.

### Output
Five answered questions with evidence.

### Quality Gate
- Each of Q1 to Q5 has an answer and a quoted value or "unknown".

---

## Phase 2: Choose the Mitigation

### Entry Criteria
- Q1 to Q5 are answered.

### Actions
1. Walk the table top to bottom. Take the FIRST row that matches.

| Row | Condition | Action | Flow to run next |
|---|---|---|---|
| 1 | Q2 yes | flag_off | `inc-feature-flag-off` |
| 2 | Q1 yes and the change is a deploy | rollback | `inc-k8s-rollout-undo` on Kubernetes, or the platform's rollback |
| 3 | Q4 yes | traffic_shift | `inc-traffic-shift` |
| 4 | Q3 yes and the bottleneck is in the service's own pods (CPU throttling, pending pods, per-pod memory) | scale_out | `inc-k8s-scale-out` |
| 5 | Q3 yes and the bottleneck is a shared dependency (database, cache, queue) | shed_load: reduce traffic to the dependency (turn off non-critical features, lower concurrency, enable rate limiting) | `inc-feature-flag-off` or the service's rate limit config |
| 6 | Q5 yes and no other row matched | scale_out, plus rate limiting at the edge if available | `inc-k8s-scale-out` |
| 7 | Pods are stuck (deadlocked, leaking) and nothing above matched | restart one pod at a time AFTER capturing evidence with the runtime flows | `inc-k8s-safe-debug-access` first |
| 8 | Nothing matched | none: go straight to diagnosis | `inc-hypothesis-draft` |

2. Rules that override the table:
   - Never scale out when the bottleneck is a shared database; more pods open more connections and make it worse. Use row 5.
   - Rolling back a deploy that included a database schema migration is NOT safe by default. If the change contains a migration, check whether the old code works with the new schema before rolling back; if unknown, prefer a flag or traffic shift.
   - A restart destroys in-memory evidence. Capture evidence first (row 7).
3. Copy the exact command from `change_correlation` or write it for the chosen flow.
4. Write the rollback of the mitigation itself (how to undo it if it makes things worse).

### Output
Draft `mitigation_choice`.

### Quality Gate
- `evidence_row` names exactly one table row number.
- `exact_command_or_ui_step` and `rollback_of_mitigation` are both literal commands or UI paths.

---

## Phase 3: Get the Decision Approved and Logged

### Entry Criteria
- Draft exists.

### Actions
1. The ops lead states the choice in the channel: "Proposing <action> on <target> because row <N>: <evidence>. Undo: <command>."
2. The IC replies approve or reject. Record the name in `approved_by`.
3. The scribe adds a `decision` entry to the timeline.

### Output
`mitigation_choice`.

### Quality Gate
- `approved_by` is filled.
- A `decision` timeline entry exists with the same action.

---

## Worked Example

Illustrative only. INC-20261020-1406.

- Phase 1: Q1 yes (checkout revision 42 at 13:58:02Z, onset 13:59:30Z). Q2 no (revision 42 is not behind a flag). Q3 yes for CPU throttling at 13:59:15Z, but that started after the deploy. Q4 unknown. Q5 no (rate flat).
- Phase 2: Row 1 does not match. Row 2 matches. Action rollback; command `kubectl rollout undo deployment/checkout -n shop --to-revision=41`; undo `kubectl rollout undo deployment/checkout -n shop --to-revision=42`; revision 42 contains no migration (checked in the diff). Expected effect: error ratio returns to baseline 0.002.
- Phase 3: IC lee approves at 14:19Z; decision entry logged.

---

## Exit Criteria

DONE when one mitigation is chosen by a single table row, has a literal command and an undo command, and is approved by the IC.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Most answers are unknown | **Adjust**: pick row 2 if any deploy landed shortly before the onset; otherwise row 8. |
| Phase 2 | The chosen change contains a migration | **Adjust**: move to row 1 or 3; if neither applies, escalate the choice to the IC with the risk stated. |
| Phase 2 | The mitigation fails or makes it worse | **Return**: run the undo command and come back to Phase 2 with the next matching row. |
| Phase 3 | IC rejects | **Return**: record the reason and choose the next matching row. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
