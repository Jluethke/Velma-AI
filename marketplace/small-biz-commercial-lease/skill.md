# Small Business Commercial Lease

**One-line description:** The business owner and the landlord each submit their real needs, financial constraints, and non-negotiables — Claude finds where the deal works, designs the lease terms, and produces a negotiation strategy so the owner gets a location they can afford and the landlord gets a tenant who will be there in year three.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and landlord must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_address` (string, required): Property address or description.
- `shared_lease_term_requested` (string, required): Term requested by tenant.

### Business Owner / Tenant Submits Privately
- `tenant_business_and_use` (string, required): What is the business, how does it use the space, and what are the operational requirements?
- `tenant_what_they_can_afford` (object, required): Rent budget — base rent ceiling, what they can handle in years 1–3 as the business ramps.
- `tenant_what_they_need_in_the_space` (array, required): Build-out requirements, signage, parking, access hours, loading — what the business cannot operate without.
- `tenant_concerns_about_the_lease` (array, required): What clauses or landlord requirements worry you — rent escalations, personal guarantee, CAM charges, exclusivity?
- `tenant_leverage_and_alternatives` (string, required): What alternatives do you have? How much do you need this specific space?

### Landlord Submits Privately
- `landlord_minimum_acceptable_rent` (object, required): Base rent floor, acceptable structure — NNN vs. gross, CAM estimates, escalation requirements.
- `landlord_tenant_quality_concerns` (object, required): What concerns you about this tenant — business stability, credit, use, ability to pay long-term?
- `landlord_what_they_will_provide` (object, required): Tenant improvement allowance, free rent period, build-out work — what is on the table?
- `landlord_non_negotiable_terms` (array, required): Clauses the landlord will not remove or modify — personal guarantee, insurance requirements, use restrictions.
- `landlord_concerns_about_vacancy_risk` (string, required): How long has the space been vacant? What is the cost of not closing this deal?

## Outputs
- `lease_economics_alignment` (object): Whether the rent range works for both parties, with the structure that bridges any gap.
- `ti_and_concession_package` (object): Tenant improvement allowance, free rent, and other concessions — what is justified and what to ask for.
- `key_term_negotiation_guide` (object): Position-by-position on the material terms — guarantee, escalations, CAM, exclusivity, options to renew.
- `build_out_and_use_alignment` (object): Whether the space works for the tenant's use and what modifications are needed.
- `lease_negotiation_strategy` (object): How to sequence the negotiation — concede early, negotiate in round two, hold firm on what matters.
- `red_flags_and_deal_risks` (array): Terms or situations that put the tenant at unacceptable risk — what to fix before signing.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm tenant's budget and landlord's minimum rent present.
**Output:** Readiness confirmation.
**Quality Gate:** Tenant's affordability range and landlord's rent floor both present.

---

### Phase 1: Assess Economics and Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare tenant's affordability against landlord's rent floor — is there a deal on economics? 2. Assess the tenant's use against the landlord's use restrictions and the property's capabilities. 3. Identify what TI and concessions the landlord has on the table and whether they bridge the gap. 4. Assess the landlord's vacancy risk — how motivated are they to close?
**Output:** Economics alignment, use compatibility, TI assessment, landlord motivation.
**Quality Gate:** Economics assessment is specific — "tenant ceiling of $X/sf vs. landlord floor of $Y/sf — $Z gap that TI or free rent can bridge."

---

### Phase 2: Design the Term Package
**Entry Criteria:** Economics assessed.
**Actions:** 1. Design the rent structure — base rent, escalation schedule, NNN vs. gross — that fits both budgets. 2. Build the concession ask — TI allowance, free rent months, landlord work — specific amounts based on what the landlord has signaled. 3. For each non-negotiable term (guarantee, CAM, insurance), define the tenant's position and what modification to request. 4. Flag lease terms that create unacceptable risk — unlimited CAM exposure, aggressive termination clauses, problematic exclusivity language.
**Output:** Rent structure, concession package, term-by-term positions, risk flags.
**Quality Gate:** Every material term has a tenant position — accept, modify with specific language, or reject with rationale.

---

### Phase 3: Build the Negotiation Strategy
**Entry Criteria:** Terms designed.
**Actions:** 1. Sequence the negotiation — what to accept quickly, what to negotiate, what to save as a final ask. 2. Define the walk-away position — what terms make this location not viable. 3. Build the counteroffer strategy — what to ask for first, knowing some will be rejected. 4. Define what professional help is needed — attorney to review lease, accountant to stress-test economics.
**Output:** Negotiation sequence, walk-away terms, counteroffer strategy, professional prep.
**Quality Gate:** Negotiation sequence is specific — "accept rent structure, negotiate TI in round one, push guarantee cap in round two, walk away if..."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Strategy built.
**Actions:** 1. Present lease economics alignment. 2. Deliver TI and concession package. 3. Deliver key term negotiation guide. 4. Deliver lease negotiation strategy. 5. Flag red flags and deal risks.
**Output:** Full synthesis — economics, concessions, term positions, negotiation strategy, red flags.
**Quality Gate:** Tenant walks into the negotiation knowing exactly what to ask for and what to hold firm on.

---

## Exit Criteria
Done when: (1) economics assessed with specific gap and bridge, (2) concession package is specific, (3) every material term has a position, (4) negotiation sequence is specific, (5) walk-away terms defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
