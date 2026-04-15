# Data Governance

**One-line description:** Legal and data engineering each submit their real compliance requirements and technical constraints — AI produces a data governance policy that is actually implementable, not one that gets agreed to and ignored.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both legal/privacy and data engineering must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_data_types_in_scope` (array, required): Types of data covered. e.g., "customer PII," "payment data," "employee records," "health data."

### Legal / Privacy Lead Submits Privately
- `legal_compliance_requirements` (array, required): Specific regulatory obligations — GDPR, CCPA, HIPAA, SOC 2, etc. What must be done.
- `legal_retention_policies` (object, required): How long can each data type be held? What triggers deletion?
- `legal_privacy_obligations` (object, required): Consent requirements, data subject rights, cross-border transfer restrictions.
- `legal_what_must_be_enforced` (array, required): Controls that are legally non-negotiable — not nice-to-have.
- `legal_concerns_about_technical_gaps` (array, required): What gaps in data practices do you know about that worry you from a legal standpoint?

### Data Engineering Lead Submits Privately
- `data_current_architecture` (object, required): Current data infrastructure — where data lives, how it flows, who can access it.
- `data_technical_feasibility` (object, required): Which legal requirements are technically straightforward vs. complex vs. would require major rearchitecture?
- `data_implementation_costs` (object, required): Effort and cost estimates for each major requirement.
- `data_timeline_reality` (object, required): Realistic timeline to implement each requirement.
- `data_concerns_about_compliance_requirements` (array, required): Where do the legal requirements not account for technical realities?

## Outputs
- `compliance_gap_assessment` (object): Where current data practices fall short of legal requirements.
- `feasibility_analysis` (object): Which requirements are quick wins vs. require significant investment.
- `data_governance_policy_draft` (string): The governance policy — data classification, retention schedules, access controls, deletion procedures, incident response.
- `implementation_roadmap` (object): Phased plan to implement requirements by priority and feasibility.
- `residual_risk_register` (array): Requirements that will take time to implement with the accepted risk during the gap period.
- `ownership_and_accountability_model` (object): Who owns what data, who is accountable for compliance in each area.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm compliance requirements and current architecture present.
**Output:** Readiness confirmation.
**Quality Gate:** Legal requirements list and current data architecture both present.

---

### Phase 1: Map Compliance Gaps
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. For each legal requirement, assess current technical state — compliant, partially compliant, or non-compliant. 2. Identify where data engineering's architecture description reveals gaps legal did not know about. 3. Cross-reference legal's non-negotiables against engineering's feasibility ratings. 4. Flag requirements that are both legally mandatory and technically complex — these are the highest priority and highest risk.
**Output:** Compliance gap map, unknown gaps surfaced from architecture review, non-negotiable feasibility conflicts.
**Quality Gate:** Every requirement has a compliance status. Non-compliant items flagged with regulatory exposure.

---

### Phase 2: Assess Feasibility and Cost
**Entry Criteria:** Gaps mapped.
**Actions:** 1. Build the implementation effort and cost estimate for each gap. 2. Separate quick wins (compliant within 30-60 days) from medium investment (60-180 days) from major rearchitecture (180+ days). 3. For major rearchitecture requirements, assess whether there are interim controls that reduce risk while the full solution is built. 4. Build the timeline reality for achieving full compliance.
**Output:** Implementation effort by requirement, quick wins list, interim controls for major items, full compliance timeline.
**Quality Gate:** Timeline is specific — not "we will address this in future quarters" but "full implementation requires X months given current team capacity."

---

### Phase 3: Draft the Policy and Roadmap
**Entry Criteria:** Feasibility assessed.
**Actions:** 1. Draft the data governance policy: data classification framework, retention schedules by data type, access control requirements, deletion procedures, breach response. 2. Build the implementation roadmap phased by priority: legally mandatory items first, then risk-reduction items, then best-practice items. 3. Build the ownership model — who is the data owner, who is the technical steward, who has accountability for each policy area. 4. Draft the residual risk register for items not yet implemented.
**Output:** Data governance policy draft, implementation roadmap, ownership model, residual risk register.
**Quality Gate:** Policy contains specific, enforceable requirements — not "data should be protected" but "customer PII shall be retained for no more than 36 months and deleted within 30 days of the retention trigger."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Policy drafted.
**Actions:** 1. Present compliance gap assessment. 2. Present feasibility analysis with quick wins. 3. Deliver data governance policy draft. 4. Deliver implementation roadmap. 5. Present residual risk register.
**Output:** Full synthesis — compliance gaps, feasibility, governance policy, implementation roadmap, residual risks.
**Quality Gate:** Legal has a policy they can enforce. Engineering has a roadmap they can execute. Residual risks are formally accepted, not ignored.

---

## Exit Criteria
Done when: (1) every requirement has compliance status, (2) implementation roadmap with phased timelines, (3) policy contains specific enforceable requirements, (4) ownership model names accountable parties, (5) residual risk register with formal acceptance.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
