# Project Kickoff

**One-line description:** Project manager and key stakeholder each submit their real scope understanding, priorities, and concerns before kickoff — Claude produces a project charter both sides have actually agreed to, not one the PM wrote and the stakeholder signed without reading.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both project manager and stakeholder must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name.
- `shared_start_date` (string, required): Target start date.

### Project Manager Submits Privately
- `pm_scope_understanding` (object, required): What do you understand the scope to be? What's in and what's explicitly out?
- `pm_capacity_and_constraints` (object, required): What's your team's actual capacity? What constraints will affect delivery?
- `pm_risks` (array, required): What are the top risks you see at this stage?
- `pm_what_they_need_from_stakeholder` (array, required): What decisions, inputs, or availability do you need from the stakeholder to succeed?
- `pm_concerns_about_the_engagement` (array, required): What do you worry the stakeholder doesn't understand or hasn't committed to?

### Stakeholder Submits Privately
- `stakeholder_success_definition` (object, required): What does success look like? What would make this project worth the investment?
- `stakeholder_priorities` (array, required): If the project must make tradeoffs, what matters most — scope, timeline, cost, quality?
- `stakeholder_concerns` (array, required): What do you worry will go wrong? What has failed in similar projects?
- `stakeholder_availability_reality` (object, required): How much time can you realistically give to this project? What will compete for your attention?
- `stakeholder_what_will_cause_them_to_escalate` (array, required): What would trigger you to escalate or pull the plug?

## Outputs
- `scope_alignment` (object): Where PM and stakeholder agree on scope and where they diverge.
- `success_criteria` (array): Specific, agreed-upon outcomes that define project success.
- `risk_register` (array): Identified risks with owners and mitigations.
- `stakeholder_engagement_plan` (object): How the stakeholder will stay engaged — cadence, decision points, escalation triggers.
- `project_charter_draft` (string): Full charter — scope, success criteria, timeline, risks, governance.
- `escalation_triggers` (array): Specific conditions under which the stakeholder expects to be escalated to.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm scope understanding and success definition present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** Scope and success definition both present.

---

### Phase 1: Map the Scope and Success Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare PM's scope understanding to stakeholder's success definition — where do they align and where do they diverge? 2. Identify scope items the PM thinks are in that the stakeholder hasn't confirmed. 3. Identify success criteria the stakeholder has that the PM hasn't accounted for. 4. Check stakeholder priorities against PM's known constraints.
**Output:** Scope alignment map, success gap, priority-constraint tensions.
**Quality Gate:** Every scope divergence is named explicitly, not softened.

---

### Phase 2: Surface the Real Risks
**Entry Criteria:** Scope and success mapped.
**Actions:** 1. Combine PM's technical/delivery risks with stakeholder's concerns about failure patterns. 2. Identify the engagement risks — where stakeholder availability won't meet PM's needs. 3. Identify escalation mismatch — what the PM thinks is a normal problem vs. what the stakeholder would escalate. 4. Build risk register with owners.
**Output:** Consolidated risk register, engagement risks, escalation mismatch map.
**Quality Gate:** Each risk has an owner and a stated mitigation or acceptance.

---

### Phase 3: Draft the Charter and Engagement Plan
**Entry Criteria:** Risks mapped.
**Actions:** 1. Draft the project charter: scope statement, success criteria, timeline, team, governance. 2. Define the stakeholder engagement plan: decision cadence, escalation triggers, review checkpoints. 3. Resolve scope divergences with explicit in/out decisions. 4. Draft the escalation protocol.
**Output:** Project charter draft, stakeholder engagement plan, escalation protocol.
**Quality Gate:** Charter includes explicit scope boundaries. Success criteria are measurable. Stakeholder engagement plan has specific cadence, not "as needed."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Charter drafted.
**Actions:** 1. Present scope alignment and gaps. 2. Present success criteria both sides agree on. 3. Deliver risk register. 4. Deliver stakeholder engagement plan. 5. Deliver full project charter.
**Output:** Full synthesis — scope alignment, success criteria, risk register, engagement plan, charter.
**Quality Gate:** PM has a charter they can execute against. Stakeholder has commitments they actually made.

---

## Exit Criteria
Done when: (1) scope divergences resolved with explicit in/out decisions, (2) success criteria are specific and measurable, (3) risk register has owners and mitigations, (4) stakeholder engagement plan has specific cadence, (5) full charter is ready to sign.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
