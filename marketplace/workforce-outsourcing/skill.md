# Workforce Outsourcing Engagement

**One-line description:** An HR leader and a workforce solutions provider each submit their real staffing requirements, service expectations, and cost constraints before signing — Claude aligns on an outsourcing arrangement that fills critical workforce needs without creating misclassification risk or service quality failures.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both HR leader and workforce provider must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_and_provider` (string, required): Client company and workforce solutions provider names.
- `shared_workforce_scope` (string, required): Type of workforce — contingent, temp-to-perm, RPO, managed services, or specific function.

### HR Leader Submits Privately
- `hr_workforce_requirements` (object, required): Roles needed, volume, skills, locations, timing — the full workforce demand picture.
- `hr_cost_and_budget_constraints` (object, required): Bill rate targets, total program cost, what you currently pay, what you can afford.
- `hr_quality_and_compliance_requirements` (object, required): Worker quality standards, background check requirements, classification compliance, safety certifications.
- `hr_current_workforce_problems` (array, required): What is failing now — quality, speed, cost, compliance, supplier management burden.
- `hr_concerns_about_this_provider` (array, required): Worker quality, compliance posture, pricing transparency, responsiveness, competitive conflicts.

### Workforce Provider Submits Privately
- `provider_capabilities_and_capacity` (object, required): Talent pool depth, sourcing capabilities, compliance infrastructure, technology platform.
- `provider_pricing_and_margin` (object, required): Bill rate structure, margin requirements, what is included vs. what is billed additionally.
- `provider_compliance_posture` (object, required): Worker classification approach, co-employment risk management, insurance, background screening.
- `provider_concerns_about_this_client` (object, required): Volume commitment, bill rate competitiveness, requisition quality, co-employment posture.
- `provider_what_they_will_not_do` (array, required): Arrangements outside your compliance framework, volume below minimums, bill rates that cannot sustain quality.

## Outputs
- `workforce_program_design` (object): Scope, roles, volume, service model — what is being outsourced and how.
- `pricing_and_economics` (object): Bill rates, markup transparency, total program cost at projected volume.
- `compliance_and_classification_framework` (object): Worker classification approach, co-employment management, insurance requirements.
- `service_level_standards` (object): Fill rates, time-to-fill, quality metrics, what the provider is accountable for.
- `governance_and_transition_plan` (object): Program oversight, reporting, incumbent worker transition, supplier consolidation.
- `services_agreement_framework` (object): Key terms for the master services agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm HR's workforce requirements and provider's capabilities and pricing both present.
**Output:** Readiness confirmation.
**Quality Gate:** Workforce requirements and provider's pricing and compliance posture both present.

---

### Phase 1: Assess Program Fit and Economics
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate provider's talent pool against HR's skill and volume requirements. 2. Assess bill rate targets against provider's margin requirements. 3. Evaluate compliance requirements against provider's classification approach. 4. Identify current program failure root causes.
**Output:** Capability fit, economic viability, compliance alignment, current failure root cause.
**Quality Gate:** Bill rate analysis is specific — requested rate, provider margin at that rate, whether the margin supports quality sourcing.

---

### Phase 2: Design the Program
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the program scope — roles, volume commitments, service model. 2. Build the pricing structure with full markup transparency. 3. Establish service level standards with specific targets. 4. Define the compliance framework — classification, insurance, background requirements.
**Output:** Program scope, pricing structure, SLA, compliance framework.
**Quality Gate:** Every SLA metric has a specific target and a specific remedy.

---

### Phase 3: Define Governance and Transition
**Entry Criteria:** Program designed.
**Actions:** 1. Build the governance structure — reporting, QBRs, issue escalation. 2. Define the transition plan — incumbent workers, supplier consolidation timeline. 3. Define co-employment protections — what the client cannot do with contingent workers. 4. Assemble the agreement framework.
**Output:** Governance structure, transition plan, co-employment protections, agreement framework.
**Quality Gate:** Transition plan names every supplier being consolidated with a specific timeline.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — program design, pricing, SLA, compliance framework, governance, transition plan, agreement structure.
**Quality Gate:** HR leader knows total program cost and what compliance risks are managed. Provider knows the volume commitment and compliance requirements.

---

## Exit Criteria
Done when: (1) program scope is defined, (2) pricing is transparent, (3) SLAs are specific, (4) compliance framework is established, (5) transition plan is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
