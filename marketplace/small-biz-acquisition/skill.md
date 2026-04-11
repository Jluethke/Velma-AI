# Small Business Acquisition

**One-line description:** Buyer and seller each submit their real deal expectations, financials, and concerns — Claude aligns on valuation range, deal structure, and what needs to be true for both sides to close, before either wastes time on a deal that was never going to happen.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both buyer and seller must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_asking_price` (string, required): Seller's asking price or stated range.

### Buyer Submits Privately
- `buyer_what_attracted_them_to_the_business` (string, required): Why this business? What is the strategic or financial thesis?
- `buyer_valuation_and_offer_range` (object, required): What do you believe it is worth and what would you pay? How did you get there?
- `buyer_financing_plan` (object, required): How are you funding the acquisition — cash, SBA, seller note, outside capital?
- `buyer_due_diligence_concerns` (array, required): What are you most worried about finding — customer concentration, key-person risk, legal liabilities, financials?
- `buyer_deal_structure_preferences` (object, required): Asset vs. equity sale, earnout, seller stay, training period — what do you want and why?

### Seller Submits Privately
- `seller_business_reality` (object, required): The real picture — what the financials show, what the trends are, what is not obvious from the books.
- `seller_minimum_acceptable_terms` (object, required): What must be true for you to sell — price floor, payment structure, tax treatment, what you will not sign?
- `seller_what_they_need_post_close` (string, required): Do you need to stay on? For how long? At what role or compensation? Are you done the day you close?
- `seller_what_the_buyer_does_not_know` (array, required): Material information the buyer will find in due diligence — better to surface it now.
- `seller_concerns_about_the_buyer` (array, required): What worries you about this buyer — capability, financing certainty, how they will treat employees or customers?

## Outputs
- `deal_zone_assessment` (object): Whether a deal is possible given both positions, and the price and structure range where agreement is achievable.
- `due_diligence_flag_list` (array): Material issues the buyer needs to investigate and the seller needs to disclose, prioritized by deal risk.
- `deal_structure_recommendation` (object): The specific structure — asset vs. equity, price allocation, earnout design, seller note terms — that fits both sides.
- `transition_plan` (object): What the seller does post-close, for how long, at what terms.
- `loi_framework` (object): The key terms for a letter of intent — price, structure, exclusivity, conditions, timeline.
- `deal_risk_register` (array): The issues most likely to kill the deal in due diligence or negotiation, with mitigation options.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm buyer's offer range and seller's minimum terms present.
**Output:** Readiness confirmation.
**Quality Gate:** Buyer's valuation and seller's minimum terms both present.

---

### Phase 1: Assess Deal Zone
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare buyer's valuation range against seller's minimum terms — is there a zone where a deal is possible? 2. Identify the specific gaps — price gap, structure gap (asset vs. equity), earnout disagreement. 3. Surface what the seller has disclosed that the buyer does not yet know — assess deal impact. 4. Assess whether buyer's financing plan is credible for the price range.
**Output:** Deal zone analysis, gap map, disclosure assessment, financing credibility.
**Quality Gate:** Deal zone is specific — "deal is possible between $X and $Y if seller accepts Z structure" or "no deal zone exists because..."

---

### Phase 2: Design the Structure
**Entry Criteria:** Deal zone confirmed.
**Actions:** 1. For the identified deal zone, design the structure that best meets both parties' needs — asset vs. equity, earnout design, seller note, tax treatment. 2. Design the earnout if needed — what metrics, what period, what payment. 3. Define the transition plan — what the seller does post-close, for how long, at what terms. 4. Flag the due diligence items that are deal-critical vs. confirmatory.
**Output:** Structure design, earnout terms, transition plan, due diligence priority list.
**Quality Gate:** Structure is specific enough to draft an LOI. Every earnout has specific metrics and measurement periods.

---

### Phase 3: Build the LOI Framework
**Entry Criteria:** Structure designed.
**Actions:** 1. Draft the key LOI terms — purchase price, structure, earnout, seller note, transition period, exclusivity, conditions to close, timeline. 2. Identify the risks most likely to disrupt the deal during due diligence. 3. Build the closing timeline — exclusivity period, due diligence, legal drafting, financing confirmation, close. 4. Flag what needs professional help — attorney, CPA, business broker.
**Output:** LOI key terms, deal risk register, closing timeline, professional prep flags.
**Quality Gate:** LOI framework is specific enough to hand to attorneys. Risks are named and have mitigation strategies.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** LOI framework built.
**Actions:** 1. Present deal zone assessment. 2. Deliver due diligence flag list. 3. Deliver deal structure recommendation. 4. Deliver LOI framework. 5. Present deal risk register and timeline.
**Output:** Full synthesis — deal zone, due diligence flags, structure, LOI framework, risks, timeline.
**Quality Gate:** Both parties understand what it takes to close. No one is surprised by a deal-killer in week three of due diligence.

---

## Exit Criteria
Done when: (1) deal zone confirmed or no-deal declared, (2) structure is specific enough for LOI, (3) due diligence flags prioritized, (4) transition terms defined, (5) closing timeline with next steps.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
