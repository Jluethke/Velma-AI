# Incident Customer Status Updates

**One-line description:** Writes customer-facing status updates from fixed templates for the four Statuspage-style states (investigating, identified, monitoring, resolved), checks each one against a list of forbidden content, and posts them through the Atlassian Statuspage API or the status tool's UI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Title, affected services and customer impact statement.
- `severity` (string, required): Severity level; decides whether a public post is required under the organization's policy.
- `timeline_log` (object[], required): From `inc-timeline-capture`; the source of facts for each update.
- `status_page_id` (string, optional): Statuspage page ID. When absent, the updates are produced as text for whatever status tool the organization uses.

---

## Outputs

- `status_updates` (object[]): Each update: {state, posted_at_utc, title, body, components, channel, approved_by}.

---

## Phase 1: Decide Whether and Where to Post

### Entry Criteria
- `incident_record` has a customer impact statement.

### Actions
1. Apply this table:

| Condition | Action |
|---|---|
| `incident_record` customer impact names a customer-visible effect | Public status page post required |
| Impact is limited to named enterprise customers | Direct message to those customers through support; public post only if policy says so |
| Internal-only impact | Internal stakeholder update only; no public post |
| Data exposure or security issue suspected | Do NOT post details publicly. Post only the generic template and route wording through the security and legal contacts named by the organization |

2. List the status page components that match `affected_services`. Use the component names exactly as they appear on the page.

### Output
Channel decision and component list.

### Quality Gate
- One channel is chosen and the matching table row is quoted.
- Every component name matches the status page exactly.

---

## Phase 2: Fill the Template

### Entry Criteria
- Channel is chosen.

### Actions
1. Use the template for the current state. Replace each bracket with facts from `timeline_log` only:

| State | Template |
|---|---|
| investigating | "We are investigating [symptom customers see] affecting [function] [in region, if scoped]. Next update by [UTC time]." |
| identified | "We have identified the cause of [symptom] and are [mitigation in plain words]. Next update by [UTC time]." |
| monitoring | "A fix has been applied for [symptom]. [Function] is recovering and we are monitoring. Next update by [UTC time]." |
| resolved | "This incident is resolved. Between [start UTC] and [end UTC], [who] could not [function]. [One sentence on follow-up, if any]." |

2. Check the draft against this forbidden list and remove any hit:
   - Internal names: hostnames, service code names, employee names, vendor blame.
   - Guessed causes not confirmed in `timeline_log`.
   - Promises with a time ("fixed in 10 minutes") unless the IC approved that time.
   - Blame words aimed at a person or team.
3. Always include the next update time while the state is not resolved.
4. Send the draft to the IC. The IC replies "approved". Record the approver.

### Output
Approved draft update.

### Quality Gate
- The draft contains zero words from the forbidden list (read it word by word).
- `approved_by` is filled with the IC's name.

---

## Phase 3: Post and Record

### Entry Criteria
- Draft is approved.

### Actions
1. If `status_page_id` is present and Atlassian Statuspage is used, create the incident with the REST API:
   ```
   curl -sS -X POST "https://api.statuspage.io/v1/pages/$STATUSPAGE_PAGE_ID/incidents" \
     -H "Authorization: OAuth $STATUSPAGE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"incident":{"name":"<title>","status":"investigating","body":"<body>"}}'
   ```
   For later states, update the same incident with `PATCH .../incidents/<incident_id>` and a new `status` and `body`. Check the Statuspage API reference for the component fields before adding them; do not guess field names.
2. For any other status tool, post through its UI and paste the resulting public URL.
3. Read the response: an HTTP 201 or 200 with an `id` field means it posted. Save the id.
4. Add a `comms` entry to `timeline_log` with the posted time and the URL.
5. Repeat Phases 2 and 3 at every update time and every state change.

### Output
`status_updates` with the new entry.

### Quality Gate
- The API response contains an incident `id`, or a public URL is recorded.
- A `comms` entry with the same time exists in `timeline_log`.

---

## Worked Example

Illustrative only. INC-20261020-1406, SEV2, customers in eu-west-1 cannot place orders.

- Phase 1: Customer-visible effect: public post. Component: "Checkout".
- Phase 2: Draft: "We are investigating errors when placing orders for some customers in Europe. Next update by 14:40 UTC." Forbidden list check: no hostnames, no causes. IC lee approves.
- Phase 3: `curl ... -d '{"incident":{"name":"Errors placing orders","status":"investigating","body":"We are investigating errors when placing orders for some customers in Europe. Next update by 14:40 UTC."}}'` returns HTTP 201 with `"id":"p31zjtct2jer"`. Timeline entry 14:12:40Z comms added. At 14:28Z a "monitoring" update is posted with PATCH.

---

## Exit Criteria

DONE when every state the incident passed through has a posted, approved update recorded in `status_updates`, and the final state is "resolved" or the incident is still open with a next update time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsure whether impact is customer-visible | **Adjust**: post the investigating template; an unneeded post costs less than silence. |
| Phase 2 | IC is not reachable for approval | **Adjust**: the comms lead posts the investigating template only, which contains no cause. |
| Phase 3 | API returns 401 or 403 | **Stop**: do not retry with other keys; post through the UI and fix the key after the incident. |
| Phase 3 | Next update time passes with no news | **Retry**: post "Still investigating. Next update by [time]." on schedule. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
