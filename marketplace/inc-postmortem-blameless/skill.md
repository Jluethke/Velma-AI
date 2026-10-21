# Incident Blameless Postmortem With Contributing Factors

**One-line description:** Writes a blameless postmortem from the timeline and cause statement using a fixed section layout, separates the trigger from contributing factors in four categories, replaces "human error" with the system conditions behind it, and drafts candidate action items for review.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Title, severity, customer impact.
- `resolution_record` (object, required): From `inc-declare-resolved`; durations and the owner.
- `timeline_log` (object[], required): From `inc-timeline-capture`.
- `confirmed_cause` (object, required): From `inc-hypothesis-verdict`.
- `role_assignments` (object, required): From `inc-assign-incident-roles`; who responded, for the review invite and the response analysis.

---

## Outputs

- `postmortem_doc` (object): The document with sections Summary, Impact, Timeline, Trigger, Contributing Factors, What Went Well, Where We Got Lucky, Response Analysis, Candidate Action Items, Open Questions; plus its link and review status.

---

## Phase 1: Draft the Factual Sections

### Entry Criteria
- `resolution_record` names the owner.

### Actions
1. Use this layout, adapted from the Google SRE book's example postmortem and the PagerDuty postmortem template:
   - Summary: three sentences: what customers saw, for how long, and what stopped it.
   - Impact: who, what function, how many (only numbers measured during the incident, with their query or source), start and end in UTC.
   - Timeline: copy `timeline_log` entries of type impact_start, detected, declared, decision, action, mitigated, resolved. Keep the UTC times.
   - Trigger and mechanism: copy from `confirmed_cause`.
2. Every number in Impact cites where it came from (a PromQL query, a log query, a support ticket count).
3. Do NOT include a customer name or personal data.

### Output
Draft of the factual sections.

### Quality Gate
- Every Impact number has a cited source.
- The timeline section has the same UTC times as `timeline_log`.

---

## Phase 2: Contributing Factors, Blameless

### Entry Criteria
- Factual sections exist.

### Actions
1. List contributing factors under four categories. Each factor is a condition of the system that made the incident possible, larger, or longer:

| Category | Ask |
|---|---|
| Technical | What design or config let the trigger cause harm? (no timeout, no circuit breaker, no limit, single point of failure) |
| Detection | Why did detection take the time it took? (missing alert, alert on a cause not a symptom, noisy alert ignored) |
| Process | What in the release, review or change process let the trigger reach production? (no canary, skipped step, no load test) |
| Response | What slowed mitigation? (missing runbook, unclear rollback, access needed mid-incident, GitOps reverted a rollback) |

2. Apply the blameless rewrite rule to every sentence. If a sentence names a person as the reason, rewrite it to name the condition:
   - "Alex deployed without testing" becomes "The pipeline allowed a deploy without the integration stage."
   - "The on-call missed the alert" becomes "The alert routed to a channel, not a page, at this severity."
   Names may appear only in the timeline as actors, never as causes.
3. Ban the phrase "human error" and "root cause: operator". When someone made a choice, write what information they had at that moment and why the choice made sense to them then (local rationality, as described in Sidney Dekker's Field Guide to Understanding Human Error).
4. Use "5 whys" only as a prompt for finding more factors, not to reach a single root cause; real incidents have several.
5. Add What Went Well and Where We Got Lucky. Luck is a contributing factor in disguise; each lucky item should get a candidate action.

### Output
Contributing factors and the two reflection sections.

### Quality Gate
- At least one factor in each of the four categories, or "none found" with the question asked.
- A text search of the draft for "human error", "should have", "failed to", "careless" finds zero hits.

---

## Phase 3: Candidate Actions and Review

### Entry Criteria
- Factors are written.

### Actions
1. Write at least one candidate action per factor. Each must be specific, have a verifiable done condition, and be typed as one of: Prevent (stops the trigger), Mitigate (limits harm), Detect (finds it sooner), Respond (speeds recovery). These types follow common SRE practice; use your organization's if it has others.
2. Bad: "Improve monitoring". Good: "Add an alert on checkout 5xx ratio from the SLO burn rate, routed to the checkout pager; done when a staging fault injection pages."
3. Record Open Questions from `confirmed_cause.remaining_unknowns` and the timeline.
4. Hold the review meeting. The facilitator reads the blameless rule aloud. Corrections from attendees are added; the owner marks status "reviewed".

### Output
`postmortem_doc`.

### Quality Gate
- Every factor has at least one action with type and done condition.
- Review status is "reviewed" with the meeting date.

---

## Worked Example

Illustrative only. INC-20261020-1406.

- Phase 1: Summary: "From 13:59 to 14:28 UTC some customers in Europe could not place orders. A checkout release switched pricing calls to a new service that could not handle full load. Rolling back the release restored service." Impact: error ratio 0.31 peak (PromQL query cited), 4,812 failed checkout requests (from `sum(increase(...[29m]))`).
- Phase 2: Technical: no circuit breaker on the pricing client. Detection: the alert fired 4 min after onset (acceptable, noted). Process: the client switch shipped in one step without a flag. Response: Argo CD auto-sync would have reverted a kubectl rollback; the responder knew to pause it, which is luck. Grep for "human error", "should have", "failed to", "careless": zero hits.
- Phase 3: Actions: Prevent "put the pricing-v2 switch behind a percentage flag"; Mitigate "circuit breaker with fallback"; Respond "add 'pause Argo CD sync' to the rollback runbook"; Detect "none needed". Reviewed on the meeting date.

---

## Exit Criteria

DONE when the postmortem has all ten sections, contributing factors in four categories with no blame language, typed actions with done conditions, and review status "reviewed".

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Timeline has gaps | **Adjust**: interview responders and add entries marked "reconstructed". |
| Phase 2 | Review attendees push a single person as cause | **Stop**: the facilitator restates the rule; rewrite the sentence before continuing. |
| Phase 3 | Actions are vague | **Return**: rewrite until each has a done condition that can be checked. |
| Phase 3 | Owner unavailable for the meeting | **Adjust**: the IC presents; the date moves only once. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
