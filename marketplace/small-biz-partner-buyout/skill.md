# Small Business Partner Buyout

**One-line description:** Both partners submit their real valuation views, financial needs, and what they want from the business going forward — AI finds where they can agree, surfaces where they cannot, and produces a buyout structure that closes without destroying the relationship or the business.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both partners must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_ownership_split` (string, required): Current ownership percentages.

### Buying Partner Submits Privately
- `buyer_valuation_view` (object, required): What do you believe the business is worth and how did you arrive at that number?
- `buyer_what_they_can_pay` (object, required): How much can you pay, in what structure — lump sum, seller financing, earnout, combination?
- `buyer_concerns_about_the_business_post_buyout` (array, required): What risks or liabilities are you worried about inheriting without your partner?
- `buyer_what_they_need_from_exiting_partner` (object, required): Non-compete, transition period, customer introductions, knowledge transfer — what do you need?
- `buyer_concerns_about_the_negotiation` (array, required): What do you think will be the hardest part of reaching agreement?

### Exiting Partner Submits Privately
- `seller_valuation_view` (object, required): What do you believe the business is worth and how did you arrive at that number?
- `seller_financial_needs` (object, required): What do you need from this transaction — minimum price, payment timing, tax structure, other considerations?
- `seller_what_they_are_willing_to_do_post_exit` (string, required): Are you willing to stay involved — transition support, consulting, non-compete? What are your limits?
- `seller_concerns_about_the_buyer_running_it_alone` (array, required): What worries you about how the business will be run after you leave?
- `seller_concerns_about_the_negotiation` (array, required): What do you think will be the hardest part of reaching agreement?

## Outputs
- `valuation_gap_analysis` (object): Where the valuations agree, where they diverge, and why — with a bridging range.
- `payment_structure_options` (array): Structures that meet the buyer's capacity and the seller's needs — with trade-offs.
- `transition_terms` (object): What the seller will do post-exit, for how long, and at what compensation.
- `risk_allocation` (object): How liabilities, customer relationships, and known risks are handled in the deal.
- `agreed_deal_framework` (object): The specific deal structure both sides can accept — price, terms, conditions, timeline.
- `relationship_preservation_plan` (object): How to handle the ongoing relationship — employees, customers, the community — after the buyout.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm both valuation views and financial needs present.
**Output:** Readiness confirmation.
**Quality Gate:** Both partners' valuation views and financial requirements present.

---

### Phase 1: Assess the Valuation Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare both valuation approaches — are they using different methods, different multiples, different assumptions? 2. Identify the gap size and the specific drivers of the gap. 3. Assess which valuation inputs are factual (actual financials) vs. subjective (future projections, risk discount). 4. Identify the range where a deal is possible — where the buyer can pay and the seller can accept.
**Output:** Valuation gap map, driver analysis, factual vs. subjective inputs, deal zone.
**Quality Gate:** Gap is specific — "seller values at 4.5x EBITDA, buyer at 3x EBITDA based on concentration risk" not "they disagree on value."

---

### Phase 2: Design the Payment Structure
**Entry Criteria:** Valuation assessed.
**Actions:** 1. Map the buyer's payment capacity against the seller's financial needs — where do they align? 2. Design payment structures that bridge the gap — seller financing, earnout tied to performance, deferred payments, asset vs. equity sale for tax efficiency. 3. Assess transition terms — what the seller does post-exit, for how long, and whether it is compensated or a condition of the deal. 4. Identify risk allocation — warranties, indemnities, known liabilities that need to be addressed.
**Output:** Payment structure options, transition terms, risk allocation framework.
**Quality Gate:** Every payment structure is specific — amounts, timing, conditions. Transition terms are specific — what, for how long, what triggers end.

---

### Phase 3: Build the Deal Framework
**Entry Criteria:** Structure designed.
**Actions:** 1. Assemble the deal framework — the specific terms both sides can accept. 2. Identify remaining gaps that require direct negotiation or third-party help (attorney, accountant, business broker). 3. Build the closing timeline — LOI, due diligence, legal drafting, funding, close. 4. Define the relationship plan post-close — how employees, customers, and vendors are notified and managed.
**Output:** Deal framework, remaining gaps, closing timeline, relationship transition plan.
**Quality Gate:** Deal framework is specific enough to hand to attorneys. Remaining gaps are named, not papered over.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Framework built.
**Actions:** 1. Present valuation gap analysis and bridging range. 2. Deliver payment structure options. 3. Deliver agreed deal framework. 4. Deliver transition terms and risk allocation. 5. Present closing timeline and relationship plan.
**Output:** Full synthesis — valuation gap, payment structures, deal framework, transition terms, timeline.
**Quality Gate:** Both partners have a shared deal framework. Neither side is surprised by what is in it.

---

## Exit Criteria
Done when: (1) valuation gap is explained with specific drivers, (2) deal zone identified where buyer can pay and seller can accept, (3) payment structure is specific, (4) transition terms defined, (5) closing timeline with next steps.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
