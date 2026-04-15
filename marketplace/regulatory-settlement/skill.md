# Regulatory Settlement Negotiation

**One-line description:** A regulator and a company each submit their real enforcement position, remediation capacity, and settlement parameters before formal proceedings — AI aligns on a settlement structure that achieves the regulator's public protection objectives and the company's ability to actually comply without litigation.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both regulator and company must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_agency_and_company` (string, required): Regulatory agency name and company name.
- `shared_matter_description` (string, required): Regulatory matter — type of violation, statute, program area.

### Regulator Submits Privately
- `regulator_enforcement_position` (object, required): The violations found, the legal basis, the harm or risk to the public — the factual and legal record.
- `regulator_settlement_objectives` (object, required): What this settlement must achieve — cessation, remediation, penalty, deterrence, public disclosure.
- `regulator_penalty_range` (object, required): Applicable penalty range, what factors increase or decrease the penalty, what the agency needs to justify a settlement.
- `regulator_compliance_requirements` (object, required): What the company must do — corrective actions, monitoring, reporting, third-party oversight.
- `regulator_concerns_about_settling` (array, required): Precedent concerns, inadequate deterrence, insufficient compliance infrastructure, company's ability to actually comply.

### Company Submits Privately
- `company_factual_position` (object, required): Your view of the facts and the legal exposure — what you agree with, what you dispute, what the real risk is.
- `company_remediation_capacity` (object, required): What corrective actions you have already taken, what you can realistically implement, timeline and cost.
- `company_financial_position` (object, required): Ability to pay a penalty — what is material, what would affect operations, what you can absorb.
- `company_settlement_requirements` (object, required): What the settlement must include for you to agree — finality provisions, no-admit language, confidentiality, compliance timeline.
- `company_concerns_about_settlement` (array, required): Precedent for other jurisdictions, collateral litigation, disclosure requirements, compliance cost.

## Outputs
- `factual_and_legal_alignment` (object): Where parties agree and disagree on the record — what can be stipulated.
- `penalty_framework` (object): Penalty amount rationale, payment structure, what factors were applied.
- `corrective_action_plan` (object): Specific remediation requirements, timeline, milestones, verification.
- `compliance_monitoring_structure` (object): Ongoing monitoring, reporting, third-party oversight, what triggers additional enforcement.
- `settlement_terms_framework` (object): Key settlement terms — finality, no-admit, disclosure, compliance period.
- `consent_order_framework` (object): Key terms for legal drafting of the consent order or settlement agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm regulator's enforcement position and company's factual position and remediation capacity both present.
**Output:** Readiness confirmation.
**Quality Gate:** Enforcement record and company's factual position and financial capacity all present.

---

### Phase 1: Assess the Factual and Legal Record
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Identify where parties agree and disagree on the facts. 2. Assess the legal exposure — what can be proven and at what penalty level? 3. Evaluate remediation capacity against what the regulator requires. 4. Assess financial capacity against penalty range.
**Output:** Factual alignment map, legal exposure assessment, remediation gap, financial capacity assessment.
**Quality Gate:** Factual disputes are specific — named facts in dispute with both parties' positions, not general characterizations.

---

### Phase 2: Structure the Settlement
**Entry Criteria:** Record assessed.
**Actions:** 1. Define the penalty — amount, payment schedule, what justifies any reduction from maximum. 2. Build the corrective action plan — specific actions, specific timelines, verification methods. 3. Define the compliance monitoring structure. 4. Identify the settlement terms both parties require.
**Output:** Penalty structure, corrective action plan, monitoring structure, settlement terms.
**Quality Gate:** Every corrective action has a specific completion date and a specific verification method.

---

### Phase 3: Define Final Terms and Implementation
**Entry Criteria:** Structure built.
**Actions:** 1. Define finality provisions — what the settlement resolves and what it does not. 2. Build the compliance reporting schedule — what is reported, to whom, when. 3. Define what happens if the company fails to comply — default, additional penalties, reopening. 4. Assemble the consent order framework.
**Output:** Finality provisions, reporting schedule, default consequences, consent order framework.
**Quality Gate:** Finality provisions are specific — named claims resolved, named jurisdictions, what is explicitly preserved.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — factual alignment, penalty rationale, corrective action plan, monitoring structure, settlement terms, consent order framework.
**Quality Gate:** Regulator knows what the company will do and how it will be verified. Company knows the full cost and compliance commitment.

---

## Exit Criteria
Done when: (1) penalty is structured with rationale, (2) corrective action plan has specific actions and dates, (3) monitoring is defined, (4) settlement terms address both parties' requirements, (5) consent order framework is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
