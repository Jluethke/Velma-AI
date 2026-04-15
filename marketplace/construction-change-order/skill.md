# Construction Change Order

**One-line description:** GC and owner each submit their real position on a change order before negotiation — AI assesses legitimacy, reviews pricing, and produces negotiated terms that resolve the dispute before it becomes a claim.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both GC and owner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name.
- `shared_change_description` (string, required): What is the change? Brief description of the scope change or differing site condition.

### General Contractor Submits Privately
- `gc_scope_change_justification` (string, required): Why is this a legitimate change? What is the contractual basis — owner-directed change, differing site condition, design error, or unforeseen condition?
- `gc_cost_breakdown` (object, required): Detailed cost breakdown — labor, material, equipment, subcontractor, overhead, and profit.
- `gc_time_impact` (object, required): Schedule impact — how many days, which activities are affected, and critical path impact.
- `gc_why_it_is_a_legitimate_change` (string, required): Point to the specific contract clause, drawing, or specification that supports the change.
- `gc_documentation` (array, required): Supporting documentation — RFIs, photos, daily reports, design drawings.

### Owner / Owner's Rep Submits Privately
- `owner_whether_they_agree_it_is_a_change` (string, required): Do you believe this is a legitimate change or was it included in the original scope? What is your position?
- `owner_budget_position` (object, required): What is the current budget status? What contingency is available?
- `owner_schedule_tolerance` (string, required): Can the project absorb the schedule impact? What are the consequences of a delay?
- `owner_what_they_will_approve` (object, required): What cost and time are you willing to approve, if any?
- `owner_concerns_about_gc_pricing` (array, required): Are there specific line items in the GC's pricing that appear excessive or unjustified?

## Outputs
- `change_legitimacy_assessment` (object): Whether the change is contractually legitimate and on what basis.
- `cost_reasonableness_review` (object): Assessment of each cost component — reasonable, excessive, or unsupported.
- `schedule_impact_analysis` (object): Whether the claimed schedule impact is justified and what it means for the project.
- `negotiated_change_order_terms` (object): A recommended cost and time that fairly resolves the change.
- `documentation_requirements` (array): What additional documentation is needed to support the change.
- `dispute_risk_assessment` (object): If this is not resolved now, what is the dispute risk and cost?

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm GC's justification and cost breakdown, and owner's position present.
**Output:** Readiness confirmation.
**Quality Gate:** Contractual basis and cost breakdown present from GC, owner's position present.

---

### Phase 1: Assess Legitimacy
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate the GC's contractual basis — does the contract, drawings, or specification support the claim that this is a change? 2. Assess the owner's scope-inclusion argument — is there a plausible reading of the contract documents under which this was included? 3. Identify whether this is a dispute about legitimacy, pricing, or both. 4. Review what documentation exists to support or refute each position.
**Output:** Legitimacy assessment, scope ambiguity analysis, documentation status.
**Quality Gate:** Legitimacy assessment cites specific contract provisions or drawings — not general statements about who is right.

---

### Phase 2: Review Cost Reasonableness
**Entry Criteria:** Legitimacy assessed.
**Actions:** 1. Review each cost component against market rates — are labor rates, material pricing, and subcontractor markups reasonable? 2. Identify line items flagged by the owner as excessive and assess whether the concern is justified. 3. Check overhead and profit against contract rates or market norms. 4. Assess schedule impact claim against the change description — is the claimed delay consistent with the scope of the change?
**Output:** Cost component assessment, flagged item review, overhead/profit check, schedule impact validity.
**Quality Gate:** Every flagged cost item has an assessment — "reasonable at market rates," "high — recommend negotiating to $X," or "unsupported without documentation."

---

### Phase 3: Build the Negotiated Terms
**Entry Criteria:** Costs reviewed.
**Actions:** 1. Recommend a cost and time adjustment that is fair given the legitimacy assessment and cost review. 2. Identify what documentation the GC should provide to support the recommended amount. 3. Draft the change order terms. 4. Assess dispute risk if the change is not resolved now.
**Output:** Negotiated cost and time recommendation, documentation requirements, change order terms, dispute risk.
**Quality Gate:** Recommendation is a specific number with rationale — not a range. Dispute risk is assessed in terms of cost and timeline impact.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Terms built.
**Actions:** 1. Present legitimacy assessment. 2. Present cost reasonableness review. 3. Deliver schedule impact analysis. 4. Deliver negotiated change order terms. 5. State dispute risk.
**Output:** Full synthesis — legitimacy, cost review, schedule impact, negotiated terms, dispute risk.
**Quality Gate:** Both parties can execute the change order or understand exactly what is disputed and how to resolve it.

---

## Exit Criteria
Done when: (1) legitimacy assessment cites specific contract provisions, (2) every cost component assessed, (3) schedule impact validity assessed, (4) negotiated terms with specific recommendation, (5) dispute risk named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
