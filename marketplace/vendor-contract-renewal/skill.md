# Vendor Contract Renewal

**One-line description:** The business owner who uses the vendor and procurement each submit their real requirements and leverage before renewal — Claude builds the negotiation strategy, identifies the BATNA, and produces a redline priority list.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both business owner and procurement must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_vendor_name` (string, required): Vendor name.
- `shared_renewal_date` (string, required): Contract renewal date.

### Business Owner (Vendor User) Submits Privately
- `owner_vendor_satisfaction` (string, required): Honest assessment — how well is this vendor actually performing? What do you love and hate?
- `owner_what_they_need_from_vendor` (array, required): What capabilities or services must this vendor provide going forward?
- `owner_must_haves_in_renewal` (array, required): Contract terms, SLAs, or pricing structures you need in the renewal.
- `owner_concerns_about_switching` (string, required): What would switching vendors actually cost — in time, disruption, and money?

### Procurement / Finance Lead Submits Privately
- `procurement_current_contract_terms` (object, required): Current pricing, SLAs, payment terms, and any auto-renewal or termination provisions.
- `procurement_leverage_points` (array, required): Where does the company have leverage? Contract expiry timing, competitive alternatives, volume commitments.
- `procurement_alternative_vendors` (array, required): What alternatives exist? Have you gotten quotes?
- `procurement_cost_target` (object, required): Target cost reduction or cap for the renewal.
- `procurement_terms_to_improve` (array, required): Specific contract terms to push for — pricing caps, SLA improvements, termination rights, data portability.

## Outputs
- `negotiation_leverage_assessment` (object): Where you have real leverage vs. where you do not.
- `batna_analysis` (object): Best alternative to a negotiated agreement — what switching actually costs vs. the cost of a bad renewal.
- `negotiation_strategy` (object): Approach to the renewal conversation — sequencing, who leads, opening position.
- `contract_redline_priorities` (array): Must-have vs. nice-to-have vs. walk-away terms, ranked.
- `cost_reduction_opportunity` (object): Realistic cost reduction based on alternatives and leverage.
- `renewal_recommendation` (object): Renew, renew with conditions, or switch — with the deciding factors stated.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm vendor satisfaction data and current contract terms present.
**Output:** Readiness confirmation.
**Quality Gate:** Business owner satisfaction and current contract terms both present.

---

### Phase 1: Assess Leverage and BATNA
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess the company's real leverage — contract expiry timing, alternatives available, vendor's dependence on this account. 2. Cross-reference business owner's switching concerns against procurement's alternative vendor options — is switching as hard as the business owner fears? 3. Calculate the true cost of switching: transition cost, disruption, productivity loss, re-integration. 4. Compare switching cost to the cost of accepting bad renewal terms.
**Output:** Leverage assessment, true switching cost model, BATNA calculation.
**Quality Gate:** BATNA is stated in dollars — "switching costs approximately $X in transition time and productivity loss."

---

### Phase 2: Prioritize the Redlines
**Entry Criteria:** BATNA assessed.
**Actions:** 1. Rank procurement's desired terms into must-have (walk away if not achieved), important (push hard but negotiate), and nice-to-have (trade if needed). 2. Check business owner's must-haves against what procurement is prioritizing — resolve any conflicts. 3. Identify where the vendor has incentive to give ground (high renewal risk for them) vs. where they do not. 4. Estimate realistic improvement range for each term based on alternatives and leverage.
**Output:** Redline priority ranking, conflict resolution, realistic improvement range by term.
**Quality Gate:** Every term is labeled must-have, important, or nice-to-have. Conflicts between owner and procurement are resolved, not averaged.

---

### Phase 3: Build the Negotiation Strategy
**Entry Criteria:** Redlines prioritized.
**Actions:** 1. Design the opening position — start anchored high/strong on the terms with most leverage. 2. Define the concession sequence — what to offer first, in exchange for what. 3. Determine whether to reveal alternatives or hold them in reserve. 4. Draft the renewal recommendation — renew at target terms, renew with minimum acceptable terms, or switch.
**Output:** Opening position, concession sequence, alternative reveal strategy, renewal recommendation.
**Quality Gate:** Opening position is specific — not "ask for a discount" but "open at $X, 20% below current, with 3-year cap." Walk-away conditions are explicit.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Strategy built.
**Actions:** 1. Present leverage assessment and BATNA. 2. Deliver redline priority list. 3. Deliver negotiation strategy with opening position. 4. Present renewal recommendation. 5. State walk-away conditions.
**Output:** Full synthesis — leverage, BATNA, redline priorities, negotiation strategy, recommendation.
**Quality Gate:** Procurement goes into the conversation with a clear strategy. Business owner understands what is being negotiated and why.

---

## Exit Criteria
Done when: (1) BATNA stated in dollars, (2) every term labeled must-have/important/nice-to-have, (3) opening position is specific, (4) concession sequence defined, (5) renewal recommendation with walk-away conditions.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
