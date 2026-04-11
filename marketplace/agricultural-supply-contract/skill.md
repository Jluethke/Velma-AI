# Agricultural Supply Contract

**One-line description:** The food processor or buyer and the grower each submit their real volume needs, production capacity, and price requirements — Claude designs the supply agreement that gives the buyer reliable supply and the grower bankable terms they can take to their lender.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both buyer and grower must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_buyer_and_grower` (string, required): Processor/buyer and grower names.
- `shared_crop_and_volume` (string, required): Crop type and estimated contract volume.

### Processor / Buyer Submits Privately
- `buyer_volume_and_quality_requirements` (object, required): Annual volume, delivery schedule, quality specifications, grade requirements, food safety standards.
- `buyer_pricing_target` (object, required): Target price per unit, price adjustment mechanisms, what market benchmarks support the price.
- `buyer_supply_security_requirements` (object, required): Minimum fill rate, what happens if the crop fails, right to source elsewhere if supply is short.
- `buyer_concerns_about_the_grower` (array, required): Production reliability, food safety compliance, financial stability, ability to meet volume commitments.
- `buyer_contract_terms_required` (array, required): Delivery terms, payment timing, quality rejection rights, audit rights.

### Grower Submits Privately
- `grower_production_capacity` (object, required): Acreage available, expected yield, production variability — honest capacity assessment.
- `grower_cost_of_production` (object, required): Per-acre costs, total production cost, minimum price needed to cover costs and service debt.
- `grower_what_they_need_from_the_contract` (array, required): Price certainty, volume commitment, advance payment or operating loan support, input financing.
- `grower_risks_and_concerns` (array, required): Weather risk, yield variability, quality rejection risk, price below cost of production if market drops.
- `grower_what_they_will_not_agree_to` (array, required): Terms that make the contract financially unworkable — rejection rights that are too broad, price mechanisms that transfer all risk to grower.

## Outputs
- `price_viability_assessment` (object): Whether the buyer's target price covers the grower's cost of production with an acceptable margin.
- `volume_and_delivery_agreement` (object): Committed volume, delivery schedule, tolerance for yield variability.
- `price_and_payment_structure` (object): Base price, quality premiums, price adjustment mechanisms, payment timing.
- `risk_allocation` (object): How weather, yield shortfall, and quality risk are shared between buyer and grower.
- `food_safety_and_compliance_requirements` (object): What the grower must document and certify, how audits work.
- `contract_framework` (object): Key terms ready for agricultural legal counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm buyer's specifications and grower's cost of production present.
**Output:** Readiness confirmation.
**Quality Gate:** Buyer's volume and price requirements and grower's production costs both present.

---

### Phase 1: Assess Price and Volume Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check buyer's target price against grower's cost of production — is there a viable margin? 2. Compare buyer's volume requirements against grower's production capacity — can they supply it? 3. Assess yield variability risk — what does a bad year look like and who bears it? 4. Identify contract terms the grower has flagged that create unacceptable risk.
**Output:** Price margin assessment, volume coverage, yield risk, term risk assessment.
**Quality Gate:** Price assessment is specific — "buyer target of $X/bushel vs. grower cost of $Y/bushel; margin of $Z; at a 20% yield shortfall, break-even requires price floor of $W."

---

### Phase 2: Design the Contract Structure
**Entry Criteria:** Viability assessed.
**Actions:** 1. Design the pricing structure — base price, quality premiums, price adjustment mechanism. 2. Define the volume commitment — how much is firm, how much is variable, what tolerance applies. 3. Build the risk allocation — what happens in a short crop year, what alternatives the buyer has, what the grower is protected from. 4. Define the food safety requirements specifically.
**Output:** Pricing structure, volume commitment, risk allocation, food safety requirements.
**Quality Gate:** Volume tolerance is specific — "buyer commits to take X bushels; grower committed to deliver X +/- Y%; shortfall below Y% is force majeure."

---

### Phase 3: Build the Agreement
**Entry Criteria:** Structure designed.
**Actions:** 1. Define payment terms — net days from delivery, advance payment if needed, quality dispute resolution. 2. Build the quality rejection framework — what specs trigger rejection, dispute process, what happens to rejected product. 3. Define the multi-year framework if applicable — price reopeners, volume adjustments. 4. Assemble the contract framework.
**Output:** Payment terms, rejection framework, multi-year terms, contract framework.
**Quality Gate:** Rejection rights have a specific dispute process with timeline. Payment terms are specific days from delivery.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present price viability assessment. 2. Deliver volume and delivery agreement. 3. Deliver pricing and payment structure. 4. Deliver risk allocation. 5. Present food safety requirements and contract framework.
**Output:** Full synthesis — price viability, volume, pricing, risk, food safety, contract.
**Quality Gate:** Grower can take this contract to their lender. Buyer has supply security.

---

## Exit Criteria
Done when: (1) price margin is viable or gap is named, (2) volume commitment has tolerance, (3) pricing mechanism is specific, (4) yield risk allocation is defined, (5) rejection rights have a dispute process.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
