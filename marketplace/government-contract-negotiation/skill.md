# Government Contract Negotiation

**One-line description:** The government agency and the vendor each submit their real requirements, pricing rationale, and concerns before contract negotiations begin — AI aligns on terms that meet compliance requirements, fit the agency's budget, and give the vendor a viable contract to perform.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agency and vendor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_agency_and_vendor` (string, required): Agency name and vendor company name.
- `shared_contract_type_and_scope` (string, required): Contract type (FFP, T&M, IDIQ) and scope description.

### Government Agency Submits Privately
- `agency_requirements_and_specifications` (object, required): Technical requirements, performance standards, deliverables, and compliance requirements.
- `agency_budget_and_pricing_position` (object, required): Budget, IGCE, and pricing objectives — what you need to stay within.
- `agency_compliance_and_regulatory_requirements` (array, required): FAR/DFAR clauses, small business requirements, reporting obligations — non-negotiable compliance elements.
- `agency_concerns_about_vendor_performance` (array, required): What do you worry about in this vendor's ability to perform — past performance, capacity, subcontracting risk?
- `agency_timeline_and_urgency` (string, required): When does this need to be awarded and performing? What drives the urgency?

### Vendor Submits Privately
- `vendor_cost_and_pricing_basis` (object, required): Your cost basis, proposed pricing, and the rationale — what drives your price.
- `vendor_technical_approach` (string, required): How you will perform the work — approach, team, tools, any teaming arrangements.
- `vendor_compliance_concerns` (array, required): Which requirements create performance risk, cost uncertainty, or operational difficulty?
- `vendor_what_they_need_from_the_agency` (array, required): Timely decisions, data access, government-furnished equipment, clear requirements — what makes this contract performable.
- `vendor_risks_in_this_contract` (array, required): What could cause cost overrun, delay, or non-performance — and which risks you are willing vs. not willing to absorb.

## Outputs
- `requirements_and_pricing_alignment` (object): Whether the requirements and budget are in sync — and what needs to change if not.
- `compliance_risk_assessment` (array): Which compliance requirements create performance or cost risk and how to address them.
- `contract_structure_recommendation` (object): Contract type, terms, and structure that fits the work and protects both parties.
- `performance_standard_agreement` (object): Deliverables, milestones, acceptance criteria, and remedies — specific and fair.
- `risk_allocation` (object): Which risks the government bears, which the vendor bears, and how uncertainty is handled.
- `negotiation_resolution_plan` (object): How to resolve the key negotiation points — price, terms, compliance, performance.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm agency requirements and vendor pricing basis present.
**Output:** Readiness confirmation.
**Quality Gate:** Agency's requirements and budget and vendor's pricing and approach both present.

---

### Phase 1: Assess Requirements and Price Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare agency requirements against vendor's technical approach — does the vendor's approach meet the requirements? 2. Compare agency IGCE/budget against vendor pricing — is there a viable deal? 3. Identify compliance requirements that create cost or performance risk for the vendor. 4. Assess agency concerns about vendor performance against vendor's stated approach.
**Output:** Technical compliance assessment, price gap analysis, compliance risk map, performance risk assessment.
**Quality Gate:** Price gap is specific — "agency IGCE is $X; vendor proposed price is $Y; gap is $Z concentrated in labor category rates and travel."

---

### Phase 2: Resolve Key Issues
**Entry Criteria:** Alignment assessed.
**Actions:** 1. For each price gap driver, identify whether it reflects different scope understanding, different cost estimates, or different risk allocation. 2. For compliance requirements that create vendor risk, identify whether the risk can be mitigated or needs to be priced. 3. Define what the agency must provide (GFE, data, timely decisions) and what happens if it does not. 4. Resolve contract type — does the scope support FFP, or does uncertainty require T&M or cost-plus?
**Output:** Price gap resolution, compliance risk mitigation, government obligations, contract type rationale.
**Quality Gate:** Every price gap item has a resolution — scope clarification, risk reallocation, or accepted price difference.

---

### Phase 3: Build the Contract Framework
**Entry Criteria:** Issues resolved.
**Actions:** 1. Define performance standards — deliverables, milestones, acceptance criteria, reporting. 2. Allocate risk — which uncertainties the vendor prices in, which are handled through contract mechanisms (undefinitized actions, option years, T&M labor categories). 3. Define remedies — what happens if the vendor misses a milestone, what the cure process is. 4. Build the negotiation resolution plan for items that cannot be pre-agreed.
**Output:** Performance standards, risk allocation, remedy structure, negotiation plan.
**Quality Gate:** Performance standards are specific and binary. Risk allocation is explicit — not "vendor bears all risk" but named risks with named owners.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Framework built.
**Actions:** 1. Present requirements and pricing alignment. 2. Deliver compliance risk assessment. 3. Deliver contract structure recommendation. 4. Deliver performance standards and risk allocation. 5. Present negotiation resolution plan.
**Output:** Full synthesis — alignment, compliance risks, contract structure, performance standards, risk allocation.
**Quality Gate:** Agency and vendor can enter contract negotiations with a shared understanding of what the deal is and what the remaining issues are.

---

## Exit Criteria
Done when: (1) price gap is identified and resolution path is clear, (2) compliance risks are assessed, (3) contract type is recommended with rationale, (4) performance standards are specific, (5) risk allocation is explicit.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
