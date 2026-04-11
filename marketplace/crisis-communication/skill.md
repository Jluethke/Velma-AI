# Crisis Communication

**One-line description:** Communications and legal each submit their real constraints before a crisis response — Claude produces messaging that is legally defensible and human enough to actually work.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both communications and legal must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_incident_summary` (string, required): What happened? Factual description only.

### Communications Lead Submits Privately
- `comms_proposed_messaging` (string, required): Draft messaging or key messages you want to convey.
- `comms_stakeholder_map` (object, required): Who needs to hear from the company? Customers, employees, press, investors, regulators?
- `comms_channel_plan` (array, required): What channels are you planning to use and in what sequence?
- `comms_proposed_timing` (string, required): When do you want to communicate and why?
- `comms_concerns_about_legal_constraints` (array, required): What legal constraints are you worried will water down the message too much?

### Legal Lead Submits Privately
- `legal_what_can_be_said` (string, required): What can be communicated publicly without legal exposure?
- `legal_liability_concerns` (array, required): What in the proposed messaging creates legal liability?
- `legal_regulatory_constraints` (object, required): Are there regulatory disclosure requirements? What can and cannot be said to regulators?
- `legal_approval_requirements` (string, required): What requires legal sign-off before going out? What is the process?
- `legal_concerns_about_comms_draft` (array, required): Specific phrases or commitments in the comms draft that are problematic.

## Outputs
- `legal_risk_assessment` (object): What in the current draft creates exposure and why.
- `approved_messaging_framework` (string): What can be said — framed in a way that is honest and human, not corporate and evasive.
- `stakeholder_communication_plan` (object): Who gets what message, through what channel, in what order.
- `channel_and_timing_plan` (object): Recommended timing and channel sequence with rationale.
- `holding_statements` (array): Pre-approved statements for each stakeholder group for use before full communication is ready.
- `escalation_protocol` (object): What triggers escalation to the board, regulators, or outside counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm incident summary, proposed messaging, and legal risk assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Incident description and legal constraints both present.

---

### Phase 1: Assess Legal Risk in Proposed Messaging
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Review each element of the comms draft against legal's specific concerns. 2. Identify what creates liability (admissions, promises, inaccurate facts) vs. what legal is simply uncomfortable with (transparency that is legally permissible). 3. Identify regulatory disclosure requirements and whether they are satisfied. 4. Assess timing against any legal or regulatory deadlines.
**Output:** Line-by-line risk assessment of proposed messaging, regulatory requirement check, timing assessment.
**Quality Gate:** Legal risk is specific — "this phrase implies causation not yet established" not "this is risky."

---

### Phase 2: Build the Approved Framework
**Entry Criteria:** Risk assessed.
**Actions:** 1. Draft messaging that is factually accurate, legally defensible, and human — not corporate boilerplate. 2. Identify where comms' instinct to be transparent is legally permissible and should be honored vs. where it creates real exposure. 3. Draft holding statements for each stakeholder group. 4. Define the approval workflow — what goes to legal review, what comms can approve independently.
**Output:** Approved messaging framework, holding statements, approval workflow.
**Quality Gate:** Approved messaging does not read like it was written by legal. It is honest about what the company knows and does not know.

---

### Phase 3: Build the Communication Plan
**Entry Criteria:** Framework approved.
**Actions:** 1. Sequence stakeholder communications — who hears first (employees before press, regulators before public if required). 2. Assign channels to stakeholder groups. 3. Build the timing plan against regulatory deadlines and the news cycle. 4. Draft the escalation protocol.
**Output:** Stakeholder communication plan with sequencing, channel assignments, timing plan, escalation protocol.
**Quality Gate:** Sequencing accounts for regulatory requirements and the risk of one audience hearing from a third party before hearing from the company.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present legal risk assessment. 2. Deliver approved messaging framework. 3. Deliver holding statements. 4. Deliver stakeholder communication plan. 5. State escalation protocol.
**Output:** Full synthesis — legal risk, approved messaging, holding statements, communication plan, escalation protocol.
**Quality Gate:** The company can communicate within the hour with approved, human, legally defensible messaging.

---

## Exit Criteria
Done when: (1) every element of proposed messaging has legal risk status, (2) approved framework is honest and human not boilerplate, (3) holding statements ready for each stakeholder group, (4) communication sequence accounts for regulatory requirements, (5) escalation protocol defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
