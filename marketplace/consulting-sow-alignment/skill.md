# Consulting SOW Alignment

**One-line description:** The consulting lead and the client each submit what they actually expect from the engagement — Claude aligns on scope, deliverables, and success criteria so the consultant delivers what was bought and the client stops moving the goalposts.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both consultant and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_engagement_name` (string, required): Engagement or project name.
- `shared_firm_and_client` (string, required): Consulting firm and client company names.

### Consulting Lead Submits Privately
- `consultant_scope_as_understood` (string, required): What you believe you have been hired to do — the problem, the deliverables, and the boundaries.
- `consultant_deliverables_and_timeline` (object, required): What you will produce, by when, and what "done" looks like for each deliverable.
- `consultant_assumptions_the_sow_depends_on` (array, required): What must be true for the engagement to go as scoped — data access, client involvement, decision authority, budget stability.
- `consultant_concerns_about_scope_creep` (array, required): Where do you expect the client to push beyond what was agreed?
- `consultant_fee_structure` (object, required): Fixed fee, T&M, retainer — how you are billing and what the ceiling or estimate is.

### Client Submits Privately
- `client_what_success_looks_like` (string, required): What must be true at the end of this engagement for it to have been worth the investment?
- `client_what_they_actually_need_vs_what_they_asked_for` (string, required): Is what you asked for really what you need? What underlying problem are you solving?
- `client_concerns_about_the_engagement` (array, required): What are you worried about — cost overrun, quality, knowledge transfer, team adoption?
- `client_access_and_involvement_they_can_provide` (object, required): What stakeholders, data, and decisions can you actually commit to — realistically, not aspirationally?
- `client_what_they_will_not_accept` (array, required): What outcomes, behaviors, or deliverable quality would cause you to push back on the engagement?

## Outputs
- `scope_alignment_assessment` (object): Where consultant and client agree on scope and where there are gaps or mismatches.
- `deliverable_definitions` (array): Each deliverable with a specific, agreed definition of done.
- `assumption_risk_register` (array): Each assumption the SOW depends on, with the risk if it does not hold and the mitigation.
- `scope_boundary_agreement` (object): The explicit line between in-scope and out-of-scope — what the firm will not do without a change order.
- `success_criteria` (array): Specific, measurable criteria by which the engagement will be judged successful.
- `governance_and_escalation_plan` (object): How decisions are made, how issues are escalated, and how scope changes are handled.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm consultant's scope and client's success definition present.
**Output:** Readiness confirmation.
**Quality Gate:** Consultant's deliverables and client's success criteria both present.

---

### Phase 1: Assess Scope Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare consultant's scope as understood against client's definition of success — are they solving the same problem? 2. Identify scope gaps — what the client needs that the consultant has not scoped, and what the consultant has scoped that the client does not value. 3. Assess the client's access and involvement commitments against the consultant's assumptions — are they realistic? 4. Flag assumptions that will not hold based on the client's submission.
**Output:** Scope alignment map, gap analysis, access feasibility, assumption risk assessment.
**Quality Gate:** Every scope gap is specific — "client needs change management support; consultant scoped analysis only" not "scope may be misaligned."

---

### Phase 2: Define Deliverables and Criteria
**Entry Criteria:** Scope assessed.
**Actions:** 1. Write a specific definition of done for each deliverable — format, depth, who reviews and approves, what is not included. 2. Translate the client's success vision into specific, measurable success criteria. 3. Define the scope boundary — what triggers a change order conversation. 4. Align on governance — who owns decisions, what requires client escalation, what the consultant decides independently.
**Output:** Deliverable definitions, success criteria, scope boundary, governance framework.
**Quality Gate:** Every deliverable definition is specific enough that both parties would agree on whether it was met. Success criteria are measurable.

---

### Phase 3: Build the SOW Framework
**Entry Criteria:** Deliverables defined.
**Actions:** 1. Draft the SOW structure — scope, deliverables with definitions, timeline, fee, client responsibilities, governance. 2. Build the assumption register — each assumption with the risk and mitigation. 3. Define the change order process — what triggers it, how quickly it must be resolved, who approves. 4. Define what escalation looks like — how disagreements about scope or quality are resolved.
**Output:** SOW framework, assumption register, change order process, escalation path.
**Quality Gate:** SOW is specific enough to enforce. Change order trigger is clear — not "material scope changes" but specific examples of what qualifies.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** SOW built.
**Actions:** 1. Present scope alignment assessment. 2. Deliver deliverable definitions and success criteria. 3. Deliver assumption risk register. 4. Deliver SOW framework. 5. Present governance and escalation plan.
**Output:** Full synthesis — scope alignment, deliverables, assumptions, SOW framework, governance.
**Quality Gate:** Consultant and client can both point to the same document and agree on what was bought.

---

## Exit Criteria
Done when: (1) scope gaps are resolved, (2) every deliverable has a specific definition of done, (3) success criteria are measurable, (4) assumptions are registered with risks, (5) change order process is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
