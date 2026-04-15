# Franchise Agreement Negotiation

**One-line description:** The franchisor and franchisee each submit their real expectations, concerns, and financial requirements before the franchise agreement is signed — AI aligns on territory, fees, support, and obligations so the franchisee opens with open eyes and the franchisor gets a franchisee who will not be underwater by year two.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both franchisor and franchisee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_franchise_brand` (string, required): Franchise brand name.
- `shared_territory_or_location` (string, required): Territory or specific location being discussed.

### Franchisor Submits Privately
- `franchisor_fee_structure` (object, required): Franchise fee, royalty rate, marketing fund contribution, renewal fees, transfer fees.
- `franchisor_territorial_rights_and_restrictions` (object, required): Exclusive vs. protected territory, what the franchisee gets and does not get, development obligations.
- `franchisor_support_and_training_provided` (object, required): What training, operational support, marketing, and technology the franchisor provides — and what it actually looks like in practice.
- `franchisor_performance_standards_and_enforcement` (object, required): What standards must be met, how they are measured, consequences of non-compliance, termination criteria.
- `franchisor_concerns_about_this_franchisee` (array, required): Capital adequacy, business experience, location risk, personal commitment — what worries you about awarding this franchise?

### Franchisee Submits Privately
- `franchisee_financial_picture` (object, required): Available capital, financing plan, personal financial situation — can you actually fund this and survive year one?
- `franchisee_unit_economics_model` (object, required): Revenue assumptions, projected costs, break-even timeline — what you believe the numbers look like.
- `franchisee_concerns_about_the_system` (object, required): What you have learned in due diligence that concerns you — support quality, franchisee satisfaction, system health?
- `franchisee_what_they_need_to_succeed` (array, required): Territory protection, marketing support, technology, operational flexibility — what you need from the franchisor to build a viable business.
- `franchisee_what_they_will_not_accept` (array, required): Agreement terms that would make you walk away — excessive royalties, insufficient territory, termination triggers that are too broad.

## Outputs
- `financial_viability_assessment` (object): Whether the franchisee's capital and the unit economics model support a viable business.
- `unit_economics_reality_check` (object): Honest assessment of whether the franchisee's projections are consistent with actual system performance.
- `agreement_term_alignment` (object): Where the agreement terms are standard and where they are negotiable.
- `territory_and_development_agreement` (object): Territory definition, exclusivity scope, development timeline.
- `support_and_training_expectations` (object): What the franchisee will actually receive vs. what they are expecting.
- `go_no_go_recommendation` (object): Whether this is the right franchise for this franchisee at this time — with the specific rationale.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm franchisee's financial picture and franchisor's fee structure present.
**Output:** Readiness confirmation.
**Quality Gate:** Franchisee's capital and franchisor's unit economics both present.

---

### Phase 1: Assess Financial Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model the franchisee's financial position against startup costs and year-one cash needs — do they have enough? 2. Compare franchisee's projected unit economics against actual system performance — is the projection realistic? 3. Identify the franchisor's concerns about this franchisee and assess their validity. 4. Check the break-even timeline against the franchisee's financial runway.
**Output:** Capital adequacy, projection reality check, franchisor concern assessment, runway analysis.
**Quality Gate:** Viability is specific — "franchisee has $X available; startup requires $Y; year-one cash burn is estimated at $Z; runway covers X months before profitability required."

---

### Phase 2: Align on Agreement Terms
**Entry Criteria:** Viability assessed.
**Actions:** 1. Review each term the franchisee flagged as a concern — what is negotiable, what is system-standard and non-negotiable. 2. Define the territory precisely — what is included, what exclusivity means, what development obligations apply. 3. Align on support — what the franchisor actually provides vs. what the franchisee is expecting. 4. Address performance standards — what triggers a default, what the cure process is.
**Output:** Negotiable vs. non-negotiable terms, territory definition, support alignment, performance standard clarity.
**Quality Gate:** Every franchisee concern has a specific answer — "this term is non-negotiable because X" or "this term can be modified to Y."

---

### Phase 3: Build the Go/No-Go Assessment
**Entry Criteria:** Terms aligned.
**Actions:** 1. Make the go/no-go recommendation — is this the right franchise for this franchisee, is the timing right, does the location work? 2. If go: define any conditions to award — capital verification, location approval, training completion. 3. Define the opening timeline — training, site build-out, grand opening milestones. 4. Define the franchisor's commitment to the opening — dedicated support, marketing launch, opening team.
**Output:** Go/no-go recommendation with rationale, award conditions, opening timeline, franchisor opening commitments.
**Quality Gate:** Recommendation is specific with rationale. If no-go, the specific reason is named.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Assessment built.
**Actions:** 1. Present financial viability assessment. 2. Deliver unit economics reality check. 3. Deliver agreement term alignment. 4. Deliver territory and development agreement. 5. Present go/no-go recommendation.
**Output:** Full synthesis — viability, unit economics, agreement terms, territory, go/no-go.
**Quality Gate:** Franchisee enters the agreement with full knowledge of the financial reality and what they are committing to.

---

## Exit Criteria
Done when: (1) financial viability is confirmed or risks named, (2) unit economics are grounded in system reality, (3) every agreement concern has a resolution, (4) territory is defined specifically, (5) go/no-go has a specific rationale.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
