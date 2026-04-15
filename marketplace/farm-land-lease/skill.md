# Farm Land Lease

**One-line description:** The landowner and the farmer each submit their real financial requirements, land use expectations, and long-term goals — AI designs the lease terms that give the farmer a viable operation and the landowner fair returns and a partner who takes care of the land.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both landowner and farmer must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_farm_description` (string, required): Farm location, acreage, and primary use.
- `shared_lease_term_requested` (string, required): Term being discussed.

### Landowner Submits Privately
- `landowner_financial_requirements` (object, required): Cash rent floor, crop share expectations, minimum acceptable return on land value.
- `landowner_land_stewardship_requirements` (array, required): Soil health, drainage maintenance, chemical use restrictions, cover crops, conservation requirements.
- `landowner_concerns_about_the_farmer` (array, required): What worries you — will they maintain the land, meet financial obligations, handle disputes professionally?
- `landowner_long_term_goals` (string, required): Do you want to farm this land eventually, sell it, or keep it as a long-term investment with the right tenant?
- `landowner_what_they_will_not_accept` (array, required): Uses, practices, or modifications you prohibit.

### Farmer Submits Privately
- `farmer_operation_plan` (object, required): What you intend to grow or raise, crop rotation, inputs plan, equipment you will bring.
- `farmer_economic_model` (object, required): Pro forma budget for this land — projected revenue, input costs, what rent level makes this viable.
- `farmer_investment_requirements` (object, required): What improvements, infrastructure, or long-term investments the farm needs that you are willing to make.
- `farmer_concerns_about_the_lease` (array, required): What lease terms worry you — short term, landlord interference, improvement compensation, neighbors?
- `farmer_long_term_intentions` (string, required): Are you building a long-term operation here or is this transitional? What would make you want to stay for 10+ years?

## Outputs
- `lease_economics_assessment` (object): Whether the rent level works for the farmer's operation and meets the landowner's return requirements.
- `lease_structure_recommendation` (object): Cash rent, crop share, or hybrid — with specific rates and terms.
- `stewardship_and_practices_agreement` (object): What farming practices are required, encouraged, or prohibited — specific and enforceable.
- `improvement_and_investment_framework` (object): What the farmer can invest in, who owns improvements, compensation at end of term.
- `lease_term_and_renewal_structure` (object): Term, renewal options, notification periods, what triggers or prevents renewal.
- `lease_agreement_framework` (object): Key terms ready for legal drafting.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm landowner's financial requirements and farmer's economic model present.
**Output:** Readiness confirmation.
**Quality Gate:** Landowner's rent floor and farmer's viability model both present.

---

### Phase 1: Assess Economic Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model the farmer's operation at the landowner's minimum rent — is the operation economically viable? 2. Identify the gap if the economics do not work at the stated rent. 3. Check what improvements the farm needs against what the landowner and farmer are each willing to invest. 4. Assess the long-term goal alignment — do both parties want the same type of relationship?
**Output:** Economic viability model, rent gap, improvement alignment, relationship alignment.
**Quality Gate:** Viability is specific — "at $X/acre cash rent, farmer's projected net is $Y/acre; minimum viable is $Z/acre; gap is $W concentrated in input costs."

---

### Phase 2: Design the Lease Structure
**Entry Criteria:** Viability assessed.
**Actions:** 1. Select the rent structure — cash, crop share, flex rent — that works for both parties. 2. Define specific stewardship requirements — soil testing, cover crop schedules, chemical restrictions. 3. Build the improvement framework — what the farmer can do, who owns it, compensation at termination. 4. Define the term and renewal — length, options, notice periods.
**Output:** Rent structure, stewardship requirements, improvement terms, term and renewal.
**Quality Gate:** Rent structure is specific — cash rent at $X/acre OR crop share at Y% with listed crops. Stewardship requirements are enforceable, not aspirational.

---

### Phase 3: Build the Lease Agreement
**Entry Criteria:** Structure designed.
**Actions:** 1. Define the inspection and monitoring rights — how often the landowner can inspect, what notice is required. 2. Build the default and cure process — what triggers a default, how long to cure, termination process. 3. Define what happens at end of term — holdover, first right of negotiation. 4. Assemble the key lease terms for legal drafting.
**Output:** Inspection rights, default and cure, end-of-term provisions, lease framework.
**Quality Gate:** Default triggers are specific — named events, not "material breach." Cure periods are specific timeframes.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present lease economics assessment. 2. Deliver lease structure recommendation. 3. Deliver stewardship and practices agreement. 4. Deliver improvement and investment framework. 5. Present term structure and lease framework.
**Output:** Full synthesis — economics, structure, stewardship, improvements, term, agreement.
**Quality Gate:** Both parties understand what they are committing to and can take this to their attorneys.

---

## Exit Criteria
Done when: (1) economic viability confirmed or gap named, (2) rent structure is specific, (3) stewardship requirements are enforceable, (4) improvement terms are clear, (5) default and termination are defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
