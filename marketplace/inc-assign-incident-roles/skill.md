# Incident Assign Command Roles

**One-line description:** Assigns the incident commander, operations lead, communications lead and scribe from the on-call roster using fixed rules, opens the incident channel, and writes the handoff protocol so command never goes unowned.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): From `inc-declare-severity`: id, title, severity, affected services.
- `severity` (string, required): The chosen severity level from `inc-declare-severity`.
- `responder_roster` (object, required): Who is on call now: primary and secondary on-call per affected service, the incident commander rotation if one exists, and a communications or support contact.

---

## Outputs

- `role_assignments` (object): Named person for each role (incident_commander, ops_lead, comms_lead, scribe, subject_matter_experts), the incident channel name, the bridge or call link, the update cadence agreed by the incident commander, and the handoff log.

---

## Phase 1: Assign the Roles

### Entry Criteria
- `incident_record` and `responder_roster` are present.

### Actions
1. Use the role definitions from the Incident Command System as adapted in the public PagerDuty Incident Response docs and Google's IMAG model:

| Role | Owns | Does NOT do |
|---|---|---|
| Incident commander (IC) | Decisions, priorities, who does what, declaring stabilized and resolved | Typing commands or debugging |
| Ops lead | Running mitigation and diagnostic commands, directing subject matter experts | Talking to customers |
| Comms lead | Status page, customer support, internal stakeholder updates | Changing production |
| Scribe | Writing the timeline in real time | Making decisions |
| Subject matter expert (SME) | Answering questions and running commands the ops lead requests | Changing production without the ops lead knowing |

2. Fill roles with this rule table:

| Situation | Assignment |
|---|---|
| An IC rotation exists in `responder_roster` | IC = the person on that rotation now |
| No IC rotation, `severity` is the top one or two levels | IC = secondary on-call of the most affected service; primary on-call becomes ops lead |
| No IC rotation, lower severity | Primary on-call holds IC and ops lead together; record that the roles are combined |
| A support or comms contact is listed | Comms lead = that person |
| No comms contact listed | IC also holds comms; record it as an open question |
| Anyone else has joined | Scribe = the first person who joined who is not already assigned |

3. Do NOT let the person debugging hold the IC role at the top two severity levels. When the only available person must do both, record "IC and ops lead combined" so the postmortem can see it.

### Output
Draft `role_assignments` with one name per role.

### Quality Gate
- Every role in the table has a name or the word "combined with <role>".
- At the top two severity levels, incident_commander and ops_lead are different people, or the combination is recorded.

---

## Phase 2: Open the Channel and Announce

### Entry Criteria
- Draft `role_assignments` exists.

### Actions
1. Create the incident channel named after the incident ID, for example `#inc-20261020-1406-checkout`. In Slack use the incident tool's command if one is installed; otherwise create the channel by hand.
2. Post the first message in this exact shape:
   ```
   INCIDENT <id> | <severity> | <title>
   IC: @name  Ops: @name  Comms: @name  Scribe: @name
   Bridge: <link>
   Current status: investigating
   Next update: <UTC time>
   ```
3. Pin that message. Set the channel topic to the same first line.
4. The IC states the update cadence. Use the cadence from the organization's incident policy for this severity. If there is no policy, the IC picks one and the choice is recorded as an open question; do not copy a number from another company.

### Output
Channel created and the role announcement pinned.

### Quality Gate
- The pinned message contains every role name and a next update time in UTC.
- The channel name contains the incident ID.

---

## Phase 3: Write the Handoff Protocol

### Entry Criteria
- Announcement is posted.

### Actions
1. Add a handoff log to `role_assignments`: a list of {time_utc, role, from, to}.
2. Any role change follows these steps in order: the outgoing person posts a summary (status, current hypothesis, actions in flight, next update time); the incoming person replies "I have <role>"; the scribe adds the row to the handoff log and the timeline.
3. A role is never transferred silently. If the IC must leave, they hand off before leaving, not after.

### Output
Final `role_assignments`.

### Quality Gate
- The handoff log exists (empty list allowed).
- Every entry has both a "from" and a "to" name.

---

## Worked Example

Illustrative only. `severity` = "SEV2", `responder_roster` = {checkout: {primary: "dana", secondary: "lee"}, ic_rotation: none, support: "sam"}.

- Phase 1: No IC rotation, SEV2 is in the top two levels: IC = lee (secondary), ops lead = dana (primary), comms = sam. Priya joins next: scribe = priya.
- Phase 2: Channel `#inc-20261020-1406-checkout`. Pinned: "INCIDENT INC-20261020-1406 | SEV2 | Checkout returns HTTP 500 in eu-west-1 / IC: @lee Ops: @dana Comms: @sam Scribe: @priya / Next update: 14:40Z". No written cadence policy: open question recorded.
- Phase 3: Handoff log starts empty. At 16:10Z lee hands IC to omar; the row {16:10Z, IC, lee, omar} is added.

---

## Exit Criteria

DONE when every role has an owner, the channel and pinned announcement exist, and the handoff protocol is recorded in `role_assignments`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Nobody on the roster answers a page | **Retry**: page the secondary and then the escalation policy's next level; record every page time. |
| Phase 1 | Only one responder is available | **Adjust**: combine roles and record the combination. |
| Phase 2 | Chat tool is down | **Adjust**: use the bridge call and a shared document as the channel; record it. |
| Phase 3 | IC leaves without handing off | **Return**: the ops lead assumes IC immediately and posts the takeover. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
