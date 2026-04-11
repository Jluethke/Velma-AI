# Energy Power Purchase Agreement

**One-line description:** The energy generator and the offtaker each submit their real price requirements, volume commitments, and risk positions before PPA negotiations begin — Claude aligns on the contract structure that gives the generator bankable revenue and the offtaker predictable energy costs.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both generator and offtaker must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Power project name.
- `shared_energy_type_and_capacity` (string, required): Energy type (solar, wind, gas, etc.) and nameplate capacity.

### Generator / Developer Submits Privately
- `generator_lcoe_and_price_floor` (object, required): Levelized cost of energy and the minimum price needed to finance and operate the project.
- `generator_project_timeline_and_risks` (object, required): Construction schedule, COD target, permitting status, development risks.
- `generator_capacity_factor_and_delivery_profile` (object, required): Expected generation output — annual, seasonal, daily profile — and what variability the project carries.
- `generator_bankability_requirements` (object, required): What the PPA must look like to satisfy project finance lenders — term, credit, take-or-pay provisions.
- `generator_concerns_about_the_offtaker` (array, required): Creditworthiness, curtailment risk, grid constraints, offtaker's ability to take delivery.

### Offtaker Submits Privately
- `offtaker_energy_needs` (object, required): Load profile, annual consumption, when and how you need energy delivered.
- `offtaker_price_ceiling_and_budget` (object, required): Maximum price per MWh, budget for energy procurement, any indexed or fixed price preference.
- `offtaker_sustainability_requirements` (object, required): RECs, carbon goals, additionality requirements, regulatory or reporting obligations.
- `offtaker_term_and_risk_preferences` (object, required): Preferred contract term, fixed vs. indexed pricing, curtailment rights, termination flexibility.
- `offtaker_concerns_about_delivery` (array, required): What worries you — intermittency, grid access, project completion risk, technology risk?

## Outputs
- `price_and_economics_alignment` (object): Whether generator's floor and offtaker's ceiling overlap, with the deal zone.
- `delivery_profile_match` (object): How well the generator's output profile matches the offtaker's load — and what the mismatch means.
- `ppa_structure_recommendation` (object): Contract type (physical, virtual/financial, sleeved), term, pricing structure, volume commitments.
- `risk_allocation` (object): Curtailment, grid constraint, offtake credit, force majeure — who bears what.
- `sustainability_and_rec_framework` (object): How RECs are handled, what additionality standard is met, how it satisfies the offtaker's reporting needs.
- `ppa_term_sheet` (object): Key terms ready for legal drafting — price, term, volume, delivery, credit, termination.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm generator's price floor and offtaker's budget present.
**Output:** Readiness confirmation.
**Quality Gate:** Generator's economics and offtaker's energy needs both present.

---

### Phase 1: Assess Price and Delivery Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare generator's price floor against offtaker's ceiling — is there a deal zone? 2. Assess the delivery profile match — does the generation pattern serve the offtaker's load? 3. Evaluate offtaker's sustainability requirements against what the project can deliver. 4. Assess bankability — does the offtaker's credit and the proposed structure support project finance?
**Output:** Price deal zone, delivery mismatch assessment, sustainability fit, bankability check.
**Quality Gate:** Price alignment is specific — "generator floor of $X/MWh vs. offtaker ceiling of $Y/MWh; deal zone exists if curtailment risk is allocated to offtaker."

---

### Phase 2: Design the PPA Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Select the contract type — physical delivery, virtual/financial VPPA, or sleeved arrangement. 2. Define the pricing structure — fixed, indexed, or shaped — and what hedges or collars apply. 3. Define volume commitments — take-or-pay, curtailment rights, minimum delivery. 4. Structure the credit support — parental guarantee, LC, ratings trigger.
**Output:** Contract type, pricing structure, volume terms, credit support.
**Quality Gate:** Pricing structure is specific — fixed at $X/MWh for 15 years, OR indexed to [benchmark] with a floor of $X and a cap of $Y.

---

### Phase 3: Allocate Risk and Define Terms
**Entry Criteria:** Structure designed.
**Actions:** 1. Allocate curtailment risk — who bears economic loss from grid curtailment. 2. Define force majeure scope — what excuses performance, what triggers termination. 3. Build the termination framework — what triggers it, termination payments, wind-down. 4. Define the REC and sustainability reporting framework.
**Output:** Curtailment allocation, force majeure, termination framework, REC framework.
**Quality Gate:** Curtailment allocation is specific — percentage split or named risk owner. Termination payments are a formula, not "fair market value."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Risk allocated.
**Actions:** 1. Present price and economics alignment. 2. Deliver delivery profile match. 3. Deliver PPA structure recommendation. 4. Deliver risk allocation. 5. Present sustainability framework and term sheet.
**Output:** Full synthesis — economics, delivery, structure, risk, sustainability, term sheet.
**Quality Gate:** Both parties can brief their legal and finance teams from this synthesis.

---

## Exit Criteria
Done when: (1) deal zone confirmed, (2) contract type selected, (3) pricing structure is specific, (4) every risk has an owner, (5) term sheet is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
