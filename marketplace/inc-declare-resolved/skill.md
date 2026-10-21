# Incident Declare Resolved and Close Out

**One-line description:** Checks a fixed list of resolution criteria, posts the resolved customer update, closes the incident channel's active phase, computes the incident durations from the timeline, and schedules the postmortem.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_verification` (object, required): From `inc-fix-verification`; verdict and final SLI. When the fix is still pending but impact has ended, the IC may resolve on `stabilization_status` alone and record why.
- `stabilization_status` (object, required): From `inc-confirm-stabilization`.
- `timeline_log` (object[], required): From `inc-timeline-capture`.
- `status_updates` (object[], required): From `inc-status-page-update`.

---

## Outputs

- `resolution_record` (object): {resolved_at_utc, criteria_results, durations (time to detect, time to mitigate, time to resolve), final_status_update, postmortem_owner, postmortem_due, postmortem_meeting}.

---

## Phase 1: Check the Resolution Criteria

### Entry Criteria
- `stabilization_status.state` is "mitigated".

### Actions
1. Check each criterion and write yes or no with evidence:

| # | Criterion | Evidence |
|---|---|---|
| C1 | Customer-facing SLI is within tolerance of baseline | `fix_verification.final_sli` or the AFTER value in `stabilization_status` |
| C2 | No mitigation is in a state that will silently revert (for example, GitOps paused with the bad commit still in git) | `fix_verification.mitigations_unwound` |
| C3 | No production-changing action is in flight | ops lead confirms in the channel |
| C4 | Customer support reports no new tickets for the symptom since mitigation | comms lead confirms |
| C5 | Alerts for the symptom have cleared | the alerting tool shows the alert resolved |

2. Rule: resolve when C1, C3 and C5 are yes. If C2 or C4 is no, resolve only if the IC accepts the risk in writing, and record it as an action item.
3. Do NOT resolve because people are tired. An incident can be downgraded in severity instead.

### Output
Criteria table.

### Quality Gate
- Every criterion has yes or no and an evidence source.
- The rule in Action 2 is satisfied, or the IC's written acceptance is quoted.

---

## Phase 2: Announce and Record

### Entry Criteria
- Criteria pass.

### Actions
1. Post the resolved status update with `inc-status-page-update`'s resolved template. Include the customer-facing start and end times in UTC.
2. Post in the incident channel: "RESOLVED at <UTC>. Postmortem owner: <name>, due <date>." Update the pinned message.
3. Add a `resolved` entry to `timeline_log`.
4. Compute durations from the timeline: time to detect = detected minus impact_start; time to mitigate = mitigated minus impact_start; time to resolve = resolved minus impact_start. Write each as minutes and seconds. If an entry is missing, write "unknown" and add an open question.

### Output
Announcements posted and durations computed.

### Quality Gate
- `status_updates` has a final entry with state "resolved".
- Each duration is computed from two named timeline entries or marked unknown.

---

## Phase 3: Schedule the Postmortem

### Entry Criteria
- Incident is resolved.

### Actions
1. Decide whether a postmortem is required from the organization's policy. If there is no policy, use the triggers listed in Google's SRE book chapter on postmortem culture: user-visible downtime or degradation beyond a threshold, data loss, on-call intervention such as a rollback or traffic reroute, resolution time above a threshold, or a monitoring failure. The thresholds must come from the organization; if none exist, write a postmortem and record "no thresholds defined" as an open question.
2. Assign the postmortem owner: usually the IC or the ops lead, not a manager. Set the due date per policy, or the IC sets it and it is recorded.
3. Book the review meeting and invite every responder in `role_assignments` plus the owners of affected services.
4. Archive nothing yet; the channel stays readable for the postmortem.

### Output
`resolution_record`.

### Quality Gate
- `postmortem_owner` and `postmortem_due` are set, or "not required" is recorded with the policy rule quoted.

---

## Worked Example

Illustrative only. INC-20261020-1406.

- Phase 1: C1 yes (error ratio 0.0020 vs baseline 0.002). C2 yes (Argo CD re-enabled after revert on main). C3 yes. C4 yes (support: 0 tickets since 14:25Z). C5 yes (CheckoutHighErrorRate resolved 14:31Z).
- Phase 2: Resolved update: "Between 13:59 and 14:28 UTC some customers in Europe could not place orders. Service is fully restored." Durations: detect 4 min 10 s, mitigate 28 min 30 s, resolve 2 h 41 min (fix deployed later).
- Phase 3: A rollback happened, which meets the "on-call intervention" trigger. Owner dana, due date set by IC lee, review meeting booked.

---

## Exit Criteria

DONE when the criteria are met or risk-accepted, the resolved update is posted, durations are computed, and the postmortem has an owner and date or a recorded "not required".

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | C1 fails | **Stop**: the incident is not resolved; return to `inc-stabilize-decision-table`. |
| Phase 1 | Alert will not clear because the alert itself is wrong | **Adjust**: silence it with an expiry, record it, and file an action item to fix the alert. |
| Phase 2 | Symptom recurs after resolution | **Return**: reopen the same incident ID rather than declaring a new one, and add a timeline entry. |
| Phase 3 | Nobody accepts the postmortem owner role | **Adjust**: the IC owns it by default. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
