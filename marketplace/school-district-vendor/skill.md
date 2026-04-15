# School District Vendor Agreement

**One-line description:** A school district and an educational vendor each submit their real requirements, budget constraints, and implementation expectations before signing — AI aligns on an agreement that actually improves student outcomes rather than just purchasing software that sits unused in classrooms.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both district and vendor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_district_and_vendor` (string, required): School district name and vendor/company name.
- `shared_product_and_scope` (string, required): Product or service — curriculum, technology platform, professional development, assessment, SIS, or other.

### Vendor Submits Privately
- `vendor_product_and_evidence_base` (object, required): What your product does, the evidence base, outcomes data, what it requires to work.
- `vendor_pricing_and_contract_terms` (object, required): Per-student pricing, site license, implementation fees, professional development costs, total cost of ownership.
- `vendor_implementation_requirements` (object, required): Technical infrastructure, training time, staff roles, what the district must commit to for the product to work.
- `vendor_concerns_about_this_district` (array, required): IT infrastructure gaps, change management capacity, teacher buy-in, contract complexity, procurement timeline.
- `vendor_what_makes_implementations_fail` (array, required): District behaviors and conditions that cause implementations to fail — what you have seen go wrong.

### District Submits Privately
- `district_educational_need` (object, required): The specific outcome you are trying to improve — student performance gap, operational problem, teacher need — and your evidence that this vendor addresses it.
- `district_budget_reality` (object, required): Available budget, funding source (general fund, grant, ESSER), what happens if costs exceed budget.
- `district_technical_and_capacity_constraints` (object, required): IT infrastructure, staff capacity to implement and support, change management capability, competing initiatives.
- `district_procurement_requirements` (object, required): Board approval timeline, state procurement rules, contract requirements, pilot requirements.
- `district_prior_vendor_problems` (array, required): Products that did not deliver, implementations that failed, what you need to be true for this to work.

## Outputs
- `educational_fit_assessment` (object): Whether this product addresses the district's specific need and what the evidence says.
- `total_cost_of_ownership` (object): Full 3-year cost — license, implementation, professional development, ongoing support.
- `implementation_readiness_assessment` (object): What the district must have in place for implementation to succeed.
- `contract_and_procurement_framework` (object): Key terms — SLA, data privacy, termination, performance guarantees.
- `pilot_and_evaluation_plan` (object): If a pilot is required, what it measures and what constitutes success.
- `implementation_and_training_plan` (object): What happens, when, who is responsible, what success looks like in Year 1.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm vendor's product evidence and district's educational need and budget both present.
**Output:** Readiness confirmation.
**Quality Gate:** Product evidence base and district's specific need and capacity constraints both present.

---

### Phase 1: Assess Educational and Implementation Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate whether the product addresses the stated educational need — what does the evidence say? 2. Assess implementation requirements against district capacity. 3. Evaluate total cost against budget. 4. Identify what would cause this implementation to fail.
**Output:** Educational fit, implementation capacity gap, budget feasibility, failure risk map.
**Quality Gate:** Educational fit assessment cites specific evidence — named studies, outcomes data — not claims.

---

### Phase 2: Structure the Agreement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the total cost with all components. 2. Build the implementation plan — timeline, responsibilities, training. 3. Define the performance expectations — what outcomes the product is expected to produce. 4. Establish the pilot and evaluation framework if needed.
**Output:** Total cost, implementation plan, performance expectations, evaluation framework.
**Quality Gate:** Implementation plan names every district staff role and time commitment required.

---

### Phase 3: Define Contract and Data Privacy Terms
**Entry Criteria:** Structure built.
**Actions:** 1. Define data privacy obligations — FERPA, COPPA, student data protections, vendor access limitations. 2. Build the SLA and performance guarantees. 3. Define termination provisions and data return. 4. Assemble the contract framework.
**Output:** Data privacy framework, SLA, termination terms, contract framework.
**Quality Gate:** Data privacy terms are specific — what data the vendor can access, what they cannot do with it, how it is deleted on termination.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — educational fit, total cost, implementation plan, performance expectations, data privacy, contract framework.
**Quality Gate:** District knows the full cost and what implementation requires. Vendor knows the district's capacity and constraints.

---

## Exit Criteria
Done when: (1) educational fit is assessed with evidence, (2) total cost is disclosed, (3) implementation requirements are assigned, (4) data privacy terms are specific, (5) performance expectations are defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
